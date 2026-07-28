import api from './api';

const CACHE_PREFIX = 'anpc_cache_';
const CACHE_TTL_MS = 5 * 60 * 1000;

const getCacheKey = (url, params = {}) => {
  const sorted = Object.keys(params)
    .sort()
    .map(key => `${key}=${params[key] ?? ''}`)
    .join('&');
  return `${CACHE_PREFIX}${url}?${sorted}`;
};

const readCache = (key) => {
  if (typeof window === 'undefined') return null;
  try {
    const raw = sessionStorage.getItem(key);
    if (!raw) return null;
    const entry = JSON.parse(raw);
    if (!entry || !entry.expiresAt) return null;
    if (Date.now() > entry.expiresAt) {
      sessionStorage.removeItem(key);
      return null;
    }
    return entry.data;
  } catch {
    sessionStorage.removeItem(key);
    return null;
  }
};

const writeCache = (key, data) => {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.setItem(key, JSON.stringify({ data, expiresAt: Date.now() + CACHE_TTL_MS }));
  } catch {
    sessionStorage.removeItem(key);
  }
};

const inflate = (input) => input?.data ?? input;

export async function fetchWithCache(url, params = {}, options = {}) {
  const {
    force = false,
    onStale = null,
    cacheKey: explicitKey,
    ttl = CACHE_TTL_MS,
    inflate: shouldInflate = true,
  } = options;

  const key = explicitKey || getCacheKey(url, params);

  if (!force) {
    const cached = readCache(key);
    if (cached) {
      if (onStale) onStale(shouldInflate ? inflate(cached) : cached);
      revalidate(key, url, params, ttl);
      return shouldInflate ? inflate(cached) : cached;
    }
  }

  const { data } = await api.get(url, { params });
  writeCache(key, data);
  return shouldInflate ? inflate(data) : data;
}

const revalidate = (key, url, params, ttl) => {
  if (typeof window === 'undefined') return;
  const timer = setTimeout(async () => {
    try {
      const { data } = await api.get(url, { params });
      writeCache(key, data);
    } catch {
      sessionStorage.removeItem(key);
    }
  }, 800);

  if (typeof window !== 'undefined') {
    window.__anpc_revalidation_timers = window.__anpc_revalidation_timers || new Map();
    window.__anpc_revalidation_timers.set(key, timer);
  }
};

export function invalidateCache(pattern) {
  if (typeof window === 'undefined') return;
  const revalidationTimers = window.__anpc_revalidation_timers;
  if (revalidationTimers) {
    for (const [key, timer] of revalidationTimers.entries()) {
      if (key.includes(pattern)) {
        clearTimeout(timer);
        revalidationTimers.delete(key);
      }
    }
  }
  try {
    for (let i = sessionStorage.length - 1; i >= 0; i--) {
      const key = sessionStorage.key(i);
      if (key && key.includes(pattern)) {
        sessionStorage.removeItem(key);
      }
    }
  } catch {
    sessionStorage.clear();
  }
}
