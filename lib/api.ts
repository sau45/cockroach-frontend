import { API_BASE_URL } from './constants';
import { getDeviceFingerprint } from './fingerprint';

export async function apiClient<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
  
  const headers = new Headers(options.headers || {});
  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  try {
    if (!headers.has('x-device-fingerprint')) {
      const fp = await getDeviceFingerprint();
      if (fp) headers.set('x-device-fingerprint', fp);
    }
  } catch (e) {}

  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('ct_session_token');
    if (token && !headers.has('Authorization')) {
      headers.set('Authorization', `Bearer ${token}`);
    }
  }

  const response = await fetch(url, {
    ...options,
    headers,
    credentials: 'include' // Always send cookies (ct_session)
  });

  const data = await response.json().catch(() => ({}));

  if (data && typeof data === 'object' && (data as any).token && typeof window !== 'undefined') {
    localStorage.setItem('ct_session_token', (data as any).token);
  }

  if (!response.ok) {
    const errorMsg = data.message || `Request failed with status ${response.status}`;
    throw new Error(errorMsg);
  }

  return data as T;
}
