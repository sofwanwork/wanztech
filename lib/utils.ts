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
    return `/api/proxy-image?url=${encodeURIComponent(directUrl)}`;
  }
  return url;
}

// Strip HTML tags for plain text display (e.g., card previews)
export function stripHtml(html: string): string {
  if (!html) return '';
  return html.replace(/<[^>]*>/g, '').trim();
}
