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

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Pencil className="h-5 w-5 text-primary" />
            <div>
              <CardTitle>Pautan Sunting Jawapan</CardTitle>
              <CardDescription>
                Hantar pautan ajaib kepada respondent supaya mereka boleh sunting
                jawapan dalam tempoh tertentu.
              </CardDescription>
            </div>
          </div>
          <Switch
            checked={cfg.enabled}
            onCheckedChange={(checked) => update({ enabled: checked })}
            aria-label="Toggle edit link"
          />
        </div>
      </CardHeader>
      {cfg.enabled && (
        <CardContent className="space-y-4">
          {emailFields.length === 0 ? (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-md text-sm text-amber-800">
              ⚠️ Tambah satu field jenis <strong>Email</strong> dalam borang anda
              dahulu. Pautan sunting akan dihantar ke email tersebut.
            </div>
          ) : (
            <div className="space-y-2">
              <Label htmlFor="edit-email-field" className="text-sm">
                Field email respondent
              </Label>
              <Select
                value={cfg.emailFieldId ?? ''}
                onValueChange={(val) => update({ emailFieldId: val || undefined })}
              >
                <SelectTrigger id="edit-email-field" className="w-full">
                  <SelectValue placeholder="Pilih field email..." />
                </SelectTrigger>
                <SelectContent>
                  {emailFields.map((f) => (
                    <SelectItem key={f.id} value={f.id}>
                      {f.label || '(Tanpa Tajuk)'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Pautan sunting akan dihantar ke nilai field ini selepas setiap
                submission.
              </p>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="edit-expiry" className="text-sm">
              Tempoh sah pautan (hari)
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
              Pautan luput automatik selepas tempoh ini. Setiap pautan hanya boleh
              digunakan sekali.
            </p>
          </div>
        </CardContent>
      )}
    </Card>
  );
}
