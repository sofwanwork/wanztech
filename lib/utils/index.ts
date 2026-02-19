import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getProxiedImageUrl(url: string) {
  if (!url) return '';
  // Handle Google Drive Links
  // https://drive.google.com/file/d/12345/view?usp=sharing
  const match = url.match(/\/d\/([a-zA-Z0-9-_]+)/);
  if (match && match[1] && (url.includes('drive.google.com') || url.includes('docs.google.com'))) {
    // Use our own proxy to bypass CORS/Hotlinking issues
    // Format: https://lh3.googleusercontent.com/d/FILE_ID
    const directUrl = `https://lh3.googleusercontent.com/d/${match[1]}`;
    return `/api/proxy?url=${encodeURIComponent(directUrl)}`;
  }
  return url;
}

// Strip HTML tags for plain text display (e.g., card previews)
export function stripHtml(html: string): string {
  if (!html) return '';
  return html.replace(/<[^>]*>/g, '').trim();
}

// Basic sanitization for Rich Text to prevent XSS
// Blocks common XSS vectors from Tiptap/ProseMirror rich text output.
// Note: For maximum security, consider DOMPurify on client or isomorphic-dompurify on server.
export function sanitizeHtml(html: string): string {
  if (!html) return '';
  return html
    // Remove script/iframe/object/embed tags entirely (with content)
    .replace(/<script\b[^>]*>([\s\S]*?)<\/script>/gim, '')
    .replace(/<iframe\b[^>]*>([\s\S]*?)<\/iframe>/gim, '')
    .replace(/<object\b[^>]*>([\s\S]*?)<\/object>/gim, '')
    .replace(/<embed\b[^>]*\/?>/gim, '')
    // Remove inline event handlers (onclick, onload, onerror, etc.)
    .replace(/\bon\w+\s*=\s*"[^"]*"/gim, '')
    .replace(/\bon\w+\s*=\s*'[^']*'/gim, '')
    .replace(/\bon\w+\s*=[^\s>]*/gim, '')
    // Block javascript: and vbscript: in href/src/action attributes
    .replace(/\bhref\s*=\s*["']?\s*javascript:/gim, 'href="about:blank" data-blocked="')
    .replace(/\bhref\s*=\s*["']?\s*vbscript:/gim, 'href="about:blank" data-blocked="')
    .replace(/\bsrc\s*=\s*["']?\s*javascript:/gim, 'src="" data-blocked="')
    // Block data: URLs in src (can execute scripts in some browsers)
    .replace(/\bsrc\s*=\s*["']?\s*data:/gim, 'src="" data-blocked="')
    // Catch any remaining bare javascript: references
    .replace(/javascript:/gim, '')
    .replace(/vbscript:/gim, '');
}
