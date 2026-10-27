'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { AdminClientItem, updateClientSubscriptionAction } from '@/actions/admin';
import { SubscriptionTier, SubscriptionStatus } from '@/lib/types/subscription';
import { Loader2, Calendar, ShieldCheck, Sparkles, CheckCircle2, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface EditSubscriptionDialogProps {
  client: AdminClientItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: (updatedClient: {
    userId: string;
    tier: SubscriptionTier;
    status: SubscriptionStatus;
    currentPeriodEnd?: string | null;
  }) => void;
}

export function EditSubscriptionDialog({
  client,
  open,
  onOpenChange,
  onSuccess,
}: EditSubscriptionDialogProps) {
  const [tier, setTier] = useState<SubscriptionTier>('free');
  const [status, setStatus] = useState<SubscriptionStatus>('active');
  const [expiryDate, setExpiryDate] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Sync state when client opens
  const handleOpenChange = (isOpen: boolean) => {
    if (isOpen && client) {
      setTier(client.tier || 'free');
      setStatus(client.status || 'active');
      if (client.currentPeriodEnd) {
        // Format to YYYY-MM-DD for date input
        const d = new Date(client.currentPeriodEnd);
        if (!isNaN(d.getTime())) {
          setExpiryDate(d.toISOString().split('T')[0]);
        } else {
          setExpiryDate('');
        }
      } else {
        setExpiryDate('');
      }
    }
    onOpenChange(isOpen);
  };

  const applyPreset = (preset: '1month' | '1year' | 'lifetime' | 'clear') => {
    const now = new Date();
    if (preset === '1month') {
      now.setMonth(now.getMonth() + 1);
      setExpiryDate(now.toISOString().split('T')[0]);
      setStatus('active');
      // If user was free, auto-upgrade to PRO when adding time
      if (tier === 'free') {
        setTier('pro');
      }
    } else if (preset === '1year') {
      now.setFullYear(now.getFullYear() + 1);
      setExpiryDate(now.toISOString().split('T')[0]);
      setStatus('active');
      if (tier === 'free') {
        setTier('pro');
      }
    } else if (preset === 'lifetime') {
      setExpiryDate('2099-12-31');
      setStatus('active');
      if (tier === 'free') {
        setTier('pro');
      }
    } else if (preset === 'clear') {
      setExpiryDate('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!client) return;

    // Safety check: If user sets an expiry date in the future but tier is free, remind or auto-promote to PRO
    let finalTier = tier;
    if (tier === 'free' && expiryDate) {
      finalTier = 'pro';
      setTier('pro');
      toast.info('Pelan dinaik taraf kepada PRO secara automatik kerana tarikh luput ditetapkan.');
    }

    setIsSubmitting(true);
    try {
      const formattedEnd = expiryDate ? new Date(`${expiryDate}T23:59:59.000Z`).toISOString() : null;

      const res = await updateClientSubscriptionAction({
        userId: client.id,
        tier: finalTier,
        status,
        currentPeriodEnd: formattedEnd,
      });

      if (!res.success) {
        toast.error(res.error || 'Gagal mengemas kini langganan');
        return;
      }

      toast.success(`Pelan ${client.fullName} berjaya dikemas kini kepada ${finalTier.toUpperCase()}`);
      onSuccess({
        userId: client.id,
        tier: finalTier,
        status,
        currentPeriodEnd: formattedEnd,
      });
      onOpenChange(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Ralat berlaku semasa kemas kini';
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!client) return null;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden no-scrollbar">
        <form onSubmit={handleSubmit}>
          {/* Header */}
          <div className="bg-slate-900 text-white p-5 border-b border-slate-800">
            <div className="flex items-center gap-2 text-primary mb-1">
              <ShieldCheck className="h-5 w-5 text-indigo-400" />
              <span className="text-xs font-semibold uppercase tracking-wider text-indigo-300">
                Pengurusan Langganan Pentadbir
              </span>
            </div>
            <DialogHeader>
              <DialogTitle className="text-xl font-bold text-white">
                {client.fullName}
              </DialogTitle>
              <DialogDescription className="text-slate-400 text-xs">
                {client.email} • ID: <span className="font-mono text-slate-300">{client.id.substring(0, 8)}...</span>
              </DialogDescription>
            </DialogHeader>
          </div>

          <div className="p-5 space-y-4 bg-white text-slate-900">
            {/* Pelan Langganan (Tier Selector Cards) */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-bold text-slate-700 uppercase">
                  Pilih Pelan / Tier
                </Label>
                <span className="text-[11px] font-semibold text-indigo-600 uppercase">
                  Semasa: {tier}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2">
                {/* Free Card */}
                <button
                  type="button"
                  onClick={() => {
                    setTier('free');
                    setExpiryDate('');
                  }}
                  className={cn(
                    'p-3 rounded-xl border text-left flex flex-col justify-between transition-all cursor-pointer',
                    tier === 'free'
                      ? 'border-slate-800 bg-slate-900 text-white shadow-sm ring-2 ring-slate-800'
                      : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                  )}
                >
                  <span className="text-xs font-bold uppercase tracking-wider">Free</span>
                  <span className={cn('text-[11px] mt-1', tier === 'free' ? 'text-slate-300' : 'text-slate-500')}>
                    Percuma Asas
                  </span>
                </button>

                {/* Pro Card */}
                <button
                  type="button"
                  onClick={() => {
                    setTier('pro');
                    if (!expiryDate) applyPreset('1month');
                  }}
                  className={cn(
                    'p-3 rounded-xl border text-left flex flex-col justify-between transition-all cursor-pointer',
                    tier === 'pro'
                      ? 'border-sky-600 bg-sky-50 text-sky-950 shadow-sm ring-2 ring-sky-500'
                      : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                  )}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-sky-600">Pro</span>
                    <Sparkles className="h-3.5 w-3.5 text-sky-600" />
                  </div>
                  <span className={cn('text-[11px] mt-1', tier === 'pro' ? 'text-sky-800 font-medium' : 'text-slate-500')}>
                    Pelan Pro
                  </span>
                </button>

                {/* Enterprise Card */}
                <button
                  type="button"
                  onClick={() => {
                    setTier('enterprise');
                    if (!expiryDate) applyPreset('1year');
                  }}
                  className={cn(
                    'p-3 rounded-xl border text-left flex flex-col justify-between transition-all cursor-pointer',
                    tier === 'enterprise'
                      ? 'border-purple-600 bg-purple-50 text-purple-950 shadow-sm ring-2 ring-purple-500'
                      : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                  )}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-purple-600">Enterprise</span>
                    <ShieldCheck className="h-3.5 w-3.5 text-purple-600" />
                  </div>
                  <span className={cn('text-[11px] mt-1', tier === 'enterprise' ? 'text-purple-800 font-medium' : 'text-slate-500')}>
                    Akses VIP
                  </span>
                </button>
              </div>
            </div>

            {/* Status Langganan */}
            <div className="space-y-1.5">
              <Label htmlFor="status-select" className="text-xs font-bold text-slate-700 uppercase">
                Status Langganan
              </Label>
              <Select value={status} onValueChange={(val) => setStatus(val as SubscriptionStatus)}>
                <SelectTrigger id="status-select" className="w-full h-10 border-slate-200">
                  <SelectValue placeholder="Pilih Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active" className="text-emerald-700 font-medium">
                    ✓ Active (Aktif & Dibenarkan Akses Penuh)
                  </SelectItem>
                  <SelectItem value="expired" className="text-rose-700 font-medium">
                    ✕ Expired (Tamat Tempoh)
                  </SelectItem>
                  <SelectItem value="cancelled" className="text-amber-700 font-medium">
                    ⚠ Cancelled (Dibatalkan)
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Tarikh Luput */}
            <div className="space-y-2 pt-1">
              <div className="flex items-center justify-between">
                <Label htmlFor="expiry-input" className="text-xs font-bold text-slate-700 uppercase flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5 text-slate-500" />
                  Tarikh Luput Langganan
                </Label>
                {expiryDate && (
                  <span className="text-[11px] text-slate-500 font-medium">
                    {new Date(expiryDate).toLocaleDateString('ms-MY', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </span>
                )}
              </div>

              <Input
                id="expiry-input"
                type="date"
                value={expiryDate}
                onChange={(e) => {
                  setExpiryDate(e.target.value);
                  if (e.target.value && tier === 'free') {
                    setTier('pro');
                  }
                }}
                className="h-10 border-slate-200"
              />

              {/* Informative notice if Free tier has expiry */}
              {tier === 'free' && !expiryDate && (
                <p className="text-[11px] text-slate-500 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3 text-slate-400 shrink-0" />
                  Pelan Free tiada tarikh tamat. Pilih PRO atau klik pintasan untuk aktifkan had masa.
                </p>
              )}

              {/* Quick Presets */}
              <div className="pt-1">
                <p className="text-[11px] text-slate-500 mb-1.5 font-medium">Pintasan Pantas (Auto-Upgrade ke PRO):</p>
                <div className="grid grid-cols-3 gap-1.5">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="text-xs h-8 text-slate-700 border-slate-200 hover:bg-sky-50 hover:text-sky-700 hover:border-sky-300 transition-colors"
                    onClick={() => applyPreset('1month')}
                  >
                    + 1 Bulan
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="text-xs h-8 text-slate-700 border-slate-200 hover:bg-sky-50 hover:text-sky-700 hover:border-sky-300 transition-colors"
                    onClick={() => applyPreset('1year')}
                  >
                    + 1 Tahun
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="text-xs h-8 font-semibold text-purple-700 border-purple-200 hover:bg-purple-50 transition-colors"
                    onClick={() => applyPreset('lifetime')}
                  >
                    <Sparkles className="h-3 w-3 mr-1 text-purple-600" />
                    Lifetime
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <DialogFooter className="bg-slate-50 border-t border-slate-200 p-4 flex sm:justify-between items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="text-slate-600 hover:text-slate-900"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Batal
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={isSubmitting}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium shadow-sm px-4"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                  Menyimpan...
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4 mr-1.5" />
                  Simpan Perubahan
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
