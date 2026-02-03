// Shared types for certificate templates

export interface TemplateProps {
  id?: string;
  name: string;
  program: string;
  formattedDate?: string;
}

export interface TemplateConfig {
  id: string;
  name: string;
  component: React.ComponentType<TemplateProps>;
}

// Template IDs as const for type safety
export const TEMPLATE_IDS = [
  'classic',
  'modern',
  'elegant',
  'corporate',
  'creative',
  'minimalist',
  'premium',
  'vintage',
  'nature',
  'royal',
] as const;

export type TemplateId = (typeof TEMPLATE_IDS)[number];
