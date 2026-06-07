'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ShieldCheck } from 'lucide-react';
import type { Form, PdpaSettings } from '@/lib/types';

interface PdpaCardProps {
  form: Form;
  onChange: (next: PdpaSettings | undefined) => void;
}

const DEFAULT_CONSENT =
  'I consent to my personal data being processed in accordance with the Personal Data Protection Act (PDPA) 2010.';

export function PdpaCard({ form, onChange }: PdpaCardProps) {
  const cfg: PdpaSettings = form.pdpaSettings ?? { enabled: false };

  const update = (patch: Partial<PdpaSettings>) => {
    onChange({ ...cfg, ...patch });
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-primary" />
            <div>
              <CardTitle>PDPA Consent</CardTitle>
              <CardDescription>
                Require respondents to agree to personal data processing (PDPA
                2010) before submitting the form.
              </CardDescription>
            </div>
          </div>
          <Switch
            checked={cfg.enabled}
            onCheckedChange={(checked) => update({ enabled: checked })}
            aria-label="Toggle PDPA consent"
          />
        </div>
      </CardHeader>
      {cfg.enabled && (
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="pdpa-text" className="text-sm">
              Consent text
            </Label>
            <Textarea
              id="pdpa-text"
              rows={3}
              maxLength={1000}
              placeholder={DEFAULT_CONSENT}
              value={cfg.consentText ?? ''}
              onChange={(e) => update({ consentText: e.target.value })}
            />
            <p className="text-xs text-muted-foreground">
              Leave empty to use the default PDPA text.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="pdpa-policy" className="text-sm">
              Privacy policy link (optional)
            </Label>
            <Input
              id="pdpa-policy"
              type="url"
              placeholder="https://example.com/privacy-policy"
              value={cfg.policyUrl ?? ''}
              onChange={(e) => update({ policyUrl: e.target.value || undefined })}
            />
            <p className="text-xs text-muted-foreground">
              If set, a &quot;Privacy Policy&quot; link is shown next to the
              consent checkbox.
            </p>
          </div>
        </CardContent>
      )}
    </Card>
  );
}
