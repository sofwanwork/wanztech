
'use client'

import { Form, FormField } from '@/lib/types';

import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn, getProxiedImageUrl } from '@/lib/utils';
import { format } from 'date-fns';
import { CalendarIcon, Loader2, CheckCircle2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { submitFormAction } from '@/actions/form';
import { toast } from 'sonner';

interface PublicFormClientProps {
    form: Form;
}

export function PublicFormClient({ form }: PublicFormClientProps) {
    const [submitting, setSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [formData, setFormData] = useState<Record<string, any>>({});
    const [dateOpen, setDateOpen] = useState<Record<string, boolean>>({});
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    // Helper to check visibility
    const isFieldVisible = (field: FormField) => {
        if (!field.conditional) return true;
        const { fieldId, value } = field.conditional;
        const dependentValue = formData[fieldId];
        // Simple string comparison. For checkboxes/arrays, might need includes() check in future.
        return dependentValue === value;
    };

    const visibleFields = form.fields.filter(isFieldVisible);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validation (only for visible fields)
        for (const field of visibleFields) {
            if (field.required && !formData[field.id]) {
                toast.error(`Please fill out "${field.label}"`);
                return;
            }
        }

        setSubmitting(true);
        try {
            const formDataToSend = new FormData();
            formDataToSend.append('timestamp', new Date().toISOString());

            // Only append visible fields
            visibleFields.forEach(field => {
                let value = formData[field.id];
                if (value instanceof Date) {
                    value = format(value, 'yyyy-MM-dd');
                }

                if (field.type === 'file' && value instanceof File) {
                    formDataToSend.append(field.label, value);
                } else {
                    formDataToSend.append(field.label, value || '');
                }
            });

            const result = await submitFormAction(form.id, formDataToSend);

            if (result.success) {
                setSubmitted(true);
                toast.success('Submitted successfully!');
            } else {
                toast.error(result.error || 'Something went wrong');
            }
        } catch (error) {
            toast.error('An error occurred');
        } finally {
            setSubmitting(false);
        }
    };

    const handleInputChange = (id: string, value: any) => {
        setFormData(prev => ({ ...prev, [id]: value }));
    };

    if (!mounted) {
        return <div className="min-h-screen bg-slate-50" />;
    }

    if (submitted) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
                <Card className="w-full max-w-md text-center border border-gray-200 bg-white">
                    <CardHeader className="pt-8 pb-6">
                        <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-green-100 flex items-center justify-center">
                            <CheckCircle2 className="h-6 w-6 text-green-600" />
                        </div>
                        <CardTitle className="text-xl font-semibold text-gray-900">
                            Thank You!
                        </CardTitle>
                        <CardDescription className="whitespace-pre-wrap text-gray-600 mt-2">
                            {form.thankYouMessage || "Your response has been recorded."}
                        </CardDescription>
                    </CardHeader>
                </Card>
            </div>
        );
    }

    // Check validity (only visible)
    const isFormValid = visibleFields.every(field => {
        if (!field.required) return true;
        const value = formData[field.id];
        return value !== undefined && value !== '' && value !== null;
    });

    return (
        <div className="min-h-screen bg-gray-50 py-8 px-4">
            <div className="max-w-2xl mx-auto space-y-6">
                {/* Cover Image */}
                {form.coverImage && (
                    <div className="rounded-lg overflow-hidden border border-gray-200">
                        <div
                            className="w-full aspect-[2/1] bg-cover bg-center"
                            style={{ backgroundImage: `url(${getProxiedImageUrl(form.coverImage)})` }}
                        />
                    </div>
                )}

                {/* Header */}
                <Card className="border border-gray-200 bg-white">
                    <CardHeader className="border-l-4 border-l-primary">
                        <CardTitle className="text-2xl font-bold text-gray-900">{form.title}</CardTitle>
                        {form.description && (
                            <div
                                className="text-gray-600 mt-2 [&>p]:mb-0 [&>p:empty]:h-3 [&>strong]:font-semibold"
                                dangerouslySetInnerHTML={{ __html: form.description }}
                            />
                        )}
                    </CardHeader>
                </Card>

                {/* Form Fields */}
                <form onSubmit={handleSubmit} className="space-y-6">
                    <Card className="border border-gray-200 bg-white">
                        <CardContent className="p-0">
                            {visibleFields.map((field, index) => (
                                <div key={field.id} className="py-5 px-6 border-b border-gray-100 last:border-b-0">
                                    <Label className="text-sm font-medium text-gray-700 flex items-center gap-2 mb-3">
                                        {field.label}
                                        {field.required && <span className="text-red-500">*</span>}
                                    </Label>

                                    {field.type === 'text' && (
                                        <Input
                                            className="h-12 text-base transition-all duration-200 focus:ring-2 focus:ring-primary/20 border-slate-200"
                                            placeholder="Your answer"
                                            value={formData[field.id] || ''}
                                            onChange={(e) => handleInputChange(field.id, e.target.value)}
                                        />
                                    )}

                                    {field.type === 'email' && (
                                        <Input
                                            type="email"
                                            className="h-12 text-base transition-all duration-200 focus:ring-2 focus:ring-primary/20 border-slate-200"
                                            placeholder="name@example.com"
                                            value={formData[field.id] || ''}
                                            onChange={(e) => handleInputChange(field.id, e.target.value)}
                                        />
                                    )}

                                    {field.type === 'number' && (
                                        <Input
                                            type="number"
                                            className="h-12 text-base transition-all duration-200 focus:ring-2 focus:ring-primary/20 border-slate-200"
                                            placeholder="0"
                                            value={formData[field.id] || ''}
                                            onChange={(e) => handleInputChange(field.id, e.target.value)}
                                        />
                                    )}

                                    {field.type === 'textarea' && (
                                        <Textarea
                                            className="min-h-[120px] text-base transition-all duration-200 focus:ring-2 focus:ring-primary/20 border-slate-200 resize-y"
                                            placeholder="Your answer"
                                            value={formData[field.id] || ''}
                                            onChange={(e) => handleInputChange(field.id, e.target.value)}
                                        />
                                    )}

                                    {field.type === 'select' && (
                                        <Select
                                            onValueChange={(val) => handleInputChange(field.id, val)}
                                            value={formData[field.id] || ''}
                                        >
                                            <SelectTrigger className="h-12 text-base border-slate-200">
                                                <SelectValue placeholder="Select an option" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {field.options?.map((opt, i) => (
                                                    <SelectItem key={i} value={opt} className="text-base">{opt}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    )}

                                    {field.type === 'file' && (
                                        <div className="flex items-center justify-center w-full">
                                            <Label
                                                htmlFor={`file-${field.id}`}
                                                className="flex flex-col items-center justify-center w-full h-32 border-2 border-slate-300 border-dashed rounded-lg cursor-pointer bg-slate-50 hover:bg-slate-100 transition-colors"
                                            >
                                                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                                    <svg className="w-8 h-8 mb-4 text-slate-500" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 16">
                                                        <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2" />
                                                    </svg>
                                                    <p className="mb-2 text-sm text-slate-500"><span className="font-semibold">Click to upload</span> or drag and drop</p>
                                                    <p className="text-xs text-slate-500">
                                                        {formData[field.id] instanceof File ? (
                                                            <span className="text-primary font-medium">{formData[field.id].name}</span>
                                                        ) : (
                                                            "Any file type"
                                                        )}
                                                    </p>
                                                </div>
                                                <Input
                                                    id={`file-${field.id}`}
                                                    type="file"
                                                    className="hidden"
                                                    onChange={(e) => {
                                                        if (e.target.files && e.target.files[0]) {
                                                            handleInputChange(field.id, e.target.files[0]);
                                                        }
                                                    }}
                                                />
                                            </Label>
                                        </div>
                                    )}

                                    {field.type === 'date' && (
                                        <Popover open={dateOpen[field.id]} onOpenChange={(open) => setDateOpen(prev => ({ ...prev, [field.id]: open }))}>
                                            <PopoverTrigger asChild>
                                                <Button
                                                    variant={"outline"}
                                                    className={cn(
                                                        "w-full h-12 justify-start text-left font-normal text-base border-slate-200",
                                                        !formData[field.id] && "text-muted-foreground"
                                                    )}
                                                >
                                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                                    {formData[field.id] ? format(formData[field.id], "PPP") : <span>Pick a date</span>}
                                                </Button>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-auto p-0">
                                                <Calendar
                                                    mode="single"
                                                    selected={formData[field.id]}
                                                    onSelect={(date) => {
                                                        handleInputChange(field.id, date);
                                                        setDateOpen(prev => ({ ...prev, [field.id]: false }));
                                                    }}
                                                    initialFocus
                                                />
                                            </PopoverContent>
                                        </Popover>
                                    )}
                                </div>
                            ))}
                        </CardContent>
                        <CardFooter className="p-6 border-t border-gray-100">
                            <Button
                                type="submit"
                                disabled={submitting || !isFormValid}
                                className="w-full h-11 bg-primary hover:bg-primary/90 text-white font-medium disabled:bg-gray-200 disabled:text-gray-400"
                            >
                                {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {submitting ? 'Submitting...' : 'Submit'}
                            </Button>
                        </CardFooter>
                    </Card>
                </form>
            </div>
        </div>
    );

}

