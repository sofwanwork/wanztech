'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Plus, Loader2, CheckCircle2, FileText } from 'lucide-react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { createCertificateTemplateAction } from '@/actions/certificate-template';
import {
  CERTIFICATE_PRESETS,
  type CertificateOrientation,
} from '@/lib/certificates/presets';
import { cn } from '@/lib/utils';

interface NewCertificateDialogProps {
  children: React.ReactNode;
}

const PRESET_SWATCH_STYLES: Record<
  string,
  {
    bg: string;
    border: string;
    accentBar?: 'top-bottom' | 'left' | 'double-frame' | 'frame' | 'blank';
    accentColor?: string;
    lineColor: string;
  }
> = {
  blank: {
    bg: '#ffffff',
    border: '#cbd5e1',
    accentBar: 'blank',
    lineColor: '#cbd5e1',
  },
  'royal-gold': {
    bg: '#0f172a',
    border: '#f59e0b',
    accentBar: 'double-frame',
    accentColor: '#f59e0b',
    lineColor: '#fbbf24',
  },
  'corporate-blue': {
    bg: '#ffffff',
    border: '#cbd5e1',
    accentBar: 'top-bottom',
    accentColor: '#1e3a8a',
    lineColor: '#3b82f6',
  },
  'academic-classic': {
    bg: '#fffdfa',
    border: '#92400e',
    accentBar: 'double-frame',
    accentColor: '#92400e',
    lineColor: '#b45309',
  },
  'modern-training': {
    bg: '#f8fafc',
    border: '#cbd5e1',
    accentBar: 'left',
    accentColor: '#059669',
    lineColor: '#10b981',
  },
  'luxury-dark': {
    bg: '#18181b',
    border: '#eab308',
    accentBar: 'frame',
    accentColor: '#eab308',
    lineColor: '#fef08a',
  },
};

function PresetMiniPreview({
  presetId,
  backgroundColor,
  orientation,
}: {
  presetId: string;
  backgroundColor: string;
  orientation: CertificateOrientation;
}) {
  const style = PRESET_SWATCH_STYLES[presetId] ?? {
    bg: backgroundColor,
    border: '#cbd5e1',
    accentBar: 'blank' as const,
    lineColor: '#94a3b8',
  };

  return (
    <div
      className={cn(
        'relative shrink-0 rounded-[4px] overflow-hidden shadow-2xs transition-all duration-150 flex flex-col items-center justify-center',
        orientation === 'landscape' ? 'w-12 h-8' : 'w-8 h-11',
        style.accentBar === 'blank' ? 'border border-dashed' : 'border'
      )}
      style={{
        backgroundColor: style.bg,
        borderColor: style.border,
      }}
      aria-hidden="true"
    >
      {style.accentBar === 'double-frame' && (
        <div
          className="absolute inset-[2.5px] rounded-[2px] border"
          style={{ borderColor: style.accentColor }}
        />
      )}
      {style.accentBar === 'frame' && (
        <div
          className="absolute inset-[3px] rounded-[1px] border"
          style={{ borderColor: style.accentColor }}
        />
      )}
      {style.accentBar === 'top-bottom' && (
        <>
          <div
            className="absolute top-0 inset-x-0 h-[3px]"
            style={{ backgroundColor: style.accentColor }}
          />
          <div
            className="absolute bottom-0 inset-x-0 h-[3px]"
            style={{ backgroundColor: style.accentColor }}
          />
        </>
      )}
      {style.accentBar === 'left' && (
        <div
          className="absolute left-0 inset-y-0 w-[3.5px]"
          style={{ backgroundColor: style.accentColor }}
        />
      )}

      {/* Subtle layout lines */}
      <div className="flex flex-col items-center gap-[2.5px] w-full px-2">
        <span
          className="block h-[2px] w-3/5 rounded-full opacity-80"
          style={{ backgroundColor: style.lineColor }}
        />
        <span
          className="block h-[1.5px] w-4/5 rounded-full opacity-50"
          style={{ backgroundColor: style.lineColor }}
        />
        <span
          className="block h-[1.5px] w-2/5 rounded-full opacity-40"
          style={{ backgroundColor: style.lineColor }}
        />
      </div>
    </div>
  );
}

