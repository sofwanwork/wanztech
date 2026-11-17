import { v4 as uuidv4 } from 'uuid';
import type {
  AttendanceSettings,
  CertificateCategoryConfig,
  ConditionalConfig,
  EditLinkSettings,
  Form,
  FormField,
  RespondentNotificationSettings,
} from '@/lib/types';

/**
 * Compute the next human-friendly copy title for a duplicated form:
 * - "genz" -> "genz (Copy)"
 * - "genz (Copy)" -> "genz (Copy 2)"
 * - "genz (Copy 2)" -> "genz (Copy 3)"
 */
export function buildDuplicatedTitle(title?: string): string {
  const trimmed = (title || '').trim() || 'Untitled Form';
  const copySuffixMatch = trimmed.match(/^(.*)\s+\(Copy(?:\s+(\d+))?\)$/i);

  if (!copySuffixMatch) {
    return `${trimmed} (Copy)`;
  }

  const baseTitle = copySuffixMatch[1].trim() || 'Untitled Form';
  const currentNum = copySuffixMatch[2] ? Number.parseInt(copySuffixMatch[2], 10) : 1;
  return `${baseTitle} (Copy ${currentNum + 1})`;
}

function remapConditional(
  conditional: ConditionalConfig | undefined,
  fieldIdMap: Map<string, string>
): ConditionalConfig | undefined {
  if (!conditional) return undefined;

  return {
    ...conditional,
    ...(conditional.fieldId
      ? { fieldId: fieldIdMap.get(conditional.fieldId) ?? conditional.fieldId }
      : {}),
    ...(conditional.rules
      ? {
          rules: conditional.rules.map((rule) => ({
            ...rule,
            fieldId: fieldIdMap.get(rule.fieldId) ?? rule.fieldId,
          })),
        }
      : {}),
  };
}

function remapField(
  field: FormField,
  newId: string,
  fieldIdMap: Map<string, string>,
  generateId: () => string
): FormField {
  return {
    ...field,
    id: newId,
    ...(field.options ? { options: [...field.options] } : {}),
    ...(field.products
      ? {
          products: field.products.map((product) => ({
            ...product,
            id: generateId(),
          })),
        }
      : {}),
    ...(field.ratingConfig ? { ratingConfig: { ...field.ratingConfig } } : {}),
    ...(field.gridConfig
      ? {
          gridConfig: {
            ...field.gridConfig,
            rows: [...field.gridConfig.rows],
            columns: [...field.gridConfig.columns],
          },
        }
      : {}),
    ...(field.validation ? { validation: { ...field.validation } } : {}),
    ...(field.conditional
      ? { conditional: remapConditional(field.conditional, fieldIdMap) }
      : {}),
  };
}

function cloneAttendanceSettings(
  attendance: AttendanceSettings | undefined,
  fieldIdMap: Map<string, string>
): AttendanceSettings | undefined {
  if (!attendance) return undefined;

  return {
    ...attendance,
    ...(attendance.geofence ? { geofence: { ...attendance.geofence } } : {}),
    ...(attendance.checkInOut
      ? {
          checkInOut: {
            ...attendance.checkInOut,
            ...(attendance.checkInOut.identifierFieldId
              ? {
                  identifierFieldId:
                    fieldIdMap.get(attendance.checkInOut.identifierFieldId) ??
                    attendance.checkInOut.identifierFieldId,
                }
              : {}),
          },
        }
      : {}),
    ...(attendance.rotatingQr
      ? {
          rotatingQr: {
            ...attendance.rotatingQr,
            // Clear custom secret so the duplicated form gets its own independent HMAC secret
            secret: undefined,
          },
        }
      : {}),
  };
}

function cloneEditLinkSettings(
  editLinkSettings: EditLinkSettings | undefined,
  fieldIdMap: Map<string, string>
): EditLinkSettings | undefined {
  if (!editLinkSettings) return undefined;

  return {
    ...editLinkSettings,
    ...(editLinkSettings.emailFieldId
      ? {
          emailFieldId:
            fieldIdMap.get(editLinkSettings.emailFieldId) ?? editLinkSettings.emailFieldId,
        }
      : {}),
  };
}

function cloneRespondentNotification(
  settings: RespondentNotificationSettings | undefined,
  fieldIdMap: Map<string, string>
): RespondentNotificationSettings | undefined {
  if (!settings) return undefined;

  return {
    ...settings,
    ...(settings.emailFieldId
      ? { emailFieldId: fieldIdMap.get(settings.emailFieldId) ?? settings.emailFieldId }
      : {}),
  };
}

function cloneCertificateCategory(
  category: CertificateCategoryConfig | undefined,
  fieldIdMap: Map<string, string>
): CertificateCategoryConfig | undefined {
  if (!category) return undefined;

  return {
    fieldId: fieldIdMap.get(category.fieldId) ?? category.fieldId,
    map: { ...category.map },
  };
}

export interface CloneFormOptions {
  newId: string;
  newTitle?: string;
  newGoogleSheetUrl?: string;
  nowIso?: string;
  generateId?: () => string;
}

/**
 * Pure deep-clone helper for duplicating a Form.
 * - Assigns fresh IDs to the form, fields, and products while preserving all internal cross-references.
 * - Isolates shortCode, Google Sheet URL, and rotating QR secret from the source form.
 */
export function cloneFormForDuplication(source: Form, options: CloneFormOptions): Form {
  const generateId = options.generateId ?? uuidv4;
  const fieldIdMap = new Map<string, string>();

  const sourceFields = Array.isArray(source.fields) ? source.fields : [];
  for (const field of sourceFields) {
    fieldIdMap.set(field.id, generateId());
  }

  const clonedFields = sourceFields.map((field) =>
    remapField(field, fieldIdMap.get(field.id) ?? generateId(), fieldIdMap, generateId)
  );

  return {
    id: options.newId,
    userId: source.userId,
    title: options.newTitle ?? buildDuplicatedTitle(source.title),
    description: source.description ?? '',
    coverImage: source.coverImage ?? '',
    thankYouMessage: source.thankYouMessage ?? '',
    redirectButtons: source.redirectButtons?.map((btn) => ({ ...btn })),
    // Never inherit the source Google Sheet so responses stay isolated
    googleSheetUrl: options.newGoogleSheetUrl ?? '',
    allowMultipleSubmissions: source.allowMultipleSubmissions,
    receiveEmailNotifications: source.receiveEmailNotifications ?? true,
    isActive: source.isActive ?? true,
    theme: source.theme ? { ...source.theme } : undefined,
    fields: clonedFields,
    createdAt: options.nowIso ?? new Date().toISOString(),
    // Omit shortCode so the database BEFORE INSERT trigger generates a new unique code
    shortCode: undefined,
    userTier: source.userTier,
    eCertificateEnabled: source.eCertificateEnabled,
    eCertificateTemplate: source.eCertificateTemplate,
    eCertificateCategory: cloneCertificateCategory(source.eCertificateCategory, fieldIdMap),
    attendanceSettings: cloneAttendanceSettings(source.attendanceSettings, fieldIdMap),
    qrSettings: source.qrSettings ? { ...source.qrSettings } : undefined,
    editLinkSettings: cloneEditLinkSettings(source.editLinkSettings, fieldIdMap),
    respondentNotification: cloneRespondentNotification(source.respondentNotification, fieldIdMap),
    pdpaSettings: source.pdpaSettings ? { ...source.pdpaSettings } : undefined,
  };
}
