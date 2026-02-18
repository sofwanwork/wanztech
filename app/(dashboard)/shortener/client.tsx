'use client';

import { useState } from 'react';
import { useFormStatus } from 'react-dom';
import { createShortLinkAction, deleteShortLinkAction } from '@/actions/short-links';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { DialogFooter } from '@/components/ui/dialog';
import { TableCell, TableRow } from '@/components/ui/table';
import { Trash2, ExternalLink, Copy, Link as LinkIcon, Check } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

export function CreateLinkForm({ onSuccess }: { onSuccess?: () => void }) {
    const [error, setError] = useState<string | null>(null);

    async function clientAction(formData: FormData) {
        const res = await createShortLinkAction({}, formData);
        if (res.error) {
            setError(res.error);
            toast.error(res.error);
        } else {
            setError(null);
            toast.success('Short link created successfully!');
            // Ideally close dialog here
        }
    }

    return (
        <form action={clientAction} className="grid gap-6 py-4">
            <div className="space-y-2">
                <Label htmlFor="originalUrl">Destination URL</Label>
                <Input
                    id="originalUrl"
                    name="originalUrl"
                    placeholder="https://example.com/very-long-url..."
                    required
                    className="h-10"
                />
                <p className="text-xs text-muted-foreground">The long URL you want to shorten.</p>
            </div>

            <div className="space-y-2">
                <Label htmlFor="slug">Short Code (Optional)</Label>
                <div className="flex items-center">
                    <div className="bg-muted px-3 h-10 flex items-center border border-r-0 rounded-l-md text-sm text-muted-foreground whitespace-nowrap">
                        {typeof window !== 'undefined' ? window.location.host : 'klikform.com'}/s/
                    </div>
                    <Input
                        id="slug"
                        name="slug"
                        placeholder="custom-alias"
                        className="rounded-l-none h-10"
                        required
                    />
                </div>
                <p className="text-xs text-muted-foreground">Customize your short link back-half.</p>
            </div>

            {error && (
                <div className="bg-red-50 text-red-600 text-sm p-3 rounded-md border border-red-100">
                    {error}
                </div>
            )}

            <DialogFooter>
                <SubmitButton />
            </DialogFooter>
        </form>
    );
}

function SubmitButton() {
    const { pending } = useFormStatus();
    return (
        <Button type="submit" disabled={pending} className="w-full sm:w-auto">
            {pending ? 'Creating...' : 'Create Short Link'}
        </Button>
    );
}

interface ShortLink {
    id: string;
    user_id: string;
    slug: string;
    original_url: string;
    clicks: number;
    created_at: string;
}

export function ShortLinkRow({ link }: { link: ShortLink }) {
    const shortUrl = `${window.location.origin}/s/${link.slug}`;
    const [isDeleting, setIsDeleting] = useState(false);
    const [copied, setCopied] = useState(false);

    const copyToClipboard = () => {
        navigator.clipboard.writeText(shortUrl);
        setCopied(true);
        toast.success('Link copied to clipboard');
        setTimeout(() => setCopied(false), 2000);
    };

    const handleDelete = async () => {
        if (!confirm('Are you sure you want to delete this link?')) return;
        setIsDeleting(true);
        const res = await deleteShortLinkAction(link.id);
        if (res.error) {
            toast.error(res.error);
            setIsDeleting(false);
        } else {
            toast.success('Link deleted');
        }
    };

    return (
        <TableRow className="group">
            <TableCell className="font-medium max-w-[300px]" title={link.original_url}>
                <div className="truncate text-gray-500">
                    {link.original_url}
                </div>
            </TableCell>
            <TableCell>
                <div className="flex items-center gap-2">
                    <span className="text-primary font-semibold hover:underline cursor-pointer bg-primary/5 px-2 py-1 rounded-md" onClick={() => window.open(shortUrl, '_blank')}>
                        {link.slug}
                    </span>
                    <Button variant="ghost" size="icon" onClick={copyToClipboard} className="h-8 w-8 text-gray-400 hover:text-gray-900">
                        {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                    </Button>
                </div>
            </TableCell>
            <TableCell>
                <div className="flex items-center gap-1">
                    <span className="font-bold">{link.clicks}</span>
                    <span className="text-xs text-muted-foreground">clicks</span>
                </div>
            </TableCell>
            <TableCell className="text-muted-foreground text-sm">
                {format(new Date(link.created_at), 'MMM d, yyyy')}
            </TableCell>
            <TableCell className="text-right">
                <div className="flex justify-end gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                    <Button variant="ghost" size="sm" onClick={() => window.open(shortUrl, '_blank')} title="Visit Link">
                        <ExternalLink className="h-4 w-4 text-gray-500" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={handleDelete} className="text-red-500 hover:text-red-700 hover:bg-red-50" disabled={isDeleting} title="Delete Link">
                        <Trash2 className="h-4 w-4" />
                    </Button>
                </div>
            </TableCell>
        </TableRow>
    );
}
