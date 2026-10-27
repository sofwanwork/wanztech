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
import { Loader2, Calendar, ShieldCheck, Sparkles, CheckCircle2 } from 'lucide-react';
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
    } else if (preset === '1year') {
      now.setFullYear(now.getFullYear() + 1);
      setExpiryDate(now.toISOString().split('T')[0]);
      setStatus('active');
    } else if (preset === 'lifetime') {
      setExpiryDate('2099-12-31');
      setStatus('active');
    } else if (preset === 'clear') {
      setExpiryDate('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!client) return;

    setIsSubmitting(true);
    try {
      const formattedEnd = expiryDate ? new Date(`${expiryDate}T23:59:59.000Z`).toISOString() : null;

      const res = await updateClientSubscriptionAction({
        userId: client.id,
        tier,
        status,
        currentPeriodEnd: formattedEnd,
      });

      if (!res.success) {
        toast.error(res.error || 'Gagal mengemas kini langganan');
        return;
      }

      toast.success(`Pelan ${client.fullName} berjaya dikemas kini kepada ${tier.toUpperCase()}`);
      onSuccess({
        userId: client.id,
        tier,
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
      <DialogContent className="sm:max-w-[480px] p-0 overflow-hidden no-scrollbar">
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
            {/* Pelan Langganan (Tier) */}
            <div className="space-y-1.5">
              <Label htmlFor="tier-select" className="text-xs font-bold text-slate-700 uppercase">
                Pilih Pelan / Tier
              </Label>
              <Select value={tier} onValueChange={(val) => setTier(val as SubscriptionTier)}>
                <SelectTrigger id="tier-select" className="w-full h-10 border-slate-200">
                  <SelectValue placeholder="Pilih Pelan" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="free" className="font-medium">
                    <span className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-slate-400" />
                      Free (Pelan Percuma Standard)
                    </span>
                  </SelectItem>
                  <SelectItem value="pro" className="font-medium text-sky-600">
                    <span className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-sky-500" />
                      Pro (Pelan Profesional)
                    </span>
                  </SelectItem>
                  <SelectItem value="enterprise" className="font-medium text-purple-600">
                    <span className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-purple-500" />
                      Enterprise (Akses Penuh / VVIP)
                    </span>
                  </SelectItem>
                </SelectContent>
              </Select>
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
                  <span className="text-[11px] text-slate-500">
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
                onChange={(e) => setExpiryDate(e.target.value)}
                className="h-10 border-slate-200"
              />

              {/* Quick Presets */}
              <div className="pt-1">
                <p className="text-[11px] text-slate-500 mb-1.5 font-medium">Pintasan Pantas:</p>
                <div className="grid grid-cols-3 gap-1.5">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="text-xs h-8 text-slate-700 border-slate-200 hover:bg-slate-100"
                    onClick={() => applyPreset('1month')}
                  >
                    + 1 Bulan
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="text-xs h-8 text-slate-700 border-slate-200 hover:bg-slate-100"
                    onClick={() => applyPreset('1year')}
                  >
                    + 1 Tahun
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="text-xs h-8 font-semibold text-purple-700 border-purple-200 hover:bg-purple-50"
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
