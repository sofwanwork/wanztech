import { useRouter } from 'next/navigation';

let navigationTimeout: NodeJS.Timeout | null = null;
let lastNavigationTime = 0;
const MIN_NAVIGATION_INTERVAL = 500; // Minimum 500ms between navigations

/**
 * Safely navigate with rate limiting and error handling
 * Prevents overlapping RSC requests that cause net::ERR_ABORTED
 */
export async function safeNavigate(
  router: ReturnType<typeof useRouter>,
  url: string,
  options?: { replace?: boolean; scroll?: boolean }
): Promise<void> {
  const now = Date.now();
  const timeSinceLastNavigation = now - lastNavigationTime;

  // Rate limit: prevent rapid successive navigations
  if (timeSinceLastNavigation < MIN_NAVIGATION_INTERVAL) {
    console.debug('Navigation rate limited:', url);
    return;
  }

  // Clear any pending navigation
  if (navigationTimeout) {
    clearTimeout(navigationTimeout);
    navigationTimeout = null;
  }

  lastNavigationTime = now;

  try {
    if (options?.replace) {
      router.replace(url, { scroll: options?.scroll !== false });
    } else {
      router.push(url, { scroll: options?.scroll !== false });
    }
  } catch (error) {
    // Silently handle navigation cancellation errors
    if (error instanceof Error && error.message.includes('AbortError')) {
      console.debug('Navigation cancelled (expected):', url);
    } else {
      console.warn('Navigation failed:', error);
    }
  }
}

/**
 * Debounced navigation - useful for search inputs
 */
export function debouncedNavigate(
  router: ReturnType<typeof useRouter>,
  url: string,
  delay: number = 300
): void {
  if (navigationTimeout) {
    clearTimeout(navigationTimeout);
  }

  navigationTimeout = setTimeout(() => {
    safeNavigate(router, url, { replace: true });
  }, delay);
}
