import { RefObject } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
    Type,
    Image as ImageIcon,
    Square,
    UserCheck,
    FileText,
    Calendar,
    Star,
    QrCode,
    Trash2,
} from 'lucide-react';
import { CertificateElement, CertificateTemplate } from '@/lib/types';
import { createClient } from '@/utils/supabase/client';
import { compressImage } from '@/utils/image-compression';
import { v4 as uuidv4 } from 'uuid';
import { toast } from 'sonner';

interface CertificateEditorSidebarProps {
    addElement: (type: CertificateElement['type'], extra?: Partial<CertificateElement>) => void;
    imageInputRef: RefObject<HTMLInputElement | null>;
    template: CertificateTemplate;
    onUpdateTemplate: (updates: Partial<CertificateTemplate>) => void;
}

export function CertificateEditorSidebar({
    addElement,
    imageInputRef,
    template,
    onUpdateTemplate,
}: CertificateEditorSidebarProps) {
    const handleBackgroundUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.size > 10 * 1024 * 1024) {
            toast.error('Image too large. Max 10MB.');
            return;
        }

        const toastId = toast.loading('Memuat naik gambar latar...');

        try {
            const compressedFile = await compressImage(file, 0.7);
            const supabase = createClient();
            const {
                data: { user },
            } = await supabase.auth.getUser();

            if (!user) {
                toast.error('Please login first', { id: toastId });
                return;
            }

            const dir = user.id;
            const fileExt = file.name.split('.').pop() || 'png';
            const fileName = `${uuidv4()}.${fileExt}`;
            const filePath = `${dir}/${fileName}`;

            // Cleanup old background if it's from our storage
            if (template.backgroundImage && template.backgroundImage.includes('certificate_backgrounds')) {
                try {
                    const parts = template.backgroundImage.split('/certificate_backgrounds/');
                    if (parts.length === 2) {
                        await supabase.storage.from('certificate_backgrounds').remove([parts[1]]);
                    }
                } catch (err) {
                    console.warn('Failed to cleanup old background:', err);
                }
            }

            const { error: uploadError } = await supabase.storage
                .from('certificate_backgrounds')
                .upload(filePath, compressedFile, {
                    cacheControl: '3600',
                    upsert: false,
                });

            if (uploadError) throw uploadError;

            const {
                data: { publicUrl },
            } = supabase.storage.from('certificate_backgrounds').getPublicUrl(filePath);

            onUpdateTemplate({ backgroundImage: publicUrl });
            toast.success('Gambar latar berjaya dimuat naik!', { id: toastId });
        } catch (error) {
            console.error('Upload error:', error);
            toast.error('Gagal memuat naik gambar.', { id: toastId });
        }
        // clear input
        e.target.value = '';
    };

    const handleDeleteBackground = async () => {
        const url = template.backgroundImage;
        if (url?.includes('certificate_backgrounds')) {
            try {
                const supabase = createClient();
                const parts = url.split('/certificate_backgrounds/');
                if (parts.length === 2) {
                    await supabase.storage.from('certificate_backgrounds').remove([parts[1]]);
                }
            } catch (e) {
                console.warn('Failed to delete background:', e);
            }
        }
        onUpdateTemplate({ backgroundImage: undefined });
    };

    return (
        <div className="w-64 bg-white border-r p-4 space-y-6 overflow-y-auto hidden md:block">
            {/* Tambah Elemen Section */}
            <div>
                <Label className="text-xs text-gray-500 uppercase tracking-wider">Tambah Elemen</Label>
                <div className="grid grid-cols-2 gap-2 mt-2">
                    <Button
                        variant="outline"
                        size="sm"
                        className="flex-col h-16 gap-1"
                        onClick={() => addElement('text')}
                    >
                        <Type className="h-5 w-5" />
                        <span className="text-xs">Teks</span>
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        className="flex-col h-16 gap-1"
                        onClick={() => imageInputRef.current?.click()}
                    >
                        <ImageIcon className="h-5 w-5" />
                        <span className="text-xs">Gambar</span>
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        className="flex-col h-16 gap-1"
                        onClick={() =>
                            addElement('shape', {
                                shapeType: 'rectangle',
                                fill: '#e5e7eb',
                                width: 100,
                                height: 100,
                            })
                        }
                    >
                        <Square className="h-5 w-5" />
                        <span className="text-xs">Bentuk</span>
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        className="flex-col h-16 gap-1"
                        onClick={() =>
                            addElement('shape', {
                                shapeType: 'line',
                                fill: '#000000',
                                width: 200,
                                height: 2,
                            })
                        }
                    >
                        <div className="h-0.5 w-6 bg-current" />
                        <span className="text-xs">Garisan</span>
                    </Button>
                </div>
            </div>

            {/* Placeholder Data Section */}
            <div>
                <Label className="text-xs text-gray-500 uppercase tracking-wider">Placeholder Data</Label>
                <div className="grid grid-cols-1 gap-2 mt-2">
                    <Button
                        variant="outline"
                        size="sm"
                        className="justify-start gap-2"
                        onClick={() =>
                            addElement('placeholder', {
                                placeholderType: 'name',
                                fontSize: 36,
                                fontWeight: 'bold',
                                width: 400,
                                height: 50,
                            })
                        }
                    >
                        <UserCheck className="h-4 w-4" />
                        Nama Peserta
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        className="justify-start gap-2"
                        onClick={() =>
                            addElement('placeholder', {
                                placeholderType: 'program',
                                fontSize: 24,
                                width: 300,
                                height: 40,
                            })
                        }
                    >
                        <FileText className="h-4 w-4" />
                        Nama Program
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        className="flex-col h-16 gap-1"
                        onClick={() =>
                            addElement('icon', { iconName: 'Star', stroke: '#000000', strokeWidth: 2 })
                        }
                    >
                        <Star className="h-5 w-5" />
                        <span className="text-xs">Icon</span>
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        className="flex-col h-16 gap-1"
                        onClick={() => addElement('qr')}
                    >
                        <QrCode className="h-5 w-5" />
                        <span className="text-xs">QR Code</span>
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        className="justify-start gap-2"
                        onClick={() =>
                            addElement('placeholder', {
                                placeholderType: 'date',
                                fontSize: 14,
                                width: 150,
                                height: 30,
                            })
                        }
                    >
                        <Calendar className="h-4 w-4" />
                        Tarikh
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        className="justify-start gap-2"
                        onClick={() =>
                            addElement('placeholder', {
                                placeholderType: 'expiry',
                                fontSize: 14,
                                width: 200,
                                height: 30,
                                color: '#666666',
                            })
                        }
                    >
                        <Calendar className="h-4 w-4" />
                        Tarikh Luput
                    </Button>
                </div>
            </div>

            {/* Latar Belakang Section */}
            <div>
                <Label className="text-xs text-gray-500 uppercase tracking-wider">Latar Belakang</Label>
                <div className="mt-2 space-y-4">
                    <div>
                        <Label className="text-sm">Warna Latar</Label>
                        <div className="flex items-center gap-2 mt-1">
                            <input
                                type="color"
                                value={template.backgroundColor}
                                onChange={(e) => onUpdateTemplate({ backgroundColor: e.target.value })}
                                className="w-10 h-10 rounded cursor-pointer border shadow-sm"
                            />
                            <Input
                                value={template.backgroundColor}
                                onChange={(e) => onUpdateTemplate({ backgroundColor: e.target.value })}
                                className="flex-1 font-mono"
                            />
                        </div>
                    </div>

                    <div>
                        <Label className="text-sm">Gambar Latar</Label>
                        <label className="block mt-1">
                            <input
                                type="file"
                                accept="image/png,image/jpeg,image/webp"
                                onChange={handleBackgroundUpload}
                                className="w-full text-xs file:mr-2 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20 cursor-pointer border rounded-md"
                            />
                        </label>
                        <p className="text-xs text-gray-400 mt-1">PNG, JPG, WebP. Maks 10MB.</p>

                        {template.backgroundImage && (
                            <div className="relative mt-2 group">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                    src={template.backgroundImage}
                                    alt="Background preview"
                                    className="w-full h-24 object-cover rounded border"
                                />
                                <Button
                                    variant="destructive"
                                    size="icon"
                                    className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                                    onClick={handleDeleteBackground}
                                >
                                    <Trash2 className="h-3 w-3" />
                                </Button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
