'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { saveCertificateTemplate, deleteCertificateTemplate } from '@/lib/storage/certificates';
import { CertificateTemplate, CertificateElement, CertificateCategory } from '@/lib/types';

import { canCreateCertificate, canUpdateCertificate } from '@/lib/storage/subscription';

const VALID_CATEGORIES: CertificateCategory[] = [
  'school',
  'corporate',
  'training',
  'event',
  'other',
];

export async function createCertificateTemplateAction(formData: FormData): Promise<void> {
  const categoryInput = formData.get('category') as string | null;
  const category: CertificateCategory = VALID_CATEGORIES.includes(
    categoryInput as CertificateCategory
  )
    ? (categoryInput as CertificateCategory)
    : 'other';

  // Check limits
  const { allowed, message } = await canCreateCertificate();
  if (!allowed) {
    // Since this is a server action called from a form, we can't easily show a toast.
    // Ideally we should handle this in the UI state or return an error state.
    // For now we will just return (and maybe redirect to an upgrade page if we could).
    // Or we could redirect with an error param.
    // Let's redirect to builder with error query param.
    redirect('/certificates/builder?error=' + encodeURIComponent(message || 'Limit reached'));
  }

  const template = await saveCertificateTemplate({
    name: 'Sijil Baru',
    category,
    elements: [
      // Default placeholder elements
      {
        id: 'title',
        type: 'text',
        x: 421,
        y: 80,
        width: 400,
        height: 60,
        content: 'SIJIL PENGHARGAAN',
        fontSize: 36,
        fontFamily: 'serif',
        fontWeight: 'bold',
        color: '#1a1a2e',
        textAlign: 'center',
      },
      {
        id: 'subtitle',
        type: 'text',
        x: 421,
        y: 150,
        width: 300,
        height: 30,
        content: 'Diberikan kepada',
        fontSize: 16,
        fontFamily: 'sans-serif',
        color: '#666666',
        textAlign: 'center',
      },
      {
        id: 'name-placeholder',
        type: 'placeholder',
        x: 421,
        y: 200,
        width: 500,
        height: 60,
        placeholderType: 'name',
        fontSize: 48,
        fontFamily: 'serif',
        fontWeight: 'bold',
        fontStyle: 'italic',
        color: '#1a1a2e',
        textAlign: 'center',
      },
      {
        id: 'program-label',
        type: 'text',
        x: 421,
        y: 280,
        width: 300,
        height: 30,
        content: 'kerana menyertai',
        fontSize: 16,
        fontFamily: 'sans-serif',
        color: '#666666',
        textAlign: 'center',
      },
      {
        id: 'program-placeholder',
        type: 'placeholder',
        x: 421,
        y: 320,
        width: 400,
        height: 40,
        placeholderType: 'program',
        fontSize: 24,
        fontFamily: 'serif',
        fontWeight: 'bold',
        color: '#1a1a2e',
        textAlign: 'center',
      },
      {
        id: 'date-placeholder',
        type: 'placeholder',
        x: 150,
        y: 500,
        width: 200,
        height: 30,
        placeholderType: 'date',
        fontSize: 14,
        fontFamily: 'sans-serif',
        color: '#666666',
        textAlign: 'center',
      },
    ] as CertificateElement[],
    backgroundColor: '#ffffff',
    width: 842,
    height: 595,
  });

  if (template) {
    redirect(`/certificates/builder/${template.id}`);
  }
  // If failed, stay on same page (no return needed for form actions)
}

export async function updateCertificateTemplateAction(
  id: string,
  data: Partial<CertificateTemplate>
) {
  // Check limits before update
  const { allowed, message } = await canUpdateCertificate();
  if (!allowed) {
    return { error: message || 'Limit exceeded' };
  }

  const template = await saveCertificateTemplate({
    id,
    ...data,
  });

  if (template) {
    revalidatePath('/certificates/builder');
    revalidatePath(`/certificates/builder/${id}`);
    return { success: true, template };
  }

  return { error: 'Failed to update template' };
}

export async function deleteCertificateTemplateAction(id: string) {
  const success = await deleteCertificateTemplate(id);

  if (success) {
    revalidatePath('/certificates/builder');
    redirect('/certificates/builder');
  }

  return { error: 'Failed to delete template' };
}

export async function cloneCertificateTemplateAction(id: string): Promise<void> {
  // Get existing template
  const { getCertificateTemplate } = await import('@/lib/storage/certificates');
  const existingTemplate = await getCertificateTemplate(id);

  if (!existingTemplate) {
    return;
  }

  // Check limits
  const { allowed, message } = await canCreateCertificate();
  if (!allowed) {
    redirect('/certificates/builder?error=' + encodeURIComponent(message || 'Limit reached'));
  }

  // Create new template with copied data
  const newTemplate = await saveCertificateTemplate({
    name: `${existingTemplate.name} (Copy)`,
    elements: existingTemplate.elements,
    backgroundColor: existingTemplate.backgroundColor,
    backgroundImage: existingTemplate.backgroundImage,
    width: existingTemplate.width,
    height: existingTemplate.height,
  });

  if (newTemplate) {
    revalidatePath('/certificates/builder');
    redirect(`/certificates/builder/${newTemplate.id}`);
  }
}
