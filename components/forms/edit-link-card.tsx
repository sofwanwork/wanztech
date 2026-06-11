'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Pencil } from 'lucide-react';
import type { Form, EditLinkSettings, FormField } from '@/lib/types';

interface EditLinkCardProps {
  form: Form;
  onChange: (next: EditLinkSettings | undefined) => void;
}

export function EditLinkCard({ form, onChange }: EditLinkCardProps) {
  const cfg: EditLinkSettings = form.editLinkSettings ?? {
    enabled: false,
    expiryDays: 7,
  };
  const emailFields: FormField[] = form.fields.filter((f) => f.type === 'email');

  const update = (patch: Partial<EditLinkSettings>) => {
    onChange({ ...cfg, ...patch });
  };

  const handleToggle = (checked: boolean) => {
    // Auto-select the first email field when enabling, so the magic link has a
    // destination even if the owner doesn't open the dropdown.
    if (checked && !cfg.emailFieldId && emailFields.length > 0) {
      update({ enabled: true, emailFieldId: emailFields[0].id });
    } else {
      update({ enabled: checked });
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Pencil className="h-5 w-5 text-primary" />
            <div>
              <CardTitle>Response Edit Link</CardTitle>
              <CardDescription>
                Send respondents a magic link so they can edit their answers
                within a set period.
              </CardDescription>
            </div>
          </div>
          <Switch
            checked={cfg.enabled}
            onCheckedChange={handleToggle}
            aria-label="Toggle edit link"
          />
        </div>
      </CardHeader>
      {cfg.enabled && (
        <CardContent className="space-y-4">
          {emailFields.length === 0 ? (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-md text-sm text-amber-800">
              ⚠️ Add an <strong>Email</strong> field to your form first. The edit
              link will be sent to that email.
            </div>
          ) : (
            <div className="space-y-2">
              <Label htmlFor="edit-email-field" className="text-sm">
                Respondent&apos;s email field
              </Label>
              <Select
                value={cfg.emailFieldId ?? ''}
                onValueChange={(val) => update({ emailFieldId: val || undefined })}
              >
                <SelectTrigger id="edit-email-field" className="w-full">
                  <SelectValue placeholder="Select email field..." />
                </SelectTrigger>
                <SelectContent>
                  {emailFields.map((f) => (
                    <SelectItem key={f.id} value={f.id}>
                      {f.label || '(Untitled)'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                The edit link will be sent to this field&apos;s value after every
                submission.
              </p>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="edit-expiry" className="text-sm">
              Link validity (days)
            </Label>
            <Input
              id="edit-expiry"
              type="number"
              min={1}
              max={365}
              value={cfg.expiryDays}
              onChange={(e) =>
                update({
                  expiryDays: Math.max(1, Math.min(365, Number(e.target.value) || 7)),
                })
              }
              className="w-32"
            />
            <p className="text-xs text-muted-foreground">
              The link expires automatically after this period. Each link can only
              be used once.
            </p>
          </div>
        </CardContent>
      )}
    </Card>
  );
}
