'use client';

import { Form, FormField } from '@/lib/types';
import Link from 'next/link';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn, getProxiedImageUrl } from '@/lib/utils';
import { format } from 'date-fns';
import { Loader2, CheckCircle2, List } from 'lucide-react';
import { useState, useEffect } from 'react';
import { submitFormAction } from '@/actions/forms';
import { toast } from 'sonner';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { TimePicker } from '@/components/ui/time-picker';
import { DatePicker } from '@/components/ui/date-picker';

interface PublicFormClientProps {
  form: Form;
}

export function PublicFormClient({ form }: PublicFormClientProps) {
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [formData, setFormData] = useState<Record<string, any>>({});
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
      const error = validateField(field, formData[field.id]);
      if (error) {
        toast.error(error);
        // Optional: Scroll to error field
        return;
      }
    }

    setSubmitting(true);
    try {
      const formDataToSend = new FormData();
      formDataToSend.append('timestamp', new Date().toISOString());

      // Only append visible fields
      visibleFields.forEach((field) => {
        let value = formData[field.id];
        if (value instanceof Date) {
          value = format(value, 'yyyy-MM-dd');
        } else if (Array.isArray(value)) {
          value = value.join(', ');
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
    } catch {
      toast.error('An error occurred');
    } finally {
      setSubmitting(false);
    }
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleInputChange = (id: string, value: any) => {
    setFormData((prev) => ({ ...prev, [id]: value }));
  };

  const [checkingAccess, setCheckingAccess] = useState(true);
  const [accessDenied, setAccessDenied] = useState<string | null>(null);

  // Haversine formula to calculate distance in meters
  const getDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371e3; // metres
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  };

  useEffect(() => {
    const checkAccess = () => {
      const settings = form.attendanceSettings;
      if (!settings || !settings.enabled) {
        setCheckingAccess(false);
        setMounted(true);
        return;
      }

      // 1. Time Check
      const now = new Date();
      if (settings.startTime) {
        const start = new Date(settings.startTime);
        if (now < start) {
          setAccessDenied(
            `Form ini belum dibuka.\nSila tunggu sehingga: ${format(start, 'PP pp')}`
          );
          setCheckingAccess(false);
          setMounted(true);
          return;
        }
      }
      if (settings.endTime) {
        const end = new Date(settings.endTime);
        if (now > end) {
          setAccessDenied(`Form ini telah ditutup pada: ${format(end, 'PP pp')}`);
          setCheckingAccess(false);
          setMounted(true);
          return;
        }
      }

      // 2. Geofence Check
      if (settings.geofence?.enabled) {
        if (!navigator.geolocation) {
          setAccessDenied('Browser anda tidak menyokong Geolocation. Sila guna browser lain.');
          setCheckingAccess(false);
          setMounted(true);
          return;
        }

        navigator.geolocation.getCurrentPosition(
          (position) => {
            const userLat = position.coords.latitude;
            const userLng = position.coords.longitude;
            const targetLat = settings.geofence!.lat;
            const targetLng = settings.geofence!.lng;
            const radius = settings.geofence!.radius;

            const distance = getDistance(userLat, userLng, targetLat, targetLng);

            if (distance > radius) {
              setAccessDenied(
                `Anda berada di luar kawasan yang dibenarkan.\nJarak anda: ${Math.round(distance)}m\nJarak dibenarkan: ${radius}m`
              );
            }
            setCheckingAccess(false);
            setMounted(true);
          },
          (error) => {
            console.error(error);
            setAccessDenied('Sila benarkan akses lokasi (GPS) untuk mengisi form ini.');
            setCheckingAccess(false);
            setMounted(true);
          },
          { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
        );
        return; // Wait for callback
      }

      // All good
      setCheckingAccess(false);
      setMounted(true);
    };

    checkAccess();
  }, [form.attendanceSettings]);

  if (!mounted || checkingAccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-gray-500">Checking access...</p>
        </div>
      </div>
    );
  }

  const { primaryColor, backgroundColor } = form.theme || {};

  if (accessDenied) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 transition-colors duration-500 font-sans access-denied-container">
        <Card className="w-full max-w-md text-center border-t-4 border-red-500 shadow-lg bg-white">
          <CardHeader className="pt-8 pb-6">
            <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-red-100 flex items-center justify-center">
              <span className="text-2xl">🚫</span>
            </div>
            <CardTitle className="text-xl font-semibold text-gray-900">Akses Dihadkan</CardTitle>
            <CardDescription className="whitespace-pre-wrap text-gray-600 mt-2 font-medium">
              {accessDenied}
            </CardDescription>
          </CardHeader>
          <CardFooter className="justify-center pb-8">
            <Button variant="outline" onClick={() => window.location.reload()}>
              Cuba Semula
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 transition-colors duration-500 font-sans submitted-container">
        <Card className="w-full max-w-md text-center shadow-lg bg-white overflow-hidden relative border-none">
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-[var(--primary)]" />
          <CardHeader className="pt-8 pb-6">
            <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-green-100 flex items-center justify-center">
              <CheckCircle2 className="h-6 w-6 text-green-600" />
            </div>
            {!form.thankYouMessage && (
              <CardTitle className="text-xl font-semibold text-gray-900">Thank You!</CardTitle>
            )}
            <CardDescription className="whitespace-pre-wrap text-gray-600 mt-2">
              {form.thankYouMessage || 'Your response has been recorded.'}
            </CardDescription>
          </CardHeader>
          <CardFooter className="justify-center pb-8">
            {(form.allowMultipleSubmissions ?? true) && (
              <Button
                variant="outline"
                onClick={() => window.location.reload()}
                className="border-[var(--primary)] text-[var(--primary)] hover:bg-[var(--primary)] hover:text-white transition-colors"
              >
                Submit another response
              </Button>
            )}
          </CardFooter>
        </Card>
      </div>
    );
  }

  // Check validity (only visible inputs)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const validateField = (field: FormField, value: any): string | null => {
    if (field.type === 'separator') return null;

    // Required Check
    if (
      field.required &&
      (value === undefined ||
        value === '' ||
        value === null ||
        (Array.isArray(value) && value.length === 0))
    ) {
      return `Please fill out "${field.label}"`;
    }

    // Skip other validations if empty and not required
    if (!value) return null;

    // String validations (Text, Textarea, Email, Number as string)
    if (typeof value === 'string') {
      if (field.validation?.minLength && value.length < field.validation.minLength) {
        return `"${field.label}" requires just at least ${field.validation.minLength} characters.`;
      }
      if (field.validation?.maxLength && value.length > field.validation.maxLength) {
        return `"${field.label}" cannot exceed ${field.validation.maxLength} characters.`;
      }
      if (field.validation?.pattern) {
        try {
          const regex = new RegExp(field.validation.pattern);
          if (!regex.test(value)) {
            return `"${field.label}" is invalid format.`;
          }
        } catch {
          // Invalid regex in config, ignore
        }
      }
    }

    return null;
  };

  const isFormValid = visibleFields.every((field) => !validateField(field, formData[field.id]));

  return (
    <div className="min-h-screen py-8 sm:py-12 px-4 transition-colors duration-500 font-sans form-container">
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700;900&family=Lora:wght@400;600;700;900&family=Roboto:wght@400;500;700;900&display=swap');

        :root {
          --primary: ${primaryColor || '#0f172a'};
          --primary-foreground: #ffffff;
          --ring: ${primaryColor || '#0f172a'};
          --bg-color: ${backgroundColor || '#f9fafb'};
          --cover-image: url(${form.coverImage ? getProxiedImageUrl(form.coverImage) : ''});
          --cover-image-display: ${form.coverImage ? 'block' : 'none'};
        }

        .cover-image-container {
          background-image: var(--cover-image);
          display: var(--cover-image-display);
        }

        /* ... existing styles ... */
      `}</style>

      {/* ... */}

      <div className="max-w-2xl mx-auto space-y-6">
        {/* Cover Image */}
        {form.coverImage && (
          <div className="rounded-lg overflow-hidden border border-gray-200">
            <div className="w-full aspect-[2/1] bg-cover bg-center cover-image-container" />
          </div>
        )}

        {/* Header */}
        <div className="rounded-xl shadow-lg flex overflow-hidden bg-transparent">
          <div className="w-[10px] shrink-0 bg-primary" />
          <div
            className={cn(
              'flex-1 bg-white',
              form.theme?.headerAlignment === 'center' && 'text-center'
            )}
          >
            <CardHeader className="pt-8 pb-6">
              {form.theme?.logo && (
                <div
                  className={cn(
                    'mb-6',
                    form.theme?.headerAlignment === 'center' ? 'flex justify-center' : ''
                  )}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={form.theme.logo}
                    alt="Logo"
                    className="max-h-24 w-auto object-contain"
                  />
                </div>
              )}
              <CardTitle
                className="text-2xl font-black text-gray-900 leading-tight"
                style={{
                  fontFamily:
                    form.theme?.headerFont === 'playfair'
                      ? '"Playfair Display", serif'
                      : form.theme?.headerFont === 'lora'
                        ? '"Lora", serif'
                        : form.theme?.headerFont === 'roboto'
                          ? '"Roboto", sans-serif'
                          : 'inherit',
                }}
              >
                {form.title}
              </CardTitle>
              {form.description && (
                <div
                  className="ProseMirror text-gray-600 mt-2 [&>p]:mb-0 [&>p:empty]:h-3 [&_strong]:font-bold [&_b]:font-bold font-sans"
                  dangerouslySetInnerHTML={{ __html: form.description }}
                />
              )}
            </CardHeader>
          </div>
        </div>

        {/* Form Fields */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <Card className="border border-gray-200 bg-white">
            <CardContent className="p-0">
              {visibleFields.map((field) => {
                if (field.type === 'separator') {
                  return (
                    <div
                      key={field.id}
                      className="py-6 px-6 bg-slate-50 border-b border-gray-100 last:border-b-0"
                    >
                      <h3 className="text-lg font-semibold text-gray-900">{field.label}</h3>
                      {field.description && (
                        <p className="text-sm text-gray-500 mt-1 whitespace-pre-wrap">
                          {field.description}
                        </p>
                      )}
                    </div>
                  );
                }

                return (
                  <div
                    key={field.id}
                    className="py-5 px-6 border-b border-gray-100 last:border-b-0"
                  >
                    <Label className="text-sm font-medium text-gray-700 flex items-center gap-2 mb-1">
                      {field.label}
                      {field.required && <span className="text-red-500">*</span>}
                    </Label>

                    {field.description && (
                      <p className="text-sm text-gray-500 mb-3">{field.description}</p>
                    )}

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
                        <SelectTrigger className="w-full h-12 text-base border-slate-200 justify-start px-3 font-normal">
                          <List className="mr-2 h-4 w-4 text-muted-foreground" />
                          <SelectValue placeholder="Select an option" />
                        </SelectTrigger>
                        <SelectContent>
                          {field.options?.map((opt, i) => (
                            <SelectItem key={i} value={opt} className="text-base">
                              {opt}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}

                    {field.type === 'checkbox' && (
                      <div className="space-y-3 pt-2">
                        {field.options?.map((opt, i) => (
                          <div key={i} className="flex items-center space-x-2">
                            <Checkbox
                              id={`${field.id}-${i}`}
                              checked={(formData[field.id] || []).includes(opt)}
                              onCheckedChange={(checked) => {
                                const current = formData[field.id] || [];
                                if (checked) {
                                  handleInputChange(field.id, [...current, opt]);
                                } else {
                                  handleInputChange(
                                    field.id,
                                    current.filter((v: string) => v !== opt)
                                  );
                                }
                              }}
                            />
                            <Label
                              htmlFor={`${field.id}-${i}`}
                              className="text-base font-normal cursor-pointer"
                            >
                              {opt}
                            </Label>
                          </div>
                        ))}
                      </div>
                    )}

                    {field.type === 'radio' && (
                      <RadioGroup
                        value={formData[field.id] || ''}
                        onValueChange={(val) => handleInputChange(field.id, val)}
                        className="space-y-3 pt-2"
                      >
                        {field.options?.map((opt, i) => (
                          <div key={i} className="flex items-center space-x-2">
                            <RadioGroupItem value={opt} id={`${field.id}-${i}`} />
                            <Label
                              htmlFor={`${field.id}-${i}`}
                              className="text-base font-normal cursor-pointer"
                            >
                              {opt}
                            </Label>
                          </div>
                        ))}
                      </RadioGroup>
                    )}

                    {field.type === 'file' && (
                      <div className="flex items-center justify-center w-full">
                        <Label
                          htmlFor={`file-${field.id}`}
                          className="flex flex-col items-center justify-center w-full h-32 border-2 border-slate-300 border-dashed rounded-lg cursor-pointer bg-slate-50 hover:bg-slate-100 transition-colors"
                        >
                          <div className="flex flex-col items-center justify-center pt-5 pb-6">
                            <svg
                              className="w-8 h-8 mb-4 text-slate-500"
                              aria-hidden="true"
                              xmlns="http://www.w3.org/2000/svg"
                              fill="none"
                              viewBox="0 0 20 16"
                            >
                              <path
                                stroke="currentColor"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.017 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2"
                              />
                            </svg>
                            <p className="mb-2 text-sm text-slate-500">
                              <span className="font-semibold">Click to upload</span> or drag and
                              drop
                            </p>
                            <p className="text-xs text-slate-500">
                              {formData[field.id] instanceof File ? (
                                <span className="text-primary font-medium">
                                  {formData[field.id].name}
                                </span>
                              ) : (
                                'Any file type'
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
                      <DatePicker
                        value={formData[field.id]}
                        onChange={(date) => {
                          handleInputChange(field.id, date);
                          // Ensure uncontrolled state sync if needed, though DatePicker handles its own open state
                        }}
                        placeholder="Pick a date"
                      />
                    )}

                    {field.type === 'time' && (
                      <TimePicker
                        value={formData[field.id] || ''}
                        onChange={(val) => handleInputChange(field.id, val)}
                        placeholder="Pick a time"
                      />
                    )}

                    {field.type === 'rating' && (
                      <RadioGroup
                        value={formData[field.id]?.toString() || ''}
                        onValueChange={(val) => handleInputChange(field.id, val)}
                        className="w-full pt-4 overflow-x-auto"
                      >
                        <div className="flex items-end justify-between min-w-[300px] gap-4">
                          {/* Min Label */}
                          <div className="flex flex-col justify-end pb-1 w-20">
                            {field.ratingConfig?.minLabel && (
                              <span className="text-sm text-gray-500 font-medium leading-tight">
                                {field.ratingConfig.minLabel}
                              </span>
                            )}
                          </div>

                          {/* Scale */}
                          <div className="flex justify-center gap-3 sm:gap-6 flex-1 px-2">
                            {Array.from(
                              {
                                length:
                                  (field.ratingConfig?.max || 5) -
                                  (field.ratingConfig?.min || 1) +
                                  1,
                              },
                              (_, i) => i + (field.ratingConfig?.min || 1)
                            ).map((val) => (
                              <div key={val} className="flex flex-col items-center gap-3">
                                <Label
                                  htmlFor={`${field.id}-${val}`}
                                  className="text-sm font-medium cursor-pointer text-gray-600"
                                >
                                  {val}
                                </Label>
                                <RadioGroupItem
                                  value={val.toString()}
                                  id={`${field.id}-${val}`}
                                  className="h-6 w-6 border-slate-300 text-primary data-[state=checked]:border-primary"
                                />
                              </div>
                            ))}
                          </div>

                          {/* Max Label */}
                          <div className="flex flex-col justify-end pb-1 w-20 text-right">
                            {field.ratingConfig?.maxLabel && (
                              <span className="text-sm text-gray-500 font-medium leading-tight">
                                {field.ratingConfig.maxLabel}
                              </span>
                            )}
                          </div>
                        </div>
                      </RadioGroup>
                    )}
                    {field.type === 'product' && (
                      <div className="space-y-4 pt-2">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {field.products?.map((product) => {
                            const selectedProducts = formData[field.id] || [];
                            const selectedProduct = selectedProducts.find(
                              // eslint-disable-next-line @typescript-eslint/no-explicit-any
                              (p: any) => p.id === product.id
                            );
                            const isSelected = !!selectedProduct;
                            const quantity = selectedProduct?.quantity || 0;

                            const updateQuantity = (newQty: number) => {
                              const current = formData[field.id] || [];
                              if (newQty <= 0) {
                                // Remove product
                                handleInputChange(
                                  field.id,
                                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                  current.filter((p: any) => p.id !== product.id)
                                );
                              } else {
                                const productData = {
                                  id: product.id,
                                  name: product.name,
                                  price: product.price,
                                  currency: product.currency,
                                  quantity: newQty,
                                };
                                if (isSelected) {
                                  // Update quantity
                                  handleInputChange(
                                    field.id,
                                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                    current.map((p: any) => (p.id === product.id ? productData : p))
                                  );
                                } else {
                                  // Add product
                                  handleInputChange(field.id, [...current, productData]);
                                }
                              }
                            };

                            return (
                              <div
                                key={product.id}
                                className={cn(
                                  'relative group border rounded-lg overflow-hidden transition-all duration-200',
                                  isSelected
                                    ? 'border-primary ring-1 ring-primary bg-primary/5'
                                    : 'border-slate-200 hover:border-slate-300 hover:shadow-sm'
                                )}
                              >
                                <div
                                  className="aspect-[4/3] w-full bg-slate-100 relative overflow-hidden cursor-pointer"
                                  onClick={() => {
                                    if (!isSelected) {
                                      updateQuantity(1);
                                    }
                                  }}
                                >
                                  {product.imageUrl ? (
                                    /* eslint-disable-next-line @next/next/no-img-element */
                                    <img
                                      src={product.imageUrl}
                                      alt={product.name}
                                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                                    />
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center text-slate-400">
                                      <span className="text-xs">No Image</span>
                                    </div>
                                  )}
                                  <div className="absolute top-2 right-2">
                                    <div
                                      className={cn(
                                        'h-6 w-6 rounded-full border border-white shadow-sm flex items-center justify-center transition-colors',
                                        isSelected
                                          ? 'bg-primary border-primary'
                                          : 'bg-white/80 backdrop-blur-sm'
                                      )}
                                    >
                                      {isSelected && (
                                        <CheckCircle2 className="h-4 w-4 text-white" />
                                      )}
                                    </div>
                                  </div>
                                </div>
                                <div className="p-3">
                                  <div className="font-medium text-gray-900 leading-tight mb-1">
                                    {product.name}
                                  </div>
                                  <div className="flex items-center justify-between">
                                    <div className="text-sm font-semibold text-primary">
                                      {product.currency} {product.price.toFixed(2)}
                                    </div>
                                    {/* Quantity Controls */}
                                    <div className="flex items-center gap-2">
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          updateQuantity(quantity - 1);
                                        }}
                                        className={cn(
                                          'h-7 w-7 rounded-full flex items-center justify-center text-sm font-bold transition-colors',
                                          isSelected
                                            ? 'bg-primary/10 text-primary hover:bg-primary/20'
                                            : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                                        )}
                                        disabled={!isSelected}
                                      >
                                        −
                                      </button>
                                      <span
                                        className={cn(
                                          'w-6 text-center font-semibold text-sm',
                                          isSelected ? 'text-gray-900' : 'text-slate-400'
                                        )}
                                      >
                                        {quantity}
                                      </span>
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          updateQuantity(quantity + 1);
                                        }}
                                        className="h-7 w-7 rounded-full bg-primary text-white flex items-center justify-center text-sm font-bold hover:bg-primary/90 transition-colors"
                                      >
                                        +
                                      </button>
                                    </div>
                                  </div>
                                  {/* Subtotal */}
                                  {isSelected && quantity > 0 && (
                                    <div className="mt-2 pt-2 border-t border-slate-100">
                                      <div className="text-xs text-slate-500 flex justify-between">
                                        <span>Subtotal:</span>
                                        <span className="font-semibold text-gray-900">
                                          {product.currency} {(product.price * quantity).toFixed(2)}
                                        </span>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
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

        {(!form.userTier || form.userTier === 'free') && (
          <div className="mt-8 pb-8 text-center">
            <Link
              href="/"
              target="_blank"
              className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-gray-900 transition-colors"
            >
              <span>Powered by</span>
              <span className="font-semibold">KlikForm</span>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
