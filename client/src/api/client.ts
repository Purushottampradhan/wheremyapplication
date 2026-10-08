const configured = (import.meta.env.VITE_API_URL as string | undefined)?.trim();
/** Empty = same-origin / Vite proxy in dev (`/api` → API server). */
export const API_URL = (configured || '').replace(/\/$/, '');

export function getToken(): string | null {
  return localStorage.getItem('wheremyapplication_token');
}

export function setToken(token: string | null) {
  if (token) localStorage.setItem('wheremyapplication_token', token);
  else localStorage.removeItem('wheremyapplication_token');
}

export async function api<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const headers = new Headers(options.headers || {});
  if (!headers.has('Content-Type') && options.body) {
    headers.set('Content-Type', 'application/json');
  }
  const token = getToken();
  if (token) headers.set('Authorization', `Bearer ${token}`);

  const url = `${API_URL}${path}`;
  let res: Response;
  try {
    res = await fetch(url, { ...options, headers });
  } catch {
    throw new Error(
      `Cannot reach API at ${url || path}. Is the server running on port 5080? Try: cd WhereMyApplication && npm run dev`
    );
  }

  const text = await res.text();
  let data: unknown = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = { error: text || 'Request failed' };
  }
  if (!res.ok) {
    const err = (data as { error?: string })?.error || res.statusText;
    throw new Error(err);
  }
  return data as T;
}
