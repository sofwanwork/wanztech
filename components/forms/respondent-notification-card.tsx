'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { MailCheck } from 'lucide-react';
import type { Form, RespondentNotificationSettings, FormField } from '@/lib/types';

interface RespondentNotificationCardProps {
  form: Form;
  onChange: (next: RespondentNotificationSettings | undefined) => void;
}

export function RespondentNotificationCard({
  form,
  onChange,
}: RespondentNotificationCardProps) {
  const cfg: RespondentNotificationSettings = form.respondentNotification ?? {
    enabled: false,
    includeSummary: true,
  };
  const emailFields: FormField[] = form.fields.filter((f) => f.type === 'email');

  const update = (patch: Partial<RespondentNotificationSettings>) => {
    onChange({ ...cfg, ...patch });
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <MailCheck className="h-5 w-5 text-primary" />
            <div>
              <CardTitle>Respondent Confirmation Email</CardTitle>
              <CardDescription>
                Send respondents an automatic confirmation email after they
                submit the form.
              </CardDescription>
            </div>
          </div>
          <Switch
            checked={cfg.enabled}
            onCheckedChange={(checked) => update({ enabled: checked })}
            aria-label="Toggle respondent confirmation email"
          />
        </div>
      </CardHeader>
      {cfg.enabled && (
        <CardContent className="space-y-4">
          {emailFields.length === 0 ? (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-md text-sm text-amber-800">
              ⚠️ Add an <strong>Email</strong> field to your form first. The
              confirmation email will be sent to that email.
            </div>
          ) : (
            <div className="space-y-2">
              <Label htmlFor="resp-email-field" className="text-sm">
                Respondent&apos;s email field
              </Label>
              <Select
                value={cfg.emailFieldId ?? ''}
                onValueChange={(val) => update({ emailFieldId: val || undefined })}
              >
                <SelectTrigger id="resp-email-field" className="w-full">
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
                The confirmation email will be sent to this field&apos;s value
                after every submission.
              </p>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="resp-message" className="text-sm">
              Custom message (optional)
            </Label>
            <Textarea
              id="resp-message"
              rows={3}
              maxLength={1000}
              placeholder="e.g. Thanks for registering! We will be in touch soon."
              value={cfg.message ?? ''}
              onChange={(e) => update({ message: e.target.value })}
            />
            <p className="text-xs text-muted-foreground">
              Leave empty to use the default confirmation message.
            </p>
          </div>

          <div className="flex items-center justify-between gap-3 rounded-md border p-3">
            <div>
              <Label htmlFor="resp-summary" className="text-sm">
                Include answer summary
              </Label>
              <p className="text-xs text-muted-foreground">
                Show a table of the respondent&apos;s answers in the confirmation
                email.
              </p>
            </div>
            <Switch
              id="resp-summary"
              checked={cfg.includeSummary ?? false}
              onCheckedChange={(checked) => update({ includeSummary: checked })}
              aria-label="Toggle answer summary in email"
            />
          </div>
        </CardContent>
      )}
    </Card>
  );
}
