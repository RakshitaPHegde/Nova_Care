import { enqueue, pending, remove } from './offline';

export const API_URL = (import.meta as any).env.VITE_API || 'http://localhost:4000';

export async function request<T = any>(endpoint: string, options: {
  method?: string;
  body?: any;
  params?: Record<string, string | number | undefined>;
} = {}): Promise<T> {
  const { method = 'GET', body, params } = options;

  let url = API_URL + endpoint;
  if (params) {
    const q = new URLSearchParams();
    for (const [k, v] of Object.entries(params)) {
      if (v !== undefined && v !== null) q.append(k, String(v));
    }
    const qs = q.toString();
    if (qs) url += (url.includes('?') ? '&' : '?') + qs;
  }

  const token = localStorage.getItem('token');
  const headers: Record<string, string> = {
    'Content-Type': 'application/json'
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const isGet = method.toUpperCase() === 'GET';

  try {
    const res = await fetch(url, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      const err = new Error(data.error || `HTTP ${res.status}: ${res.statusText}`);
      (err as any).status = res.status;
      (err as any).data = data;
      throw err;
    }

    if (isGet) {
      try {
        localStorage.setItem('cache_' + endpoint, JSON.stringify({ t: Date.now(), d: data }));
      } catch (e) {
        // storage quota exceeded or disabled
      }
    }

    return data;
  } catch (err: any) {
    // If offline or network failed on GET, try reading cache
    if (isGet && !err.status) {
      const cached = localStorage.getItem('cache_' + endpoint);
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          const data = parsed.d;
          if (typeof data === 'object' && data !== null) {
            (data as any)._cachedAt = parsed.t;
          }
          return data;
        } catch {}
      }
    }
    throw err;
  }
}

export async function flushOfflineQueue() {
  const queue = await pending();
  if (!queue.length) return { syncedCount: 0 };

  try {
    const res = await request('/api/sync/upload', {
      method: 'POST',
      body: { records: queue }
    });

    let syncedCount = 0;
    if (res.results) {
      for (const item of res.results) {
        if (item.status !== 'failed') {
          await remove(item.key);
          syncedCount++;
        }
      }
    }
    return { syncedCount, results: res.results };
  } catch (err) {
    console.warn('[Sync] Offline queue flush failed:', err);
    return { syncedCount: 0 };
  }
}
