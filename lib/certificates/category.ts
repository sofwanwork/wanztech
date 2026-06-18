import type { CertificateCategoryConfig } from '@/lib/types';

/**
 * Decide which certificate template id to use for a respondent.
 *
 * If the form maps a dropdown answer → template and the respondent's value has
 * a mapping, that template wins. Otherwise we fall back to the form's default
 * template id. Pure & deterministic for easy testing.
 */
export function resolveCategoryTemplateId(
  config: CertificateCategoryConfig | undefined,
  categoryValue: string | undefined | null,
  defaultTemplateId: string | undefined
): string | undefined {
  const value = (categoryValue ?? '').trim().toLowerCase();
  if (config?.map && value) {
    for (const [key, templateId] of Object.entries(config.map)) {
      if (key.trim().toLowerCase() === value && templateId) {
        return templateId;
      }
    }
  }
  return defaultTemplateId;
}

/**
 * The distinct set of template ids a form might render (default + every mapped
 * category template), so callers can prefetch exactly the templates needed.
 */
export function collectTemplateIds(
  config: CertificateCategoryConfig | undefined,
  defaultTemplateId: string | undefined
): string[] {
  const ids = new Set<string>();
  if (defaultTemplateId) ids.add(defaultTemplateId);
  if (config?.map) {
    for (const id of Object.values(config.map)) {
      if (id) ids.add(id);
    }
  }
  return Array.from(ids);
}
