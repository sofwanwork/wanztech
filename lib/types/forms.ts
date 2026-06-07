/**
 * Form-related type definitions
 */

import { SubscriptionTier } from './subscription';

/**
 * Field types supported by the form builder
 */
export type FormFieldType =
  | 'text'
  | 'textarea'
  | 'email'
  | 'number'
  | 'date'
  | 'time'
  | 'select'
  | 'checkbox'
  | 'radio'
  | 'file'
  | 'separator'
  | 'pagebreak'
  | 'rating'
  | 'product'
  | 'image';

/**
 * Product item for product field type
 */
export interface ProductItem {
  id: string;
  name: string;
  description?: string;
  price: number;
  currency: string;
  imageUrl?: string;
}

/**
 * Rating field configuration
 */
export interface RatingConfig {
  min: number;
  max: number;
  minLabel?: string;
  maxLabel?: string;
}

/**
 * Conditional display configuration.
 *
 * Supports two shapes for backward compatibility:
 *  - Legacy (single equality): `{ fieldId, value }` — implicit `equals`.
 *  - New (multi-rule): `{ rules: ConditionRule[], logic?: 'all' | 'any' }`.
 *
 * Both shapes are normalized via `normalizeConditional()` in
 * `lib/forms/conditions.ts` before evaluation.
 */
export type ConditionOperator =
  | 'equals'
  | 'not_equals'
  | 'contains'
  | 'not_contains'
  | 'is_empty'
  | 'is_not_empty'
  | 'gt'
  | 'lt';

export interface ConditionRule {
  fieldId: string;
  operator: ConditionOperator;
  /** Value to compare against. Ignored for `is_empty` / `is_not_empty`. */
  value?: string;
}

export interface ConditionalConfig {
  // Legacy shape (kept so older saved forms still load). New rules engine
  // normalizes these into a single equals-rule at runtime.
  fieldId?: string;
  value?: string;
  // New shape
  rules?: ConditionRule[];
  /** How to combine multiple rules. Defaults to `all`. */
  logic?: 'all' | 'any';
}

/**
 * Field validation rules
 */
export interface ValidationConfig {
  minLength?: number;
  maxLength?: number;
  pattern?: string; // Regex string
}

/**
 * Form field definition
 */
export interface FormField {
  id: string;
  type: FormFieldType;
  label: string;
  description?: string;
  required: boolean;
  options?: string[]; // For select, checkbox, radio
  products?: ProductItem[];
  ratingConfig?: RatingConfig;
  conditional?: ConditionalConfig;
  validation?: ValidationConfig;
  imageUrl?: string;
}

/**
 * Background pattern options for form theme
 */
export type BackgroundPattern =
  | 'none'
  | 'dots'
  | 'grid'
  | 'diagonal'
  | 'waves'
  | 'circles'
  | 'triangles';

/**
 * Header font options
 */
export type HeaderFont = 'inter' | 'playfair' | 'lora' | 'roboto';

/**
 * Form theme settings
 */
export interface FormTheme {
  primaryColor?: string;
  backgroundColor?: string;
  textColor?: string;
  backgroundPattern?: BackgroundPattern;
  headerAlignment?: 'left' | 'center';
  logo?: string;
  logoAlignment?: 'left' | 'center' | 'right';
  headerFont?: HeaderFont;
  whatsappShareEnabled?: boolean;
  whatsappShareMessage?: string;
}

/**
 * Geofence configuration for attendance
 */
export interface GeofenceConfig {
  enabled: boolean;
  lat: number;
  lng: number;
  radius: number; // meters
}

/**
 * Attendance settings for form
 */
export interface AttendanceSettings {
  enabled: boolean;
  startTime?: string;
  endTime?: string;
  geofence?: GeofenceConfig;
}

/**
 * QR code customization settings
 */
export interface QRSettings {
  dotsColor?: string;
  dotsType?: string;
  cornersColor?: string;
  cornersType?: string;
  backgroundColor?: string;
  logo?: string;
}

/**
 * Edit-link settings — when enabled, every submission generates a magic
 * link emailed to the respondent so they can edit their answers within
 * `expiryDays`. Requires an email field on the form so we know where to
 * send the link.
 */
export interface EditLinkSettings {
  enabled: boolean;
  /** Days the magic link stays valid after submission. */
  expiryDays: number;
  /** id of the form field that holds the respondent's email address. */
  emailFieldId?: string;
}

/**
 * Respondent confirmation email — when enabled, every submission sends an
 * acknowledgement email to the *respondent* (separate from the owner
 * notification controlled by `receiveEmailNotifications`). Requires an email
 * field on the form so we know where to send the confirmation.
 */
export interface RespondentNotificationSettings {
  enabled: boolean;
  /** id of the form field that holds the respondent's email address. */
  emailFieldId?: string;
  /** Optional custom thank-you message shown in the email body. */
  message?: string;
  /** Whether to include a summary table of the respondent's answers. */
  includeSummary?: boolean;
}

/**
 * PDPA (Personal Data Protection Act) consent settings. When enabled, the
 * public form shows a mandatory consent checkbox the respondent must tick
 * before submitting. The consent is recorded with the submission. Aligns the
 * form with Malaysia's PDPA 2010 consent requirements.
 */
export interface PdpaSettings {
  enabled: boolean;
  /** Consent statement shown next to the checkbox. */
  consentText?: string;
  /** Optional link to the data controller's privacy policy. */
  policyUrl?: string;
}

/**
 * Category-based certificate mapping. A chosen dropdown (`select`) field's
 * answer decides WHICH certificate template a respondent receives — e.g. a
 * "Kategori" field with options Urusetia / Penganjur / Peserta each mapped to
 * a different template. Falls back to the form's default template when a
 * respondent's value has no mapping.
 */
export interface CertificateCategoryConfig {
  /** id of the `select` field whose answer selects the template. */
  fieldId: string;
  /** Maps an option value → certificate template id. */
  map: Record<string, string>;
}

/**
 * Complete Form definition
 */
export interface Form {
  id: string;
  userId?: string; // Owner ID for rate limiting
  title: string;
  description?: string;
  coverImage?: string;
  thankYouMessage?: string;
  googleSheetUrl?: string;
  allowMultipleSubmissions?: boolean;
  receiveEmailNotifications?: boolean;
  isActive?: boolean;
  theme?: FormTheme;
  fields: FormField[];
  createdAt: string;
  shortCode?: string;
  userTier?: SubscriptionTier;
  // E-Certificate settings
  eCertificateEnabled?: boolean;
  eCertificateTemplate?: string; // Template ID or custom URL
  eCertificateExpiryDays?: number; // Number of days the certificate link is valid after submission
  eCertificateExpiredMessage?: string; // Custom message to show when link is expired
  // Category-based certificate (different template per dropdown answer)
  eCertificateCategory?: CertificateCategoryConfig;
  // Attendance Settings
  attendanceSettings?: AttendanceSettings;
  // QR Settings
  qrSettings?: QRSettings;
  // Edit-link Settings
  editLinkSettings?: EditLinkSettings;
  // Respondent confirmation email Settings
  respondentNotification?: RespondentNotificationSettings;
  // PDPA consent Settings
  pdpaSettings?: PdpaSettings;
}
