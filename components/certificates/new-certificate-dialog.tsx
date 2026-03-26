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
import {
  Plus,
  GraduationCap,
  Building2,
  BookOpen,
  Calendar,
  MoreHorizontal,
  Loader2,
} from 'lucide-react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { createCertificateTemplateAction } from '@/actions/certificate-template';

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
  const [selectedCategory, setSelectedCategory] = useState('other');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData();
    formData.set('category', selectedCategory);

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
        description: 'Sistem mengalami gangguan pautan. Sila uncak/refresh semula.',
      });
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-md max-h-[90dvh] flex flex-col">
        <DialogHeader className="shrink-0">
          <DialogTitle className="text-xl">Create New Certificate</DialogTitle>
          <DialogDescription>Pilih kategori untuk sijil baru anda</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto p-1 mb-6">
            <RadioGroup
              value={selectedCategory}
              onValueChange={setSelectedCategory}
              className="grid gap-3"
            >
              {CATEGORIES.map((category) => {
                const Icon = category.icon;
                return (
                  <div key={category.id}>
                    <RadioGroupItem value={category.id} id={category.id} className="peer sr-only" />
                    <Label
                      htmlFor={category.id}
                      className="flex items-center gap-4 rounded-xl border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5 cursor-pointer transition-all"
                    >
                      <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center peer-data-[state=checked]:bg-primary/10">
                        <Icon className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">{category.label}</p>
                        <p className="text-sm text-muted-foreground">{category.description}</p>
                      </div>
                    </Label>
                  </div>
                );
              })}
            </RadioGroup>
          </div>

          <div className="flex gap-3 shrink-0">
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
                  Creating...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4" />
                  Create
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
