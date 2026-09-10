import { useEffect, useRef } from 'react';
import { apiUrl } from '../apiBase.js';

const SESSION_KEY = 'qa_kit_session_id';

function getSessionId(): string {
  let id = localStorage.getItem(SESSION_KEY);
  if (!id) {
    id = (typeof crypto !== 'undefined' && crypto.randomUUID)
      ? crypto.randomUUID()
      : `sess_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    localStorage.setItem(SESSION_KEY, id);
  }
  return id;
}

function sendTrack(path: string, durationSeconds: number, token: string | null) {
  if (durationSeconds <= 0) return;
  const payload = JSON.stringify({
    session_id: getSessionId(),
    path,
    duration_seconds: durationSeconds,
    auth_token: token
  });

  if (typeof navigator !== 'undefined' && navigator.sendBeacon) {
    const blob = new Blob([payload], { type: 'application/json' });
    navigator.sendBeacon(apiUrl('/api/analytics/track'), blob);
  } else {
    fetch('/api/analytics/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: payload,
      keepalive: true
    }).catch(() => {});
  }
}

// Silently pings the backend as visitors move between pages, so the admin panel can
// report how many people visit and how long they actually spend on each page.
// The admin's own browsing is never tracked — isAdmin skips it entirely, so testing/using
// the site as admin never skews the visitor analytics the admin panel then reports on.
export function useVisitTracking(path: string, token: string | null, isAdmin: boolean) {
  const enteredAtRef = useRef<number>(Date.now());
  const pathRef = useRef(path);
  const tokenRef = useRef(token);
  const isAdminRef = useRef(isAdmin);

  useEffect(() => {
    tokenRef.current = token;
  }, [token]);

  useEffect(() => {
    isAdminRef.current = isAdmin;
  }, [isAdmin]);

  useEffect(() => {
    const now = Date.now();
    const durationSeconds = Math.round((now - enteredAtRef.current) / 1000);
    if (!isAdminRef.current) {
      sendTrack(pathRef.current, durationSeconds, tokenRef.current);
    }
    pathRef.current = path;
    enteredAtRef.current = now;
  }, [path]);

  useEffect(() => {
    const flush = () => {
      const durationSeconds = Math.round((Date.now() - enteredAtRef.current) / 1000);
      if (!isAdminRef.current) {
        sendTrack(pathRef.current, durationSeconds, tokenRef.current);
      }
      enteredAtRef.current = Date.now();
    };
    const handleVisibility = () => {
      if (document.visibilityState === 'hidden') flush();
    };
    window.addEventListener('beforeunload', flush);
    document.addEventListener('visibilitychange', handleVisibility);
    return () => {
      window.removeEventListener('beforeunload', flush);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, []);
}
