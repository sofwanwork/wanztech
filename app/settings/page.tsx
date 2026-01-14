'use client'

import { useState, useEffect, useRef, Suspense } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { toast } from 'sonner';
import { ExternalLink, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { saveSettingsAction, getSettingsAction } from '@/actions/form';

import { useRouter, useSearchParams } from 'next/navigation';

function SettingsContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [loading, setLoading] = useState(true);
    const [email, setEmail] = useState('');
    const [personalEmail, setPersonalEmail] = useState('');
    const [key, setKey] = useState('');
    const [folderId, setFolderId] = useState('');
    const hasShownError = useRef(false);

    useEffect(() => {
        // Check for error param
        if (searchParams.get('error') === 'missing_config' && !hasShownError.current) {
            toast.error('Please configure your settings first before creating a form.');
            hasShownError.current = true;
        }

        getSettingsAction().then(settings => {
            if (settings) {
                if (settings.googleClientEmail) setEmail(settings.googleClientEmail);
                if (settings.userPersonalEmail) setPersonalEmail(settings.userPersonalEmail);
                if (settings.googlePrivateKey) setKey(settings.googlePrivateKey);
                if (settings.googleDriveFolderId) setFolderId(settings.googleDriveFolderId);
            }
            setLoading(false);
        });
    }, []);

    const handleSave = async () => {
        try {
            await saveSettingsAction({
                googleClientEmail: email,
                userPersonalEmail: personalEmail,
                googlePrivateKey: key,
                googleDriveFolderId: folderId
            });
            toast.success('Settings saved successfully');
            router.push('/');
        } catch {
            toast.error('Failed to save settings');
        }
    };

    if (loading) return <div className="min-h-screen bg-gray-50 flex items-center justify-center text-gray-500">Loading...</div>;

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="container mx-auto py-8 px-4 max-w-2xl">
                {/* Header with Back Button */}
                <div className="flex items-center gap-3 mb-6">
                    <Link href="/">
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-xl font-semibold text-gray-900">Settings</h1>
                        <p className="text-sm text-gray-500">Configure your integrations</p>
                    </div>
                </div>

                <Card className="border border-gray-200 bg-white">
                    <CardHeader className="border-b border-gray-100">
                        <CardTitle className="text-base font-semibold">Google Sheets Integration</CardTitle>
                        <CardDescription className="text-sm">Connect your forms to Google Sheets.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label>Google Service Account Email</Label>
                            <Input
                                placeholder="example@project-id.iam.gserviceaccount.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Your Personal Email (For Auto-Share)</Label>
                            <Input
                                placeholder="your.email@gmail.com"
                                value={personalEmail}
                                onChange={(e) => setPersonalEmail(e.target.value)}
                            />
                            <p className="text-xs text-muted-foreground">
                                Required for "Auto-Create Sheet". The bot will share new sheets with this email.
                            </p>
                        </div>
                        <div className="space-y-2">
                            <Label>Google Drive Folder ID (Optional)</Label>
                            <Input
                                placeholder="1-D7dlraZiTG7zOjqi5LVt7mJaTr1i8az"
                                value={folderId}
                                onChange={(e) => setFolderId(e.target.value)}
                            />
                            <p className="text-xs text-muted-foreground">
                                Open the folder in Google Drive and copy the ID from the URL (e.g. drive.google.com/drive/folders/<b>ID_HERE</b>). Leave empty for root.
                            </p>
                        </div>
                        <div className="space-y-2">
                            <Label>Google Private Key</Label>
                            <Textarea
                                placeholder="-----BEGIN PRIVATE KEY-----\n..."
                                className="font-mono text-xs min-h-[150px]"
                                value={key}
                                onChange={(e) => setKey(e.target.value)}
                            />
                            <p className="text-xs text-muted-foreground">
                                Copy the entire private key from your service account JSON file.
                            </p>
                        </div>
                    </CardContent>
                    <CardFooter>
                        <Button onClick={handleSave}>Save Settings</Button>
                    </CardFooter>
                </Card>

                <Card className="mt-8">
                    <CardHeader>
                        <CardTitle>Setup Guide</CardTitle>
                        <CardDescription>Step-by-step instructions to configure your Google Sheets integration.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Accordion type="single" collapsible className="w-full">
                            <AccordionItem value="item-1">
                                <AccordionTrigger>Step 1: Create Google Service Account</AccordionTrigger>
                                <AccordionContent>
                                    <ol className="list-decimal list-inside space-y-2">
                                        <li>Go to the <a href="https://console.cloud.google.com/" target="_blank" className="text-blue-500 hover:underline inline-flex items-center">Google Cloud Console <ExternalLink className="h-3 w-3 ml-1" /></a>.</li>
                                        <li>Create a new project (or select an existing one).</li>
                                        <li>Enable <strong>Google Sheets API</strong> and <strong>Google Drive API</strong> from the "APIs & Services" &gt; "Library" menu.</li>
                                        <li>Go to "APIs & Services" &gt; "Credentials" &gt; "Create Credentials" &gt; "Service Account".</li>
                                        <li>Fill in a name (e.g., "form-bot") and click Create.</li>
                                        <li>Copy the generated <strong>Service Account Email</strong> (ends with <code>@project-id.iam.gserviceaccount.com</code>) and paste it into the settings above.</li>
                                    </ol>
                                </AccordionContent>
                            </AccordionItem>
                            <AccordionItem value="item-2">
                                <AccordionTrigger>Step 2: Get Private Key</AccordionTrigger>
                                <AccordionContent>
                                    <ol className="list-decimal list-inside space-y-2">
                                        <li>In the Google Cloud Console, click on your newly created Service Account email.</li>
                                        <li>Go to the <strong>Keys</strong> tab.</li>
                                        <li>Click "Add Key" &gt; "Create new key" &gt; Select <strong>JSON</strong> &gt; Create.</li>
                                        <li>A JSON file will download. Open it with a text editor (Notepad, VS Code, etc.).</li>
                                        <li>Copy the entire content of the <code>private_key</code> field (starts with <code>-----BEGIN PRIVATE KEY-----</code>) and paste it into the "Google Private Key" field above.</li>
                                    </ol>
                                </AccordionContent>
                            </AccordionItem>
                            <AccordionItem value="item-3">
                                <AccordionTrigger>Step 3: Setup Google Drive Folder (Optional)</AccordionTrigger>
                                <AccordionContent>
                                    <ol className="list-decimal list-inside space-y-2">
                                        <li>Go to Google Drive and create a new folder where you want your sheets to be stored.</li>
                                        <li>Open the folder. Look at the URL in your browser bar.</li>
                                        <li>It will look like <code>drive.google.com/drive/folders/<b>1-D7dlraZiTG...</b></code>.</li>
                                        <li>Copy that ID string (the bold part) and paste it into the "Google Drive Folder ID" field.</li>
                                        <li><strong>Important:</strong> You must <strong>Share</strong> this folder with your Service Account Email (from Step 1) so the bot can write to it.</li>
                                    </ol>
                                </AccordionContent>
                            </AccordionItem>
                        </Accordion>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

export default function SettingsPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-gray-50 flex items-center justify-center text-gray-500">Loading...</div>}>
            <SettingsContent />
        </Suspense>
    );
}
