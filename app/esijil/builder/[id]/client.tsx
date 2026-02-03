'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { CertificateElement, CertificateTemplate } from '@/lib/types';
import {
  updateCertificateTemplateAction,
  deleteCertificateTemplateAction,
} from '@/actions/certificate-template';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  ArrowLeft,
  Save,
  Trash,
  Type,
  Image as ImageIcon,
  Square,
  UserCheck,
  Calendar,
  FileText,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Bold,
  Italic,
  Undo,
  Redo,
  Eye,
  Download,
  Upload,
  Copy,
  Layers,
  ArrowUpToLine,
  ArrowDownToLine,
  ChevronUp,
  ChevronDown,
  Grid,
  Magnet,
  Ruler,
  Crop,
  Group,
  Ungroup,
  Link as LinkIcon,
  Unlink,
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
  QrCode,
} from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import html2canvas from 'html2canvas-pro';
import { QRCodeSVG } from 'qrcode.react';
import { createClient } from '@/utils/supabase/client';
import { compressImage } from '@/utils/image-compression';
import { v4 as uuidv4 } from 'uuid';
import { ImageCropperDialog } from '@/components/image-cropper-dialog';

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

const MAX_HISTORY = 50;

export function CertificateBuilderClient({
  template: initialTemplate,
}: CertificateBuilderClientProps) {
  const [template, setTemplate] = useState(initialTemplate);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [saving, setSaving] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [history, setHistory] = useState<CertificateTemplate[]>([initialTemplate]);
  const [historyIndex, setHistoryIndex] = useState(0);

  // Smart Editing State
  const [showGrid, setShowGrid] = useState(false);
  const [snapToGrid, setSnapToGrid] = useState(false);
  const [alignmentGuides, setAlignmentGuides] = useState<{ x: number[]; y: number[] }>({
    x: [],
    y: [],
  });

  // Image Cropper State
  const [cropperOpen, setCropperOpen] = useState(false);
  const [imageToCrop, setImageToCrop] = useState<string>('');

  // Multi-select State
  const [additionalSelectedIds, setAdditionalSelectedIds] = useState<string[]>([]);
  const [dragStartPos, setDragStartPos] = useState<{ x: number; y: number } | null>(null);
  const [initialElementPositions, setInitialElementPositions] = useState<
    Record<string, { x: number; y: number }>
  >({});

  const canvasRef = useRef<HTMLDivElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  const selectedElement = template.elements.find((el) => el.id === selectedId);

  // Save to history
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

  // Update element with history
  const updateElement = useCallback((id: string, updates: Partial<CertificateElement>) => {
    setTemplate((prev) => {
      const newTemplate = {
        ...prev,
        elements: prev.elements.map((el) => (el.id === id ? { ...el, ...updates } : el)),
      };
      return newTemplate;
    });
  }, []);

  // Commit change to history (call after drag/resize ends)
  const commitToHistory = useCallback(() => {
    saveToHistory(template);
  }, [template, saveToHistory]);

  // Add element
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
        // Icon defaults
        iconName: type === 'icon' ? 'Star' : undefined,
        // QR default
        qrData: type === 'qr' ? 'https://esijil.com/verify/123' : undefined,
        fontSize: 16,
        fontFamily: 'sans-serif',
        color: '#1a1a2e',
        textAlign: 'center',
        ...extra,
      };
      const newTemplate = {
        ...template,
        elements: [...template.elements, defaultElement],
      };
      setTemplate(newTemplate);
      saveToHistory(newTemplate);
      setSelectedId(newId);
    },
    [template, saveToHistory]
  );

  // Delete element
  const deleteElement = useCallback(
    (id: string) => {
      const newTemplate = {
        ...template,
        elements: template.elements.filter((el) => el.id !== id),
      };
      setTemplate(newTemplate);
      saveToHistory(newTemplate);
      if (selectedId === id) setSelectedId(null);
    },
    [template, selectedId, saveToHistory]
  );

  // Layer controls - Bring to Front
  const bringToFront = useCallback(
    (id: string) => {
      const idx = template.elements.findIndex((el) => el.id === id);
      if (idx === -1 || idx === template.elements.length - 1) return;

      const newElements = [...template.elements];
      const [element] = newElements.splice(idx, 1);
      newElements.push(element);

      const newTemplate = { ...template, elements: newElements };
      setTemplate(newTemplate);
      saveToHistory(newTemplate);
    },
    [template, saveToHistory]
  );

  // Layer controls - Send to Back
  const sendToBack = useCallback(
    (id: string) => {
      const idx = template.elements.findIndex((el) => el.id === id);
      if (idx === -1 || idx === 0) return;

      const newElements = [...template.elements];
      const [element] = newElements.splice(idx, 1);
      newElements.unshift(element);

      const newTemplate = { ...template, elements: newElements };
      setTemplate(newTemplate);
      saveToHistory(newTemplate);
    },
    [template, saveToHistory]
  );

  // Layer controls - Move Up
  const moveLayerUp = useCallback(
    (id: string) => {
      const idx = template.elements.findIndex((el) => el.id === id);
      if (idx === -1 || idx === template.elements.length - 1) return;

      const newElements = [...template.elements];
      [newElements[idx], newElements[idx + 1]] = [newElements[idx + 1], newElements[idx]];

      const newTemplate = { ...template, elements: newElements };
      setTemplate(newTemplate);
      saveToHistory(newTemplate);
    },
    [template, saveToHistory]
  );

  // Layer controls - Move Down
  const moveLayerDown = useCallback(
    (id: string) => {
      const idx = template.elements.findIndex((el) => el.id === id);
      if (idx <= 0) return;

      const newElements = [...template.elements];
      [newElements[idx], newElements[idx - 1]] = [newElements[idx - 1], newElements[idx]];

      const newTemplate = { ...template, elements: newElements };
      setTemplate(newTemplate);
      saveToHistory(newTemplate);
    },
    [template, saveToHistory]
  );

  // Undo
  const undo = useCallback(() => {
    if (historyIndex > 0) {
      setHistoryIndex((prev) => prev - 1);
      setTemplate(history[historyIndex - 1]);
    }
  }, [history, historyIndex]);

  // Redo
  const redo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex((prev) => prev + 1);
      setTemplate(history[historyIndex + 1]);
    }
  }, [history, historyIndex]);

  // Duplicate selected element
  const duplicateElement = useCallback(() => {
    if (!selectedId) return;
    const el = template.elements.find((e) => e.id === selectedId);
    if (!el) return;

    const newElement: CertificateElement = {
      ...el,
      id: `${el.type}-${Date.now()}`,
      x: el.x + 20,
      y: el.y + 20,
    };

    const newTemplate = {
      ...template,
      elements: [...template.elements, newElement],
    };
    setTemplate(newTemplate);
    saveToHistory(newTemplate);
    setSelectedId(newElement.id);
    toast.success('Element duplicated!');
  }, [selectedId, template, saveToHistory]);

  // Nudge element with arrow keys
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

  // Save template
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
        toast.error('Gagal menyimpan template');
      }
    } catch {
      toast.error('Gagal menyimpan template');
    } finally {
      setSaving(false);
    }
  }, [template, selectedId]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if typing in input
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        return;
      }

      // Ctrl/Cmd + Z = Undo
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        undo();
      }

      // Ctrl/Cmd + Y or Ctrl/Cmd + Shift + Z = Redo
      if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
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
        handleSave();
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
        nudgeElement(0, -nudgeAmount);
      }
      if (e.key === 'ArrowDown' && selectedId) {
        e.preventDefault();
        nudgeElement(0, nudgeAmount);
      }
      if (e.key === 'ArrowLeft' && selectedId) {
        e.preventDefault();
        nudgeElement(-nudgeAmount, 0);
      }
      if (e.key === 'ArrowRight' && selectedId) {
        e.preventDefault();
        nudgeElement(nudgeAmount, 0);
      }

      // Escape = Deselect
      if (e.key === 'Escape') {
        setSelectedId(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo, duplicateElement, deleteElement, nudgeElement, selectedId, handleSave]);

  // Upload image element to Supabase Storage
  const handleImageUpload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      // Check initial file size (max 5MB before compression)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image too large. Maximum 5MB.');
        return;
      }

      const toastId = toast.loading('Uploading image...');

      try {
        // Compress image to max 500KB for faster loading
        const compressedFile = await compressImage(file, 0.5);

        // Upload to Supabase Storage
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          toast.error('Please login first', { id: toastId });
          return;
        }

        const dir = user.id;
        const fileExt = file.name.split('.').pop() || 'png';
        const fileName = `${uuidv4()}.${fileExt}`;
        const filePath = `${dir}/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('certificate_backgrounds')
          .upload(filePath, compressedFile, {
            cacheControl: '3600',
            upsert: false,
          });

        if (uploadError) {
          throw uploadError;
        }

        // Get public URL
        const {
          data: { publicUrl },
        } = supabase.storage.from('certificate_backgrounds').getPublicUrl(filePath);

        // Add element with URL instead of Base64
        addElement('image', { src: publicUrl, width: 150, height: 150 });
        toast.success('Image uploaded successfully!', { id: toastId });
      } catch (error) {
        console.error('Image upload error:', error);
        toast.error('Failed to upload image', { id: toastId });
      }

      // Reset input
      if (imageInputRef.current) imageInputRef.current.value = '';
    },
    [addElement]
  );

  // Handle Crop Complete
  const handleCropComplete = useCallback(
    async (croppedBlob: Blob) => {
      if (!selectedId) return;

      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        toast.error('Please login first');
        return;
      }

      const dir = user.id;
      const fileName = `${uuidv4()}.png`;
      const filePath = `${dir}/${fileName}`;

      try {
        const { error: uploadError } = await supabase.storage
          .from('certificate_backgrounds')
          .upload(filePath, croppedBlob, {
            cacheControl: '3600',
            upsert: false,
          });

        if (uploadError) throw uploadError;

        const {
          data: { publicUrl },
        } = supabase.storage.from('certificate_backgrounds').getPublicUrl(filePath);

        updateElement(selectedId, { src: publicUrl });
        toast.success('Image cropped successfully!');
      } catch (error) {
        console.error('Crop save error:', error);
        toast.error('Failed to save cropped image');
      }
    },
    [selectedId, updateElement]
  );

  // Export to PNG
  const exportToPNG = useCallback(async () => {
    if (!canvasRef.current) return;
    setExporting(true);
    try {
      // Hide selection ring during export
      setSelectedId(null);
      await new Promise((r) => setTimeout(r, 100));

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

  // Grouping Logic
  const handleGroup = useCallback(() => {
    if (!selectedId && additionalSelectedIds.length === 0) return;
    const newGroupId = uuidv4();
    const idsToGroup = new Set([selectedId, ...additionalSelectedIds].filter(Boolean) as string[]);

    // Check if any element is already in a group (optional: merge groups? for now, just overwrite)
    const newElements = template.elements.map((el) => {
      if (idsToGroup.has(el.id)) {
        return { ...el, groupId: newGroupId };
      }
      return el;
    });

    setTemplate({ ...template, elements: newElements });
    toast.success('Elements grouped');
    commitToHistory();
  }, [selectedId, additionalSelectedIds, template, commitToHistory]);

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
        const { groupId, ...rest } = el;
        return rest;
      }
      return el;
    });

    setTemplate({ ...template, elements: newElements });
    toast.success('Elements ungrouped');
    commitToHistory();
  }, [selectedId, additionalSelectedIds, template, commitToHistory]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'g') {
        e.preventDefault();
        if (e.shiftKey) {
          handleUngroup();
        } else {
          handleGroup();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedId, additionalSelectedIds, template.elements, handleGroup, handleUngroup]);

  // Mouse handlers for drag
  const handleMouseDown = (e: React.MouseEvent, el: CertificateElement) => {
    e.stopPropagation();

    // 1. Determine new selection
    let newSelectedId = selectedId;
    let newAdditionalIds = additionalSelectedIds;
    const isAlreadySelected = selectedId === el.id || additionalSelectedIds.includes(el.id);

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
            const remaining = additionalSelectedIds.filter((id) => !idsToRemove.has(id));
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
          newAdditionalIds = additionalSelectedIds.filter((id) => !idsToRemove.has(id));
        }
      } else {
        // Add to selection (include group members)
        if (!selectedId) {
          newSelectedId = el.id;
          newAdditionalIds = groupIdsToSelect;
        } else {
          // Avoid duplicates
          const currentSet = new Set(additionalSelectedIds);
          const newIds = [el.id, ...groupIdsToSelect].filter((id) => !currentSet.has(id));
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
    const idsToDrag = new Set([newSelectedId, ...newAdditionalIds].filter(Boolean) as string[]);
    const initial: Record<string, { x: number; y: number }> = {};

    template.elements.forEach((elem) => {
      if (idsToDrag.has(elem.id)) {
        initial[elem.id] = { x: elem.x, y: elem.y };
      }
    });
    setInitialElementPositions(initial);
  };

  // Resize handle mouse down
  const handleResizeMouseDown = (e: React.MouseEvent, el: CertificateElement) => {
    e.stopPropagation();
    setSelectedId(el.id);
    setIsResizing(true);
    const rect = canvasRef.current?.getBoundingClientRect();
    if (rect) {
      const scale = rect.width / template.width;
      setDragOffset({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      });
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
        const centerX = newPrimaryX;
        const centerY = newPrimaryY;

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
      commitToHistory();
    }
    setIsDragging(false);
    setIsResizing(false);
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
      />

      {/* Top Toolbar */}
      <div className="bg-white border-b px-4 py-3 flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link href="/esijil/builder">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <Input
            value={template.name}
            onChange={(e) => setTemplate((prev) => ({ ...prev, name: e.target.value }))}
            className="font-semibold text-lg border-none shadow-none focus-visible:ring-0 w-64"
          />
          {/* Undo/Redo */}
          <div className="flex items-center gap-1 border-l pl-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={undo}
              disabled={historyIndex <= 0}
              title="Batal (Undo)"
            >
              <Undo className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={redo}
              disabled={historyIndex >= history.length - 1}
              title="Ulang (Redo)"
            >
              <Redo className="h-4 w-4" />
            </Button>
          </div>

          {/* Smart Tools */}
          <div className="flex items-center gap-1 border-l pl-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleGroup}
              disabled={additionalSelectedIds.length === 0}
              title="Group (Ctrl+G)"
            >
              <Group className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleUngroup}
              disabled={additionalSelectedIds.length === 0 && !selectedId}
              title="Ungroup (Ctrl+Shift+G)"
            >
              <Ungroup className="h-4 w-4" />
            </Button>
            <div className="w-px h-6 bg-gray-200 mx-2" />
            <Button
              variant={showGrid ? 'default' : 'ghost'}
              size="icon"
              onClick={() => setShowGrid(!showGrid)}
              title="Show Grid"
            >
              <Grid className="h-4 w-4" />
            </Button>
            <Button
              variant={snapToGrid ? 'default' : 'ghost'}
              size="icon"
              onClick={() => setSnapToGrid(!snapToGrid)}
              title="Snap to Grid"
            >
              <Magnet className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={exportToPNG}
            disabled={exporting}
          >
            <Download className="h-4 w-4" />
            {exporting ? 'Eksport...' : 'Eksport PNG'}
          </Button>
          <Link href={`/esijil/builder/${template.id}/preview`}>
            <Button variant="outline" size="sm" className="gap-2">
              <Eye className="h-4 w-4" />
              Preview
            </Button>
          </Link>
          <Button onClick={handleSave} disabled={saving} className="gap-2">
            <Save className="h-4 w-4" />
            {saving ? 'Menyimpan...' : 'Simpan'}
          </Button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar - Elements */}
        <div className="w-64 bg-white border-r p-4 space-y-4 overflow-y-auto">
          <div>
            <Label className="text-xs text-gray-500 uppercase tracking-wider">Tambah Elemen</Label>
            <div className="grid grid-cols-2 gap-2 mt-2">
              <Button
                variant="outline"
                size="sm"
                className="flex-col h-16 gap-1"
                onClick={() => addElement('text')}
              >
                <Type className="h-5 w-5" />
                <span className="text-xs">Teks</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="flex-col h-16 gap-1"
                onClick={() => imageInputRef.current?.click()}
              >
                <ImageIcon className="h-5 w-5" />
                <span className="text-xs">Gambar</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="flex-col h-16 gap-1"
                onClick={() =>
                  addElement('shape', {
                    shapeType: 'rectangle',
                    fill: '#e5e7eb',
                    width: 100,
                    height: 100,
                  })
                }
              >
                <Square className="h-5 w-5" />
                <span className="text-xs">Bentuk</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="flex-col h-16 gap-1"
                onClick={() =>
                  addElement('shape', { shapeType: 'line', fill: '#000000', width: 200, height: 2 })
                }
              >
                <div className="h-0.5 w-6 bg-current" />
                <span className="text-xs">Garisan</span>
              </Button>
            </div>
          </div>

          <div>
            <Label className="text-xs text-gray-500 uppercase tracking-wider">
              Placeholder Data
            </Label>
            <div className="grid grid-cols-1 gap-2 mt-2">
              <Button
                variant="outline"
                size="sm"
                className="justify-start gap-2"
                onClick={() =>
                  addElement('placeholder', {
                    placeholderType: 'name',
                    fontSize: 36,
                    fontWeight: 'bold',
                    width: 400,
                    height: 50,
                  })
                }
              >
                <UserCheck className="h-4 w-4" />
                Nama Peserta
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="justify-start gap-2"
                onClick={() =>
                  addElement('placeholder', {
                    placeholderType: 'program',
                    fontSize: 24,
                    width: 300,
                    height: 40,
                  })
                }
              >
                <FileText className="h-4 w-4" />
                Nama Program
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="flex-col h-16 gap-1"
                onClick={() =>
                  addElement('icon', { iconName: 'Star', stroke: '#000000', strokeWidth: 2 })
                }
              >
                <Star className="h-5 w-5" />
                <span className="text-xs">Icon</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="flex-col h-16 gap-1"
                onClick={() => addElement('qr')}
              >
                <QrCode className="h-5 w-5" />
                <span className="text-xs">QR Code</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="justify-start gap-2"
                onClick={() =>
                  addElement('placeholder', {
                    placeholderType: 'date',
                    fontSize: 14,
                    width: 150,
                    height: 30,
                  })
                }
              >
                <Calendar className="h-4 w-4" />
                Tarikh
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="justify-start gap-2"
                onClick={() =>
                  addElement('placeholder', {
                    placeholderType: 'expiry',
                    fontSize: 14,
                    width: 200,
                    height: 30,
                    color: '#666666',
                  })
                }
              >
                <Calendar className="h-4 w-4" />
                Tarikh Luput
              </Button>
            </div>
          </div>

          <div>
            <Label className="text-xs text-gray-500 uppercase tracking-wider">Latar Belakang</Label>
            <div className="mt-2 space-y-3">
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={template.backgroundColor}
                  onChange={(e) =>
                    setTemplate((prev) => ({ ...prev, backgroundColor: e.target.value }))
                  }
                  className="w-8 h-8 rounded cursor-pointer"
                />
                <span className="text-sm text-gray-600">Warna</span>
              </div>

              {/* Background Image Upload */}
              <div className="space-y-2">
                <Label className="text-sm">Gambar Latar</Label>
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/jpg,image/webp"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;

                    // Check file size (max 10MB before compression)
                    if (file.size > 10 * 1024 * 1024) {
                      toast.error('Gambar terlalu besar. Maksimum 10MB.');
                      return;
                    }

                    try {
                      toast.loading('Memuat naik gambar...', { id: 'bg-upload' });

                      // 1. Compress image (max 1MB)
                      const compressedFile = await compressImage(file, 1);

                      // 2. Upload to Supabase Storage
                      const supabase = createClient();
                      const {
                        data: { user },
                      } = await supabase.auth.getUser();
                      const dir = user ? user.id : 'public';
                      const fileExt = file.name.split('.').pop();
                      const fileName = `${uuidv4()}.${fileExt}`;
                      const filePath = `${dir}/${fileName}`;

                      const { error: uploadError } = await supabase.storage
                        .from('certificate_backgrounds')
                        .upload(filePath, compressedFile, {
                          cacheControl: '3600',
                          upsert: false,
                        });

                      if (uploadError) throw uploadError;

                      // 3. Get public URL
                      const {
                        data: { publicUrl },
                      } = supabase.storage.from('certificate_backgrounds').getPublicUrl(filePath);

                      // 4. Auto-replace: Delete old background if exists
                      if (
                        template.backgroundImage &&
                        template.backgroundImage.includes('certificate_backgrounds')
                      ) {
                        try {
                          const oldUrl = template.backgroundImage;
                          const parts = oldUrl.split('/certificate_backgrounds/');
                          if (parts.length === 2) {
                            // Decode to handle spaces/special chars if needed, though simple split usually works for uuid keys
                            // But usually Supabase URLs are encoded. remove() expects the path.
                            // The 'parts[1]' from public URL might contain query params or encoding.
                            // For simplicity, we assume standard UUID filenames.
                            await supabase.storage
                              .from('certificate_backgrounds')
                              .remove([parts[1]]);
                          }
                        } catch (e) {
                          console.warn('Failed to cleanup old background:', e);
                        }
                      }

                      // 5. Update template state
                      setTemplate((prev) => ({
                        ...prev,
                        backgroundImage: publicUrl,
                      }));

                      toast.success('Gambar latar berjaya dimuat naik!', { id: 'bg-upload' });
                    } catch (error) {
                      console.error('Upload error:', error);
                      toast.error('Gagal memuat naik gambar.', { id: 'bg-upload' });
                    }
                  }}
                  className="w-full text-xs file:mr-2 file:py-1 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-medium file:bg-primary/10 file:text-primary hover:file:bg-primary/20 cursor-pointer"
                />
                <p className="text-xs text-gray-400">PNG, JPG, WebP. Maks 10MB (akan dicompress)</p>
                {template.backgroundImage && (
                  <div className="relative">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={template.backgroundImage}
                      alt="Background preview"
                      className="w-full h-20 object-cover rounded border"
                    />
                    <Button
                      variant="destructive"
                      size="icon"
                      className="absolute top-1 right-1 h-6 w-6"
                      onClick={async () => {
                        // Delete from storage if it's a Supabase URL
                        const url = template.backgroundImage;
                        if (url?.includes('certificate_backgrounds')) {
                          try {
                            const supabase = createClient();
                            const parts = url.split('/certificate_backgrounds/');
                            if (parts.length === 2) {
                              await supabase.storage
                                .from('certificate_backgrounds')
                                .remove([parts[1]]);
                            }
                          } catch (e) {
                            console.warn('Failed to delete background:', e);
                          }
                        }
                        setTemplate((prev) => ({ ...prev, backgroundImage: undefined }));
                      }}
                    >
                      <Trash className="h-3 w-3" />
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Canvas Area */}
        <div
          className="flex-1 overflow-auto p-8 flex items-center justify-center"
          onClick={() => setSelectedId(null)}
        >
          <div
            ref={canvasRef}
            className="relative shadow-2xl"
            style={{
              width: '100%',
              maxWidth: '800px',
              aspectRatio: `${template.width}/${template.height}`,
              backgroundColor: template.backgroundColor,
              backgroundImage: template.backgroundImage
                ? `url(${template.backgroundImage})`
                : undefined,
              backgroundSize: 'cover',
            }}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onClick={() => setSelectedId(null)}
          >
            {showGrid && (
              <div
                className="absolute inset-0 pointer-events-none z-0"
                style={{
                  backgroundImage:
                    'linear-gradient(to right, #e5e7eb 1px, transparent 1px), linear-gradient(to bottom, #e5e7eb 1px, transparent 1px)',
                  backgroundSize: '20px 20px',
                }}
              />
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
                      style={{
                        fontSize: `${(el.fontSize || 16) * scale}px`,
                        fontFamily: el.fontFamily,
                        fontWeight: el.fontWeight,
                        fontStyle: el.fontStyle,
                        color: el.color,
                        textAlign: el.textAlign,
                        lineHeight: el.lineHeight ?? 1.2,
                        letterSpacing: `${el.letterSpacing ?? 0}px`,
                        WebkitTextStroke: el.textStrokeWidth
                          ? `${el.textStrokeWidth * scale}px ${el.textStroke || '#000'}`
                          : undefined,
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {el.content}
                    </div>
                  )}
                  {el.type === 'placeholder' && (
                    <div
                      className="border-2 border-dashed border-primary/40 bg-primary/5 px-2 py-1 rounded"
                      style={{
                        fontSize: `${(el.fontSize || 16) * scale}px`,
                        fontFamily: el.fontFamily,
                        fontWeight: el.fontWeight,
                        fontStyle: el.fontStyle,
                        color: el.color,
                        textAlign: el.textAlign,
                        lineHeight: el.lineHeight ?? 1.2,
                        letterSpacing: `${el.letterSpacing ?? 0}px`,
                        WebkitTextStroke: el.textStrokeWidth
                          ? `${el.textStrokeWidth * scale}px ${el.textStroke || '#000'}`
                          : undefined,
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {PLACEHOLDER_LABELS[el.placeholderType || 'name']}
                    </div>
                  )}
                  {el.type === 'shape' && (
                    <div
                      style={{
                        width: '100%',
                        height: '100%',
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
                      style={{
                        width: '100%',
                        height: '100%',
                        backgroundImage: `url(${el.src})`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        backgroundRepeat: 'no-repeat',
                        pointerEvents: 'none',
                        borderRadius: `${el.borderRadius ?? 0}px`,
                        filter: `brightness(${el.brightness ?? 100}%) contrast(${el.contrast ?? 100}%) grayscale(${el.grayscale ?? 0}%)`,
                      }}
                    />
                  )}

                  {/* Icon Rendering */}
                  {el.type === 'icon' && el.iconName && (
                    <div
                      style={{
                        width: '100%',
                        height: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: el.stroke || '#000000',
                      }}
                      className="pointer-events-none"
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
                        value={el.qrData || 'https://esijil.com'}
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
        <div className="w-72 bg-white border-l p-4 overflow-y-auto">
          {selectedElement ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-xs text-gray-500 uppercase tracking-wider">
                  {selectedElement.type === 'placeholder' ? 'Placeholder' : 'Element Properties'}
                </Label>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => duplicateElement()}
                    title="Duplicate (Ctrl+D)"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50"
                    onClick={() => deleteElement(selectedElement.id)}
                    title="Delete"
                  >
                    <Trash className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Layer Controls */}
              <div className="space-y-2">
                <Label className="text-xs text-gray-500 uppercase tracking-wider flex items-center gap-1">
                  <Layers className="h-3 w-3" /> Layer Order
                </Label>
                <div className="flex gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 text-xs"
                    onClick={() => bringToFront(selectedElement.id)}
                    title="Bring to Front"
                  >
                    <ArrowUpToLine className="h-3 w-3 mr-1" />
                    Front
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 text-xs"
                    onClick={() => sendToBack(selectedElement.id)}
                    title="Send to Back"
                  >
                    <ArrowDownToLine className="h-3 w-3 mr-1" />
                    Back
                  </Button>
                </div>
                <div className="flex gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 text-xs"
                    onClick={() => moveLayerUp(selectedElement.id)}
                    title="Move Up"
                  >
                    <ChevronUp className="h-3 w-3 mr-1" />
                    Up
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 text-xs"
                    onClick={() => moveLayerDown(selectedElement.id)}
                    title="Move Down"
                  >
                    <ChevronDown className="h-3 w-3 mr-1" />
                    Down
                  </Button>
                </div>
              </div>

              {/* Opacity & Rotation Controls */}
              <div className="space-y-3 border-t pt-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <Label className="text-sm">Opacity</Label>
                    <span className="text-xs text-gray-500">
                      {Math.round((selectedElement.opacity ?? 1) * 100)}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={Math.round((selectedElement.opacity ?? 1) * 100)}
                    onChange={(e) =>
                      updateElement(selectedElement.id, { opacity: parseInt(e.target.value) / 100 })
                    }
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary"
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <Label className="text-sm">Rotation</Label>
                    <span className="text-xs text-gray-500">{selectedElement.rotation ?? 0}°</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="360"
                    value={selectedElement.rotation ?? 0}
                    onChange={(e) =>
                      updateElement(selectedElement.id, { rotation: parseInt(e.target.value) })
                    }
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary"
                  />
                </div>
              </div>

              {selectedElement.type === 'image' && (
                <div className="mb-4">
                  <Label className="text-sm">Image Tools</Label>
                  <Button
                    className="w-full mt-2"
                    variant="outline"
                    onClick={() => {
                      if (selectedElement.src) {
                        setImageToCrop(selectedElement.src);
                        setCropperOpen(true);
                      }
                    }}
                  >
                    <Crop className="w-4 h-4 mr-2" />
                    Crop Image
                  </Button>

                  <div className="mt-4">
                    <div className="flex items-center justify-between mb-1">
                      <Label className="text-sm">Border Radius</Label>
                      <span className="text-xs text-gray-500">
                        {selectedElement.borderRadius ?? 0}px
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={selectedElement.borderRadius ?? 0}
                      onChange={(e) =>
                        updateElement(selectedElement.id, {
                          borderRadius: parseInt(e.target.value),
                        })
                      }
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary"
                    />
                  </div>

                  {/* Image Filters */}
                  <div className="mt-4 space-y-3 border-t pt-3">
                    <Label className="text-xs font-semibold text-gray-500 uppercase">Filters</Label>

                    {/* Brightness */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <Label className="text-sm">Brightness</Label>
                        <span className="text-xs text-gray-500">
                          {selectedElement.brightness ?? 100}%
                        </span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="200"
                        value={selectedElement.brightness ?? 100}
                        onChange={(e) =>
                          updateElement(selectedElement.id, {
                            brightness: parseInt(e.target.value),
                          })
                        }
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary"
                      />
                    </div>

                    {/* Contrast */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <Label className="text-sm">Contrast</Label>
                        <span className="text-xs text-gray-500">
                          {selectedElement.contrast ?? 100}%
                        </span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="200"
                        value={selectedElement.contrast ?? 100}
                        onChange={(e) =>
                          updateElement(selectedElement.id, { contrast: parseInt(e.target.value) })
                        }
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary"
                      />
                    </div>

                    {/* Grayscale */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <Label className="text-sm">Grayscale</Label>
                        <span className="text-xs text-gray-500">
                          {selectedElement.grayscale ?? 0}%
                        </span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={selectedElement.grayscale ?? 0}
                        onChange={(e) =>
                          updateElement(selectedElement.id, { grayscale: parseInt(e.target.value) })
                        }
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary"
                      />
                    </div>
                  </div>
                </div>
              )}

              {selectedElement.type === 'icon' && (
                <div className="space-y-4">
                  <Label className="text-xs font-semibold text-gray-500 uppercase">
                    Icon Properties
                  </Label>

                  {/* Icon Picker */}
                  <div>
                    <Label className="text-xs mb-2 block">Pilih Icon</Label>
                    <div className="grid grid-cols-5 gap-2 p-2 border rounded-md bg-gray-50/50">
                      {Object.keys(ICON_MAP).map((iconName) => {
                        const IconComp = ICON_MAP[iconName];
                        return (
                          <Button
                            key={iconName}
                            variant={selectedElement.iconName === iconName ? 'default' : 'ghost'}
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => updateElement(selectedElement.id, { iconName })}
                            title={iconName}
                          >
                            <IconComp className="h-4 w-4" />
                          </Button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Color */}
                  <div>
                    <Label className="text-sm">Warna Icon</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <input
                        type="color"
                        value={selectedElement.stroke || '#000000'}
                        onChange={(e) =>
                          updateElement(selectedElement.id, { stroke: e.target.value })
                        }
                        className="w-8 h-8 rounded cursor-pointer border"
                      />
                      <Input
                        value={selectedElement.stroke || '#000000'}
                        onChange={(e) =>
                          updateElement(selectedElement.id, { stroke: e.target.value })
                        }
                        className="h-8 w-24 font-mono text-xs"
                      />
                    </div>
                  </div>

                  {/* Stroke Width */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <Label className="text-sm">Ketebalan</Label>
                      <span className="text-xs text-gray-500">
                        {selectedElement.strokeWidth ?? 2}px
                      </span>
                    </div>
                    <input
                      type="range"
                      min="1"
                      max="10"
                      step="0.5"
                      value={selectedElement.strokeWidth ?? 2}
                      onChange={(e) =>
                        updateElement(selectedElement.id, {
                          strokeWidth: parseFloat(e.target.value),
                        })
                      }
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary"
                    />
                  </div>
                </div>
              )}

              {selectedElement.type === 'qr' && (
                <div className="space-y-4">
                  <Label className="text-xs font-semibold text-gray-500 uppercase">
                    QR Code Settings
                  </Label>

                  {/* QR Data Input */}
                  <div>
                    <Label className="text-sm">Data / URL</Label>
                    <textarea
                      value={selectedElement.qrData || ''}
                      onChange={(e) =>
                        updateElement(selectedElement.id, { qrData: e.target.value })
                      }
                      className="mt-1 w-full border rounded-md px-3 py-2 text-sm min-h-[80px]"
                      placeholder="https://example.com"
                    />
                    <p className="text-xs text-gray-400 mt-1">
                      Masukkan link pengesahan sijil di sini.
                    </p>
                  </div>

                  {/* Color */}
                  <div>
                    <Label className="text-sm">Warna QR</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <input
                        type="color"
                        value={selectedElement.color || '#000000'}
                        onChange={(e) =>
                          updateElement(selectedElement.id, { color: e.target.value })
                        }
                        className="w-8 h-8 rounded cursor-pointer border"
                      />
                      <Input
                        value={selectedElement.color || '#000000'}
                        onChange={(e) =>
                          updateElement(selectedElement.id, { color: e.target.value })
                        }
                        className="h-8 w-24 font-mono text-xs"
                      />
                    </div>
                  </div>
                </div>
              )}

              {(selectedElement.type === 'text' || selectedElement.type === 'placeholder') && (
                <>
                  {selectedElement.type === 'text' && (
                    <div>
                      <Label className="text-sm">Teks</Label>
                      <Input
                        value={selectedElement.content || ''}
                        onChange={(e) =>
                          updateElement(selectedElement.id, { content: e.target.value })
                        }
                        className="mt-1"
                      />
                    </div>
                  )}

                  <div>
                    <Label className="text-sm">Saiz Font</Label>
                    <Input
                      type="number"
                      value={selectedElement.fontSize || 16}
                      onChange={(e) =>
                        updateElement(selectedElement.id, { fontSize: parseInt(e.target.value) })
                      }
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label className="text-sm">Font</Label>
                    <select
                      value={selectedElement.fontFamily || 'sans-serif'}
                      onChange={(e) =>
                        updateElement(selectedElement.id, { fontFamily: e.target.value })
                      }
                      className="mt-1 w-full border rounded-md px-3 py-2 text-sm"
                      style={{ fontFamily: selectedElement.fontFamily }}
                    >
                      <optgroup label="Sans Serif">
                        <option value="sans-serif" style={{ fontFamily: 'sans-serif' }}>
                          Sans Serif
                        </option>
                        <option value="Arial, sans-serif" style={{ fontFamily: 'Arial' }}>
                          Arial
                        </option>
                        <option value="Helvetica, sans-serif" style={{ fontFamily: 'Helvetica' }}>
                          Helvetica
                        </option>
                        <option value="Verdana, sans-serif" style={{ fontFamily: 'Verdana' }}>
                          Verdana
                        </option>
                        <option value="Tahoma, sans-serif" style={{ fontFamily: 'Tahoma' }}>
                          Tahoma
                        </option>
                        <option
                          value="Trebuchet MS, sans-serif"
                          style={{ fontFamily: 'Trebuchet MS' }}
                        >
                          Trebuchet MS
                        </option>
                      </optgroup>
                      <optgroup label="Serif">
                        <option value="serif" style={{ fontFamily: 'serif' }}>
                          Serif
                        </option>
                        <option
                          value="Times New Roman, serif"
                          style={{ fontFamily: 'Times New Roman' }}
                        >
                          Times New Roman
                        </option>
                        <option value="Georgia, serif" style={{ fontFamily: 'Georgia' }}>
                          Georgia
                        </option>
                        <option value="Palatino, serif" style={{ fontFamily: 'Palatino' }}>
                          Palatino
                        </option>
                        <option value="Book Antiqua, serif" style={{ fontFamily: 'Book Antiqua' }}>
                          Book Antiqua
                        </option>
                        <option value="Garamond, serif" style={{ fontFamily: 'Garamond' }}>
                          Garamond
                        </option>
                      </optgroup>
                      <optgroup label="Display">
                        <option value="Impact, sans-serif" style={{ fontFamily: 'Impact' }}>
                          Impact
                        </option>
                        <option
                          value="Comic Sans MS, cursive"
                          style={{ fontFamily: 'Comic Sans MS' }}
                        >
                          Comic Sans MS
                        </option>
                        <option value="cursive" style={{ fontFamily: 'cursive' }}>
                          Cursive
                        </option>
                        <option value="fantasy" style={{ fontFamily: 'fantasy' }}>
                          Fantasy
                        </option>
                      </optgroup>
                      <optgroup label="Monospace">
                        <option value="monospace" style={{ fontFamily: 'monospace' }}>
                          Monospace
                        </option>
                        <option
                          value="Courier New, monospace"
                          style={{ fontFamily: 'Courier New' }}
                        >
                          Courier New
                        </option>
                        <option
                          value="Lucida Console, monospace"
                          style={{ fontFamily: 'Lucida Console' }}
                        >
                          Lucida Console
                        </option>
                      </optgroup>
                      <optgroup label="Google Fonts - Sans Serif">
                        <option value="Roboto, sans-serif" style={{ fontFamily: 'Roboto' }}>
                          Roboto
                        </option>
                        <option value="Open Sans, sans-serif" style={{ fontFamily: 'Open Sans' }}>
                          Open Sans
                        </option>
                        <option value="Lato, sans-serif" style={{ fontFamily: 'Lato' }}>
                          Lato
                        </option>
                        <option value="Montserrat, sans-serif" style={{ fontFamily: 'Montserrat' }}>
                          Montserrat
                        </option>
                        <option value="Poppins, sans-serif" style={{ fontFamily: 'Poppins' }}>
                          Poppins
                        </option>
                      </optgroup>
                      <optgroup label="Google Fonts - Serif">
                        <option
                          value="Playfair Display, serif"
                          style={{ fontFamily: 'Playfair Display' }}
                        >
                          Playfair Display
                        </option>
                        <option value="Merriweather, serif" style={{ fontFamily: 'Merriweather' }}>
                          Merriweather
                        </option>
                        <option value="Cinzel, serif" style={{ fontFamily: 'Cinzel' }}>
                          Cinzel
                        </option>
                      </optgroup>
                      <optgroup label="Google Fonts - Decorative">
                        <option
                          value="Dancing Script, cursive"
                          style={{ fontFamily: 'Dancing Script' }}
                        >
                          Dancing Script
                        </option>
                        <option value="Great Vibes, cursive" style={{ fontFamily: 'Great Vibes' }}>
                          Great Vibes
                        </option>
                      </optgroup>
                    </select>
                  </div>

                  <div>
                    <Label className="text-sm">Warna</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <input
                        type="color"
                        value={selectedElement.color || '#000000'}
                        onChange={(e) =>
                          updateElement(selectedElement.id, { color: e.target.value })
                        }
                        className="w-10 h-10 rounded cursor-pointer"
                      />
                      <Input
                        value={selectedElement.color || '#000000'}
                        onChange={(e) =>
                          updateElement(selectedElement.id, { color: e.target.value })
                        }
                        className="flex-1"
                      />
                    </div>
                  </div>

                  <div>
                    <Label className="text-sm">Penjajaran</Label>
                    <div className="flex gap-1 mt-1">
                      <Button
                        variant={selectedElement.textAlign === 'left' ? 'default' : 'outline'}
                        size="icon"
                        className="h-9 w-9"
                        onClick={() => updateElement(selectedElement.id, { textAlign: 'left' })}
                      >
                        <AlignLeft className="h-4 w-4" />
                      </Button>
                      <Button
                        variant={selectedElement.textAlign === 'center' ? 'default' : 'outline'}
                        size="icon"
                        className="h-9 w-9"
                        onClick={() => updateElement(selectedElement.id, { textAlign: 'center' })}
                      >
                        <AlignCenter className="h-4 w-4" />
                      </Button>
                      <Button
                        variant={selectedElement.textAlign === 'right' ? 'default' : 'outline'}
                        size="icon"
                        className="h-9 w-9"
                        onClick={() => updateElement(selectedElement.id, { textAlign: 'right' })}
                      >
                        <AlignRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <div>
                    <Label className="text-sm">Gaya</Label>
                    <div className="flex gap-1 mt-1">
                      <Button
                        variant={selectedElement.fontWeight === 'bold' ? 'default' : 'outline'}
                        size="icon"
                        className="h-9 w-9"
                        onClick={() =>
                          updateElement(selectedElement.id, {
                            fontWeight: selectedElement.fontWeight === 'bold' ? 'normal' : 'bold',
                          })
                        }
                      >
                        <Bold className="h-4 w-4" />
                      </Button>
                      <Button
                        variant={selectedElement.fontStyle === 'italic' ? 'default' : 'outline'}
                        size="icon"
                        className="h-9 w-9"
                        onClick={() =>
                          updateElement(selectedElement.id, {
                            fontStyle: selectedElement.fontStyle === 'italic' ? 'normal' : 'italic',
                          })
                        }
                      >
                        <Italic className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Line Height */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <Label className="text-sm">Line Height</Label>
                      <span className="text-xs text-gray-500">
                        {selectedElement.lineHeight ?? 1.2}
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0.8"
                      max="3"
                      step="0.1"
                      value={selectedElement.lineHeight ?? 1.2}
                      onChange={(e) =>
                        updateElement(selectedElement.id, {
                          lineHeight: parseFloat(e.target.value),
                        })
                      }
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary"
                    />
                  </div>

                  {/* Letter Spacing */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <Label className="text-sm">Letter Spacing</Label>
                      <span className="text-xs text-gray-500">
                        {selectedElement.letterSpacing ?? 0}px
                      </span>
                    </div>
                    <input
                      type="range"
                      min="-5"
                      max="20"
                      step="0.5"
                      value={selectedElement.letterSpacing ?? 0}
                      onChange={(e) =>
                        updateElement(selectedElement.id, {
                          letterSpacing: parseFloat(e.target.value),
                        })
                      }
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary"
                    />
                  </div>

                  {/* Text Outline/Stroke */}
                  <div>
                    <Label className="text-sm">Text Outline</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <input
                        type="color"
                        value={selectedElement.textStroke || '#000000'}
                        onChange={(e) =>
                          updateElement(selectedElement.id, { textStroke: e.target.value })
                        }
                        className="w-8 h-8 rounded cursor-pointer"
                      />
                      <Input
                        type="number"
                        placeholder="Width"
                        value={selectedElement.textStrokeWidth || 0}
                        onChange={(e) =>
                          updateElement(selectedElement.id, {
                            textStrokeWidth: parseInt(e.target.value) || 0,
                          })
                        }
                        className="w-20"
                      />
                      <span className="text-xs text-gray-500">px</span>
                    </div>
                  </div>
                </>
              )}

              {selectedElement.type === 'shape' && (
                <div className="space-y-3">
                  <div>
                    <Label className="text-sm">
                      {selectedElement.shapeType === 'line' ? 'Line Color' : 'Fill Color'}
                    </Label>
                    <div className="flex items-center gap-2 mt-1">
                      <input
                        type="color"
                        value={selectedElement.fill || '#e5e7eb'}
                        onChange={(e) =>
                          updateElement(selectedElement.id, { fill: e.target.value })
                        }
                        className="w-10 h-10 rounded cursor-pointer"
                      />
                      <Input
                        value={selectedElement.fill || '#e5e7eb'}
                        onChange={(e) =>
                          updateElement(selectedElement.id, { fill: e.target.value })
                        }
                        className="flex-1"
                      />
                    </div>
                  </div>

                  {/* Border/Stroke */}
                  <div>
                    <Label className="text-sm">Border</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <input
                        type="color"
                        value={selectedElement.stroke || '#000000'}
                        onChange={(e) =>
                          updateElement(selectedElement.id, { stroke: e.target.value })
                        }
                        className="w-10 h-10 rounded cursor-pointer"
                      />
                      <Input
                        type="number"
                        placeholder="Width"
                        value={selectedElement.strokeWidth || 0}
                        onChange={(e) =>
                          updateElement(selectedElement.id, {
                            strokeWidth: parseInt(e.target.value),
                          })
                        }
                        className="w-20"
                      />
                      <span className="text-xs text-gray-500">px</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Shadow Effect (for all elements) */}
              <div className="space-y-2 border-t pt-3">
                <div className="flex items-center justify-between">
                  <Label className="text-sm">Shadow</Label>
                  <input
                    type="checkbox"
                    checked={selectedElement.shadow?.enabled ?? false}
                    onChange={(e) =>
                      updateElement(selectedElement.id, {
                        shadow: {
                          enabled: e.target.checked,
                          color: selectedElement.shadow?.color || 'rgba(0,0,0,0.3)',
                          blur: selectedElement.shadow?.blur || 10,
                          offsetX: selectedElement.shadow?.offsetX || 4,
                          offsetY: selectedElement.shadow?.offsetY || 4,
                        },
                      })
                    }
                    className="w-4 h-4 accent-primary"
                  />
                </div>
                {selectedElement.shadow?.enabled && (
                  <div className="space-y-2 pl-2 border-l-2 border-gray-200">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <Label className="text-xs">Blur</Label>
                        <span className="text-xs text-gray-500">
                          {selectedElement.shadow.blur}px
                        </span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="50"
                        value={selectedElement.shadow.blur}
                        onChange={(e) =>
                          updateElement(selectedElement.id, {
                            shadow: { ...selectedElement.shadow!, blur: parseInt(e.target.value) },
                          })
                        }
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label className="text-xs">Offset X</Label>
                        <Input
                          type="number"
                          value={selectedElement.shadow.offsetX}
                          onChange={(e) =>
                            updateElement(selectedElement.id, {
                              shadow: {
                                ...selectedElement.shadow!,
                                offsetX: parseInt(e.target.value),
                              },
                            })
                          }
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Offset Y</Label>
                        <Input
                          type="number"
                          value={selectedElement.shadow.offsetY}
                          onChange={(e) =>
                            updateElement(selectedElement.id, {
                              shadow: {
                                ...selectedElement.shadow!,
                                offsetY: parseInt(e.target.value),
                              },
                            })
                          }
                          className="mt-1"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="pt-4 border-t">
                <Label className="text-sm">Posisi & Saiz</Label>
                <div className="grid grid-cols-2 gap-2 mt-1">
                  <div>
                    <Label className="text-xs text-gray-500">X</Label>
                    <Input
                      type="number"
                      value={Math.round(selectedElement.x)}
                      onChange={(e) =>
                        updateElement(selectedElement.id, { x: parseInt(e.target.value) })
                      }
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-gray-500">Y</Label>
                    <Input
                      type="number"
                      value={Math.round(selectedElement.y)}
                      onChange={(e) =>
                        updateElement(selectedElement.id, { y: parseInt(e.target.value) })
                      }
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-gray-500">Lebar (W)</Label>
                    <Input
                      type="number"
                      value={Math.round(selectedElement.width)}
                      onChange={(e) =>
                        updateElement(selectedElement.id, { width: parseInt(e.target.value) })
                      }
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-gray-500">Tinggi (H)</Label>
                    <Input
                      type="number"
                      value={Math.round(selectedElement.height)}
                      onChange={(e) =>
                        updateElement(selectedElement.id, { height: parseInt(e.target.value) })
                      }
                    />
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center text-gray-500 py-12">
              <p className="text-sm">Pilih elemen untuk edit</p>
            </div>
          )}
        </div>
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
