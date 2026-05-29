'use client';

import { useEffect, useRef, useCallback } from 'react';
import { trackFormEvent } from '@/actions/analytics';
import type { AnalyticsEventType } from '@/lib/analytics/aggregate';

/**
 * Stable per-tab session id stored in sessionStorage.
 * Resets when the user closes the tab.
 */
function getSessionId(): string {
  if (typeof window === 'undefined') return 'ssr';
  const KEY = 'klikform-session';
  let id = sessionStorage.getItem(KEY);
  if (!id) {
    id = crypto.randomUUID();
    sessionStorage.setItem(KEY, id);
  }
  return id;
}

interface UseFormTrackingOptions {
  formId: string;
  /** Disable tracking entirely (e.g. when previewing in builder) */
  enabled?: boolean;
}

interface FormTracking {
  trackStart: () => void;
  trackFieldFocus: (fieldId: string) => void;
  trackSubmit: () => void;
}

/**
 * Hook that wires public-form analytics events:
 *  - `view` fires once on mount.
 *  - `start` fires the first time the user touches a field.
 *  - `field_focus` fires per field, but throttled to once per field per session.
 *  - `submit` fires from the form's onSubmit handler.
 *  - `abandon` fires on `pagehide` if the user never submitted.
 */
export function useFormTracking({ formId, enabled = true }: UseFormTrackingOptions): FormTracking {
  const sessionIdRef = useRef<string>('');
  const startedRef = useRef(false);
  const submittedRef = useRef(false);
  const startTimeRef = useRef<number>(0);
  const focusedFieldsRef = useRef<Set<string>>(new Set());

  // Fire-and-forget wrapper — never block the UI on analytics.
  const send = useCallback(
    (eventType: AnalyticsEventType, extra: { fieldId?: string; durationMs?: number } = {}) => {
      if (!enabled) return;
      void trackFormEvent({
        formId,
        eventType,
        sessionId: sessionIdRef.current,
        ...extra,
      }).catch(() => {
        /* silent — analytics must never break the form */
      });
    },
    [formId, enabled]
  );

  useEffect(() => {
    if (!enabled) return;
    sessionIdRef.current = getSessionId();
    startTimeRef.current = Date.now();
    send('view');

    const onPageHide = () => {
      if (startedRef.current && !submittedRef.current) {
        // Use sendBeacon-style fire-and-forget. Server action is non-blocking.
        send('abandon', { durationMs: Date.now() - startTimeRef.current });
      }
    };
    window.addEventListener('pagehide', onPageHide);
    return () => window.removeEventListener('pagehide', onPageHide);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled]);

  const trackStart = useCallback(() => {
    if (startedRef.current) return;
    startedRef.current = true;
    send('start');
  }, [send]);

  const trackFieldFocus = useCallback(
    (fieldId: string) => {
      trackStart();
      if (focusedFieldsRef.current.has(fieldId)) return;
      focusedFieldsRef.current.add(fieldId);
      send('field_focus', { fieldId });
    },
    [send, trackStart]
  );

  const trackSubmit = useCallback(() => {
    if (submittedRef.current) return;
    submittedRef.current = true;
    send('submit', { durationMs: Date.now() - startTimeRef.current });
  }, [send]);

  return { trackStart, trackFieldFocus, trackSubmit };
}
