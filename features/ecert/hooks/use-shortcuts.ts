import { useEffect } from 'react';

interface UseShortcutsProps {
    selectedId: string | null;
    undo: () => void;
    redo: () => void;
    duplicateElement: () => void;
    deleteElement: (id: string) => void;
    saveTemplate: () => void;
    groupElements?: () => void;
    ungroupElements?: () => void;
    moveElement: (dx: number, dy: number) => void;
}

export function useShortcuts({
    selectedId,
    undo,
    redo,
    duplicateElement,
    deleteElement,
    saveTemplate,
    groupElements,
    ungroupElements,
    moveElement,
}: UseShortcutsProps) {
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Don't trigger if typing in input
            const target = e.target as HTMLElement;
            if (
                target.tagName === 'INPUT' ||
                target.tagName === 'TEXTAREA' ||
                target.isContentEditable
            ) {
                return;
            }

            // Ctrl/Cmd + Z = Undo
            if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
                e.preventDefault();
                undo();
            }

            // Ctrl/Cmd + Y or Ctrl/Cmd + Shift + Z = Redo
            if (
                (e.ctrlKey || e.metaKey) &&
                (e.key === 'y' || (e.key === 'z' && e.shiftKey))
            ) {
                e.preventDefault();
                redo();
            }

            // Ctrl/Cmd + D = Duplicate
            if ((e.ctrlKey || e.metaKey) && e.key === 'd') {
                e.preventDefault();
                duplicateElement();
            }

            // Ctrl/Cmd + S = Save
            if ((e.ctrlKey || e.metaKey) && e.key === 's') {
                e.preventDefault();
                saveTemplate();
            }

            // Ctrl/Cmd + G = Group / Ungroup
            if ((e.ctrlKey || e.metaKey) && e.key === 'g') {
                e.preventDefault();
                if (e.shiftKey) {
                    ungroupElements?.();
                } else {
                    groupElements?.();
                }
            }

            // Delete or Backspace = Delete element
            if ((e.key === 'Delete' || e.key === 'Backspace') && selectedId) {
                e.preventDefault();
                deleteElement(selectedId);
            }

            // Arrow keys = Nudge
            const nudgeAmount = e.shiftKey ? 10 : 1;
            if (e.key === 'ArrowUp' && selectedId) {
                e.preventDefault();
                moveElement(0, -nudgeAmount);
            }
            if (e.key === 'ArrowDown' && selectedId) {
                e.preventDefault();
                moveElement(0, nudgeAmount);
            }
            if (e.key === 'ArrowLeft' && selectedId) {
                e.preventDefault();
                moveElement(-nudgeAmount, 0);
            }
            if (e.key === 'ArrowRight' && selectedId) {
                e.preventDefault();
                moveElement(nudgeAmount, 0);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [
        selectedId,
        undo,
        redo,
        duplicateElement,
        deleteElement,
        saveTemplate,
        groupElements,
        ungroupElements,
        moveElement,
    ]);
}
