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
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { AdminClientItem, updateClientSubscriptionAction } from '@/actions/admin';
import { SubscriptionTier, SubscriptionStatus } from '@/lib/types/subscription';
import {
  Loader2,
  Calendar,
  ShieldCheck,
  Sparkles,
  CheckCircle2,
  Clock,
  CalendarPlus,
  RotateCcw,
  User,
  Info,
} from 'lucide-react';
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
      // Default to pro if client was previously enterprise or pro, else free
      const safeTier: SubscriptionTier = client.tier === 'enterprise' ? 'pro' : (client.tier || 'free');
      setTier(safeTier);
      setStatus(client.status || 'active');
      if (client.currentPeriodEnd) {
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
      if (tier === 'free') setTier('pro');
    } else if (preset === '1year') {
      now.setFullYear(now.getFullYear() + 1);
      setExpiryDate(now.toISOString().split('T')[0]);
      setStatus('active');
      if (tier === 'free') setTier('pro');
    } else if (preset === 'lifetime') {
      setExpiryDate('2099-12-31');
      setStatus('active');
      if (tier === 'free') setTier('pro');
    } else if (preset === 'clear') {
      setExpiryDate('');
    }
  };

  const getExpiryBadge = () => {
    if (!expiryDate) return null;
    if (expiryDate.startsWith('2099')) {
      return {
        label: 'Lifetime',
        className: 'bg-violet-100 text-violet-900 border-violet-200',
      };
    }
    const exp = new Date(`${expiryDate}T23:59:59`);
    const now = new Date();
    const diffDays = Math.ceil((exp.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    const formatted = exp.toLocaleDateString('en-US', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });

    if (diffDays < 0) {
      return {
        label: `${formatted} (Expired)`,
        className: 'bg-rose-100 text-rose-700 border-rose-200',
      };
    }
    if (diffDays === 0) {
      return {
        label: `${formatted} (Expires Today)`,
        className: 'bg-amber-100 text-amber-700 border-amber-200',
      };
    }
    return {
      label: `${formatted} (${diffDays} days left)`,
      className: 'bg-slate-100 text-slate-700 border-slate-200',
    };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!client) return;

    let finalTier = tier;
    if (tier === 'free' && expiryDate) {
      finalTier = 'pro';
      setTier('pro');
      toast.info('Plan automatically upgraded to PRO because an expiration date was set.');
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
        toast.error(res.error || 'Failed to update subscription');
        return;
      }

      toast.success(`Plan for ${client.fullName} successfully updated to ${finalTier.toUpperCase()}`);
      onSuccess({
        userId: client.id,
        tier: finalTier,
        status,
        currentPeriodEnd: formattedEnd,
      });
      onOpenChange(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'An error occurred while updating';
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!client) return null;

  const expiryBadge = getExpiryBadge();

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[490px] p-0 overflow-hidden no-scrollbar rounded-lg border border-slate-200 bg-white shadow-lg">
        <form onSubmit={handleSubmit} className="flex flex-col">
          {/* Header */}
          <div className="bg-slate-900 text-white p-5 sm:p-6 border-b border-slate-800 relative">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded bg-violet-900/60 border border-violet-700/60 text-violet-100 text-[10px] font-bold uppercase tracking-wider mb-3">
              <ShieldCheck className="h-3.5 w-3.5 text-violet-300" />
              <span>Admin Subscription Management</span>
            </div>

            <div className="flex items-center gap-3.5">
              <Avatar className="h-11 w-11 border border-white/15 bg-slate-800 text-white font-bold text-sm shrink-0">
                <AvatarImage src={client.avatarUrl} alt={client.fullName} />
                <AvatarFallback className="bg-violet-900 text-white font-bold text-sm">
                  {client.fullName ? client.fullName.charAt(0).toUpperCase() : 'U'}
                </AvatarFallback>
              </Avatar>

              <div className="min-w-0 flex-1">
                <DialogHeader>
                  <DialogTitle className="text-lg sm:text-xl font-bold text-white tracking-tight leading-snug truncate">
                    {client.fullName || 'Client Name'}
                  </DialogTitle>
                  <DialogDescription className="text-slate-400 text-xs flex items-center gap-2 mt-0.5 truncate">
                    <span className="truncate">{client.email}</span>
                    <span className="text-slate-600 shrink-0">•</span>
                    <span className="font-mono text-[10px] bg-slate-800/90 text-slate-300 px-1.5 py-0.5 rounded border border-slate-700/60 shrink-0">
                      ID: {client.id.substring(0, 8)}...
                    </span>
                  </DialogDescription>
                </DialogHeader>
              </div>
            </div>
          </div>

          {/* Form Body */}
          <div className="p-5 sm:p-6 space-y-4 bg-white text-slate-900">
            {/* Subscription Tier (FREE vs PRO) */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                  Select Plan / Tier
                </Label>
                <span className="text-[11px] font-semibold text-slate-500 uppercase">
                  Current:{' '}
                  <span className={cn('font-bold', client.tier === 'pro' ? 'text-violet-900' : 'text-slate-700')}>
                    {client.tier || 'FREE'}
                  </span>
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {/* Free Card */}
                <button
                  type="button"
                  onClick={() => {
                    setTier('free');
                    setExpiryDate('');
                  }}
                  className={cn(
                    'p-3.5 rounded-lg border text-left flex flex-col justify-between transition-colors cursor-pointer relative group',
                    tier === 'free'
                      ? 'border-slate-900 bg-slate-900 text-white shadow-xs ring-1 ring-slate-900/20'
                      : 'border-slate-200 bg-slate-50/70 hover:bg-slate-100 text-slate-800 hover:border-slate-300'
                  )}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-1.5">
                      <User className={cn('h-4 w-4', tier === 'free' ? 'text-slate-300' : 'text-slate-500')} />
                      <span className="text-sm font-bold tracking-wider uppercase">Free</span>
                    </div>
                    {tier === 'free' ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                    ) : (
                      <div className="h-4 w-4 rounded-full border border-slate-300 group-hover:border-slate-400 shrink-0" />
                    )}
                  </div>
                  <div>
                    <p className={cn('text-xs font-semibold', tier === 'free' ? 'text-slate-200' : 'text-slate-700')}>
                      Basic Free
                    </p>
                    <p className={cn('text-[11px] mt-0.5', tier === 'free' ? 'text-slate-400' : 'text-slate-500')}>
                      Limited forms • No expiration
                    </p>
                  </div>
                </button>

                {/* Pro Card */}
                <button
                  type="button"
                  onClick={() => {
                    setTier('pro');
                    if (!expiryDate) applyPreset('1month');
                  }}
                  className={cn(
                    'p-3.5 rounded-lg border text-left flex flex-col justify-between transition-colors cursor-pointer relative group',
                    tier === 'pro'
                      ? 'border-violet-900 bg-violet-50/80 text-violet-950 shadow-xs ring-1 ring-violet-900/20'
                      : 'border-slate-200 bg-white hover:bg-violet-50/30 text-slate-800 hover:border-violet-200'
                  )}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-1.5">
                      <Sparkles className={cn('h-4 w-4', tier === 'pro' ? 'text-violet-900' : 'text-slate-500')} />
                      <span className="text-sm font-bold tracking-wider uppercase text-violet-900">Pro</span>
                    </div>
                    {tier === 'pro' ? (
                      <CheckCircle2 className="h-4 w-4 text-violet-900 shrink-0" />
                    ) : (
                      <span className="text-[10px] font-bold bg-violet-50 text-violet-900 px-1.5 py-0.5 rounded border border-violet-200/80">
                        Full Access
                      </span>
                    )}
                  </div>
                  <div>
                    <p className={cn('text-xs font-semibold', tier === 'pro' ? 'text-violet-950 font-bold' : 'text-slate-700')}>
                      Pro Plan (Full Access)
                    </p>
                    <p className={cn('text-[11px] mt-0.5', tier === 'pro' ? 'text-violet-900/80 font-medium' : 'text-slate-500')}>
                      Unlimited forms • e-Certificates &amp; Sheets
                    </p>
                  </div>
                </button>
              </div>
            </div>

            {/* Subscription Status */}
            <div className="space-y-1.5 pt-1">
              <Label htmlFor="status-select" className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                Account &amp; Access Status
              </Label>
              <Select value={status} onValueChange={(val) => setStatus(val as SubscriptionStatus)}>
                <SelectTrigger id="status-select" className="w-full h-10 border-slate-200 rounded-md bg-white focus:ring-violet-900">
                  <SelectValue placeholder="Select Status" />
                </SelectTrigger>
                <SelectContent className="rounded-md">
                  <SelectItem value="active" className="text-emerald-700 font-medium">
                    <div className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-emerald-500 shrink-0" />
                      <span>Active (Full Access Allowed)</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="expired" className="text-rose-700 font-medium">
                    <div className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-rose-500 shrink-0" />
                      <span>Expired (Access Blocked)</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="cancelled" className="text-amber-700 font-medium">
                    <div className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-amber-500 shrink-0" />
                      <span>Cancelled</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Expiry Date */}
            <div className="space-y-2 pt-1 border-t border-slate-100">
              <div className="flex items-center justify-between pt-1">
                <Label htmlFor="expiry-input" className="text-xs font-bold text-slate-700 uppercase tracking-wide flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5 text-slate-500" />
                  Subscription Expiration Date
                </Label>
                {expiryBadge && (
                  <span className={cn('text-[11px] px-2 py-0.5 rounded border font-medium', expiryBadge.className)}>
                    {expiryBadge.label}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
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
                  className="h-10 border-slate-200 rounded-md flex-1 bg-white focus:ring-violet-900"
                />
                {expiryDate && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => applyPreset('clear')}
                    className="h-10 px-2.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 text-xs rounded-md shrink-0"
                    title="Clear Date"
                  >
                    <RotateCcw className="h-3.5 w-3.5 mr-1" />
                    Reset
                  </Button>
                )}
              </div>

              {/* Informative notice if Free tier has no expiry */}
              {tier === 'free' && !expiryDate && (
                <div className="flex items-start gap-1.5 p-2.5 rounded-md bg-slate-50 border border-slate-200 text-slate-600 text-[11px] leading-relaxed">
                  <Info className="h-3.5 w-3.5 text-slate-400 shrink-0 mt-0.5" />
                  <span>Free plan has no expiration. Select <strong>PRO</strong> or click any shortcut below to set an active duration.</span>
                </div>
              )}

              {/* Quick Presets */}
              <div className="pt-1">
                <p className="text-[11px] text-slate-500 mb-1.5 font-medium flex items-center justify-between">
                  <span>Quick Presets (Auto-Upgrade to PRO):</span>
                </p>
                <div className="grid grid-cols-3 gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="text-xs h-8.5 rounded-md text-slate-700 border-slate-200 hover:bg-violet-50 hover:text-violet-900 hover:border-violet-200 font-medium transition-colors cursor-pointer"
                    onClick={() => applyPreset('1month')}
                  >
                    <CalendarPlus className="h-3 w-3 mr-1 text-violet-900" />
                    + 1 Month
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="text-xs h-8.5 rounded-md text-slate-700 border-slate-200 hover:bg-violet-50 hover:text-violet-900 hover:border-violet-200 font-medium transition-colors cursor-pointer"
                    onClick={() => applyPreset('1year')}
                  >
                    <Clock className="h-3 w-3 mr-1 text-violet-900" />
                    + 1 Year
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="text-xs h-8.5 rounded-md font-bold text-violet-900 bg-violet-50/70 border-violet-200 hover:bg-violet-100 hover:border-violet-300 transition-colors cursor-pointer"
                    onClick={() => applyPreset('lifetime')}
                  >
                    <Sparkles className="h-3 w-3 mr-1 text-violet-900 fill-violet-200" />
                    Lifetime
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <DialogFooter className="bg-slate-50 border-t border-slate-200 p-4 sm:px-6 flex sm:justify-between items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="text-slate-600 hover:text-slate-900 rounded-md"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={isSubmitting}
              className="bg-violet-900 hover:bg-violet-950 text-white font-semibold shadow-xs rounded-md px-5 h-9.5 cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4 mr-1.5" />
                  Save Changes
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
