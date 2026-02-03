export interface FormField {
  id: string;
  type:
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
  label: string;
  description?: string;
  required: boolean;
  options?: string[]; // For select, checkbox, radio
  products?: {
    id: string;
    name: string;
    description?: string;
    price: number;
    currency: string;
    imageUrl?: string;
  }[];
  ratingConfig?: {
    min: number;
    max: number;
    minLabel?: string;
    maxLabel?: string;
  };
  conditional?: {
    fieldId: string;
    value: string;
  };
  validation?: {
    minLength?: number;
    maxLength?: number;
    pattern?: string; // Regex string
  };
}

export interface Form {
  id: string;
  title: string;
  description?: string;
  coverImage?: string;
  thankYouMessage?: string;
  googleSheetUrl?: string;
  theme?: {
    primaryColor?: string;
    backgroundColor?: string;
    textColor?: string;
  };
  fields: FormField[];
  createdAt: string;
  shortCode?: string;
  // E-Certificate settings
  eCertificateEnabled?: boolean;
  eCertificateTemplate?: string; // Template ID or custom URL
  // Attendance Settings
  attendanceSettings?: {
    enabled: boolean;
    startTime?: string;
    endTime?: string;
    geofence?: {
      enabled: boolean;
      lat: number;
      lng: number;
      radius: number; // meters
    };
  };
  // QR Settings
  qrSettings?: {
    dotsColor?: string;
    dotsType?: string;
    cornersColor?: string;
    cornersType?: string;
    backgroundColor?: string;
    logo?: string;
  };
}

export interface Settings {
  googleClientEmail?: string;
  googlePrivateKey?: string;
  googleDriveFolderId?: string;
  userPersonalEmail?: string;
}

export interface Profile {
  id: string;
  username: string;
  full_name?: string;
  avatar_url?: string;
}

// Pricing Tier Types
export type SubscriptionTier = 'free' | 'pro' | 'enterprise';
export type SubscriptionStatus = 'active' | 'cancelled' | 'expired';

export interface Subscription {
  id: string;
  userId: string;
  tier: SubscriptionTier;
  status: SubscriptionStatus;
  currentPeriodStart: string;
  currentPeriodEnd: string;
}

export interface Usage {
  formsCreated: number;
  totalSubmissions: number;
  month: string;
}

export interface TierLimits {
  maxForms: number; // -1 = unlimited
  maxSubmissionsPerForm: number; // -1 = unlimited
  maxCertificates: number; // -1 = unlimited
}

export const TIER_LIMITS: Record<SubscriptionTier, TierLimits> = {
  free: { maxForms: 5, maxSubmissionsPerForm: 3000, maxCertificates: 2 },
  pro: { maxForms: -1, maxSubmissionsPerForm: -1, maxCertificates: -1 },
  enterprise: { maxForms: -1, maxSubmissionsPerForm: -1, maxCertificates: -1 },
};

// E-Sijil Builder Types
export interface CertificateElement {
  id: string;
  groupId?: string;
  type: 'text' | 'image' | 'shape' | 'placeholder' | 'icon' | 'qr';
  x: number;
  y: number;
  width: number;
  height: number;
  rotation?: number;
  opacity?: number;
  // Text specific
  content?: string;
  fontSize?: number;
  fontFamily?: string;
  fontWeight?: string;
  fontStyle?: string;
  color?: string;
  textAlign?: 'left' | 'center' | 'right';
  lineHeight?: number;
  letterSpacing?: number;
  textStroke?: string;
  textStrokeWidth?: number;
  // Placeholder specific
  placeholderType?: 'name' | 'program' | 'date' | 'signature' | 'expiry';
  // Image specific
  src?: string;
  borderRadius?: number;
  // Image Filters
  brightness?: number; // 0-200%
  contrast?: number; // 0-200%
  grayscale?: number; // 0-100%
  // Shape specific
  shapeType?: 'rectangle' | 'circle' | 'line';
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
  // Icon specific
  iconName?: string;
  // QR specific
  qrData?: string;
  // Shadow (applicable to all)
  shadow?: {
    enabled: boolean;
    color: string;
    blur: number;
    offsetX: number;
    offsetY: number;
  };
}

export interface CertificateTemplate {
  id: string;
  userId: string;
  name: string;
  category?: 'school' | 'corporate' | 'training' | 'event' | 'other';
  thumbnail?: string;
  elements: CertificateElement[];
  backgroundColor: string;
  backgroundImage?: string;
  width: number;
  height: number;
  createdAt: string;
  updatedAt: string;
}
