'use client';

import { useState, useEffect } from 'react';
import { FormField, ConditionOperator, ConditionRule } from '@/lib/types';
import {
  CONDITION_OPERATORS,
  normalizeConditional,
  operatorNeedsValue,
} from '@/lib/forms/conditions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Trash2, GripVertical, Plus, Copy } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface SortableFieldProps {
  field: FormField;
  index: number;
  allFields: FormField[];
  updateField: (index: number, updates: Partial<FormField>) => void;
  removeField: (index: number) => void;
  duplicateField: (index: number) => void;
}

function SortableField({
  field,
  index,
  allFields,
  updateField,
  removeField,
  duplicateField,
}: SortableFieldProps) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
    id: field.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  // Source fields available as the LHS of a condition. Allow most input types
  // — radio/checkbox/select still work best with `equals`, but text/number/etc.
  // pair well with `contains`/`gt`/`lt`. Excludes layout-only types and self.
  const availableConditionFields = allFields.filter(
    (f) =>
      f.id !== field.id &&
      f.type !== 'separator' &&
      f.type !== 'image' &&
      f.type !== 'file' &&
      f.type !== 'pagebreak' &&
      f.type !== 'product'
  );

  const isValidationActive = !!(
    field.validation?.minLength ||
    field.validation?.maxLength ||
    field.validation?.pattern
  );

  const norm = normalizeConditional(field.conditional);
  const rulesCount = norm?.rules?.length ?? 0;
  const isConditionalActive = rulesCount > 0;

  // Page break renders as a distinct divider, not a normal question card —
  // no label/description/type editor (those confused users). Still draggable
  // so it can be positioned between fields, and deletable.
  if (field.type === 'pagebreak') {
    return (
      <div ref={setNodeRef} style={style} className="relative group">
        <div className="flex items-center gap-2 py-1">
          <div
            {...attributes}
            {...listeners}
            className="cursor-move touch-none hover:bg-slate-200/60 p-1 rounded transition-colors"
          >
            <GripVertical className="h-4 w-4 text-slate-400 group-hover:text-slate-700" />
          </div>
          <span className="h-px flex-1 bg-primary/30" />
          <span className="text-[11px] font-semibold uppercase tracking-wider text-primary whitespace-nowrap">
            Page Break
          </span>
          <span className="h-px flex-1 bg-primary/30" />
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
            onClick={() => removeField(index)}
            title="Delete page break"
            aria-label="Delete page break"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
        <p className="text-[11px] text-muted-foreground text-center -mt-0.5">
          Fields below this line start a new page. Place it between questions.
        </p>
      </div>
    );
  }

  return (
    <div ref={setNodeRef} style={style} className="relative group">
      <Card>
        <CardHeader className="py-3 px-4 bg-muted/30 flex flex-row items-center gap-2">
          <div {...attributes} {...listeners} className="cursor-move touch-none hover:bg-slate-200/60 p-1 -ml-1 rounded transition-colors" id={index === 0 ? "tour-drag-handle" : undefined}>
            <GripVertical className="h-4 w-4 text-slate-400 group-hover:text-slate-700" />
          </div>
          <span className="text-sm font-medium">Question {index + 1}</span>
          <div className="flex items-center gap-1 ml-auto">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-foreground"
              onClick={() => duplicateField(index)}
              title="Duplicate"
              aria-label="Duplicate question"
            >
              <Copy className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
              onClick={() => removeField(index)}
              title="Delete"
              aria-label="Delete question"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-4 grid gap-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor={`field-label-${field.id}`}>Label / Question</Label>
              <Input
                id={`field-label-${field.id}`}
                value={field.label}
                onChange={(e) => updateField(index, { label: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor={`field-type-${field.id}`}>Type</Label>
              <Select
                value={field.type}
                onValueChange={(val) => updateField(index, { type: val as FormField['type'] })}
              >
                <SelectTrigger id={`field-type-${field.id}`}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="product">Product Selection</SelectItem>
                  <SelectItem value="text">Short Text</SelectItem>
                  <SelectItem value="textarea">Long Text</SelectItem>
                  <SelectItem value="email">Email</SelectItem>
                  <SelectItem value="number">Number</SelectItem>
                  <SelectItem value="date">Date</SelectItem>
                  <SelectItem value="select">Dropdown</SelectItem>
                  <SelectItem value="checkbox">Checkboxes</SelectItem>
                  <SelectItem value="radio">Multiple Choice</SelectItem>
                  <SelectItem value="file">File Upload</SelectItem>

                  <SelectItem value="time">Time</SelectItem>
                  <SelectItem value="rating">Linear Scale (Rating)</SelectItem>
                  <SelectItem value="separator">Section / Text</SelectItem>
                  <SelectItem value="pagebreak">Page Break (Multi-page)</SelectItem>
                  <SelectItem value="image">Image Display</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor={`field-desc-${field.id}`}>
              {field.type === 'separator'
                ? 'Description / Body Text (Optional)'
                : field.type === 'image'
                  ? 'Image Caption (Optional)'
                  : 'Description (Optional)'}
            </Label>
            <Input
              id={`field-desc-${field.id}`}
              value={field.description || ''}
              onChange={(e) => updateField(index, { description: e.target.value })}
              placeholder={
                field.type === 'separator'
                  ? 'Add more details or instructions...'
                  : field.type === 'image'
                    ? 'Caption for the image (Optional)'
                    : 'Help text or instructions for this question'
              }
            />
          </div>

          {field.type === 'image' && (
            <div className="space-y-4 p-4 bg-slate-50 rounded-lg border border-slate-100">
              <div className="space-y-2">
                <Label htmlFor={`field-image-${field.id}`}>Image URL</Label>
                <Input
                  id={`field-image-${field.id}`}
                  placeholder="https://example.com/image.jpg"
                  value={field.imageUrl || ''}
                  onChange={(e) => updateField(index, { imageUrl: e.target.value })}
                />
                <p className="text-xs text-muted-foreground">Provide a valid URL to an image file (jpg, png, gif).</p>
              </div>
            </div>
          )}

          {(field.type === 'select' || field.type === 'checkbox' || field.type === 'radio') && (
            <div className="space-y-2">
              <Label htmlFor={`field-options-${field.id}`}>Options (comma separated)</Label>
              <Input
                id={`field-options-${field.id}`}
                placeholder="Option A, Option B, Option C"
                value={field.options?.join(',') || ''}
                onChange={(e) => updateField(index, { options: e.target.value.split(',') })}
              />
            </div>
          )}

          {field.type === 'rating' && (
            <div className="space-y-4 p-4 bg-slate-50 rounded-lg border border-slate-100">
              <div className="flex items-center gap-4">
                <div className="space-y-2 flex-1">
                  <Label htmlFor={`rating-min-${field.id}`}>Scale Start (Min)</Label>
                  <Select
                    value={field.ratingConfig?.min?.toString() || '1'}
                    onValueChange={(val) =>
                      updateField(index, {
                        ratingConfig: {
                          ...field.ratingConfig,
                          min: parseInt(val),
                          max: field.ratingConfig?.max || 5,
                        },
                      })
                    }
                  >
                    <SelectTrigger id={`rating-min-${field.id}`}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">0</SelectItem>
                      <SelectItem value="1">1</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2 flex-1">
                  <Label htmlFor={`rating-max-${field.id}`}>Scale End (Max)</Label>
                  <Select
                    value={field.ratingConfig?.max?.toString() || '5'}
                    onValueChange={(val) =>
                      updateField(index, {
                        ratingConfig: {
                          ...field.ratingConfig,
                          min: field.ratingConfig?.min || 1,
                          max: parseInt(val),
                        },
                      })
                    }
                  >
                    <SelectTrigger id={`rating-max-${field.id}`}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                        <SelectItem key={num} value={num.toString()}>
                          {num}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor={`rating-min-label-${field.id}`}>
                    Label for Min ({field.ratingConfig?.min || 1})
                  </Label>
                  <Input
                    id={`rating-min-label-${field.id}`}
                    placeholder="e.g. Poor"
                    value={field.ratingConfig?.minLabel || ''}
                    onChange={(e) =>
                      updateField(index, {
                        ratingConfig: {
                          ...field.ratingConfig,
                          min: field.ratingConfig?.min || 1,
                          max: field.ratingConfig?.max || 5,
                          minLabel: e.target.value,
                        },
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`rating-max-label-${field.id}`}>
                    Label for Max ({field.ratingConfig?.max || 5})
                  </Label>
                  <Input
                    id={`rating-max-label-${field.id}`}
                    placeholder="e.g. Excellent"
                    value={field.ratingConfig?.maxLabel || ''}
                    onChange={(e) =>
                      updateField(index, {
                        ratingConfig: {
                          ...field.ratingConfig,
                          min: field.ratingConfig?.min || 1,
                          max: field.ratingConfig?.max || 5,
                          maxLabel: e.target.value,
                        },
                      })
                    }
                  />
                </div>
              </div>
            </div>
          )}

          {field.type === 'product' && (
            <div className="space-y-4 p-4 bg-slate-50 rounded-lg border border-slate-100">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                  Products
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const currentProducts = field.products || [];
                    updateField(index, {
                      products: [
                        ...currentProducts,
                        {
                          id: uuidv4(),
                          name: 'New Product',
                          price: 0,
                          currency: 'MYR',
                          imageUrl: '',
                        },
                      ],
                    });
                  }}
                >
                  <Plus className="mr-2 h-3 w-3" />
                  Add Product
                </Button>
              </div>

              {(!field.products || field.products.length === 0) && (
                <div className="text-sm text-slate-500 text-center py-4 border-2 border-dashed border-slate-200 rounded-md">
                  No products added yet. Click &quot;Add Product&quot; to start.
                </div>
              )}

              <div className="space-y-3">
                {field.products?.map((product, pIndex) => (
                  <div
                    key={product.id}
                    className="grid gap-3 p-3 bg-white border border-slate-200 rounded-md shadow-sm relative group/product"
                  >
                    <div className="absolute right-2 top-2 opacity-0 group-hover/product:opacity-100 transition-opacity">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-destructive hover:bg-destructive/10"
                        onClick={() => {
                          const newProducts = [...(field.products || [])];
                          newProducts.splice(pIndex, 1);
                          updateField(index, { products: newProducts });
                        }}
                        aria-label="Remove Product"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label
                          htmlFor={`product-name-${product.id}`}
                          className="text-xs text-slate-500"
                        >
                          Product Name
                        </Label>
                        <Input
                          id={`product-name-${product.id}`}
                          value={product.name}
                          onChange={(e) => {
                            const newProducts = [...(field.products || [])];
                            newProducts[pIndex] = { ...product, name: e.target.value };
                            updateField(index, { products: newProducts });
                          }}
                          className="h-8 text-sm"
                          placeholder="e.g. T-Shirt"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label
                          htmlFor={`product-price-${product.id}`}
                          className="text-xs text-slate-500"
                        >
                          Price (MYR)
                        </Label>
                        <Input
                          id={`product-price-${product.id}`}
                          type="number"
                          value={product.price}
                          onChange={(e) => {
                            const newProducts = [...(field.products || [])];
                            newProducts[pIndex] = {
                              ...product,
                              price: parseFloat(e.target.value) || 0,
                            };
                            updateField(index, { products: newProducts });
                          }}
                          className="h-8 text-sm"
                          placeholder="0.00"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between items-baseline">
                        <Label
                          htmlFor={`product-image-${product.id}`}
                          className="text-xs text-slate-500"
                        >
                          Image URL
                        </Label>
                        <span className="text-[10px] text-muted-foreground">
                          Rec: 4:3 Ratio (e.g. 800x600px)
                        </span>
                      </div>
                      <Input
                        id={`product-image-${product.id}`}
                        value={product.imageUrl || ''}
                        onChange={(e) => {
                          const newProducts = [...(field.products || [])];
                          newProducts[pIndex] = { ...product, imageUrl: e.target.value };
                          updateField(index, { products: newProducts });
                        }}
                        className="h-8 text-sm"
                        placeholder="https://example.com/image.jpg"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {field.type !== 'separator' && field.type !== 'image' && (
            <div className="flex items-center gap-2">
              <Switch
                id={`field-required-${field.id}`}
                checked={field.required}
                onCheckedChange={(checked) => updateField(index, { required: checked })}
              />
              <Label htmlFor={`field-required-${field.id}`}>Required</Label>
            </div>
          )}

          {/* Validation & Conditional Logic Accordion */}
          {field.type !== 'separator' && field.type !== 'image' && (
            <Accordion type="multiple" className="w-full mt-2 border-t border-slate-100">
              {(field.type === 'text' ||
                field.type === 'textarea' ||
                field.type === 'email' ||
                field.type === 'number') && (
                <AccordionItem value="validation" className="border-b-0">
                  <AccordionTrigger className="py-2.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider hover:no-underline">
                    <div className="flex items-center gap-2">
                      <span>Validation Rules</span>
                      {isValidationActive && (
                        <span className="text-[10px] lowercase font-normal bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400 px-2 py-0.5 rounded-full">
                          active
                        </span>
                      )}
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pt-2 pb-2">
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor={`validation-min-${field.id}`} className="text-sm">
                            Min Length
                          </Label>
                          <Input
                            id={`validation-min-${field.id}`}
                            type="number"
                            placeholder="0"
                            value={field.validation?.minLength || ''}
                            onChange={(e) =>
                              updateField(index, {
                                validation: {
                                  ...field.validation,
                                  minLength: e.target.value ? parseInt(e.target.value) : undefined,
                                },
                              })
                            }
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor={`validation-max-${field.id}`} className="text-sm">
                            Max Length
                          </Label>
                          <Input
                            id={`validation-max-${field.id}`}
                            type="number"
                            placeholder="255"
                            value={field.validation?.maxLength || ''}
                            onChange={(e) =>
                              updateField(index, {
                                validation: {
                                  ...field.validation,
                                  maxLength: e.target.value ? parseInt(e.target.value) : undefined,
                                },
                              })
                            }
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor={`validation-pattern-${field.id}`} className="text-sm">
                          Regex Pattern (Advanced)
                        </Label>
                        <div className="flex gap-2">
                          <Input
                            id={`validation-pattern-${field.id}`}
                            placeholder="e.g. ^[0-9]+$"
                            value={field.validation?.pattern || ''}
                            onChange={(e) =>
                              updateField(index, {
                                validation: { ...field.validation, pattern: e.target.value },
                              })
                            }
                          />
                          <Select
                            onValueChange={(val) =>
                              updateField(index, {
                                validation: { ...field.validation, pattern: val },
                              })
                            }
                          >
                            <SelectTrigger
                              id={`validation-pattern-preset-${field.id}`}
                              className="w-[130px]"
                              aria-label="Regex Pattern Presets"
                            >
                              <SelectValue placeholder="Presets" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="^[0-9]+$">Numbers</SelectItem>
                              <SelectItem value="^[a-zA-Z]+$">Letters</SelectItem>
                              <SelectItem value="^[^@]+@[^@]+\.[^@]+$">Email</SelectItem>
                              <SelectItem value="^(\+?6?01)[0-46-9]-*[0-9]{7,8}$">Phone (MY)</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              )}

              <AccordionItem value="conditional" className="border-b-0">
                <AccordionTrigger className="py-2.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider hover:no-underline">
                  <div className="flex items-center gap-2">
                    <span>Conditional Logic</span>
                    {isConditionalActive && (
                      <span className="text-[10px] lowercase font-normal bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 px-2 py-0.5 rounded-full">
                        {rulesCount} {rulesCount === 1 ? 'rule' : 'rules'}
                      </span>
                    )}
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pt-2 pb-2">
                  <ConditionalLogicEditor
                    field={field}
                    availableFields={availableConditionFields}
                    onChange={(updates) => updateField(index, updates)}
                  />
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

interface ConditionalLogicEditorProps {
  field: FormField;
  availableFields: FormField[];
  onChange: (updates: Partial<FormField>) => void;
}

function ConditionalLogicEditor({
  field,
  availableFields,
  onChange,
}: ConditionalLogicEditorProps) {
  const norm = normalizeConditional(field.conditional);
  const rules: ConditionRule[] = norm?.rules ?? [];
  const logic: 'all' | 'any' = norm?.logic ?? 'all';

  const writeRules = (next: ConditionRule[], nextLogic: 'all' | 'any' = logic) => {
    if (next.length === 0) {
      onChange({ conditional: undefined });
      return;
    }
    onChange({ conditional: { rules: next, logic: nextLogic } });
  };

  const addRule = () => {
    const firstField = availableFields[0];
    if (!firstField) return;
    writeRules([...rules, { fieldId: firstField.id, operator: 'equals', value: '' }]);
  };

  const updateRule = (idx: number, patch: Partial<ConditionRule>) => {
    const next = rules.map((r, i) => (i === idx ? { ...r, ...patch } : r));
    writeRules(next);
  };

  const removeRule = (idx: number) => {
    writeRules(rules.filter((_, i) => i !== idx));
  };

  return (
    <div className="space-y-3">
      {rules.length > 0 && (
        <div className="flex justify-end">
          <Button
            variant="ghost"
            size="sm"
            className="h-6 text-xs text-destructive hover:bg-destructive/10"
            onClick={() => onChange({ conditional: undefined })}
          >
            Clear Logic
          </Button>
        </div>
      )}

      {rules.length === 0 ? (
        <div className="p-3 bg-slate-50 rounded-md border border-slate-100 text-sm text-slate-600 flex items-center justify-between">
          <span>Sentiasa tunjuk soalan ini.</span>
          <Button
            variant="outline"
            size="sm"
            onClick={addRule}
            disabled={availableFields.length === 0}
          >
            <Plus className="h-3.5 w-3.5 mr-1" />
            Tambah peraturan
          </Button>
        </div>
      ) : (
        <div className="p-3 bg-slate-50 rounded-md border border-slate-100 space-y-3">
          {rules.length > 1 && (
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <span>Tunjuk jika</span>
              <Select value={logic} onValueChange={(v) => writeRules(rules, v as 'all' | 'any')}>
                <SelectTrigger className="w-[110px] h-8 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">SEMUA</SelectItem>
                  <SelectItem value="any">MANA-MANA</SelectItem>
                </SelectContent>
              </Select>
              <span>peraturan ini benar:</span>
            </div>
          )}

          {rules.map((rule, idx) => (
            <div
              key={idx}
              className="flex flex-col sm:flex-row gap-2 items-start sm:items-center"
            >
              {rules.length === 1 && (
                <span className="text-sm text-slate-600 whitespace-nowrap">Tunjuk jika</span>
              )}
              <Select
                value={rule.fieldId}
                onValueChange={(val) => updateRule(idx, { fieldId: val })}
              >
                <SelectTrigger className="w-full sm:w-[180px] h-9 text-sm">
                  <SelectValue placeholder="Pilih soalan..." />
                </SelectTrigger>
                <SelectContent>
                  {availableFields.map((f) => (
                    <SelectItem key={f.id} value={f.id}>
                      {f.label || '(Tanpa Tajuk)'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={rule.operator}
                onValueChange={(val) =>
                  updateRule(idx, { operator: val as ConditionOperator })
                }
              >
                <SelectTrigger className="w-full sm:w-[170px] h-9 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CONDITION_OPERATORS.map((op) => (
                    <SelectItem key={op.value} value={op.value}>
                      {op.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {operatorNeedsValue(rule.operator) && (
                <Input
                  className="h-9 text-sm"
                  placeholder="Nilai..."
                  value={rule.value ?? ''}
                  onChange={(e) => updateRule(idx, { value: e.target.value })}
                  aria-label="Condition value"
                />
              )}

              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-destructive hover:bg-destructive/10"
                onClick={() => removeRule(idx)}
                aria-label="Buang peraturan"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}

          <Button
            variant="outline"
            size="sm"
            onClick={addRule}
            disabled={availableFields.length === 0}
            className="h-8 text-xs"
          >
            <Plus className="h-3.5 w-3.5 mr-1" />
            Tambah peraturan
          </Button>
        </div>
      )}
    </div>
  );
}

interface FieldsEditorProps {
  fields: FormField[];
  onChange: (fields: FormField[]) => void;
}export function FieldsEditor({ fields, onChange }: FieldsEditorProps) {
  // Initialize mounted state directly to avoid useEffect setState
  const [mounted, setMounted] = useState(false);

  // Use useLayoutEffect alternative or just set directly
  useEffect(() => {
    // Timeout to avoid "synchronous setState" in effect warning
    const timer = setTimeout(() => setMounted(true), 0);
    return () => clearTimeout(timer);
  }, []);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (active.id !== over?.id) {
      const oldIndex = fields.findIndex((f) => f.id === active.id);
      const newIndex = fields.findIndex((f) => f.id === over?.id);
      onChange(arrayMove(fields, oldIndex, newIndex));
    }
  };

  const addField = () => {
    onChange([...fields, { id: uuidv4(), type: 'text', label: 'New Question', required: false }]);
  };

  const addPageBreak = () => {
    onChange([
      ...fields,
      { id: uuidv4(), type: 'pagebreak', label: 'Page Break', required: false },
    ]);
  };

  const updateField = (index: number, updates: Partial<FormField>) => {
    const newFields = [...fields];
    newFields[index] = { ...newFields[index], ...updates };
    onChange(newFields);
  };

  const duplicateField = (index: number) => {
    const field = fields[index];
    const newField = { ...field, id: uuidv4(), label: `${field.label} (Copy)` };
    const newFields = [...fields];
    newFields.splice(index + 1, 0, newField);
    onChange(newFields);
  };

  const removeField = (index: number) => {
    const newFields = fields.filter((_, i) => i !== index);
    onChange(newFields);
  };

  // Prevent hydration mismatch - only render DnD after mount
  if (!mounted) {
    return (
      <div className="space-y-4">
        {fields.map((field) => (
          <div key={field.id} className="animate-pulse bg-gray-100 h-48 rounded-lg" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={fields.map((f) => f.id)} strategy={verticalListSortingStrategy}>
          {fields.map((field, index) => (
            <SortableField
              key={field.id}
              field={field}
              index={index}
              allFields={fields}
              updateField={updateField}
              removeField={removeField}
              duplicateField={duplicateField}
            />
          ))}
        </SortableContext>
      </DndContext>

      <div className="flex flex-col gap-2">
        <Button
          id="tour-add-question"
          onClick={addField}
          variant="secondary"
          className="w-full"
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Question
        </Button>
        <Button
          onClick={addPageBreak}
          variant="outline"
          className="w-full"
          title="Split the form into multiple pages"
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Page Break
        </Button>
      </div>
    </div>
  );
}
