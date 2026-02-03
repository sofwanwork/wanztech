import { createClient } from '@/utils/supabase/server';
import { CertificateTemplate } from './types';

// Get all certificate templates for the current user
export async function getCertificateTemplates(): Promise<CertificateTemplate[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return [];

  const { data, error } = await supabase
    .from('certificate_templates')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching certificate templates:', error);
    return [];
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return data.map((row: any) => ({
    id: row.id,
    userId: row.user_id,
    name: row.name,
    category: row.category,
    thumbnail: row.thumbnail,
    elements: row.elements,
    backgroundColor: row.background_color,
    backgroundImage: row.background_image,
    width: row.width,
    height: row.height,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }));
}

// Get a single certificate template by ID
export async function getCertificateTemplate(id: string): Promise<CertificateTemplate | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data, error } = await supabase
    .from('certificate_templates')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single();

  if (error || !data) {
    console.error('Error fetching certificate template:', error);
    return null;
  }

  return {
    id: data.id,
    userId: data.user_id,
    name: data.name,
    category: data.category,
    thumbnail: data.thumbnail,
    elements: data.elements,
    backgroundColor: data.background_color,
    backgroundImage: data.background_image,
    width: data.width,
    height: data.height,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
}

// Save certificate template
export async function saveCertificateTemplate(
  template: Partial<CertificateTemplate> & { id?: string }
): Promise<CertificateTemplate | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const now = new Date().toISOString();

  if (template.id) {
    // Update existing
    const { data, error } = await supabase
      .from('certificate_templates')
      .update({
        name: template.name,
        category: template.category,
        elements: template.elements,
        background_color: template.backgroundColor,
        background_image: template.backgroundImage,
        width: template.width,
        height: template.height,
        thumbnail: template.thumbnail,
        updated_at: now,
      })
      .eq('id', template.id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error || !data) {
      console.error('Error updating certificate template:', error);
      return null;
    }

    return {
      id: data.id,
      userId: data.user_id,
      name: data.name,
      category: data.category,
      thumbnail: data.thumbnail,
      elements: data.elements,
      backgroundColor: data.background_color,
      backgroundImage: data.background_image,
      width: data.width,
      height: data.height,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  } else {
    // Create new
    const { data, error } = await supabase
      .from('certificate_templates')
      .insert({
        user_id: user.id,
        name: template.name || 'Untitled Certificate',
        category: template.category,
        elements: template.elements || [],
        background_color: template.backgroundColor || '#ffffff',
        background_image: template.backgroundImage,
        width: template.width || 842,
        height: template.height || 595,
        thumbnail: template.thumbnail,
        created_at: now,
        updated_at: now,
      })
      .select()
      .single();

    if (error || !data) {
      console.error('Error creating certificate template:', error);
      return null;
    }

    return {
      id: data.id,
      userId: data.user_id,
      name: data.name,
      category: data.category,
      thumbnail: data.thumbnail,
      elements: data.elements,
      backgroundColor: data.background_color,
      backgroundImage: data.background_image,
      width: data.width,
      height: data.height,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  }
}

// Delete certificate template
export async function deleteCertificateTemplate(id: string): Promise<boolean> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return false;

  const { error } = await supabase
    .from('certificate_templates')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id);

  if (error) {
    console.error('Error deleting certificate template:', error);
    return false;
  }

  return true;
}

// Get a single certificate template by ID (Public access for checking)
export async function getCertificateTemplatePublic(
  id: string
): Promise<CertificateTemplate | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('certificate_templates')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !data) {
    // If error is PGRST116 (0 rows), return null silently
    if (error?.code !== 'PGRST116') {
      console.error('Error fetching public certificate template:', error);
    }
    return null;
  }

  return {
    id: data.id,
    userId: data.user_id,
    name: data.name,
    thumbnail: data.thumbnail,
    elements: data.elements,
    backgroundColor: data.background_color,
    backgroundImage: data.background_image,
    width: data.width,
    height: data.height,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
}
