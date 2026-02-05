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
  | 'rating'
  | 'product';

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
 * Conditional display configuration
 */
export interface ConditionalConfig {
  fieldId: string;
  value: string;
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
  headerFont?: HeaderFont;
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
 * Complete Form definition
 */
export interface Form {
  id: string;
  title: string;
  description?: string;
  coverImage?: string;
  thankYouMessage?: string;
  googleSheetUrl?: string;
  allowMultipleSubmissions?: boolean;
  theme?: FormTheme;
  fields: FormField[];
  createdAt: string;
  shortCode?: string;
  userTier?: SubscriptionTier;
  // E-Certificate settings
  eCertificateEnabled?: boolean;
  eCertificateTemplate?: string; // Template ID or custom URL
  // Attendance Settings
  attendanceSettings?: AttendanceSettings;
  // QR Settings
  qrSettings?: QRSettings;
}
