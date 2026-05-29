import { describe, it, expect } from 'vitest';

/**
 * Mirrors `getSafeRedirectPath()` in `proxy.ts` and the `next` param
 * validation in `app/api/auth/callback/route.ts`.
 *
 * Open Redirect class: attacker controls the post-login destination
 * via crafted relative-looking URLs (e.g. `//evil.com/path`). Browsers
 * resolve `Location: //evil.com/path` as a protocol-relative URL —
 * sending the user to evil.com.
 */
function getSafeRedirectPath(path: string, fallback = '/forms'): string {
  if (path.startsWith('/') && !path.startsWith('//')) {
    return path;
  }
  return fallback;
}

describe('Open redirect guard — getSafeRedirectPath()', () => {
  it('allows safe single-slash relative paths', () => {
    expect(getSafeRedirectPath('/forms')).toBe('/forms');
    expect(getSafeRedirectPath('/dashboard/settings')).toBe('/dashboard/settings');
    expect(getSafeRedirectPath('/builder/abc-123')).toBe('/builder/abc-123');
  });

  it('blocks protocol-relative URLs (//evil.com)', () => {
    expect(getSafeRedirectPath('//evil.com')).toBe('/forms');
    expect(getSafeRedirectPath('//evil.com/login')).toBe('/forms');
  });

  it('blocks fully qualified external URLs', () => {
    expect(getSafeRedirectPath('https://evil.com')).toBe('/forms');
    expect(getSafeRedirectPath('http://evil.com/path')).toBe('/forms');
  });

  it('blocks bare paths without leading slash', () => {
    expect(getSafeRedirectPath('forms')).toBe('/forms');
    expect(getSafeRedirectPath('evil.com')).toBe('/forms');
  });

  it('respects explicit fallback parameter', () => {
    expect(getSafeRedirectPath('//evil.com', '/login')).toBe('/login');
    expect(getSafeRedirectPath('javascript:alert(1)', '/')).toBe('/');
  });

  it('blocks javascript: and data: URIs', () => {
    expect(getSafeRedirectPath('javascript:alert(1)')).toBe('/forms');
    expect(getSafeRedirectPath('data:text/html,<script>alert(1)</script>')).toBe('/forms');
  });
});
