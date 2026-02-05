import { useCallback } from 'react';
import { CertificateElement, CertificateTemplate } from '@/lib/types';

interface UseSelectionLogicProps {
    template: CertificateTemplate;
    selectedId: string | null;
    additionalSelectedIds: string[];
    setSelectedId: (id: string | null) => void;
    setAdditionalSelectedIds: (ids: string[]) => void;
    // Dragging starters
    setIsDragging: (v: boolean) => void;
    setDragStartPos: (pos: { x: number; y: number }) => void;
    setInitialElementPositions: (
        pos: Record<string, { x: number; y: number }>
    ) => void;
}

export function useSelectionLogic({
    template,
    selectedId,
    additionalSelectedIds,
    setSelectedId,
    setAdditionalSelectedIds,
    setIsDragging,
    setDragStartPos,
    setInitialElementPositions,
}: UseSelectionLogicProps) {
    const handleMouseDown = useCallback(
        (e: React.MouseEvent, el: CertificateElement) => {
            e.stopPropagation();

            // 1. Determine new selection
            let newSelectedId = selectedId;
            let newAdditionalIds = additionalSelectedIds;
            const isAlreadySelected =
                selectedId === el.id || additionalSelectedIds.includes(el.id);

            // Smart Group Selection: If element belongs to a group, select ALL group members
            let groupIdsToSelect: string[] = [];
            if (el.groupId) {
                groupIdsToSelect = template.elements
                    .filter((item) => item.groupId === el.groupId && item.id !== el.id)
                    .map((item) => item.id);
            }

            if (e.shiftKey) {
                if (isAlreadySelected) {
                    // Toggle off (and its group members)
                    const idsToRemove = new Set([el.id, ...groupIdsToSelect]);

                    if (selectedId && idsToRemove.has(selectedId)) {
                        if (additionalSelectedIds.length > 0) {
                            // Find next candidate not in the removed set
                            const remaining = additionalSelectedIds.filter(
                                (id) => !idsToRemove.has(id)
                            );
                            if (remaining.length > 0) {
                                newSelectedId = remaining[0];
                                newAdditionalIds = remaining.slice(1);
                            } else {
                                newSelectedId = null;
                                newAdditionalIds = [];
                            }
                        } else {
                            newSelectedId = null;
                            newAdditionalIds = [];
                        }
                    } else {
                        newAdditionalIds = additionalSelectedIds.filter(
                            (id) => !idsToRemove.has(id)
                        );
                    }
                } else {
                    // Add to selection (include group members)
                    if (!selectedId) {
                        newSelectedId = el.id;
                        newAdditionalIds = groupIdsToSelect;
                    } else {
                        // Avoid duplicates
                        const currentSet = new Set(additionalSelectedIds);
                        const newIds = [el.id, ...groupIdsToSelect].filter(
                            (id) => !currentSet.has(id)
                        );
                        newAdditionalIds = [...additionalSelectedIds, ...newIds];
                    }
                }
            } else {
                // No Shift - Single Select (but include group)
                if (!isAlreadySelected) {
                    newSelectedId = el.id;
                    newAdditionalIds = groupIdsToSelect;
                }
            }

            setSelectedId(newSelectedId);
            setAdditionalSelectedIds(newAdditionalIds);
            setIsDragging(true);
            setDragStartPos({ x: e.clientX, y: e.clientY });

            // Capture initial positions for drag
            const idsToDrag = new Set(
                [newSelectedId, ...newAdditionalIds].filter(Boolean) as string[]
            );
            const initial: Record<string, { x: number; y: number }> = {};

            template.elements.forEach((elem) => {
                if (idsToDrag.has(elem.id)) {
                    initial[elem.id] = { x: elem.x, y: elem.y };
                }
            });
            setInitialElementPositions(initial);
        },
        [
            template,
            selectedId,
            additionalSelectedIds,
            setSelectedId,
            setAdditionalSelectedIds,
            setIsDragging,
            setDragStartPos,
            setInitialElementPositions,
        ]
    );

    return { handleMouseDown };
}
