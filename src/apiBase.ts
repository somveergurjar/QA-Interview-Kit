// When the frontend (Vercel) and backend (Render) are deployed separately, every
// `fetch('/api/...')` call across the app needs to point at the Render backend
// instead of the Vercel domain it's actually running on. Rather than rewriting
// every call site, this patches window.fetch once at app startup to prefix any
// relative /api request with VITE_API_URL. Same-origin deploys (local dev, or a
// unified deploy) work unchanged since API_BASE is empty and nothing is rewritten.
export const API_BASE = (import.meta.env.VITE_API_URL || '').replace(/\/+$/, '');

if (API_BASE && typeof window !== 'undefined' && typeof window.fetch === 'function') {
  const originalFetch = window.fetch.bind(window);
  window.fetch = (input: RequestInfo | URL, init?: RequestInit) => {
    if (typeof input === 'string' && input.startsWith('/api')) {
      return originalFetch(`${API_BASE}${input}`, init);
    }
    return originalFetch(input, init);
  };
}

// For call sites that can't go through window.fetch (e.g. navigator.sendBeacon).
export function apiUrl(path: string): string {
  return path.startsWith('/api') ? `${API_BASE}${path}` : path;
}
