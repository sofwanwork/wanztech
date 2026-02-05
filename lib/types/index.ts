/**
 * Centralized type exports
 * Re-exports all types from organized modules for backward compatibility
 */

// Form types
export type {
  FormFieldType,
  ProductItem,
  RatingConfig,
  ConditionalConfig,
  ValidationConfig,
  FormField,
  BackgroundPattern,
  HeaderFont,
  FormTheme,
  GeofenceConfig,
  AttendanceSettings,
  QRSettings,
  Form,
} from './forms';

// E-Certificate types
export type {
  CertificateElementType,
  PlaceholderType,
  ShapeType,
  TextAlignment,
  ElementShadow,
  CertificateElement,
  CertificateCategory,
  CertificateTemplate,
  CertificateData,
} from './certificates';

// Subscription types
export type {
  SubscriptionTier,
  SubscriptionStatus,
  Subscription,
  Usage,
  TierLimits,
} from './subscription';

// Common types
export type { Profile, Settings } from './common';

// Re-export constants (will be moved to lib/constants later)
export { TIER_LIMITS } from '../constants/subscription-tiers';
