'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  Plus,
  GraduationCap,
  Building2,
  BookOpen,
  Calendar,
  MoreHorizontal,
  Loader2,
  Sparkles,
  LayoutTemplate,
  CheckCircle2,
} from 'lucide-react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { createCertificateTemplateAction } from '@/actions/certificate-template';
import { CERTIFICATE_PRESETS } from '@/lib/certificates/presets';

interface NewCertificateDialogProps {
  children: React.ReactNode;
}

const CATEGORIES = [
  { id: 'school', label: 'School', description: 'Sijil sekolah & akademik', icon: GraduationCap },
  { id: 'corporate', label: 'Corporate', description: 'Sijil syarikat & bisnes', icon: Building2 },
  { id: 'training', label: 'Training', description: 'Sijil kursus & latihan', icon: BookOpen },
  { id: 'event', label: 'Event', description: 'Sijil pertandingan & acara', icon: Calendar },
  { id: 'other', label: 'Other', description: 'Kategori lain', icon: MoreHorizontal },
];

export function NewCertificateDialog({ children }: NewCertificateDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'presets' | 'categories'>('presets');
  const [selectedPreset, setSelectedPreset] = useState('royal-gold');
  const [selectedCategory, setSelectedCategory] = useState('other');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData();
    if (activeTab === 'presets') {
      formData.set('preset', selectedPreset);
      const chosen = CERTIFICATE_PRESETS.find((p) => p.id === selectedPreset);
      formData.set('category', chosen?.category || 'other');
    } else {
      formData.set('category', selectedCategory);
    }

    try {
      const result = await createCertificateTemplateAction(formData);
      if (result?.error) {
        toast.error('Gagal membina sijil', {
          description: result.error,
        });
        setLoading(false);
      } else if (result?.success && result.id) {
        toast.success('Sijil berjaya dicipta!');
        router.push(`/certificates/builder/${result.id}`);
      }
    } catch (error) {
      console.error('Submit error:', error);
      toast.error('Ralat sistem', {
        description: 'Sistem mengalami gangguan pautan. Sila refresh semula.',
      });
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-2xl max-h-[90dvh] flex flex-col">
        <DialogHeader className="shrink-0">
          <DialogTitle className="text-xl flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-amber-500" />
            Cipta Sijil Baharu
          </DialogTitle>
          <DialogDescription>
            Pilih templat pra-bina siap guna atau bermula dengan kategori kosong.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <Tabs
            value={activeTab}
            onValueChange={(val) => setActiveTab(val as 'presets' | 'categories')}
            className="flex-1 flex flex-col overflow-hidden"
          >
            <TabsList className="grid grid-cols-2 w-full mb-4 shrink-0">
              <TabsTrigger value="presets" className="gap-2">
                <Sparkles className="h-4 w-4" />
                Templat Pra-Bina (Disyorkan)
              </TabsTrigger>
              <TabsTrigger value="categories" className="gap-2">
                <LayoutTemplate className="h-4 w-4" />
                Kategori Asas
              </TabsTrigger>
            </TabsList>

            {/* Tab 1: Presets */}
            <TabsContent value="presets" className="flex-1 overflow-y-auto pr-1">
              <RadioGroup
                value={selectedPreset}
                onValueChange={setSelectedPreset}
                className="grid grid-cols-1 sm:grid-cols-2 gap-3"
              >
                {CERTIFICATE_PRESETS.map((preset) => {
                  const isChecked = selectedPreset === preset.id;
                  return (
                    <div key={preset.id}>
                      <RadioGroupItem value={preset.id} id={preset.id} className="peer sr-only" />
                      <Label
                        htmlFor={preset.id}
                        className={`flex flex-col justify-between h-full p-4 rounded-xl border-2 cursor-pointer transition-all ${
                          isChecked
                            ? 'border-primary bg-primary/5 shadow-sm'
                            : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <span
                              className="w-4 h-4 rounded-full border border-black/10 shadow-inner"
                              style={{ backgroundColor: preset.backgroundColor }}
                            />
                            {isChecked && (
                              <CheckCircle2 className="h-4 w-4 text-primary" />
                            )}
                          </div>
                          <p className="font-semibold text-gray-900 text-sm">{preset.name}</p>
                          <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                            {preset.description}
                          </p>
                        </div>
                        <div className="mt-3 pt-2 border-t text-[11px] font-medium text-gray-400 uppercase tracking-wider">
                          Kategori: {preset.category}
                        </div>
                      </Label>
                    </div>
                  );
                })}
              </RadioGroup>
            </TabsContent>

            {/* Tab 2: Categories */}
            <TabsContent value="categories" className="flex-1 overflow-y-auto pr-1">
              <RadioGroup
                value={selectedCategory}
                onValueChange={setSelectedCategory}
                className="grid gap-3"
              >
                {CATEGORIES.map((category) => {
                  const Icon = category.icon;
                  const isChecked = selectedCategory === category.id;
                  return (
                    <div key={category.id}>
                      <RadioGroupItem value={category.id} id={category.id} className="peer sr-only" />
                      <Label
                        htmlFor={category.id}
                        className={`flex items-center gap-4 rounded-xl border-2 p-4 cursor-pointer transition-all ${
                          isChecked
                            ? 'border-primary bg-primary/5 shadow-sm'
                            : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
                          <Icon className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">{category.label}</p>
                          <p className="text-sm text-muted-foreground">{category.description}</p>
                        </div>
                        {isChecked && <CheckCircle2 className="h-5 w-5 text-primary" />}
                      </Label>
                    </div>
                  );
                })}
              </RadioGroup>
            </TabsContent>
          </Tabs>

          <div className="flex gap-3 shrink-0 pt-4 border-t mt-4">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => setOpen(false)}
              disabled={loading}
            >
              Batal
            </Button>
            <Button type="submit" className="flex-1 gap-2" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Membina Sijil...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4" />
                  Cipta Sijil
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
