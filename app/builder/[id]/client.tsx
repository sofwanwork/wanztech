
'use client'

import { useState, useEffect } from 'react';
import { Form } from '@/lib/storage';
import { updateFormAction, deleteFormAction } from '@/actions/form';
import { FieldsEditor } from '@/components/fields-editor';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RichTextEditor } from '@/components/ui/rich-text-editor';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, Save, Trash, ExternalLink, Download, Copy } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import { QRCodeSVG } from 'qrcode.react';
import { getProxiedImageUrl } from '@/lib/utils';

interface BuilderClientProps {
    initialForm: Form;
}

export function BuilderClient({ initialForm }: BuilderClientProps) {
    const [form, setForm] = useState<Form>(initialForm);
    const [saving, setSaving] = useState(false);

    const [mounted, setMounted] = useState(false);
    const [publicUrl, setPublicUrl] = useState(`/form/${initialForm.id}`);

    useEffect(() => {
        setMounted(true);
        if (form.shortCode) {
            setPublicUrl(`${window.location.origin}/s/${form.shortCode}`);
        } else {
            setPublicUrl(`${window.location.origin}/form/${form.id}`);
        }
    }, [form.id, form.shortCode]);

    const handleSave = async () => {
        setSaving(true);
        try {
            await updateFormAction(form);
            toast.success('Form saved successfully');
        } catch {
            toast.error('Failed to save');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (confirm('Are you sure you want to delete this form?')) {
            await deleteFormAction(form.id);
        }
    };



    const downloadQR = () => {
        const svg = document.getElementById("form-qr-code");
        if (svg) {
            const svgData = new XMLSerializer().serializeToString(svg);
            const canvas = document.createElement("canvas");
            const ctx = canvas.getContext("2d");
            const img = new Image();
            img.onload = () => {
                canvas.width = img.width;
                canvas.height = img.height;
                ctx?.drawImage(img, 0, 0);
                const pngFile = canvas.toDataURL("image/png");
                const downloadLink = document.createElement("a");
                downloadLink.download = `${form.title}-qr.png`;
                downloadLink.href = pngFile;
                downloadLink.click();
            };
            img.src = "data:image/svg+xml;base64," + btoa(svgData);
        }
    };

    const copyToClipboard = async (text: string): Promise<boolean> => {
        // Try modern clipboard API first
        if (navigator.clipboard && window.isSecureContext) {
            try {
                await navigator.clipboard.writeText(text);
                return true;
            } catch {
                // Fall through to legacy method
            }
        }
        // Legacy fallback using textarea
        const textArea = document.createElement("textarea");
        textArea.value = text;
        textArea.style.position = "fixed";
        textArea.style.left = "-999999px";
        textArea.style.top = "-999999px";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        try {
            document.execCommand('copy');
            document.body.removeChild(textArea);
            return true;
        } catch {
            document.body.removeChild(textArea);
            return false;
        }
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="sticky top-0 bg-white border-b border-gray-200 z-10">
                <div className="container mx-auto py-3 px-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Link href="/">
                            <Button variant="ghost" size="icon" className="h-8 w-8"><ArrowLeft className="h-4 w-4" /></Button>
                        </Link>
                        <div>
                            <h1 className="text-lg font-semibold text-gray-900 truncate max-w-[200px] md:max-w-md">{form.title}</h1>
                            <p className="text-xs text-gray-500">Editing Form</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Link href={form.shortCode ? `/s/${form.shortCode}` : `/form/${form.id}`} target="_blank">
                            <Button variant="outline" size="sm">
                                <ExternalLink className="mr-2 h-4 w-4" />
                                Preview
                            </Button>
                        </Link>
                        <Button variant="outline" size="sm" onClick={handleDelete} className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200">
                            <Trash className="h-4 w-4" />
                        </Button>
                        <Button onClick={handleSave} disabled={saving} className="bg-primary hover:bg-primary/90">
                            <Save className="mr-2 h-4 w-4" />
                            {saving ? 'Saving...' : 'Save Changes'}
                        </Button>
                    </div>
                </div>
            </header>

            <main className="container mx-auto py-6 px-4">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left: Form Settings & Fields */}
                    <div className="lg:col-span-2 space-y-6">
                        <Card className="border border-gray-200 bg-white">
                            <CardHeader>
                                <CardTitle>General Info</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label>Form Title</Label>
                                    <Input
                                        value={form.title}
                                        onChange={(e) => setForm(f => ({ ...f, title: e.target.value }))}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Description</Label>
                                    <RichTextEditor
                                        value={form.description || ''}
                                        onChange={(value) => setForm(f => ({ ...f, description: value }))}
                                        placeholder="Enter form description..."
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Cover Image URL</Label>
                                    <Input
                                        placeholder="https://example.com/poster.jpg"
                                        value={form.coverImage || ''}
                                        onChange={(e) => setForm(f => ({ ...f, coverImage: e.target.value }))}
                                    />
                                    {form.coverImage && (
                                        <div className="mt-2 aspect-video rounded-md bg-cover bg-center border" style={{ backgroundImage: `url(${getProxiedImageUrl(form.coverImage)})` }} />
                                    )}
                                </div>
                                <div className="space-y-2">
                                    <Label>Google Sheet Share URL</Label>
                                    <Input
                                        placeholder="https://docs.google.com/spreadsheets/d/..."
                                        value={form.googleSheetUrl || ''}
                                        onChange={(e) => setForm(f => ({ ...f, googleSheetUrl: e.target.value }))}
                                    />
                                    <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg text-sm">
                                        <p className="font-medium text-blue-800 dark:text-blue-200 mb-2">How to link your Google Sheet:</p>
                                        <ol className="list-decimal list-inside space-y-1 text-blue-700 dark:text-blue-300 text-xs">
                                            <li>Create a new Google Sheet.</li>
                                            <li>Click <strong>Share</strong> &gt; Add the Service Account email below as <strong>Editor</strong>.</li>
                                            <li>Copy and paste the Google Sheet URL above.</li>
                                        </ol>
                                        <div className="mt-3 flex items-center gap-2">
                                            <Button
                                                type="button"
                                                size="sm"
                                                variant="outline"
                                                className="bg-white dark:bg-gray-800"
                                                onClick={async () => {
                                                    try {
                                                        const res = await fetch('/api/service-email');
                                                        if (res.ok) {
                                                            const { email } = await res.json();
                                                            const copied = await copyToClipboard(email);
                                                            if (copied) {
                                                                toast.success('Service Account Email copied!');
                                                            } else {
                                                                toast.info(`Email: ${email}`, { duration: 10000 });
                                                            }
                                                        } else {
                                                            toast.error('Please configure your settings first.');
                                                        }
                                                    } catch {
                                                        toast.error('Failed to fetch service email.');
                                                    }
                                                }}
                                            >
                                                <Copy className="h-3 w-3 mr-1" />
                                                Copy Service Email
                                            </Button>
                                            <span className="text-xs text-muted-foreground">Paste this into Google Sheet Share</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label>Custom Thank You Message</Label>
                                    <Textarea
                                        placeholder="Thank you for your submission! We will get back to you soon."
                                        value={form.thankYouMessage || ''}
                                        onChange={(e) => setForm(f => ({ ...f, thankYouMessage: e.target.value }))}
                                    />
                                    <p className="text-xs text-muted-foreground">
                                        Optional. Leave blank to show the default message.
                                    </p>
                                </div>
                            </CardContent>
                        </Card>

                        <Separator />
                        <h2 className="text-xl font-semibold">Form Fields</h2>
                        <FieldsEditor
                            fields={form.fields}
                            onChange={(fields) => setForm(f => ({ ...f, fields }))}
                        />
                    </div>

                    {/* Right: QR Code & Analysis (Placeholder) */}
                    <div className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Share</CardTitle>
                                <CardDescription>Distribute your form</CardDescription>
                            </CardHeader>
                            <CardContent className="flex flex-col items-center gap-4">
                                <div className="p-4 bg-white rounded-lg shadow-sm border">
                                    {mounted && (
                                        <QRCodeSVG
                                            id="form-qr-code"
                                            value={publicUrl}
                                            size={200}
                                            level="H"
                                            includeMargin
                                        />
                                    )}
                                </div>
                                <div className="text-center">
                                    <p className="text-sm text-muted-foreground break-all">{publicUrl}</p>
                                </div>
                                <Button variant="outline" className="w-full" onClick={downloadQR}>
                                    <Download className="mr-2 h-4 w-4" />
                                    Download QR
                                </Button>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </main>
        </div>
    );
}
