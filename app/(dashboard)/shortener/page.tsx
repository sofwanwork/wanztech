import { getShortLinks } from '@/lib/storage/short-links';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Link as LinkIcon, MousePointerClick } from 'lucide-react';
import { CreateLinkForm, ShortLinkRow } from './client';

export default async function ShortenerPage() {
    const shortLinks = await getShortLinks();

    // Calculate stats
    const totalLinks = shortLinks.length;
    const totalClicks = shortLinks.reduce((acc, link) => acc + link.clicks, 0);

    return (
        <div className="space-y-8 max-w-6xl mx-auto py-6 px-4 md:px-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-gray-900">URL Shortener</h1>
                    <p className="text-muted-foreground mt-1">
                        Create short links, track clicks, and manage your URLs.
                    </p>
                </div>
                <CreateLinkDialog />
            </div>

            {/* Stats Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Links</CardTitle>
                        <LinkIcon className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{totalLinks}</div>
                        <p className="text-xs text-muted-foreground">Active short links</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Clicks</CardTitle>
                        <MousePointerClick className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{totalClicks}</div>
                        <p className="text-xs text-muted-foreground">Lifetime clicks across all links</p>
                    </CardContent>
                </Card>
            </div>

            <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
                <div className="p-6 border-b bg-gray-50/50">
                    <h2 className="font-semibold text-lg">Your Links</h2>
                </div>
                <div className="overflow-x-auto">
                    <Table className="min-w-[600px]">
                        <TableHeader>
                            <TableRow className="bg-gray-50/50 hover:bg-gray-50/50">
                                <TableHead className="w-[300px]">Original URL</TableHead>
                                <TableHead>Short Link</TableHead>
                                <TableHead>Clicks</TableHead>
                                <TableHead>Created At</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {shortLinks.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="h-32 text-center">
                                        <div className="flex flex-col items-center justify-center text-muted-foreground">
                                            <LinkIcon className="h-8 w-8 mb-2 opacity-20" />
                                            <p>No links created yet</p>
                                            <p className="text-xs">Create your first short link from the button above</p>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                shortLinks.map((link) => (
                                    <ShortLinkRow key={link.id} link={link} />
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>
            </div>
        </div>
    );
}

function CreateLinkDialog() {
    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button size="lg" className="shadow-sm">
                    <Plus className="mr-2 h-4 w-4" /> Create New Link
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Create Short Link</DialogTitle>
                    <DialogDescription>
                        Enter a long URL to shorten. We'll generate a short link for you.
                    </DialogDescription>
                </DialogHeader>
                <CreateLinkForm />
            </DialogContent>
        </Dialog>
    );
}