export function NewCertificateDialog({ children }: NewCertificateDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState('blank');
  const [orientation, setOrientation] = useState<CertificateOrientation>('landscape');
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData();
    formData.set('preset', selectedPreset);
    formData.set('orientation', orientation);

    try {
      const result = await createCertificateTemplateAction(formData);
      if (result?.error) {
        toast.error('Failed to create certificate', {
          description: result.error,
        });
        setLoading(false);
      } else if (result?.success && result.id) {
        toast.success('Certificate created successfully!');
        router.push(`/certificates/builder/${result.id}`);
      }
    } catch (error) {
      console.error('Submit error:', error);
      toast.error('System error', {
        description: 'Connection error encountered. Please refresh and try again.',
      });
      setLoading(false);
    }
  };

  if (!mounted) {
    return <>{children}</>;
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-2xl max-h-[90dvh] flex flex-col overflow-hidden rounded-lg border-slate-200 no-scrollbar [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
        <DialogHeader className="shrink-0">
          <DialogTitle className="text-lg font-semibold text-slate-900 flex items-center gap-2.5">
            <span className="h-8 w-8 rounded-md bg-slate-100 border border-slate-200 flex items-center justify-center text-violet-900 shrink-0">
              <FileText className="h-4 w-4" />
            </span>
            Create New Certificate
          </DialogTitle>
          <DialogDescription className="text-slate-500 text-sm">
            Choose a starter layout and paper orientation to begin designing.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0 overflow-hidden">
          {/* Paper Orientation Toggle */}
          <div className="shrink-0 mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2 rounded-lg border border-slate-200 bg-slate-50/80 px-3 py-2.5">
            <div>
              <p className="text-xs font-semibold text-slate-800">Paper Orientation</p>
              <p className="text-[11px] text-slate-500">You can still rotate anytime in the editor.</p>
            </div>
            <div
              role="radiogroup"
              aria-label="Paper orientation"
              className="grid grid-cols-2 gap-1 rounded-md bg-slate-200/70 p-1 shrink-0"
            >
              <button
                type="button"
                role="radio"
                aria-checked={orientation === 'landscape'}
                onClick={() => setOrientation('landscape')}
                className={cn(
                  'flex items-center justify-center gap-1.5 rounded px-2.5 py-1.5 text-xs font-medium transition-colors cursor-pointer',
                  orientation === 'landscape'
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                )}
              >
                <span className="w-3.5 h-2.5 rounded-[2px] border-[1.5px] border-current shrink-0" />
                <span>Landscape</span>
              </button>
              <button
                type="button"
                role="radio"
                aria-checked={orientation === 'portrait'}
                onClick={() => setOrientation('portrait')}
                className={cn(
                  'flex items-center justify-center gap-1.5 rounded px-2.5 py-1.5 text-xs font-medium transition-colors cursor-pointer',
                  orientation === 'portrait'
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                )}
              >
                <span className="w-2.5 h-3.5 rounded-[2px] border-[1.5px] border-current shrink-0" />
                <span>Portrait</span>
              </button>
            </div>
          </div>

          {/* Starter Layouts Grid */}
          <div className="flex-1 min-h-0 overflow-y-auto pr-0.5 no-scrollbar [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden overscroll-contain">
            <RadioGroup
              value={selectedPreset}
              onValueChange={setSelectedPreset}
              className="grid grid-cols-1 sm:grid-cols-2 gap-3"
            >
              {CERTIFICATE_PRESETS.map((preset) => {
                const isChecked = selectedPreset === preset.id;
                return (
                  <div key={preset.id}>
                    <RadioGroupItem value={preset.id} id={preset.id} className="peer sr-only" />
                    <Label
                      htmlFor={preset.id}
                      className={cn(
                        'flex items-start gap-3 h-full p-3.5 rounded-lg border cursor-pointer transition-colors',
                        isChecked
                          ? 'border-violet-900 bg-violet-50/40 ring-1 ring-violet-900/15'
                          : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/70'
                      )}
                    >
                      <div className="w-12 flex items-center justify-center pt-0.5 shrink-0">
                        <PresetMiniPreview
                          presetId={preset.id}
                          backgroundColor={preset.backgroundColor}
                          orientation={orientation}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <p className="font-semibold text-slate-900 text-sm truncate">
                            {preset.name}
                          </p>
                          {isChecked && (
                            <CheckCircle2 className="h-4 w-4 text-violet-900 shrink-0" />
                          )}
                        </div>
                        <p className="text-xs text-slate-500 mt-1 leading-relaxed font-normal">
                          {preset.description}
                        </p>
                      </div>
                    </Label>
                  </div>
                );
              })}
            </RadioGroup>
          </div>

          <div className="flex gap-3 shrink-0 pt-4 border-t border-slate-200 mt-4">
            <Button
              type="button"
              variant="outline"
              className="flex-1 rounded-md border-slate-200"
              onClick={() => setOpen(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1 gap-2 rounded-md bg-violet-900 hover:bg-violet-950 text-white shadow-xs"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4" />
                  Create Certificate
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
