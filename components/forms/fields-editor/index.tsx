'use client';

import { useState, useEffect } from 'react';
import { FormField } from '@/lib/types';
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

  // Filter potential condition fields (fields that appear before the current one)
  // Actually, simple logic: just don't allow self-reference. Circular dependency is hard to prevent fully without complex logic.
  // Let's just allow picking any OTHER field for now, or maybe restricted to "Select" types for simplicity?
  // User requested "Show if other field EQUALS value". Usually works best with Select/Radio.
  const availableConditionFields = allFields.filter(
    (f) =>
      f.id !== field.id &&
      (f.type === 'select' || f.type === 'text' || f.type === 'email' || f.type === 'number')
  );

  return (
    <div ref={setNodeRef} style={style} className="relative group">
      <Card>
        <CardHeader className="py-3 px-4 bg-muted/30 flex flex-row items-center gap-2">
          <div {...attributes} {...listeners} className="cursor-move touch-none">
            <GripVertical className="h-4 w-4 text-muted-foreground" />
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
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor={`field-desc-${field.id}`}>
              {field.type === 'separator'
                ? 'Description / Body Text (Optional)'
                : 'Description (Optional)'}
            </Label>
            <Input
              id={`field-desc-${field.id}`}
              value={field.description || ''}
              onChange={(e) => updateField(index, { description: e.target.value })}
              placeholder={
                field.type === 'separator'
                  ? 'Add more details or instructions...'
                  : 'Help text or instructions for this question'
              }
            />
          </div>

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
                  <Label htmlFor={`rating-min-label-${field.id}`}>Label for Min ({field.ratingConfig?.min || 1})</Label>
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
                  <Label htmlFor={`rating-max-label-${field.id}`}>Label for Max ({field.ratingConfig?.max || 5})</Label>
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
                <p className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Products</p>
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
                        <Label htmlFor={`product-name-${product.id}`} className="text-xs text-slate-500">Product Name</Label>
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
                        <Label htmlFor={`product-price-${product.id}`} className="text-xs text-slate-500">Price (MYR)</Label>
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
                        <Label htmlFor={`product-image-${product.id}`} className="text-xs text-slate-500">Image URL</Label>
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

          {field.type !== 'separator' && (
            <div className="flex items-center gap-2">
              <Switch
                id={`field-required-${field.id}`}
                checked={field.required}
                onCheckedChange={(checked) => updateField(index, { required: checked })}
              />
              <Label htmlFor={`field-required-${field.id}`}>Required</Label>
            </div>
          )}

          {/* Validation Settings */}
          {(field.type === 'text' ||
            field.type === 'textarea' ||
            field.type === 'email' ||
            field.type === 'number') && (
              <div className="pt-4 border-t space-y-3">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Validation Rules
                </p>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor={`validation-min-${field.id}`} className="text-sm">Min Length</Label>
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
                    <Label htmlFor={`validation-max-${field.id}`} className="text-sm">Max Length</Label>
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
                  <Label htmlFor={`validation-pattern-${field.id}`} className="text-sm">Regex Pattern (Advanced)</Label>
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
                      <SelectTrigger id={`validation-pattern-preset-${field.id}`} className="w-[130px]" aria-label="Regex Pattern Presets">
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
            )}

          {/* Conditional Logic Section */}
          {field.type !== 'separator' && (
            <div className="pt-4 border-t space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Conditional Logic
                </p>
                {field.conditional && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 text-xs text-destructive"
                    onClick={() => updateField(index, { conditional: undefined })}
                  >
                    Clear Logic
                  </Button>
                )}
              </div>

              <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center p-3 bg-slate-50 rounded-md border border-slate-100">
                <span id={`condition-label-${field.id}`} className="text-sm text-slate-600 whitespace-nowrap">Show this field if</span>
                <Select
                  value={field.conditional?.fieldId || 'none'}
                  onValueChange={(val) => {
                    if (val === 'none') {
                      updateField(index, { conditional: undefined });
                    } else {
                      updateField(index, {
                        conditional: { fieldId: val, value: field.conditional?.value || '' },
                      });
                    }
                  }}
                >
                  <SelectTrigger className="w-full sm:w-[180px] h-9 text-sm" aria-labelledby={`condition-label-${field.id}`}>
                    <SelectValue placeholder="Select Question..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">-- Always Show --</SelectItem>
                    {availableConditionFields.map((f) => (
                      <SelectItem key={f.id} value={f.id}>
                        {f.label || '(Unnamed)'}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {field.conditional?.fieldId && (
                  <>
                    <span className="text-sm text-slate-600">equals</span>
                    <Input
                      id={`conditional-value-${field.id}`}
                      aria-label="Condition Value"
                      className="h-9 text-sm"
                      placeholder="Value to match..."
                      value={field.conditional.value}
                      onChange={(e) =>
                        updateField(index, {
                          conditional: { ...field.conditional!, value: e.target.value },
                        })
                      }
                    />
                  </>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

interface FieldsEditorProps {
  fields: FormField[];
  onChange: (fields: FormField[]) => void;
}

export function FieldsEditor({ fields, onChange }: FieldsEditorProps) {
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

      <Button onClick={addField} variant="secondary" className="w-full">
        <Plus className="mr-2 h-4 w-4" />
        Add Question
      </Button>
    </div>
  );
}
