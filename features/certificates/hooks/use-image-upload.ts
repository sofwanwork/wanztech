import { useRef, useCallback, useState } from 'react';
import { toast } from 'sonner';
import { createClient } from '@/utils/supabase/client';
import { compressImage } from '@/utils/image-compression';
import { v4 as uuidv4 } from 'uuid';
import { CertificateElement } from '@/lib/types';

interface UseImageUploadProps {
  addElement: (type: 'image', extra: Partial<CertificateElement>) => void;
  updateElement: (id: string, updates: Partial<CertificateElement>) => void;
  selectedId: string | null;
}

export function useImageUpload({ addElement, updateElement, selectedId }: UseImageUploadProps) {
  const [cropperOpen, setCropperOpen] = useState(false);
  const [imageToCrop, setImageToCrop] = useState<string>('');
  const imageInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image too large. Maximum 5MB.');
        return;
      }

      const toastId = toast.loading('Uploading image...');

      try {
        const compressedFile = await compressImage(file, 0.5);
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

        addElement('image', { src: publicUrl, width: 150, height: 150 });
        toast.success('Image uploaded successfully!', { id: toastId });
      } catch (error) {
        console.error('Image upload error:', error);
        toast.error('Failed to upload image', { id: toastId });
      }

      if (imageInputRef.current) imageInputRef.current.value = '';
    },
    [addElement]
  );

  const handleCropComplete = useCallback(
    async (croppedBlob: Blob) => {
      if (!selectedId) return;

      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        toast.error('Please login first');
        return;
      }

      const dir = user.id;
      const fileName = `${uuidv4()}.png`;
      const filePath = `${dir}/${fileName}`;

      try {
        const { error: uploadError } = await supabase.storage
          .from('certificate_backgrounds')
          .upload(filePath, croppedBlob, {
            cacheControl: '3600',
            upsert: false,
          });

        if (uploadError) throw uploadError;

        const {
          data: { publicUrl },
        } = supabase.storage.from('certificate_backgrounds').getPublicUrl(filePath);

        updateElement(selectedId, { src: publicUrl });
        toast.success('Image cropped successfully!');
      } catch (error) {
        console.error('Crop save error:', error);
        toast.error('Failed to save cropped image');
      }
    },
    [selectedId, updateElement]
  );

  return {
    cropperOpen,
    setCropperOpen,
    imageToCrop,
    setImageToCrop,
    imageInputRef,
    handleImageUpload,
    handleCropComplete,
  };
}
