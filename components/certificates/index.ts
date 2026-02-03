// Certificate Templates - Main Index
// Export all templates and registry for easy importing

import { TemplateProps, TemplateId, TEMPLATE_IDS } from './types';

// Import all templates
import { ClassicTemplate } from './templates/ClassicTemplate';
import { ModernTemplate } from './templates/ModernTemplate';
import { ElegantTemplate } from './templates/ElegantTemplate';
import { CorporateTemplate } from './templates/CorporateTemplate';
import { CreativeTemplate } from './templates/CreativeTemplate';
import { MinimalistTemplate } from './templates/MinimalistTemplate';
import { PremiumTemplate } from './templates/PremiumTemplate';
import { VintageTemplate } from './templates/VintageTemplate';
import { NatureTemplate } from './templates/NatureTemplate';
import { RoyalTemplate } from './templates/RoyalTemplate';

// Template Registry - Maps template ID to component
export const templateRegistry: Record<string, React.ComponentType<TemplateProps>> = {
  classic: ClassicTemplate,
  modern: ModernTemplate,
  elegant: ElegantTemplate,
  corporate: CorporateTemplate,
  creative: CreativeTemplate,
  minimalist: MinimalistTemplate,
  premium: PremiumTemplate,
  vintage: VintageTemplate,
  nature: NatureTemplate,
  royal: RoyalTemplate,
};

// Template metadata for UI display
export const templateList = [
  { id: 'classic', name: 'Classic' },
  { id: 'modern', name: 'Modern' },
  { id: 'elegant', name: 'Elegant' },
  { id: 'corporate', name: 'Corporate' },
  { id: 'creative', name: 'Creative' },
  { id: 'minimalist', name: 'Minimalist' },
  { id: 'premium', name: 'Premium' },
  { id: 'vintage', name: 'Vintage' },
  { id: 'nature', name: 'Nature' },
  { id: 'royal', name: 'Royal' },
] as const;

// Get template component by ID
export function getTemplateComponent(
  templateId: string
): React.ComponentType<TemplateProps> | undefined {
  return templateRegistry[templateId];
}

// Check if template ID is valid
export function isValidTemplateId(id: string): id is TemplateId {
  return TEMPLATE_IDS.includes(id as TemplateId);
}

// Re-export types
export type { TemplateProps, TemplateId };
export { TEMPLATE_IDS };

// Re-export individual templates for direct imports if needed
export {
  ClassicTemplate,
  ModernTemplate,
  ElegantTemplate,
  CorporateTemplate,
  CreativeTemplate,
  MinimalistTemplate,
  PremiumTemplate,
  VintageTemplate,
  NatureTemplate,
  RoyalTemplate,
};
