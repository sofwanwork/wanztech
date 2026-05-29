'use client';

import { useEffect, useState, useTransition } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Webhook,
  Plus,
  Trash2,
  Send,
  CheckCircle2,
  XCircle,
  Loader2,
  EyeOff,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  listWebhooksAction,
  createWebhookAction,
  updateWebhookAction,
  deleteWebhookAction,
  testWebhookAction,
} from '@/actions/webhooks';
import type { FormWebhook } from '@/lib/types/webhooks';

interface WebhooksCardProps {
  formId: string;
}

function genSecret() {
  // 32 hex chars — sufficient entropy, ergonomic to paste into receiver code.
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    const arr = new Uint8Array(16);
    crypto.getRandomValues(arr);
    return Array.from(arr, (b) => b.toString(16).padStart(2, '0')).join('');
  }
  return Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2);
}

export function WebhooksCard({ formId }: WebhooksCardProps) {
  const [webhooks, setWebhooks] = useState<FormWebhook[]>([]);
  const [loading, setLoading] = useState(true);
  const [pending, startTransition] = useTransition();

  const [showAdd, setShowAdd] = useState(false);
  const [newUrl, setNewUrl] = useState('');
  const [newSecret, setNewSecret] = useState('');
  const [revealedSecrets, setRevealedSecrets] = useState<Record<string, string>>({});
  const [testingId, setTestingId] = useState<string | null>(null);

  useEffect(() => {
    listWebhooksAction(formId)
      .then((rows) => setWebhooks(rows))
      .finally(() => setLoading(false));
  }, [formId]);

  const refresh = async () => {
    const rows = await listWebhooksAction(formId);
    setWebhooks(rows);
  };

  const handleAdd = () => {
    if (!newUrl.trim() || !newSecret.trim()) {
      toast.error('URL dan secret diperlukan');
      return;
    }
    startTransition(async () => {
      const res = await createWebhookAction({
        formId,
        url: newUrl.trim(),
        secret: newSecret.trim(),
        events: ['submission'],
        enabled: true,
      });
      if (res.success) {
        toast.success('Webhook ditambah');
        setNewUrl('');
        setNewSecret('');
        setShowAdd(false);
        await refresh();
      } else {
        toast.error(res.error);
      }
    });
  };

  const handleToggleEnabled = (hook: FormWebhook, enabled: boolean) => {
    startTransition(async () => {
      const res = await updateWebhookAction({ id: hook.id, enabled });
      if (res.success) {
        setWebhooks((prev) =>
          prev.map((w) => (w.id === hook.id ? { ...w, enabled } : w))
        );
      } else {
        toast.error(res.error);
      }
    });
  };

  const handleDelete = (hook: FormWebhook) => {
    if (!confirm('Padam webhook ini?')) return;
    startTransition(async () => {
      const res = await deleteWebhookAction(hook.id);
      if (res.success) {
        toast.success('Webhook dipadam');
        setWebhooks((prev) => prev.filter((w) => w.id !== hook.id));
      } else {
        toast.error(res.error ?? 'Gagal');
      }
    });
  };

  const handleTest = async (hook: FormWebhook) => {
    setTestingId(hook.id);
    try {
      const res = await testWebhookAction({ formId, webhookId: hook.id });
      if (res.ok) {
        toast.success(`Test berjaya — HTTP ${res.status}`);
      } else {
        toast.error(`Test gagal: ${res.error ?? `HTTP ${res.status ?? '?'}`}`);
      }
      await refresh();
    } finally {
      setTestingId(null);
    }
  };

  const handleRotateSecret = (hook: FormWebhook) => {
    const fresh = genSecret();
    if (
      !confirm(
        'Tukar secret webhook? Anda perlu kemas kini secret di sistem penerima selepas ini.'
      )
    )
      return;
    startTransition(async () => {
      const res = await updateWebhookAction({ id: hook.id, secret: fresh });
      if (res.success) {
        toast.success('Secret ditukar');
        setRevealedSecrets((prev) => ({ ...prev, [hook.id]: fresh }));
      } else {
        toast.error(res.error);
      }
    });
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Webhook className="h-5 w-5 text-primary" />
            <div>
              <CardTitle>Outgoing Webhooks</CardTitle>
              <CardDescription>
                POST data submission ke URL anda dengan signature HMAC-SHA256.
              </CardDescription>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setShowAdd((v) => !v);
              if (!showAdd) setNewSecret(genSecret());
            }}
          >
            <Plus className="h-4 w-4 mr-1" />
            Tambah
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading ? (
          <div className="text-sm text-muted-foreground">Memuatkan…</div>
        ) : (
          <>
            {webhooks.length === 0 && !showAdd && (
              <div className="text-sm text-muted-foreground p-4 bg-slate-50 rounded-md border border-dashed">
                Belum ada webhook. Tambah satu untuk auto-hantar setiap response baru ke
                Zapier, Make, n8n, atau API anda sendiri.
              </div>
            )}

            {webhooks.map((hook) => {
              const revealed = revealedSecrets[hook.id];
              return (
                <div
                  key={hook.id}
                  className="p-4 border rounded-lg space-y-3 bg-white"
                >
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm break-all">{hook.url}</div>
                      <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                        <span>Events: {hook.events.join(', ')}</span>
                        {hook.lastFiredAt && (
                          <>
                            <span>·</span>
                            {hook.lastStatus && hook.lastStatus >= 200 && hook.lastStatus < 300 ? (
                              <span className="inline-flex items-center gap-1 text-green-600">
                                <CheckCircle2 className="h-3 w-3" />
                                {hook.lastStatus}
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-red-600">
                                <XCircle className="h-3 w-3" />
                                {hook.lastStatus ?? 'err'}
                              </span>
                            )}
                            <span>·</span>
                            <span>
                              {new Date(hook.lastFiredAt).toLocaleString('ms-MY')}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={hook.enabled}
                        onCheckedChange={(checked) => handleToggleEnabled(hook, checked)}
                        disabled={pending}
                        aria-label="Toggle webhook"
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        disabled={testingId === hook.id || !hook.enabled}
                        onClick={() => handleTest(hook)}
                        aria-label="Hantar test event"
                      >
                        {testingId === hook.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Send className="h-4 w-4" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:bg-destructive/10"
                        onClick={() => handleDelete(hook)}
                        aria-label="Padam webhook"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-muted-foreground">Secret:</span>
                    <code className="flex-1 px-2 py-1 bg-slate-100 rounded font-mono break-all">
                      {revealed ?? '••••••••••••••••'}
                    </code>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 text-xs"
                      onClick={() => handleRotateSecret(hook)}
                      disabled={pending}
                    >
                      Rotate
                    </Button>
                    {revealed && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() =>
                          setRevealedSecrets((prev) => {
                            const next = { ...prev };
                            delete next[hook.id];
                            return next;
                          })
                        }
                        aria-label="Sembunyikan"
                      >
                        <EyeOff className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}

            {showAdd && (
              <div className="p-4 border rounded-lg space-y-3 bg-slate-50">
                <div className="space-y-2">
                  <Label htmlFor="webhook-url" className="text-sm">
                    URL Webhook
                  </Label>
                  <Input
                    id="webhook-url"
                    type="url"
                    placeholder="https://hooks.example.com/abc123"
                    value={newUrl}
                    onChange={(e) => setNewUrl(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="webhook-secret" className="text-sm">
                    Secret
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      id="webhook-secret"
                      type="text"
                      placeholder="Auto-jana atau taip sendiri"
                      value={newSecret}
                      onChange={(e) => setNewSecret(e.target.value)}
                      className="font-mono text-xs"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setNewSecret(genSecret())}
                    >
                      Jana
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Akan dihantar dalam header{' '}
                    <code className="font-mono">x-klikform-signature</code> sebagai
                    HMAC-SHA256(body, secret).
                  </p>
                </div>
                <div className="flex justify-end gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowAdd(false)}
                    disabled={pending}
                  >
                    Batal
                  </Button>
                  <Button size="sm" onClick={handleAdd} disabled={pending}>
                    {pending ? (
                      <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                    ) : (
                      <Plus className="h-4 w-4 mr-1" />
                    )}
                    Tambah Webhook
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
