import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  ArrowLeft,
  Undo,
  Redo,
  Group,
  Ungroup,
  Grid,
  Magnet,
  Download,
  Eye,
  Save,
  RectangleHorizontal,
  RectangleVertical,
} from 'lucide-react';

interface CertificateEditorToolbarProps {
  templateName: string;
  templateId: string;
  onNameChange: (name: string) => void;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  canGroup: boolean;
  canUngroup: boolean;
  onGroup: () => void;
  onUngroup: () => void;
  showGrid: boolean;
  snapToGrid: boolean;
  onToggleGrid: () => void;
  onToggleSnap: () => void;
  onSave: () => void;
  saving: boolean;
  onExport: () => void;
  exporting: boolean;
  orientation: 'landscape' | 'portrait';
  onOrientationChange: () => void;
}

export function CertificateEditorToolbar({
  templateName,
  templateId,
  onNameChange,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  canGroup,
  canUngroup,
  onGroup,
  onUngroup,
  showGrid,
  snapToGrid,
  onToggleGrid,
  onToggleSnap,
  onSave,
  saving,
  onExport,
  exporting,
  orientation,
  onOrientationChange,
}: CertificateEditorToolbarProps) {
  return (
    <div className="bg-white border-b px-4 py-3 flex items-center justify-between gap-4">
      <div className="flex items-center gap-4">
        <Link href="/ecert/builder">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <Input
          value={templateName}
          onChange={(e) => onNameChange(e.target.value)}
          className="font-semibold text-lg border-none shadow-none focus-visible:ring-0 w-64"
        />
        {/* Undo/Redo */}
        <div className="flex items-center gap-1 border-l pl-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={onUndo}
            disabled={!canUndo}
            title="Batal (Undo)"
          >
            <Undo className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={onRedo}
            disabled={!canRedo}
            title="Ulang (Redo)"
          >
            <Redo className="h-4 w-4" />
          </Button>
        </div>

        {/* Orientation Toggle */}
        <div className="flex items-center gap-1 border-l pl-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={onOrientationChange}
            title={orientation === 'landscape' ? 'Tukar ke Potret' : 'Tukar ke Landskap'}
          >
            {orientation === 'landscape' ? (
              <RectangleHorizontal className="h-4 w-4" />
            ) : (
              <RectangleVertical className="h-4 w-4" />
            )}
          </Button>
        </div>

        {/* Smart Tools */}
        <div className="flex items-center gap-1 border-l pl-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={onGroup}
            disabled={!canGroup}
            title="Group (Ctrl+G)"
          >
            <Group className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={onUngroup}
            disabled={!canUngroup}
            title="Ungroup (Ctrl+Shift+G)"
          >
            <Ungroup className="h-4 w-4" />
          </Button>
          <div className="w-px h-6 bg-gray-200 mx-2" />
          <Button
            variant={showGrid ? 'default' : 'ghost'}
            size="icon"
            onClick={onToggleGrid}
            title="Show Grid"
          >
            <Grid className="h-4 w-4" />
          </Button>
          <Button
            variant={snapToGrid ? 'default' : 'ghost'}
            size="icon"
            onClick={onToggleSnap}
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
          onClick={onExport}
          disabled={exporting}
        >
          <Download className="h-4 w-4" />
          {exporting ? 'Eksport...' : 'Eksport PNG'}
        </Button>
        <Link href={`/ecert/builder/${templateId}/preview`}>
          <Button variant="outline" size="sm" className="gap-2">
            <Eye className="h-4 w-4" />
            Preview
          </Button>
        </Link>
        <Button onClick={onSave} disabled={saving} className="gap-2">
          <Save className="h-4 w-4" />
          {saving ? 'Menyimpan...' : 'Simpan'}
        </Button>
      </div>
    </div>
  );
}
