'use client';

import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Layers } from 'lucide-react';
import type {
  Form,
  FormField,
  CertificateCategoryConfig,
  CertificateTemplate,
} from '@/lib/types';

interface CertificateCategorySectionProps {
  form: Form;
  userCertificates: CertificateTemplate[];
  onChange: (next: CertificateCategoryConfig | undefined) => void;
}

const DEFAULT_OPTION = '__default__';

export function CertificateCategorySection({
  form,
  userCertificates,
  onChange,
}: CertificateCategorySectionProps) {
  const selectFields: FormField[] = form.fields.filter((f) => f.type === 'select');
  const cfg = form.eCertificateCategory;
  const enabled = !!cfg?.fieldId;
  const selectedField = selectFields.find((f) => f.id === cfg?.fieldId);

  const toggle = (on: boolean) => {
    if (on) {
      const first = selectFields[0];
      onChange(first ? { fieldId: first.id, map: {} } : undefined);
    } else {
      onChange(undefined);
    }
  };

  const setField = (fieldId: string) => {
    onChange({ fieldId, map: {} }); // reset mapping when the field changes
  };

  const setOptionTemplate = (option: string, templateId: string) => {
    if (!cfg) return;
    const map = { ...cfg.map };
    if (templateId === DEFAULT_OPTION) {
      delete map[option];
    } else {
      map[option] = templateId;
    }
    onChange({ ...cfg, map });
  };

  return (
    <div className="rounded-lg border border-gray-200 p-4 space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Layers className="h-5 w-5 text-primary" />
          <div>
            <p className="text-sm font-medium">Certificate by Category</p>
            <p className="text-xs text-muted-foreground">
              Give a different certificate based on a dropdown answer (e.g.
              Urusetia / Penganjur / Peserta).
            </p>
          </div>
        </div>
        <Switch
          checked={enabled}
          onCheckedChange={toggle}
          aria-label="Toggle certificate by category"
          disabled={selectFields.length === 0}
        />
      </div>

      {selectFields.length === 0 && (
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-md text-xs text-amber-800">
          ⚠️ Add a <strong>Dropdown</strong> field to your form first (e.g. a
          &quot;Category&quot; field). Its options will be mapped to certificates here.
        </div>
      )}

      {enabled && selectedField && (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label className="text-sm">Category field</Label>
            <Select value={cfg?.fieldId ?? ''} onValueChange={setField}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Pick a dropdown field..." />
              </SelectTrigger>
              <SelectContent>
                {selectFields.map((f) => (
                  <SelectItem key={f.id} value={f.id}>
                    {f.label || '(Untitled)'}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-sm">Template per option</Label>
            {(selectedField.options ?? []).length === 0 ? (
              <p className="text-xs text-muted-foreground">
                This dropdown has no options yet. Add options to the field first.
              </p>
            ) : (
              <div className="space-y-2">
                {(selectedField.options ?? []).map((opt) => (
                  <div key={opt} className="flex items-center gap-2">
                    <span className="w-1/3 truncate text-sm text-gray-700" title={opt}>
                      {opt}
                    </span>
                    <Select
                      value={cfg?.map?.[opt] ?? DEFAULT_OPTION}
                      onValueChange={(val) => setOptionTemplate(opt, val)}
                    >
                      <SelectTrigger className="flex-1">
                        <SelectValue placeholder="Use default template" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={DEFAULT_OPTION}>
                          Use default template
                        </SelectItem>
                        {userCertificates.map((cert) => (
                          <SelectItem key={cert.id} value={cert.id}>
                            {cert.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ))}
              </div>
            )}
            <p className="text-xs text-muted-foreground">
              Options left as &quot;Use default template&quot; fall back to the
              certificate selected above.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
