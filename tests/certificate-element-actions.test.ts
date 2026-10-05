import { describe, it, expect, vi } from 'vitest';
import { CertificateElement, CertificateTemplate } from '@/lib/types';

vi.mock('react', async () => {
  const actual = await vi.importActual<typeof import('react')>('react');
  return {
    ...actual,
    useCallback: <T extends (...args: unknown[]) => unknown>(fn: T): T => fn,
  };
});

type TemplateUpdater = CertificateTemplate | ((prev: CertificateTemplate) => CertificateTemplate);

// Import after mocking react
import { generateElementId, useElementActions } from '@/features/certificates/hooks/use-element-actions';

describe('Certificate Element Unique ID Generation', () => {
  it('should generate unique IDs on consecutive calls', () => {
    const id1 = generateElementId('el');
    const id2 = generateElementId('el');
    expect(id1).not.toBe(id2);
    expect(id1).toMatch(/^el-\d+-\d+-[a-z0-9]+$/);
    expect(id2).toMatch(/^el-\d+-\d+-[a-z0-9]+$/);
  });

  it('should guarantee zero collisions across 10,000 rapid consecutive calls', () => {
    const total = 10000;
    const ids = new Set<string>();

    for (let i = 0; i < total; i++) {
      ids.add(generateElementId('el'));
    }

    expect(ids.size).toBe(total);
  });
});

describe('useElementActions Hook', () => {
  const createMockTemplate = (elements: CertificateElement[] = []): CertificateTemplate => ({
    id: 'tpl-1',
    userId: 'user-1',
    name: 'Test Template',
    category: 'training',
    width: 1123,
    height: 794,
    backgroundColor: '#ffffff',
    elements,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  it('should add a single element with unique ID and commit to history', () => {
    let currentTemplate = createMockTemplate();
    const setTemplate = vi.fn((updater: TemplateUpdater) => {
      if (typeof updater === 'function') {
        currentTemplate = updater(currentTemplate);
      } else {
        currentTemplate = updater;
      }
    });
    const commitToHistory = vi.fn();

    const actions = useElementActions(currentTemplate, setTemplate, commitToHistory);
    const newId = actions.addElement('text', { content: 'Signature' });

    expect(newId).toBeTruthy();
    expect(currentTemplate.elements.length).toBe(1);
    expect(currentTemplate.elements[0].id).toBe(newId);
    expect(currentTemplate.elements[0].content).toBe('Signature');
    expect(commitToHistory).toHaveBeenCalledTimes(1);
  });

  it('should add multiple elements atomically in a single history commit with strictly unique IDs', () => {
    let currentTemplate = createMockTemplate();
    const setTemplate = vi.fn((updater: TemplateUpdater) => {
      if (typeof updater === 'function') {
        currentTemplate = updater(currentTemplate);
      } else {
        currentTemplate = updater;
      }
    });
    const commitToHistory = vi.fn();

    const actions = useElementActions(currentTemplate, setTemplate, commitToHistory);
    const createdIds = actions.addElements([
      { type: 'shape', extra: { shapeType: 'line', x: 270, y: 630 } },
      { type: 'text', extra: { content: 'CHAIRMAN', x: 270, y: 655 } },
      { type: 'shape', extra: { shapeType: 'line', x: 853, y: 630 } },
      { type: 'text', extra: { content: 'DIRECTOR', x: 853, y: 655 } },
    ]);

    expect(createdIds.length).toBe(4);
    const uniqueIds = new Set(createdIds);
    expect(uniqueIds.size).toBe(4); // All 4 IDs must be strictly unique!

    expect(currentTemplate.elements.length).toBe(4);
    // Verified single atomic commit to history (single undo step)
    expect(commitToHistory).toHaveBeenCalledTimes(1);
  });

  it('should duplicate an element with a distinct unique ID', () => {
    const initialElement: CertificateElement = {
      id: 'el-orig',
      type: 'text',
      content: 'Original',
      x: 100,
      y: 100,
      width: 200,
      height: 40,
    };
    let currentTemplate = createMockTemplate([initialElement]);
    const setTemplate = vi.fn((updater: TemplateUpdater) => {
      if (typeof updater === 'function') {
        currentTemplate = updater(currentTemplate);
      } else {
        currentTemplate = updater;
      }
    });
    const commitToHistory = vi.fn();

    const actions = useElementActions(currentTemplate, setTemplate, commitToHistory);
    const dupId = actions.duplicateElement('el-orig');

    expect(dupId).toBeTruthy();
    expect(dupId).not.toBe('el-orig');
    expect(currentTemplate.elements.length).toBe(2);
    expect(currentTemplate.elements[1].id).toBe(dupId);
    expect(currentTemplate.elements[1].x).toBe(120);
    expect(currentTemplate.elements[1].y).toBe(120);
    expect(commitToHistory).toHaveBeenCalledTimes(1);
  });
});
