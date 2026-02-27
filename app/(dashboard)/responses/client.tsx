'use client';

import { Form } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ExternalLink, FileSpreadsheet, Search, Plus, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useState, useTransition } from 'react';
import { createSheetForFormAction } from '@/actions/sheets';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

interface ResponsesClientProps {
    forms: Form[];
    hasGoogleOAuth?: boolean;
}

export function ResponsesClient({ forms, hasGoogleOAuth }: ResponsesClientProps) {
    const [query, setQuery] = useState('');
    const [creatingForForm, setCreatingForForm] = useState<string | null>(null);
    const [isPending, startTransition] = useTransition();
    const router = useRouter();

    const filtered = forms.filter(
        (f) =>
            f.title.toLowerCase().includes(query.toLowerCase()) ||
            (f.googleSheetUrl && f.googleSheetUrl.toLowerCase().includes(query.toLowerCase()))
    );

    function handleCreateSheet(formId: string) {
        setCreatingForForm(formId);
        startTransition(async () => {
            const result = await createSheetForFormAction(formId);
            if (result.success) {
                toast.success('Google Sheet created and linked!');
                router.refresh();
            } else {
                toast.error(result.error || 'Failed to create sheet');
            }
            setCreatingForForm(null);
        });
    }

    return (
        <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Responses</h1>
                <p className="text-gray-500 mt-2 text-sm">
                    View form responses via Google Sheets.
                </p>
            </div>

            {forms.length > 3 && (
                <div className="relative max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                        id="responses-search"
                        name="responses-search"
                        placeholder="Search forms..."
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        className="pl-9"
                    />
                </div>
            )}

            {filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-24 border-2 border-dashed border-gray-200 rounded-2xl bg-gray-50/50">
                    <div className="h-20 w-20 bg-white rounded-2xl flex items-center justify-center mb-6 shadow-sm border border-gray-100">
                        <FileSpreadsheet className="h-10 w-10 text-gray-400" />
                    </div>
                    <h3 className="text-xl font-semibold mb-2 text-gray-900">
                        {query ? 'No matches found' : 'No forms yet'}
                    </h3>
                    <p className="text-gray-500 text-sm text-center max-w-sm">
                        {query
                            ? `No forms matching "${query}".`
                            : 'Create a form and link a Google Sheet to view responses here.'}
                    </p>
                </div>
            ) : (
                <div className="space-y-3">
                    {filtered.map((form) => (
                        <Card
                            key={form.id}
                            className="border border-gray-200 bg-white hover:shadow-md transition-shadow"
                        >
                            <CardHeader className="pb-2 pt-4 px-5">
                                <CardTitle className="text-base font-semibold text-gray-900 truncate">
                                    {form.title}
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="px-5 pb-4">
                                {form.googleSheetUrl ? (
                                    <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs text-gray-400 mb-1">Google Sheet</p>
                                            <p className="text-sm text-gray-600 truncate font-mono">
                                                {form.googleSheetUrl}
                                            </p>
                                        </div>
                                        <a
                                            href={form.googleSheetUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                        >
                                            <Button
                                                size="sm"
                                                className="gap-1.5 bg-green-600 hover:bg-green-700 text-white shrink-0 w-full sm:w-auto"
                                            >
                                                <FileSpreadsheet className="h-4 w-4" />
                                                Open Sheet
                                                <ExternalLink className="h-3 w-3" />
                                            </Button>
                                        </a>
                                    </div>
                                ) : (
                                    <div className="flex items-center justify-between">
                                        <p className="text-sm text-gray-400 italic">
                                            No Google Sheet linked.
                                        </p>
                                        {hasGoogleOAuth && (
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                className="gap-1.5 text-primary border-primary/30 hover:bg-primary/5 shrink-0"
                                                onClick={() => handleCreateSheet(form.id)}
                                                disabled={isPending && creatingForForm === form.id}
                                            >
                                                {isPending && creatingForForm === form.id ? (
                                                    <Loader2 className="h-4 w-4 animate-spin" />
                                                ) : (
                                                    <Plus className="h-4 w-4" />
                                                )}
                                                Create Sheet
                                            </Button>
                                        )}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
