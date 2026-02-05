import { useCallback } from 'react';
import { CertificateElement, CertificateTemplate } from '@/lib/types';
import { toast } from 'sonner';

export function useElementActions(
  template: CertificateTemplate,
  setTemplate: (
    t: CertificateTemplate | ((prev: CertificateTemplate) => CertificateTemplate)
  ) => void,
  commitToHistory: (t: CertificateTemplate) => void
) {
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
      const newId = `el-${Date.now()}`;
      const defaultElement: CertificateElement = {
        id: newId,
        type,
        x: 421,
        y: 300,
        width: type === 'shape' || type === 'icon' ? 60 : type === 'qr' ? 100 : 200,
        height:
          type === 'image' || type === 'qr' ? 100 : type === 'shape' || type === 'icon' ? 60 : 40,
        content: type === 'text' ? 'Teks Baru' : undefined,
        iconName: type === 'icon' ? 'Star' : undefined,
        qrData: type === 'qr' ? '{VERIFY_URL}' : undefined,
        fontSize: 16,
        fontFamily: 'sans-serif',
        color: '#1a1a2e',
        textAlign: 'center',
        ...extra,
      };

      setTemplate((prev) => {
        const newTemplate = {
          ...prev,
          elements: [...prev.elements, defaultElement],
        };
        commitToHistory(newTemplate);
        return newTemplate;
      });

      return newId; // Return ID so caller can select it
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
          id: `${el.type}-${Date.now()}`,
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
    updateElement,
    deleteElement,
    duplicateElement,
    bringToFront,
    sendToBack,
    moveLayerUp,
    moveLayerDown,
  };
}
