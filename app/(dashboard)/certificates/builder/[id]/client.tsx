'use client';

import { useState, useRef, useCallback } from 'react';
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
} from 'lucide-react';
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

interface CertificateBuilderClientProps {
  template: CertificateTemplate;
}

const PLACEHOLDER_LABELS: Record<string, string> = {
  name: '{Nama Peserta}',
  program: '{Nama Program}',
  date: '{Tarikh}',
  signature: '{Tandatangan}',
  expiry: '{Tarikh Luput}',
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

export function CertificateBuilderClient({
  template: initialTemplate,
}: CertificateBuilderClientProps) {
  // 1. Core State
  const [template, setTemplate] = useState(initialTemplate);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // 2. UI/Interaction State
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [exporting, setExporting] = useState(false);

  // Smart Editing State
  const [showGrid, setShowGrid] = useState(false);
  const [snapToGrid, setSnapToGrid] = useState(false);
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
  const selectedElement = template.elements.find((el) => el.id === selectedId);

  // 3. Hooks Initialization
  const {
    history,
    historyIndex,
    commitToHistory: commitToHistoryHook, // Renamed to avoid confusion if needed
    undo: undoHistory,
    redo: redoHistory,
  } = useCertificateHistory(initialTemplate);

  const {
    addElement,
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

  // Handle Mouse Down (Selection Wrapper)
  const handleMouseDown = handleSelectionMouseDown;

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
      });
      if (result.success) {
        toast.success('Template disimpan!');
      } else {
        toast.error(result.error || 'Gagal menyimpan template');
      }
    } catch {
      toast.error('Gagal menyimpan template');
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
      link.download = `${template.name || 'sijil'}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
      toast.success('Sijil berjaya dimuat turun!');
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Gagal mengeksport sijil');
    } finally {
      setExporting(false);
    }
  }, [template.name]);

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

  // Resize handle mouse down
  const handleResizeMouseDown = (e: React.MouseEvent, el: CertificateElement) => {
    e.stopPropagation();
    setSelectedId(el.id);
    setIsResizing(true);
    const rect = canvasRef.current?.getBoundingClientRect();
    if (rect) {
      // Store initial offset for resize
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!selectedId || !canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const scale = rect.width / template.width;

    if (isDragging && dragStartPos && selectedId && initialElementPositions[selectedId]) {
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

      setAlignmentGuides(newGuides);

      // 4. Apply Final Delta to ALL selected elements
      const effectiveDeltaX = newPrimaryX - initialPrimary.x;
      const effectiveDeltaY = newPrimaryY - initialPrimary.y;

      const idsToUpdate = new Set([selectedId, ...additionalSelectedIds]);
      const newElements = template.elements.map((el) => {
        if (idsToUpdate.has(el.id) && initialElementPositions[el.id]) {
          return {
            ...el,
            x: initialElementPositions[el.id].x + effectiveDeltaX,
            y: initialElementPositions[el.id].y + effectiveDeltaY,
          };
        }
        return el;
      });

      setTemplate({ ...template, elements: newElements });
    } else if (isResizing) {
      const el = template.elements.find((el) => el.id === selectedId);
      if (el) {
        let newWidth = Math.max(30, (e.clientX - rect.left) / scale - el.x + el.width / 2);
        let newHeight = Math.max(20, (e.clientY - rect.top) / scale - el.y + el.height / 2);

        // Shift key = maintain aspect ratio
        if (e.shiftKey && el.width > 0 && el.height > 0) {
          const aspectRatio = el.width / el.height;
          // Use the larger change to determine the resize direction
          const widthChange = Math.abs(newWidth - el.width);
          const heightChange = Math.abs(newHeight - el.height);

          if (widthChange > heightChange) {
            // Width changed more, adjust height to match
            newHeight = newWidth / aspectRatio;
          } else {
            // Height changed more, adjust width to match
            newWidth = newHeight * aspectRatio;
          }
        }

        updateElement(selectedId, { width: newWidth, height: newHeight });
      }
    }
  };

  const handleMouseUp = () => {
    if (isDragging || isResizing) {
      commitToHistoryHook(template);
    }
    setIsDragging(false);
    setIsResizing(false);
    setDragStartPos(null);
    setInitialElementPositions({});
    setAlignmentGuides({ x: [], y: [] });
  };

  return (
    <div className="h-screen flex flex-col bg-gray-100">
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
        orientation={template.width >= template.height ? 'landscape' : 'portrait'}
        onOrientationChange={() => {
          setTemplate((prev) => ({
            ...prev,
            width: prev.height,
            height: prev.width,
          }));
        }}
      />

      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar - Elements */}
        <CertificateEditorSidebar
          addElement={addElement}
          imageInputRef={imageInputRef}
          template={template}
          onUpdateTemplate={(updates) => setTemplate((prev) => ({ ...prev, ...updates }))}
        />

        {/* Canvas Area */}
        <div
          className="flex-1 overflow-auto p-8 flex items-center justify-center"
          onClick={() => setSelectedId(null)}
        >
          <div
            ref={canvasRef}
            className="relative shadow-2xl w-full max-w-[800px] bg-cover"
            style={{
              aspectRatio: `${template.width}/${template.height}`,
              backgroundColor: template.backgroundColor,
              backgroundImage: template.backgroundImage
                ? `url(${template.backgroundImage})`
                : undefined,
            }}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onClick={() => setSelectedId(null)}
          >
            {showGrid && (
              <div className="absolute inset-0 pointer-events-none z-0 bg-[image:linear-gradient(to_right,#e5e7eb_1px,transparent_1px),linear-gradient(to_bottom,#e5e7eb_1px,transparent_1px)] bg-[length:20px_20px]" />
            )}
            {template.elements.map((el) => {
              const isSelected = el.id === selectedId || additionalSelectedIds.includes(el.id);
              const scale = canvasRef.current ? canvasRef.current.offsetWidth / template.width : 1;

              return (
                <div
                  key={el.id}
                  className={`absolute cursor-move transition-shadow select-none ${
                    isSelected
                      ? 'ring-2 ring-primary ring-offset-2'
                      : 'hover:ring-1 hover:ring-gray-300'
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
                      className="whitespace-nowrap"
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
                      className="border-2 border-dashed border-primary/40 bg-primary/5 px-2 py-1 rounded whitespace-nowrap"
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
                  {isSelected && el.type !== 'text' && el.type !== 'placeholder' && (
                    <>
                      {/* Resize Handle - Bottom Right */}
                      <div
                        className="absolute bottom-0 right-0 w-4 h-4 bg-white border-2 border-primary rounded-full translate-x-1/2 translate-y-1/2 cursor-se-resize z-50 hover:bg-primary/10"
                        onMouseDown={(e) => handleResizeMouseDown(e, el)}
                        onClick={(e) => e.stopPropagation()}
                      />
                    </>
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
            })}

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
        />
      </div>
      <ImageCropperDialog
        open={cropperOpen}
        onOpenChange={setCropperOpen}
        imageUrl={imageToCrop}
        onCropComplete={handleCropComplete}
      />
    </div>
  );
}
