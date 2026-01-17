
'use client'

import { useState, useEffect } from 'react';
import { FormField } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Trash2, GripVertical, Plus } from 'lucide-react';
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
}

function SortableField({ field, index, allFields, updateField, removeField }: SortableFieldProps) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
    } = useSortable({ id: field.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    // Filter potential condition fields (fields that appear before the current one)
    // Actually, simple logic: just don't allow self-reference. Circular dependency is hard to prevent fully without complex logic.
    // Let's just allow picking any OTHER field for now, or maybe restricted to "Select" types for simplicity?
    // User requested "Show if other field EQUALS value". Usually works best with Select/Radio.
    const availableConditionFields = allFields.filter(f => f.id !== field.id && (f.type === 'select' || f.type === 'text' || f.type === 'email' || f.type === 'number'));

    return (
        <div ref={setNodeRef} style={style} className="relative group">
            <Card>
                <CardHeader className="py-3 px-4 bg-muted/30 flex flex-row items-center gap-2">
                    <div {...attributes} {...listeners} className="cursor-move touch-none">
                        <GripVertical className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <span className="text-sm font-medium">Question {index + 1}</span>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="ml-auto h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={() => removeField(index)}
                    >
                        <Trash2 className="h-4 w-4" />
                    </Button>
                </CardHeader>
                <CardContent className="p-4 grid gap-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Label / Question</Label>
                            <Input
                                value={field.label}
                                onChange={(e) => updateField(index, { label: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Type</Label>
                            <Select
                                value={field.type}
                                onValueChange={(val) => updateField(index, { type: val as any })}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="text">Short Text</SelectItem>
                                    <SelectItem value="textarea">Long Text</SelectItem>
                                    <SelectItem value="email">Email</SelectItem>
                                    <SelectItem value="number">Number</SelectItem>
                                    <SelectItem value="date">Date</SelectItem>
                                    <SelectItem value="select">Dropdown</SelectItem>
                                    <SelectItem value="file">File Upload</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {field.type === 'select' && (
                        <div className="space-y-2">
                            <Label>Options (comma separated)</Label>
                            <Input
                                placeholder="Option A, Option B, Option C"
                                value={field.options?.join(', ') || ''}
                                onChange={(e) => updateField(index, { options: e.target.value.split(',').map(s => s.trim()) })}
                            />
                        </div>
                    )}

                    <div className="flex items-center gap-2">
                        <Switch
                            checked={field.required}
                            onCheckedChange={(checked) => updateField(index, { required: checked })}
                        />
                        <Label>Required</Label>
                    </div>

                    {/* Conditional Logic Section */}
                    <div className="pt-4 border-t space-y-3">
                        <div className="flex items-center justify-between">
                            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Conditional Logic</Label>
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
                            <span className="text-sm text-slate-600 whitespace-nowrap">Show this field if</span>
                            <Select
                                value={field.conditional?.fieldId || "none"}
                                onValueChange={(val) => {
                                    if (val === "none") {
                                        updateField(index, { conditional: undefined });
                                    } else {
                                        updateField(index, { conditional: { fieldId: val, value: field.conditional?.value || "" } });
                                    }
                                }}
                            >
                                <SelectTrigger className="w-full sm:w-[180px] h-9 text-sm">
                                    <SelectValue placeholder="Select Question..." />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="none">-- Always Show --</SelectItem>
                                    {availableConditionFields.map(f => (
                                        <SelectItem key={f.id} value={f.id}>{f.label || "(Unnamed)"}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>

                            {field.conditional?.fieldId && (
                                <>
                                    <span className="text-sm text-slate-600">equals</span>
                                    <Input
                                        className="h-9 text-sm"
                                        placeholder="Value to match..."
                                        value={field.conditional.value}
                                        onChange={(e) => updateField(index, { conditional: { ...field.conditional!, value: e.target.value } })}
                                    />
                                </>
                            )}
                        </div>
                    </div>
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
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
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
        onChange([
            ...fields,
            { id: uuidv4(), type: 'text', label: 'New Question', required: false }
        ]);
    };

    const updateField = (index: number, updates: Partial<FormField>) => {
        const newFields = [...fields];
        newFields[index] = { ...newFields[index], ...updates };
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
                {fields.map((field, index) => (
                    <div key={field.id} className="animate-pulse bg-gray-100 h-48 rounded-lg" />
                ))}
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
            >
                <SortableContext
                    items={fields.map(f => f.id)}
                    strategy={verticalListSortingStrategy}
                >
                    {fields.map((field, index) => (
                        <SortableField
                            key={field.id}
                            field={field}
                            index={index}
                            allFields={fields}
                            updateField={updateField}
                            removeField={removeField}
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
