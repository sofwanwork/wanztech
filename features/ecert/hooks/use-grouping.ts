import { useCallback } from 'react';
import { CertificateTemplate } from '@/lib/types';
import { v4 as uuidv4 } from 'uuid';
import { toast } from 'sonner';

interface UseGroupingProps {
    template: CertificateTemplate;
    setTemplate: (t: CertificateTemplate) => void;
    selectedId: string | null;
    additionalSelectedIds: string[];
    commitToHistory: (t: CertificateTemplate) => void;
}

export function useGrouping({
    template,
    setTemplate,
    selectedId,
    additionalSelectedIds,
    commitToHistory,
}: UseGroupingProps) {
    // Group elements
    const handleGroup = useCallback(() => {
        if (!selectedId && additionalSelectedIds.length === 0) return;
        const newGroupId = uuidv4();
        const idsToGroup = new Set(
            [selectedId, ...additionalSelectedIds].filter(Boolean) as string[]
        );

        // Check if any element is already in a group (optional: merge groups? for now, just overwrite)
        const newElements = template.elements.map((el) => {
            if (idsToGroup.has(el.id)) {
                return { ...el, groupId: newGroupId };
            }
            return el;
        });

        const newTemplate = { ...template, elements: newElements };
        setTemplate(newTemplate);
        commitToHistory(newTemplate);
        toast.success('Elements grouped');
    }, [selectedId, additionalSelectedIds, template, setTemplate, commitToHistory]);

    // Ungroup elements
    const handleUngroup = useCallback(() => {
        if (!selectedId && additionalSelectedIds.length === 0) return;
        const idsToUngroup = new Set(
            [selectedId, ...additionalSelectedIds].filter(Boolean) as string[]
        );

        // Find groups involved
        const groupsToDissolve = new Set<string>();
        template.elements.forEach((el) => {
            if (idsToUngroup.has(el.id) && el.groupId) {
                groupsToDissolve.add(el.groupId);
            }
        });

        if (groupsToDissolve.size === 0) return;

        const newElements = template.elements.map((el) => {
            if (el.groupId && groupsToDissolve.has(el.groupId)) {
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                const { groupId: _, ...rest } = el;
                return rest;
            }
            return el;
        });

        const newTemplate = { ...template, elements: newElements };
        setTemplate(newTemplate);
        commitToHistory(newTemplate);
        toast.success('Elements ungrouped');
    }, [selectedId, additionalSelectedIds, template, setTemplate, commitToHistory]);

    return { handleGroup, handleUngroup };
}
