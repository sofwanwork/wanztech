'use client';

import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { CertificateElement, CertificateTemplate } from '@/lib/types';
import { updateCertificateTemplateAction } from '@/actions/certificate-template';
import {
  Star,
  Award,
  Shield,
  Heart,
  Trophy,
  Medal,
  ThumbsUp,
  MapPin,
  CheckCircle,
  Flag,
  Minus,
  Plus,
  Maximize2,
  PlusCircle,
  Palette,
  RotateCw,
  Download,
  FileDown,
  Copy,
  Trash2,
  Layers,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { ImageCropperDialog } from '@/components/image-cropper-dialog';
import { toast } from 'sonner';
// import html2canvas from 'html2canvas-pro';
import { QRCodeSVG } from 'qrcode.react';

import { useCertificateHistory } from '@/features/certificates/hooks/use-history';
import { useElementActions } from '@/features/certificates/hooks/use-element-actions';
import { useGrouping } from '@/features/certificates/hooks/use-grouping';
import { useSelectionLogic } from '@/features/certificates/hooks/use-selection-logic';
import { useShortcuts } from '@/features/certificates/hooks/use-shortcuts';
import { useImageUpload } from '@/features/certificates/hooks/use-image-upload';
import { CertificateEditorToolbar } from '@/components/certificates/builder/toolbar';
import { CertificateEditorSidebar } from '@/components/certificates/builder/sidebar';
import { CertificateEditorProperties } from '@/components/certificates/builder/properties';
import { alignElements, distributeElements } from '@/lib/certificates/alignment';

interface CertificateBuilderClientProps {
  template: CertificateTemplate;
}

const PLACEHOLDER_LABELS: Record<string, string> = {
  name: '{Participant Name}',
  program: '{Program Name}',
  date: '{Date}',
  signature: '{Signature}',
  expiry: '{Expiry Date}',
  ic: '{ID / IC Number}',
  serial: '{Serial Number}',
  organization: '{Organization / School}',
  role: '{Role / Position}',
  grade: '{Grade / Training Hours}',
};
// ... (existing code) ...

const ICON_MAP: Record<string, React.ElementType> = {
  Star,
  Award,
  Shield,
  Heart,
  Trophy,
  Medal,
  ThumbsUp,
  MapPin,
  CheckCircle,
  Flag,
};

type ResizeHandleType = 'nw' | 'ne' | 'sw' | 'se' | 'n' | 's' | 'e' | 'w';

interface ResizeState {
  handle: ResizeHandleType;
  startX: number;
  startY: number;
  initialX: number;
  initialY: number;
  initialWidth: number;
  initialHeight: number;
  initialFontSize: number;
  elementType: CertificateElement['type'];
}

export function CertificateBuilderClient({
  template: initialTemplate,
}: CertificateBuilderClientProps) {
  // 1. Core State — sanitize initial elements to guarantee strictly unique IDs
  const sanitizedInitialTemplate = useMemo(() => {
    const seen = new Set<string>();
    let hasDuplicates = false;
    const sanitizedElements = (initialTemplate.elements || []).map((el, i) => {
      if (!el.id || seen.has(el.id)) {
        hasDuplicates = true;
        const uniqueId = `el-${Date.now()}-${i}-${Math.random().toString(36).substring(2, 7)}`;
        seen.add(uniqueId);
        return { ...el, id: uniqueId };
      }
      seen.add(el.id);
      return el;
    });
    return hasDuplicates ? { ...initialTemplate, elements: sanitizedElements } : initialTemplate;
  }, [initialTemplate]);

  const [template, setTemplate] = useState(sanitizedInitialTemplate);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // 2. UI/Interaction State
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [resizeState, setResizeState] = useState<ResizeState | null>(null);
  const [saving, setSaving] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [exportingPdf, setExportingPdf] = useState(false);

  // Smart Editing State
  const [showGrid, setShowGrid] = useState(false);
  const [snapToGrid, setSnapToGrid] = useState(false);
  const [showSafeMargin, setShowSafeMargin] = useState(false);
  const [alignmentGuides, setAlignmentGuides] = useState<{ x: number[]; y: number[] }>({
    x: [],
    y: [],
  });

  // Multi-select & Drag State
  const [additionalSelectedIds, setAdditionalSelectedIds] = useState<string[]>([]);
  const [dragStartPos, setDragStartPos] = useState<{ x: number; y: number } | null>(null);
  const [initialElementPositions, setInitialElementPositions] = useState<
    Record<string, { x: number; y: number }>
  >({});

  const canvasRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const hasMovedRef = useRef(false);
  const selectedElement = template.elements.find((el) => el.id === selectedId);

  // Responsive Workspace & Zoom State
  const [mounted, setMounted] = useState(false);
  const [showSidebar, setShowSidebar] = useState(true);
  const [zoomMode, setZoomMode] = useState<'fit' | 'custom'>('fit');
  const [customZoom, setCustomZoom] = useState(1);
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });

  // Mobile Drawers State
  const [mobileAddOpen, setMobileAddOpen] = useState(false);
  const [mobilePropsOpen, setMobilePropsOpen] = useState(false);
  const [mobileExportOpen, setMobileExportOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
    const node = containerRef.current;
    if (!node) return;

    const measure = () => {
      const rect = node.getBoundingClientRect();
      const parentW = node.parentElement?.getBoundingClientRect().width || window.innerWidth;
      const w = Math.min(rect.width || node.clientWidth, parentW, window.innerWidth);
      const h = rect.height || node.clientHeight || (window.innerHeight - 140);
      if (w > 0 && h > 0) {
        setContainerSize({ width: Math.round(w), height: Math.round(h) });
      }
    };

    measure();

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;
      const rawW = entry.contentRect.width || node.clientWidth;
      const rawH = entry.contentRect.height || node.clientHeight;
      const w = Math.min(rawW, window.innerWidth);
      const h = rawH;
      if (w > 0 && h > 0) {
        setContainerSize({ width: Math.round(w), height: Math.round(h) });
      }
    });

    observer.observe(node);
    window.addEventListener('resize', measure);

    return () => {
      observer.disconnect();
      window.removeEventListener('resize', measure);
    };
  }, []);

  // Compute fit-to-screen scale based on available container dimensions
  const fitScale = useMemo(() => {
    // Deterministic baseline across SSR and initial client hydration (prevents hydration mismatch)
    if (!mounted || containerSize.width === 0) {
      const baselineW = 390;
      const padX = 16;
      return Math.min((baselineW - padX) / template.width, 500 / template.height);
    }

    const screenW = window.innerWidth;
    const isMobile = (containerSize.width > 0 ? containerSize.width : screenW) < 640;
    const padX = isMobile ? 16 : 40;
    const padY = isMobile ? 24 : 40;

    const effectiveW = containerSize.width > 0 ? Math.min(containerSize.width, screenW) : screenW;
    const effectiveH =
      containerSize.height > 0
        ? containerSize.height
        : (window.innerHeight - 150);

    const availW = Math.max(120, effectiveW - padX);
    const availH = Math.max(120, effectiveH - padY);

    return Math.min(availW / template.width, availH / template.height);
  }, [mounted, containerSize.width, containerSize.height, template.width, template.height]);

  const currentScale = zoomMode === 'fit' ? Math.min(fitScale, 1.25) : customZoom;
  const renderedWidth = Math.max(100, Math.round(template.width * currentScale));
  const renderedHeight = Math.max(100, Math.round(template.height * currentScale));

  const handleZoomIn = () => {
    setZoomMode('custom');
    setCustomZoom((prev) => Math.min(2.5, Math.round(((zoomMode === 'fit' ? currentScale : prev) + 0.1) * 100) / 100));
  };

  const handleZoomOut = () => {
    setZoomMode('custom');
    setCustomZoom((prev) => Math.max(0.2, Math.round(((zoomMode === 'fit' ? currentScale : prev) - 0.1) * 100) / 100));
  };

  const handleResetFit = () => {
    setZoomMode('fit');
  };

  const handleActualSize = () => {
    setZoomMode('custom');
    setCustomZoom(1);
  };

  // 3. Hooks Initialization
  const {
    history,
    historyIndex,
    commitToHistory: commitToHistoryHook, // Renamed to avoid confusion if needed
    undo: undoHistory,
    redo: redoHistory,
  } = useCertificateHistory(sanitizedInitialTemplate);

  const {
    addElement,
    addElements,
    updateElement,
    deleteElement,
    duplicateElement,
    bringToFront,
    sendToBack,
    moveLayerUp,
    moveLayerDown,
  } = useElementActions(template, setTemplate, commitToHistoryHook);

  const { handleGroup, handleUngroup } = useGrouping({
    template,
    setTemplate,
    selectedId,
    additionalSelectedIds,
    commitToHistory: commitToHistoryHook,
  });

  const { handleMouseDown: handleSelectionMouseDown } = useSelectionLogic({
    template,
    selectedId,
    additionalSelectedIds,
    setSelectedId,
    setAdditionalSelectedIds,
    setIsDragging,
    setDragStartPos,
    setInitialElementPositions,
  });

  const {
    cropperOpen,
    setCropperOpen,
    imageToCrop,
    setImageToCrop,
    imageInputRef,
    handleImageUpload,
    handleCropComplete,
  } = useImageUpload({
    addElement,
    updateElement,
    selectedId,
  });

  // 4. Client-side wrappers & Actions
  const undo = useCallback(() => {
    const prev = undoHistory();
    if (prev) setTemplate(prev);
  }, [undoHistory]);

  const redo = useCallback(() => {
    const next = redoHistory();
    if (next) setTemplate(next);
  }, [redoHistory]);

  const handleToggleOrientation = useCallback(() => {
    setTemplate((prev) => {
      const nextWidth = prev.height;
      const nextHeight = prev.width;
      const ratioX = nextWidth / prev.width;
      const ratioY = nextHeight / prev.height;
      const newElements = prev.elements.map((el) => ({
        ...el,
        x: Math.round(el.x * ratioX),
        y: Math.round(el.y * ratioY),
      }));
      const updated = {
        ...prev,
        width: nextWidth,
        height: nextHeight,
        elements: newElements,
      };
      commitToHistoryHook(updated);
      return updated;
    });
    setZoomMode('fit');
  }, [commitToHistoryHook]);

  // Handle Mouse Down (Selection Wrapper)
  const handleMouseDown = useCallback(
    (e: React.MouseEvent, el: CertificateElement) => {
      hasMovedRef.current = false;
      handleSelectionMouseDown(e, el);
    },
    [handleSelectionMouseDown]
  );

  // Nudge logic wrapper
  const nudgeElement = useCallback(
    (dx: number, dy: number) => {
      if (!selectedId) return;
      const el = template.elements.find((e) => e.id === selectedId);
      if (!el) return;

      updateElement(selectedId, {
        x: Math.max(0, Math.min(template.width, el.x + dx)),
        y: Math.max(0, Math.min(template.height, el.y + dy)),
      });
    },
    [selectedId, template, updateElement]
  );

  // Multi-selection alignment & distribution
  const allSelectedIds = useMemo(() => {
    return selectedId
      ? [selectedId, ...additionalSelectedIds.filter((id) => id !== selectedId)]
      : additionalSelectedIds;
  }, [selectedId, additionalSelectedIds]);

  const handleAlignElements = useCallback(
    (type: 'left' | 'center' | 'right' | 'top' | 'middle' | 'bottom') => {
      if (allSelectedIds.length < 2) return;
      setTemplate((prev) => {
        const newElements = alignElements(prev.elements, allSelectedIds, type);
        const next = { ...prev, elements: newElements };
        commitToHistoryHook(next);
        return next;
      });
      toast.success('Elements aligned!');
    },
    [allSelectedIds, commitToHistoryHook]
  );

  const handleDistributeElements = useCallback(
    (direction: 'horizontal' | 'vertical') => {
      if (allSelectedIds.length < 3) {
        toast.info('Select at least 3 elements to distribute spacing.');
        return;
      }
      setTemplate((prev) => {
        const newElements = distributeElements(prev.elements, allSelectedIds, direction);
        const next = { ...prev, elements: newElements };
        commitToHistoryHook(next);
        return next;
      });
      toast.success('Element spacing distributed!');
    },
    [allSelectedIds, commitToHistoryHook]
  );

  // Save Template
  const handleSave = useCallback(async () => {
    setSaving(true);
    try {
      // Generate thumbnail
      let thumbnail: string | undefined = undefined;
      if (canvasRef.current) {
        // Hide selection ring
        const prevSelected = selectedId;
        setSelectedId(null);

        // Wait a bit for the ring to disappear
        await new Promise((r) => setTimeout(r, 50));

        try {
          const html2canvas = (await import('html2canvas-pro')).default;
          const canvas = await html2canvas(canvasRef.current, {
            scale: 0.4, // Small scale for thumbnail
            useCORS: true,
            backgroundColor: null,
          });
          thumbnail = canvas.toDataURL('image/jpeg', 0.7);
        } catch (err) {
          console.error('Thumbnail generation error:', err);
        }

        // Restore selection
        setSelectedId(prevSelected);
      }

      const result = await updateCertificateTemplateAction(template.id, {
        name: template.name,
        elements: template.elements,
        backgroundColor: template.backgroundColor,
        backgroundImage: template.backgroundImage,
        thumbnail,
        width: template.width,
        height: template.height,
      });
      if (result.success) {
        toast.success('Template saved!');
      } else {
        toast.error(result.error || 'Failed to save template');
      }
    } catch {
      toast.error('Failed to save template');
    } finally {
      setSaving(false);
    }
  }, [template, selectedId]);

  // Export to PNG
  const exportToPNG = useCallback(async () => {
    if (!canvasRef.current) return;
    setExporting(true);
    try {
      // Hide selection ring during export
      setSelectedId(null);
      await new Promise((r) => setTimeout(r, 100));

      const html2canvas = (await import('html2canvas-pro')).default;
      const canvas = await html2canvas(canvasRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: null,
      });
      const link = document.createElement('a');
      link.download = `${template.name || 'certificate'}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
      toast.success('Certificate downloaded successfully!');
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export certificate');
    } finally {
      setExporting(false);
    }
  }, [template.name]);

  // Export to PDF (A4 Print-Ready)
  const exportToPDF = useCallback(async () => {
    if (!canvasRef.current) return;
    setExportingPdf(true);
    const prevSelected = selectedId;
    try {
      // Hide selection ring during export
      setSelectedId(null);
      await new Promise((r) => setTimeout(r, 100));

      const html2canvas = (await import('html2canvas-pro')).default;
      const canvas = await html2canvas(canvasRef.current, {
        scale: 3, // Crisp 3x HD rendering
        useCORS: true,
        backgroundColor: template.backgroundColor || '#ffffff',
      });

      const isPortrait = (template.height || 794) > (template.width || 1123);
      const { jsPDF } = await import('jspdf');
      const pdf = new jsPDF({
        orientation: isPortrait ? 'portrait' : 'landscape',
        unit: 'mm',
        format: 'a4',
      });

      const imgData = canvas.toDataURL('image/jpeg', 0.85);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight, undefined, 'FAST');
      pdf.save(`${template.name || 'certificate'}.pdf`);
      toast.success('Certificate downloaded in PDF format (A4)!');
    } catch (error) {
      console.error('PDF export error:', error);
      toast.error('Failed to export PDF');
    } finally {
      setSelectedId(prevSelected);
      setExportingPdf(false);
    }
  }, [template.name, template.height, template.width, template.backgroundColor, selectedId]);

  // Shortcuts Hook
  useShortcuts({
    selectedId,
    undo,
    redo,
    duplicateElement: () => selectedId && duplicateElement(selectedId),
    deleteElement,
    saveTemplate: handleSave,
    groupElements: handleGroup,
    ungroupElements: handleUngroup,
    moveElement: nudgeElement,
  });

  // Drag / Resize Performance Refs
  const rafRef = useRef<number | null>(null);
  const latestTemplateRef = useRef(template);

  useEffect(() => {
    latestTemplateRef.current = template;
  }, [template]);

  // Canva-style Resize handle mouse down
  const handleResizeMouseDown = (
    e: React.MouseEvent,
    el: CertificateElement,
    handle: ResizeHandleType
  ) => {
    e.stopPropagation();
    e.preventDefault();
    hasMovedRef.current = false;
    setSelectedId(el.id);
    setIsResizing(true);
    setIsDragging(false);

    setResizeState({
      handle,
      startX: e.clientX,
      startY: e.clientY,
      initialX: Number(el.x) || 0,
      initialY: Number(el.y) || 0,
      initialWidth: Math.max(30, Number(el.width) || (el.type === 'text' || el.type === 'placeholder' ? 250 : 100)),
      initialHeight: Math.max(20, Number(el.height) || (el.type === 'text' || el.type === 'placeholder' ? 50 : 100)),
      initialFontSize: Number(el.fontSize) || 16,
      elementType: el.type,
    });
  };

  const handlePointerMove = useCallback(
    (e: MouseEvent) => {
      if (!selectedId) return;
      const scale = currentScale || 1;

      if (isDragging && dragStartPos && initialElementPositions[selectedId]) {
        // 1. Calculate main delta
        const deltaX = (e.clientX - dragStartPos.x) / scale;
        const deltaY = (e.clientY - dragStartPos.y) / scale;

        const initialPrimary = initialElementPositions[selectedId];
        if (!initialPrimary) return;

        let newPrimaryX = initialPrimary.x + deltaX;
        let newPrimaryY = initialPrimary.y + deltaY;

        // 2. Apply Snapping (to Primary Element)
        const newGuides = { x: [] as number[], y: [] as number[] };
        const SNAP_THRESHOLD = 5;

        if (snapToGrid) {
          const gridSize = 20;
          newPrimaryX = Math.round(newPrimaryX / gridSize) * gridSize;
          newPrimaryY = Math.round(newPrimaryY / gridSize) * gridSize;
        } else {
          // Alignment Guides (Center only for performance)
          if (Math.abs(newPrimaryX - template.width / 2) < SNAP_THRESHOLD) {
            newPrimaryX = template.width / 2;
            newGuides.x.push(template.width / 2);
          }

          // Snap to other elements (excluding selected ones)
          template.elements.forEach((other) => {
            if (other.id === selectedId || additionalSelectedIds.includes(other.id)) return;

            if (Math.abs(newPrimaryX - other.x) < SNAP_THRESHOLD) {
              newPrimaryX = other.x;
              newGuides.x.push(other.x);
            }
            if (Math.abs(newPrimaryY - other.y) < SNAP_THRESHOLD) {
              newPrimaryY = other.y;
              newGuides.y.push(other.y);
            }
          });
        }

        // 3. Constrain Primary
        newPrimaryX = Math.max(0, Math.min(template.width, newPrimaryX));
        newPrimaryY = Math.max(0, Math.min(template.height, newPrimaryY));

        // 4. Apply Final Delta to ALL selected elements
        const effectiveDeltaX = newPrimaryX - initialPrimary.x;
        const effectiveDeltaY = newPrimaryY - initialPrimary.y;

        if (effectiveDeltaX !== 0 || effectiveDeltaY !== 0) {
          hasMovedRef.current = true;
        }

        const idsToUpdate = new Set([selectedId, ...additionalSelectedIds]);
        const newElements = template.elements.map((el) => {
          if (idsToUpdate.has(el.id) && initialElementPositions[el.id]) {
            return {
              ...el,
              x: Math.round(initialElementPositions[el.id].x + effectiveDeltaX),
              y: Math.round(initialElementPositions[el.id].y + effectiveDeltaY),
            };
          }
          return el;
        });

        if (rafRef.current) {
          cancelAnimationFrame(rafRef.current);
        }
        rafRef.current = requestAnimationFrame(() => {
          const updated = { ...latestTemplateRef.current, elements: newElements };
          latestTemplateRef.current = updated;
          setTemplate(updated);
          setAlignmentGuides((prev) => {
            if (
              prev.x.length === newGuides.x.length &&
              prev.y.length === newGuides.y.length &&
              prev.x[0] === newGuides.x[0] &&
              prev.y[0] === newGuides.y[0]
            ) {
              return prev;
            }
            return newGuides;
          });
          rafRef.current = null;
        });
      } else if (isResizing && resizeState && selectedId) {
        const {
          handle,
          startX,
          startY,
          initialX,
          initialY,
          initialWidth,
          initialHeight,
          initialFontSize,
          elementType,
        } = resizeState;

        const dx = (e.clientX - startX) / scale;
        const dy = (e.clientY - startY) / scale;

        if (dx !== 0 || dy !== 0) {
          hasMovedRef.current = true;
        }

        const isText = elementType === 'text' || elementType === 'placeholder';
        const isCorner = handle === 'nw' || handle === 'ne' || handle === 'sw' || handle === 'se';

        let updates: Partial<CertificateElement> = {};

        if (isText) {
          if (isCorner) {
            // Canva-style corner scaling for text: scales font size and width proportionally
            let delta = 0;
            if (handle === 'se') delta = (dx + dy) / 2;
            else if (handle === 'nw') delta = (-dx - dy) / 2;
            else if (handle === 'ne') delta = (dx - dy) / 2;
            else if (handle === 'sw') delta = (-dx + dy) / 2;

            const scaleFactor = Math.max(0.2, (initialWidth + delta * 2) / initialWidth);
            const newWidth = Math.max(40, Math.round(initialWidth * scaleFactor));
            const newFontSize = Math.max(8, Math.min(140, Math.round(initialFontSize * scaleFactor)));

            updates = { width: newWidth, fontSize: newFontSize };
          } else if (handle === 'e' || handle === 'w') {
            // Side handle: adjusts text box wrap width without changing font size
            const newWidth = Math.max(40, Math.round(handle === 'e' ? initialWidth + dx * 2 : initialWidth - dx * 2));
            updates = { width: newWidth };
          }
        } else {
          // Shapes, Images, Icons, QR
          const aspectRatio = initialWidth / (initialHeight || 1);
          const isProportional = isCorner || e.shiftKey || elementType === 'qr' || elementType === 'icon';

          let newWidth = initialWidth;
          let newHeight = initialHeight;
          let newX = initialX;
          let newY = initialY;

          if (handle === 'se') {
            newWidth = Math.max(20, initialWidth + dx);
            newHeight = isProportional ? newWidth / aspectRatio : Math.max(20, initialHeight + dy);
            newX = initialX + (newWidth - initialWidth) / 2;
            newY = initialY + (newHeight - initialHeight) / 2;
          } else if (handle === 'nw') {
            newWidth = Math.max(20, initialWidth - dx);
            newHeight = isProportional ? newWidth / aspectRatio : Math.max(20, initialHeight - dy);
            newX = initialX - (newWidth - initialWidth) / 2;
            newY = initialY - (newHeight - initialHeight) / 2;
          } else if (handle === 'ne') {
            newWidth = Math.max(20, initialWidth + dx);
            newHeight = isProportional ? newWidth / aspectRatio : Math.max(20, initialHeight - dy);
            newX = initialX + (newWidth - initialWidth) / 2;
            newY = initialY - (newHeight - initialHeight) / 2;
          } else if (handle === 'sw') {
            newWidth = Math.max(20, initialWidth - dx);
            newHeight = isProportional ? newWidth / aspectRatio : Math.max(20, initialHeight + dy);
            newX = initialX - (newWidth - initialWidth) / 2;
            newY = initialY + (newHeight - initialHeight) / 2;
          } else if (handle === 'e') {
            newWidth = Math.max(20, initialWidth + dx);
            newX = initialX + (newWidth - initialWidth) / 2;
          } else if (handle === 'w') {
            newWidth = Math.max(20, initialWidth - dx);
            newX = initialX - (newWidth - initialWidth) / 2;
          } else if (handle === 's') {
            newHeight = Math.max(20, initialHeight + dy);
            newY = initialY + (newHeight - initialHeight) / 2;
          } else if (handle === 'n') {
            newHeight = Math.max(20, initialHeight - dy);
            newY = initialY - (newHeight - initialHeight) / 2;
          }

          newX = Math.max(0, Math.min(template.width, newX));
          newY = Math.max(0, Math.min(template.height, newY));

          updates = {
            width: Math.round(newWidth),
            height: Math.round(newHeight),
            x: Math.round(newX),
            y: Math.round(newY),
          };
        }

        if (rafRef.current) {
          cancelAnimationFrame(rafRef.current);
        }
        rafRef.current = requestAnimationFrame(() => {
          const updatedElements = latestTemplateRef.current.elements.map((el) =>
            el.id === selectedId ? { ...el, ...updates } : el
          );
          const updated = { ...latestTemplateRef.current, elements: updatedElements };
          latestTemplateRef.current = updated;
          setTemplate(updated);
          rafRef.current = null;
        });
      }
    },
    [
      selectedId,
      currentScale,
      isDragging,
      dragStartPos,
      initialElementPositions,
      snapToGrid,
      template.width,
      template.height,
      template.elements,
      additionalSelectedIds,
      isResizing,
      resizeState,
    ]
  );

  const handlePointerUp = useCallback(() => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    if ((isDragging || isResizing) && hasMovedRef.current) {
      commitToHistoryHook(latestTemplateRef.current);
    }
    hasMovedRef.current = false;
    setIsDragging(false);
    setIsResizing(false);
    setResizeState(null);
    setDragStartPos(null);
    setInitialElementPositions({});
    setAlignmentGuides({ x: [], y: [] });
  }, [isDragging, isResizing, commitToHistoryHook]);

  // Global window listeners for fluid, unbroken drag/resize
  const handlePointerMoveRef = useRef(handlePointerMove);
  handlePointerMoveRef.current = handlePointerMove;
  const handlePointerUpRef = useRef(handlePointerUp);
  handlePointerUpRef.current = handlePointerUp;

  useEffect(() => {
    if (!isDragging && !isResizing) return;

    const onMove = (e: MouseEvent) => {
      handlePointerMoveRef.current(e);
    };
    const onUp = () => {
      handlePointerUpRef.current();
    };

    window.addEventListener('mousemove', onMove, { passive: false });
    window.addEventListener('mouseup', onUp);

    // Global cursor lock & text selection prevention during active drag/resize
    const prevCursor = document.body.style.cursor;
    const prevUserSelect = document.body.style.userSelect;
    if (isDragging) {
      document.body.style.cursor = 'move';
    }
    document.body.style.userSelect = 'none';

    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
      document.body.style.cursor = prevCursor;
      document.body.style.userSelect = prevUserSelect;
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, [isDragging, isResizing]);

  return (
    <div className="h-full flex-1 flex flex-col bg-gray-100 overflow-hidden min-w-0 min-h-0">
      {/* Google Fonts for Certificates */}
      {/* eslint-disable-next-line @next/next/no-page-custom-font */}
      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=Alex+Brush&family=Cinzel:wght@400;700&family=Cinzel+Decorative:wght@700&family=Cormorant+Garamond:ital,wght@0,400;0,700;1,400&family=Dancing+Script:wght@700&family=Great+Vibes&family=Montserrat:wght@400;700&family=Pinyon+Script&family=Playfair+Display:ital,wght@0,400;0,700;1,400&family=Poppins:wght@400;600;700&display=swap"
      />

      {/* Hidden file input for image upload */}
      <input
        ref={imageInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        onChange={handleImageUpload}
        className="hidden"
        title="Upload Image"
      />

      {/* Top Toolbar */}
      <CertificateEditorToolbar
        templateName={template.name}
        templateId={template.id}
        onNameChange={(name) => setTemplate((prev) => ({ ...prev, name }))}
        canUndo={historyIndex > 0}
        canRedo={historyIndex < history.length - 1}
        onUndo={undo}
        onRedo={redo}
        canGroup={additionalSelectedIds.length > 0}
        canUngroup={additionalSelectedIds.length > 0 || !!selectedId}
        onGroup={handleGroup}
        onUngroup={handleUngroup}
        showGrid={showGrid}
        snapToGrid={snapToGrid}
        onToggleGrid={() => setShowGrid(!showGrid)}
        onToggleSnap={() => setSnapToGrid(!snapToGrid)}
        onSave={handleSave}
        saving={saving}
        onExport={exportToPNG}
        exporting={exporting}
        onExportPdf={exportToPDF}
        exportingPdf={exportingPdf}
        showSafeMargin={showSafeMargin}
        onToggleSafeMargin={() => setShowSafeMargin(!showSafeMargin)}
        orientation={template.width >= template.height ? 'landscape' : 'portrait'}
        onOrientationChange={handleToggleOrientation}
        showSidebar={showSidebar}
        onToggleSidebar={() => setShowSidebar((prev) => !prev)}
      />

      {/* Mobile Canvas Status Strip (md:hidden) */}
      <div className="md:hidden bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-3 py-1.5 flex items-center justify-between text-[11px] text-slate-600 shrink-0 shadow-xs">
        <div className="flex items-center gap-1.5 font-medium">
          <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
          <span className="font-semibold text-slate-800">
            {template.width >= template.height ? 'A4 Landscape' : 'A4 Portrait'}
          </span>
          <span className="text-slate-400 font-mono text-[10px]">
            ({template.width}×{template.height}px)
          </span>
        </div>
        <button
          type="button"
          onClick={handleToggleOrientation}
          className="text-slate-700 bg-slate-100 hover:bg-slate-200 px-2 py-0.5 rounded-md font-medium flex items-center gap-1 text-[11px] transition-colors active:scale-95"
          title="Switch Orientation between Landscape & Portrait"
        >
          <RotateCw className="h-3 w-3 text-slate-500" />
          <span>Rotate A4</span>
        </button>
      </div>

      <div className="flex-1 flex overflow-hidden min-w-0 min-h-0">
        {/* Left Sidebar - Elements */}
        {showSidebar && (
          <CertificateEditorSidebar
            addElement={addElement}
            addElements={addElements}
            imageInputRef={imageInputRef}
            template={template}
            onUpdateTemplate={(updates) => setTemplate((prev) => ({ ...prev, ...updates }))}
          />
        )}

        {/* Canvas Area */}
        <div
          ref={containerRef}
          className="flex-1 min-w-0 min-h-0 overflow-auto p-3 sm:p-4 md:p-6 pb-24 md:pb-6 flex relative bg-slate-100/90 select-none"
          onClick={() => setSelectedId(null)}
        >
          <div
            ref={canvasRef}
            suppressHydrationWarning
            className={`relative shadow-2xl bg-cover m-auto shrink-0 select-none ${
              !mounted || isDragging || isResizing ? 'transition-none' : 'transition-[width,height] duration-100'
            }`}
            style={{
              width: `${renderedWidth}px`,
              height: `${renderedHeight}px`,
              backgroundColor: template.backgroundColor,
              backgroundImage: template.backgroundImage
                ? `url(${template.backgroundImage})`
                : undefined,
            }}
            onClick={() => setSelectedId(null)}
          >
            {showGrid && (
              <div className="absolute inset-0 pointer-events-none z-0 bg-[image:linear-gradient(to_right,#e5e7eb_1px,transparent_1px),linear-gradient(to_bottom,#e5e7eb_1px,transparent_1px)] bg-[length:20px_20px]" />
            )}
            {showSafeMargin && (
              <div
                className="absolute inset-6 md:inset-8 border-2 border-dashed border-amber-500/70 pointer-events-none z-40 rounded-sm"
                title="Sempadan Selamat Cetakan (A4 Margin)"
              >
                <span className="absolute top-1 left-2 text-[10px] font-mono font-medium text-amber-700 bg-amber-100/90 px-1.5 py-0.5 rounded shadow-sm uppercase tracking-wider">
                  Zon Selamat Cetakan (A4)
                </span>
              </div>
            )}
            {(() => {
              const scale = currentScale;
              return template.elements.map((el) => {
              const isSelected = el.id === selectedId || additionalSelectedIds.includes(el.id);
              const isPrimarySelected = el.id === selectedId;

              return (
                <div
                  key={el.id}
                  className={`absolute cursor-move select-none group ${
                    isDragging || isResizing
                      ? 'transition-none'
                      : 'transition-[box-shadow,opacity] duration-150'
                  } ${
                    isSelected
                      ? ''
                      : 'hover:ring-1 hover:ring-primary/60 hover:ring-offset-1 rounded-sm'
                  }`}
                  style={{
                    left: `${(el.x / template.width) * 100}%`,
                    top: `${(el.y / template.height) * 100}%`,
                    width: `${(el.width / template.width) * 100}%`,
                    height:
                      el.type === 'text' || el.type === 'placeholder'
                        ? 'auto'
                        : `${(el.height / template.height) * 100}%`,
                    transform: `translate(-50%, -50%) rotate(${el.rotation ?? 0}deg)`,
                    willChange: isDragging || isResizing ? 'left, top' : undefined,
                    opacity: el.opacity ?? 1,
                    boxShadow: el.shadow?.enabled
                      ? `${el.shadow.offsetX}px ${el.shadow.offsetY}px ${el.shadow.blur}px ${el.shadow.color}`
                      : undefined,
                    borderRadius: `${el.borderRadius ?? 0}px`,
                  }}
                  onMouseDown={(e) => handleMouseDown(e, el)}
                  onClick={(e) => e.stopPropagation()}
                >
                  {el.type === 'text' && (
                    <div
                      className="whitespace-pre-line break-words px-1 py-0.5"
                      style={{
                        fontSize: `${(el.fontSize || 16) * scale}px`,
                        fontFamily: el.fontFamily,
                        fontWeight: el.fontWeight,
                        fontStyle: el.fontStyle,
                        textDecoration: el.textDecoration,
                        color: el.color,
                        textAlign: el.textAlign,
                        lineHeight: el.lineHeight ?? 1.2,
                        letterSpacing: `${el.letterSpacing ?? 0}px`,
                        WebkitTextStroke: el.textStrokeWidth
                          ? `${el.textStrokeWidth * scale}px ${el.textStroke || '#000'}`
                          : undefined,
                      }}
                    >
                      {el.content}
                    </div>
                  )}
                  {el.type === 'placeholder' && (
                    <div
                      className={`whitespace-pre-line break-words rounded transition-colors duration-150 px-1 py-0.5 ${
                        isSelected || exporting || exportingPdf
                          ? 'border border-transparent bg-transparent'
                          : 'border border-dashed border-primary/30 bg-primary/[0.03] group-hover:border-primary/60 group-hover:bg-primary/[0.06]'
                      }`}
                      style={{
                        fontSize: `${(el.fontSize || 16) * scale}px`,
                        fontFamily: el.fontFamily,
                        fontWeight: el.fontWeight,
                        fontStyle: el.fontStyle,
                        textDecoration: el.textDecoration,
                        color: el.color,
                        textAlign: el.textAlign,
                        lineHeight: el.lineHeight ?? 1.2,
                        letterSpacing: `${el.letterSpacing ?? 0}px`,
                        WebkitTextStroke: el.textStrokeWidth
                          ? `${el.textStrokeWidth * scale}px ${el.textStroke || '#000'}`
                          : undefined,
                      }}
                    >
                      {PLACEHOLDER_LABELS[el.placeholderType || 'name']}
                    </div>
                  )}
                  {el.type === 'shape' && (
                    <div
                      className="w-full h-full"
                      style={{
                        backgroundColor: el.fill,
                        borderRadius: el.shapeType === 'circle' ? '50%' : 0,
                        border: el.strokeWidth
                          ? `${el.strokeWidth}px solid ${el.stroke || '#000'}`
                          : undefined,
                      }}
                    />
                  )}
                  {/* Canva-Style Selection Box & Scaling Handles */}
                  {isPrimarySelected && (
                    <div className="absolute -inset-0.5 pointer-events-none border-[1.5px] border-primary z-30 rounded-[2px]">
                      {/* 4 Corner Handles (Scaling font size for text, proportional size for elements) */}
                      <div
                        className="pointer-events-auto absolute top-0 left-0 -translate-x-1/2 -translate-y-1/2 w-2.5 h-2.5 bg-white border-[1.5px] border-primary rounded-full shadow-sm cursor-nwse-resize hover:scale-125 transition-transform"
                        onMouseDown={(e) => handleResizeMouseDown(e, el, 'nw')}
                        onClick={(e) => e.stopPropagation()}
                        title="Tarik untuk skala"
                      />
                      <div
                        className="pointer-events-auto absolute top-0 right-0 translate-x-1/2 -translate-y-1/2 w-2.5 h-2.5 bg-white border-[1.5px] border-primary rounded-full shadow-sm cursor-nesw-resize hover:scale-125 transition-transform"
                        onMouseDown={(e) => handleResizeMouseDown(e, el, 'ne')}
                        onClick={(e) => e.stopPropagation()}
                        title="Drag to scale"
                      />
                      <div
                        className="pointer-events-auto absolute bottom-0 left-0 -translate-x-1/2 translate-y-1/2 w-2.5 h-2.5 bg-white border-[1.5px] border-primary rounded-full shadow-sm cursor-nesw-resize hover:scale-125 transition-transform"
                        onMouseDown={(e) => handleResizeMouseDown(e, el, 'sw')}
                        onClick={(e) => e.stopPropagation()}
                        title="Drag to scale"
                      />
                      <div
                        className="pointer-events-auto absolute bottom-0 right-0 translate-x-1/2 translate-y-1/2 w-2.5 h-2.5 bg-white border-[1.5px] border-primary rounded-full shadow-sm cursor-nwse-resize hover:scale-125 transition-transform"
                        onMouseDown={(e) => handleResizeMouseDown(e, el, 'se')}
                        onClick={(e) => e.stopPropagation()}
                        title="Drag to scale"
                      />

                      {/* Left and Right Pill Handles (Width) */}
                      <div
                        className="pointer-events-auto absolute top-1/2 left-0 -translate-x-1/2 -translate-y-1/2 w-1.5 h-4 bg-white border-[1.5px] border-primary rounded-full shadow-sm cursor-ew-resize hover:scale-125 transition-transform"
                        onMouseDown={(e) => handleResizeMouseDown(e, el, 'w')}
                        onClick={(e) => e.stopPropagation()}
                        title="Adjust width"
                      />
                      <div
                        className="pointer-events-auto absolute top-1/2 right-0 translate-x-1/2 -translate-y-1/2 w-1.5 h-4 bg-white border-[1.5px] border-primary rounded-full shadow-sm cursor-ew-resize hover:scale-125 transition-transform"
                        onMouseDown={(e) => handleResizeMouseDown(e, el, 'e')}
                        onClick={(e) => e.stopPropagation()}
                        title="Adjust width"
                      />

                      {/* Top and Bottom Pill Handles (Only for shapes and images) */}
                      {el.type !== 'text' && el.type !== 'placeholder' && el.type !== 'qr' && el.type !== 'icon' && (
                        <>
                          <div
                            className="pointer-events-auto absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 h-1.5 w-4 bg-white border-[1.5px] border-primary rounded-full shadow-sm cursor-ns-resize hover:scale-125 transition-transform"
                            onMouseDown={(e) => handleResizeMouseDown(e, el, 'n')}
                            onClick={(e) => e.stopPropagation()}
                            title="Adjust height"
                          />
                          <div
                            className="pointer-events-auto absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 h-1.5 w-4 bg-white border-[1.5px] border-primary rounded-full shadow-sm cursor-ns-resize hover:scale-125 transition-transform"
                            onMouseDown={(e) => handleResizeMouseDown(e, el, 's')}
                            onClick={(e) => e.stopPropagation()}
                            title="Adjust height"
                          />
                        </>
                      )}
                    </div>
                  )}

                  {/* Multi-selection bounding box for secondary elements */}
                  {isSelected && !isPrimarySelected && (
                    <div className="absolute -inset-0.5 pointer-events-none border border-dashed border-primary/80 z-20 rounded-[2px]" />
                  )}
                  {el.type === 'image' && el.src && (
                    <div
                      className="w-full h-full bg-cover bg-center bg-no-repeat pointer-events-none"
                      style={{
                        backgroundImage: `url(${el.src})`,
                        borderRadius: `${el.borderRadius ?? 0}px`,
                        filter: `brightness(${el.brightness ?? 100}%) contrast(${el.contrast ?? 100}%) grayscale(${el.grayscale ?? 0}%)`,
                      }}
                    />
                  )}

                  {/* Icon Rendering */}
                  {el.type === 'icon' && el.iconName && (
                    <div
                      className="w-full h-full flex items-center justify-center pointer-events-none"
                      style={{
                        color: el.stroke || '#000000',
                      }}
                    >
                      {(() => {
                        const IconComp = ICON_MAP[el.iconName as string] || Star;
                        return (
                          <IconComp strokeWidth={el.strokeWidth || 2} className="w-full h-full" />
                        );
                      })()}
                    </div>
                  )}

                  {/* QR Rendering */}
                  {el.type === 'qr' && (
                    <div className="w-full h-full flex items-center justify-center pointer-events-none bg-white p-1">
                      <QRCodeSVG
                        value={el.qrData || 'https://ecert.com'}
                        width="100%"
                        height="100%"
                        fgColor={el.color || '#000000'}
                        bgColor="transparent"
                      />
                    </div>
                  )}
                </div>
              );
              });
            })()}

            {/* Alignment Guides */}
            {alignmentGuides.x.map((x, i) => (
              <div
                key={`guide-x-${i}`}
                className="absolute top-0 bottom-0 border-l border-blue-500 border-dashed z-50 pointer-events-none"
                style={{ left: `${(x / template.width) * 100}%` }}
              />
            ))}
            {alignmentGuides.y.map((y, i) => (
              <div
                key={`guide-y-${i}`}
                className="absolute left-0 right-0 border-t border-blue-500 border-dashed z-50 pointer-events-none"
                style={{ top: `${(y / template.height) * 100}%` }}
              />
            ))}
          </div>

          {/* Floating Zoom Bar (Canva/Apple Precision Capsule - Brand Theme) */}
          <div
            className="absolute bottom-20 md:bottom-4 left-1/2 -translate-x-1/2 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800 shadow-[0_8px_25px_-4px_rgba(124,58,237,0.15),0_2px_8px_-2px_rgba(0,0,0,0.06)] ring-1 ring-primary/20 rounded-full p-1 flex items-center gap-1 z-30 text-xs text-slate-700 transition-all duration-200 select-none"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              className="h-7 w-7 rounded-full flex items-center justify-center text-slate-600 hover:text-primary hover:bg-primary/10 active:scale-90 active:bg-primary/20 transition-all"
              onClick={handleZoomOut}
              title="Zoom Out (-)"
              aria-label="Zoom Out"
            >
              <Minus className="h-3.5 w-3.5 stroke-[2.25]" />
            </button>

            <button
              type="button"
              className={`h-7 px-2.5 text-xs font-medium rounded-full flex items-center gap-1.5 transition-all active:scale-95 ${
                zoomMode === 'fit'
                  ? 'bg-primary text-white font-semibold shadow-xs hover:bg-primary/90'
                  : 'text-slate-700 hover:bg-primary/10 hover:text-primary'
              }`}
              onClick={() => {
                if (zoomMode === 'fit') {
                  handleActualSize();
                } else {
                  handleResetFit();
                }
              }}
              title={zoomMode === 'fit' ? 'Fit to Screen (Click for 100%)' : 'Click to Fit Screen'}
            >
              <Maximize2
                className={`h-3 w-3 shrink-0 ${zoomMode === 'fit' ? 'text-white stroke-[2.5]' : 'text-slate-500'}`}
              />
              <span suppressHydrationWarning className="tabular-nums font-semibold tracking-tight">
                {Math.round(currentScale * 100)}%
              </span>
              {zoomMode === 'fit' && (
                <span className="text-[9px] font-bold uppercase tracking-wider bg-white/25 text-white px-1.5 py-0.5 rounded-full shrink-0">
                  Fit
                </span>
              )}
            </button>

            <button
              type="button"
              className="h-7 w-7 rounded-full flex items-center justify-center text-slate-600 hover:text-primary hover:bg-primary/10 active:scale-90 active:bg-primary/20 transition-all"
              onClick={handleZoomIn}
              title="Zoom In (+)"
              aria-label="Zoom In"
            >
              <Plus className="h-3.5 w-3.5 stroke-[2.25]" />
            </button>

            <div className="h-4 w-px bg-slate-200/90 mx-0.5 shrink-0" />

            <button
              type="button"
              className={`h-7 px-2.5 text-[11px] font-medium rounded-full transition-all active:scale-95 ${
                zoomMode === 'custom' && Math.round(currentScale * 100) === 100
                  ? 'bg-primary text-white font-semibold shadow-xs hover:bg-primary/90'
                  : 'text-slate-600 hover:text-primary hover:bg-primary/10'
              }`}
              onClick={handleActualSize}
              title="Actual Size 100%"
            >
              100%
            </button>
          </div>
        </div>

        {/* Right Sidebar - Properties */}
        <CertificateEditorProperties
          selectedElement={selectedElement}
          updateElement={updateElement}
          deleteElement={deleteElement}
          duplicateElement={duplicateElement}
          bringToFront={bringToFront}
          sendToBack={sendToBack}
          moveLayerUp={moveLayerUp}
          moveLayerDown={moveLayerDown}
          onCrop={(src) => {
            setImageToCrop(src);
            setCropperOpen(true);
          }}
          templateWidth={template.width}
          templateHeight={template.height}
          hasMultiSelection={allSelectedIds.length > 1}
          onAlignElements={handleAlignElements}
          onDistributeElements={handleDistributeElements}
        />
      </div>

      {/* Mobile Canva-Style Docked Bottom Bar (md:hidden) */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 px-3 py-2 shadow-[0_-4px_16px_rgba(0,0,0,0.06)] flex items-center justify-between gap-1.5 safe-area-inset-bottom">
        {selectedElement ? (
          // Contextual Element Action Mode (When an element is selected)
          <div className="w-full flex items-center justify-between gap-1.5">
            <Button
              size="sm"
              className="flex-1 h-9 gap-1.5 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/25 font-semibold text-xs shadow-none"
              onClick={() => setMobilePropsOpen(true)}
            >
              <Palette className="h-4 w-4" />
              <span>Edit Style</span>
            </Button>

            <Button
              variant="outline"
              size="icon"
              className="h-9 w-9 shrink-0 text-slate-700 hover:bg-slate-100"
              onClick={() => {
                duplicateElement(selectedElement.id);
                toast.success('Element duplicated!');
              }}
              title="Duplicate Element"
            >
              <Copy className="h-4 w-4" />
            </Button>

            <Button
              variant="outline"
              size="icon"
              className="h-9 w-9 shrink-0 text-slate-700 hover:bg-slate-100"
              onClick={() => {
                bringToFront(selectedElement.id);
                toast.success('Brought to front');
              }}
              title="Bring Forward"
            >
              <Layers className="h-4 w-4" />
            </Button>

            <Button
              variant="outline"
              size="icon"
              className="h-9 w-9 shrink-0 text-rose-600 hover:bg-rose-50 hover:text-rose-700 border-rose-200"
              onClick={() => {
                deleteElement(selectedElement.id);
                setSelectedId(null);
                toast.success('Element deleted');
              }}
              title="Delete Element"
            >
              <Trash2 className="h-4 w-4" />
            </Button>

            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 shrink-0 text-slate-500 hover:bg-slate-100"
              onClick={() => setSelectedId(null)}
              title="Deselect"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          // Default Mode (When NO element is selected)
          <div className="w-full flex items-center justify-between gap-1.5">
            <Button
              size="sm"
              className="flex-1 h-9 gap-1.5 bg-primary hover:bg-primary/90 text-white font-medium text-xs rounded-lg shadow-sm"
              onClick={() => setMobileAddOpen(true)}
            >
              <PlusCircle className="h-4 w-4" />
              <span>Add Element</span>
            </Button>

            <Button
              variant="outline"
              size="sm"
              className="h-9 px-2.5 text-xs gap-1 text-slate-700 hover:bg-slate-100"
              onClick={() => setMobileAddOpen(true)}
              title="Certificate Background & Themes"
            >
              <Palette className="h-3.5 w-3.5" />
              <span>Canvas</span>
            </Button>

            <Button
              variant="outline"
              size="sm"
              className="h-9 px-2.5 text-xs gap-1 text-slate-700 hover:bg-slate-100"
              onClick={handleToggleOrientation}
              title="Flip Orientation"
            >
              <RotateCw className="h-3.5 w-3.5" />
              <span>Flip</span>
            </Button>

            <Button
              variant="outline"
              size="sm"
              className="h-9 px-2.5 text-xs gap-1 text-slate-700 hover:bg-slate-100"
              onClick={() => setMobileExportOpen(true)}
              title="Export Certificate"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Export</span>
            </Button>
          </div>
        )}
      </div>

      {/* Mobile Drawer 1: Add Elements & Canvas */}
      <Sheet open={mobileAddOpen} onOpenChange={setMobileAddOpen}>
        <SheetContent
          side="bottom"
          className="h-[80vh] max-h-[85vh] p-0 flex flex-col rounded-t-2xl border-t bg-white shadow-2xl overflow-hidden"
        >
          <div className="w-10 h-1 bg-slate-300 rounded-full mx-auto my-2.5 shrink-0" />
          <SheetHeader className="px-4 py-2 border-b shrink-0 text-left">
            <SheetTitle className="text-base font-semibold">Add to Certificate</SheetTitle>
            <SheetDescription className="text-xs text-slate-500">
              Select elements, text placeholders, or customize the background canvas.
            </SheetDescription>
          </SheetHeader>
          <div className="flex-1 overflow-y-auto min-h-0">
            <CertificateEditorSidebar
              addElement={addElement}
              addElements={addElements}
              imageInputRef={imageInputRef}
              template={template}
              onUpdateTemplate={(updates) => setTemplate((prev) => ({ ...prev, ...updates }))}
              className="w-full border-r-0 block h-auto p-4 space-y-6"
              onItemAdded={() => {
                setMobileAddOpen(false);
                toast.success('Added to certificate!');
              }}
            />
          </div>
        </SheetContent>
      </Sheet>

      {/* Mobile Drawer 2: Element Properties */}
      <Sheet open={mobilePropsOpen} onOpenChange={setMobilePropsOpen}>
        <SheetContent
          side="bottom"
          className="h-[80vh] max-h-[85vh] p-0 flex flex-col rounded-t-2xl border-t bg-white shadow-2xl overflow-hidden"
        >
          <div className="w-10 h-1 bg-slate-300 rounded-full mx-auto my-2.5 shrink-0" />
          <SheetHeader className="px-4 py-2 border-b shrink-0 text-left">
            <SheetTitle className="text-base font-semibold capitalize">
              Edit {selectedElement?.type || 'Element'} Style
            </SheetTitle>
            <SheetDescription className="text-xs text-slate-500">
              Customize typography, colors, borders, and position.
            </SheetDescription>
          </SheetHeader>
          <div className="flex-1 overflow-y-auto min-h-0">
            {selectedElement && (
              <CertificateEditorProperties
                selectedElement={selectedElement}
                updateElement={updateElement}
                deleteElement={(id) => {
                  deleteElement(id);
                  setMobilePropsOpen(false);
                  setSelectedId(null);
                }}
                duplicateElement={duplicateElement}
                bringToFront={bringToFront}
                sendToBack={sendToBack}
                moveLayerUp={moveLayerUp}
                moveLayerDown={moveLayerDown}
                onCrop={(src) => {
                  setImageToCrop(src);
                  setCropperOpen(true);
                  setMobilePropsOpen(false);
                }}
                templateWidth={template.width}
                templateHeight={template.height}
                hasMultiSelection={allSelectedIds.length > 1}
                onAlignElements={handleAlignElements}
                onDistributeElements={handleDistributeElements}
                className="w-full border-l-0 block h-auto p-4"
              />
            )}
          </div>
        </SheetContent>
      </Sheet>

      {/* Mobile Drawer 3: Export Options */}
      <Sheet open={mobileExportOpen} onOpenChange={setMobileExportOpen}>
        <SheetContent
          side="bottom"
          className="p-5 flex flex-col rounded-t-2xl border-t bg-white shadow-2xl"
        >
          <div className="w-10 h-1 bg-slate-300 rounded-full mx-auto -mt-2 mb-3" />
          <SheetHeader className="text-left p-0 pb-3">
            <SheetTitle className="text-base font-semibold">Export Certificate</SheetTitle>
            <SheetDescription className="text-xs text-slate-500">
              Download your certificate in high quality image or print format.
            </SheetDescription>
          </SheetHeader>
          <div className="grid grid-cols-2 gap-3 mt-2">
            <Button
              variant="outline"
              className="flex flex-col h-20 gap-2 items-center justify-center border-slate-200 hover:border-primary hover:bg-primary/5"
              onClick={() => {
                setMobileExportOpen(false);
                exportToPNG();
              }}
              disabled={exporting || exportingPdf}
            >
              <Download className="h-5 w-5 text-primary" />
              <div className="text-center">
                <div className="text-xs font-semibold text-slate-900">Download PNG</div>
                <div className="text-[10px] text-slate-500">High-Res Image</div>
              </div>
            </Button>
            <Button
              variant="outline"
              className="flex flex-col h-20 gap-2 items-center justify-center border-slate-200 hover:border-primary hover:bg-primary/5"
              onClick={() => {
                setMobileExportOpen(false);
                exportToPDF();
              }}
              disabled={exporting || exportingPdf}
            >
              <FileDown className="h-5 w-5 text-emerald-600" />
              <div className="text-center">
                <div className="text-xs font-semibold text-slate-900">Download PDF</div>
                <div className="text-[10px] text-slate-500">Print-Ready A4</div>
              </div>
            </Button>
          </div>
        </SheetContent>
      </Sheet>
      <ImageCropperDialog
        open={cropperOpen}
        onOpenChange={setCropperOpen}
        imageUrl={imageToCrop}
        onCropComplete={handleCropComplete}
      />
    </div>
  );
}
