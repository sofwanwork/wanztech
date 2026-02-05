/**
 * E-Certificate (eCert) type definitions
 */

/**
 * Certificate element types
 */
export type CertificateElementType =
    | 'text'
    | 'image'
    | 'shape'
    | 'placeholder'
    | 'icon'
    | 'qr';

/**
 * Placeholder types for dynamic content
 */
export type PlaceholderType = 'name' | 'program' | 'date' | 'signature' | 'expiry';

/**
 * Shape types available in certificate builder
 */
export type ShapeType = 'rectangle' | 'circle' | 'line';

/**
 * Text alignment options
 */
export type TextAlignment = 'left' | 'center' | 'right';

/**
 * Shadow configuration for elements
 */
export interface ElementShadow {
    enabled: boolean;
    color: string;
    blur: number;
    offsetX: number;
    offsetY: number;
}

/**
 * Certificate element definition
 * Used in the certificate builder canvas
 */
export interface CertificateElement {
    id: string;
    groupId?: string;
    type: CertificateElementType;
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
    textAlign?: TextAlignment;
    lineHeight?: number;
    letterSpacing?: number;
    textStroke?: string;
    textStrokeWidth?: number;
    textDecoration?: string; // 'none' | 'underline' | 'line-through'

    // Placeholder specific
    placeholderType?: PlaceholderType;

    // Image specific
    src?: string;
    borderRadius?: number;

    // Image Filters
    brightness?: number; // 0-200%
    contrast?: number; // 0-200%
    grayscale?: number; // 0-100%

    // Shape specific
    shapeType?: ShapeType;
    fill?: string;
    stroke?: string;
    strokeWidth?: number;

    // Icon specific
    iconName?: string;

    // QR specific
    qrData?: string;

    // Shadow (applicable to all)
    shadow?: ElementShadow;
}

/**
 * Certificate template categories
 */
export type CertificateCategory = 'school' | 'corporate' | 'training' | 'event' | 'other';

/**
 * Complete Certificate Template definition
 */
export interface CertificateTemplate {
    id: string;
    userId: string;
    name: string;
    category?: CertificateCategory;
    thumbnail?: string;
    elements: CertificateElement[];
    backgroundColor: string;
    backgroundImage?: string;
    width: number;
    height: number;
    createdAt: string;
    updatedAt: string;
}

/**
 * Data passed to certificate renderer for placeholder replacement
 */
export interface CertificateData {
    name: string;
    program: string;
    date: string;
    signature?: string;
    expiry?: string;
    ic?: string;
    formId?: string;
}
