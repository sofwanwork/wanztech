import { useCallback } from 'react';
import { CertificateElement, CertificateTemplate } from '@/lib/types';
import { toast } from 'sonner';

let elementCounter = 0;

export function generateElementId(prefix = 'el'): string {
  elementCounter = (elementCounter + 1) % 1000000;
  const rand = Math.random().toString(36).substring(2, 8);
  return `${prefix}-${Date.now()}-${elementCounter}-${rand}`;
}

export function useElementActions(
  template: CertificateTemplate,
  setTemplate: (
    t: CertificateTemplate | ((prev: CertificateTemplate) => CertificateTemplate)
  ) => void,
  commitToHistory: (t: CertificateTemplate) => void
) {
  // Helper to construct a default element with guaranteed unique ID
  const createDefaultElement = (
    type: CertificateElement['type'],
    extra?: Partial<CertificateElement>
  ): CertificateElement => {
    const newId = generateElementId(type);
    return {
      id: newId,
      type,
      x: 421,
      y: 300,
      width: type === 'shape' || type === 'icon' ? 60 : type === 'qr' ? 100 : 200,
      height:
        type === 'image' || type === 'qr' ? 100 : type === 'shape' || type === 'icon' ? 60 : 40,
      content: type === 'text' ? 'New Text' : undefined,
      iconName: type === 'icon' ? 'Star' : undefined,
      qrData: type === 'qr' ? '{VERIFY_URL}' : undefined,
      fontSize: 16,
      fontFamily: 'sans-serif',
      color: '#1a1a2e',
      textAlign: 'center',
      ...extra,
    };
  };

  // Update single element properties
  const updateElement = useCallback(
    (id: string, updates: Partial<CertificateElement>) => {
      setTemplate((prev) => ({
        ...prev,
        elements: prev.elements.map((el) => (el.id === id ? { ...el, ...updates } : el)),
      }));
    },
    [setTemplate]
  );

  // Add new element to canvas
  const addElement = useCallback(
    (type: CertificateElement['type'], extra?: Partial<CertificateElement>) => {
      const defaultElement = createDefaultElement(type, extra);

      setTemplate((prev) => {
        const newTemplate = {
          ...prev,
          elements: [...prev.elements, defaultElement],
        };
        commitToHistory(newTemplate);
        return newTemplate;
      });

      return defaultElement.id; // Return ID so caller can select it
    },
    [setTemplate, commitToHistory]
  );

  // Add multiple elements to canvas atomically in a single history entry
  const addElements = useCallback(
    (
      elementsToAdd: Array<{
        type: CertificateElement['type'];
        extra?: Partial<CertificateElement>;
      }>
    ) => {
      const createdElements = elementsToAdd.map(({ type, extra }) =>
        createDefaultElement(type, extra)
      );

      setTemplate((prev) => {
        const newTemplate = {
          ...prev,
          elements: [...prev.elements, ...createdElements],
        };
        commitToHistory(newTemplate);
        return newTemplate;
      });

      return createdElements.map((el) => el.id);
    },
    [setTemplate, commitToHistory]
  );

  // Delete element
  const deleteElement = useCallback(
    (id: string) => {
      setTemplate((prev) => {
        const newTemplate = {
          ...prev,
          elements: prev.elements.filter((el) => el.id !== id),
        };
        commitToHistory(newTemplate);
        return newTemplate;
      });
    },
    [setTemplate, commitToHistory]
  );

  // Duplicate element
  const duplicateElement = useCallback(
    (id: string) => {
      let newId = '';
      setTemplate((prev) => {
        const el = prev.elements.find((e) => e.id === id);
        if (!el) return prev;

        const newElement: CertificateElement = {
          ...el,
          id: generateElementId(el.type),
          x: el.x + 20,
          y: el.y + 20,
        };
        newId = newElement.id;

        const newTemplate = {
          ...prev,
          elements: [...prev.elements, newElement],
        };
        commitToHistory(newTemplate);
        return newTemplate;
      });
      toast.success('Element duplicated!');
      return newId;
    },
    [setTemplate, commitToHistory]
  );

  // Layer Controls
  const bringToFront = useCallback(
    (id: string) => {
      setTemplate((prev) => {
        const idx = prev.elements.findIndex((el) => el.id === id);
        if (idx === -1 || idx === prev.elements.length - 1) return prev;

        const newElements = [...prev.elements];
        const [element] = newElements.splice(idx, 1);
        newElements.push(element);

        const newTemplate = { ...prev, elements: newElements };
        commitToHistory(newTemplate);
        return newTemplate;
      });
    },
    [setTemplate, commitToHistory]
  );

  const sendToBack = useCallback(
    (id: string) => {
      setTemplate((prev) => {
        const idx = prev.elements.findIndex((el) => el.id === id);
        if (idx === -1 || idx === 0) return prev;

        const newElements = [...prev.elements];
        const [element] = newElements.splice(idx, 1);
        newElements.unshift(element);

        const newTemplate = { ...prev, elements: newElements };
        commitToHistory(newTemplate);
        return newTemplate;
      });
    },
    [setTemplate, commitToHistory]
  );

  const moveLayerUp = useCallback(
    (id: string) => {
      setTemplate((prev) => {
        const idx = prev.elements.findIndex((el) => el.id === id);
        if (idx === -1 || idx === prev.elements.length - 1) return prev;

        const newElements = [...prev.elements];
        [newElements[idx], newElements[idx + 1]] = [newElements[idx + 1], newElements[idx]];

        const newTemplate = { ...prev, elements: newElements };
        commitToHistory(newTemplate);
        return newTemplate;
      });
    },
    [setTemplate, commitToHistory]
  );

  const moveLayerDown = useCallback(
    (id: string) => {
      setTemplate((prev) => {
        const idx = prev.elements.findIndex((el) => el.id === id);
        if (idx <= 0) return prev;

        const newElements = [...prev.elements];
        [newElements[idx], newElements[idx - 1]] = [newElements[idx - 1], newElements[idx]];

        const newTemplate = { ...prev, elements: newElements };
        commitToHistory(newTemplate);
        return newTemplate;
      });
    },
    [setTemplate, commitToHistory]
  );

  return {
    addElement,
    addElements,
    updateElement,
    deleteElement,
    duplicateElement,
    bringToFront,
    sendToBack,
    moveLayerUp,
    moveLayerDown,
  };
}
