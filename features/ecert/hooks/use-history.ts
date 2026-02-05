import { useState, useCallback } from 'react';
import { CertificateTemplate } from '@/lib/types';


const MAX_HISTORY = 50;

export function useCertificateHistory(initialTemplate: CertificateTemplate) {
    const [history, setHistory] = useState<CertificateTemplate[]>([initialTemplate]);
    const [historyIndex, setHistoryIndex] = useState(0);

    // Save state to history stack
    const saveToHistory = useCallback(
        (newTemplate: CertificateTemplate) => {
            setHistory((prev) => {
                const newHistory = prev.slice(0, historyIndex + 1);
                newHistory.push(newTemplate);
                if (newHistory.length > MAX_HISTORY) newHistory.shift();
                return newHistory;
            });
            setHistoryIndex((prev) => Math.min(prev + 1, MAX_HISTORY - 1));
        },
        [historyIndex]
    );

    // Undo changes
    const undo = useCallback(() => {
        if (historyIndex > 0) {
            setHistoryIndex((prev) => prev - 1);
            return history[historyIndex - 1];
        }
        return null;
    }, [history, historyIndex]);

    // Redo changes
    const redo = useCallback(() => {
        if (historyIndex < history.length - 1) {
            setHistoryIndex((prev) => prev + 1);
            return history[historyIndex + 1];
        }
        return null;
    }, [history, historyIndex]);

    // Commit current template to history (alias for clearer intent)
    const commitToHistory = useCallback(
        (currentTemplate: CertificateTemplate) => {
            saveToHistory(currentTemplate);
        },
        [saveToHistory]
    );

    return {
        history,
        historyIndex,
        saveToHistory,
        commitToHistory,
        undo,
        redo,
        canUndo: historyIndex > 0,
        canRedo: historyIndex < history.length - 1,
    };
}
