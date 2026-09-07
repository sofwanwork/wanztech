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
  FileDown,
  Printer,
  Eye,
  Save,
  RectangleHorizontal,
  RectangleVertical,
  PanelLeft,
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
  onExportPdf: () => void;
  exportingPdf: boolean;
  showSafeMargin: boolean;
  onToggleSafeMargin: () => void;
  orientation: 'landscape' | 'portrait';
  onOrientationChange: () => void;
  showSidebar?: boolean;
  onToggleSidebar?: () => void;
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
  onExportPdf,
  exportingPdf,
  showSafeMargin,
  onToggleSafeMargin,
  orientation,
  onOrientationChange,
  showSidebar,
  onToggleSidebar,
}: CertificateEditorToolbarProps) {
  return (
    <div className="bg-white border-b px-3 sm:px-4 py-2.5 flex items-center justify-between gap-2 sm:gap-4 shrink-0">
      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
        <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" asChild>
          <Link href="/certificates/builder" title="Kembali ke Senarai Sijil">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>

        {onToggleSidebar && (
          <Button
            variant={showSidebar ? 'secondary' : 'ghost'}
            size="icon"
            className="h-8 w-8 shrink-0 hidden md:flex"
            onClick={onToggleSidebar}
            title={showSidebar ? 'Sembunyi Bar Sisi Elemen' : 'Tunjuk Bar Sisi Elemen'}
          >
            <PanelLeft className="h-4 w-4" />
          </Button>
        )}

        <Input
          value={templateName}
          onChange={(e) => onNameChange(e.target.value)}
          className="font-semibold text-base sm:text-lg border-none shadow-none focus-visible:ring-0 w-36 sm:w-48 md:w-56 truncate px-1 h-8"
          title={templateName}
        />

        {/* Undo/Redo */}
        <div className="flex items-center gap-0.5 border-l pl-2 sm:pl-3">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={onUndo}
            disabled={!canUndo}
            title="Batal (Undo)"
          >
            <Undo className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={onRedo}
            disabled={!canRedo}
            title="Ulang (Redo)"
          >
            <Redo className="h-4 w-4" />
          </Button>
        </div>

        {/* Orientation Toggle */}
        <div className="flex items-center gap-0.5 border-l pl-2 sm:pl-3">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={onOrientationChange}
            title={orientation === 'landscape' ? 'Tukar ke Potret' : 'Tukar ke Landskap'}
          >
            {orientation === 'landscape' ? (
              <RectangleHorizontal className="h-4 w-4 text-slate-700" />
            ) : (
              <RectangleVertical className="h-4 w-4 text-slate-700" />
            )}
          </Button>
        </div>

        {/* Smart Tools */}
        <div className="flex items-center gap-0.5 border-l pl-2 sm:pl-3">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={onGroup}
            disabled={!canGroup}
            title="Group (Ctrl+G)"
          >
            <Group className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={onUngroup}
            disabled={!canUngroup}
            title="Ungroup (Ctrl+Shift+G)"
          >
            <Ungroup className="h-4 w-4" />
          </Button>
          <div className="w-px h-5 bg-gray-200 mx-1 hidden sm:block" />
          <Button
            variant={showGrid ? 'default' : 'ghost'}
            size="icon"
            className="h-8 w-8 hidden sm:flex"
            onClick={onToggleGrid}
            title="Tunjuk Grid"
          >
            <Grid className="h-4 w-4" />
          </Button>
          <Button
            variant={snapToGrid ? 'default' : 'ghost'}
            size="icon"
            className="h-8 w-8 hidden sm:flex"
            onClick={onToggleSnap}
            title="Lekat ke Grid (Snap)"
          >
            <Magnet className="h-4 w-4" />
          </Button>
          <Button
            variant={showSafeMargin ? 'default' : 'ghost'}
            size="icon"
            className="h-8 w-8"
            onClick={onToggleSafeMargin}
            title={showSafeMargin ? 'Sembunyi Garis Selamat Cetakan' : 'Tunjuk Garis Selamat Cetakan (A4 Margin)'}
          >
            <Printer className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
        <Button
          variant="outline"
          size="sm"
          className="gap-1 sm:gap-1.5 h-8 px-2 sm:px-3 text-xs"
          onClick={onExport}
          disabled={exporting || exportingPdf}
        >
          <Download className="h-3.5 w-3.5" />
          <span className="hidden md:inline">{exporting ? 'Eksport...' : 'PNG'}</span>
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="gap-1 sm:gap-1.5 h-8 px-2 sm:px-3 text-xs"
          onClick={onExportPdf}
          disabled={exportingPdf || exporting}
        >
          <FileDown className="h-3.5 w-3.5" />
          <span className="hidden md:inline">{exportingPdf ? 'Menjana...' : 'PDF (A4)'}</span>
        </Button>
        <Button variant="outline" size="sm" className="gap-1 sm:gap-1.5 h-8 px-2 sm:px-3 text-xs" asChild>
          <Link href={`/certificates/builder/${templateId}/preview`}>
            <Eye className="h-3.5 w-3.5" />
            <span className="hidden lg:inline">Preview</span>
          </Link>
        </Button>
        <Button onClick={onSave} disabled={saving} size="sm" className="gap-1.5 h-8 px-3 text-xs">
          <Save className="h-3.5 w-3.5" />
          <span>{saving ? 'Menyimpan...' : 'Simpan'}</span>
        </Button>
      </div>
    </div>
  );
}
