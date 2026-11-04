const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';

export type User = {
  id: string;
  phone: string;
  fullName: string;
  role: string;
};

type Session = { accessToken: string; user: User };

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

let accessToken: string | null = null;

async function request<T>(
  path: string,
  init: RequestInit = {},
  retry = true,
): Promise<T> {
  const headers = new Headers(init.headers);
  if (init.body) headers.set('Content-Type', 'application/json');
  if (accessToken) headers.set('Authorization', `Bearer ${accessToken}`);

  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    headers,
    credentials: 'include',
  });

  if (response.status === 401 && retry && !path.startsWith('/auth/')) {
    try {
      await restoreSession();
      return await request<T>(path, init, false);
    } catch {
      // fall through to the error below
    }
  }

  if (!response.ok) {
    let message = `Request failed (${response.status})`;
    try {
      const data = (await response.json()) as { message?: unknown };
      if (typeof data.message === 'string') message = data.message;
      else if (Array.isArray(data.message)) message = data.message.join(', ');
    } catch {
      // keep the default message
    }
    throw new ApiError(message, response.status);
  }

  return (await response.json()) as T;
}

export function requestOtp(phone: string) {
  return request<{ ok: boolean }>('/auth/otp/request', {
    method: 'POST',
    body: JSON.stringify({ phone }),
  });
}

export async function verifyOtp(phone: string, code: string) {
  const session = await request<Session>('/auth/otp/verify', {
    method: 'POST',
    body: JSON.stringify({ phone, code }),
  });
  accessToken = session.accessToken;
  return session.user;
}

let refreshing: Promise<User> | null = null;

export function restoreSession(): Promise<User> {
  if (!refreshing) {
    refreshing = request<Session>('/auth/refresh', { method: 'POST' })
      .then((session) => {
        accessToken = session.accessToken;
        return session.user;
      })
      .finally(() => {
        refreshing = null;
      });
  }
  return refreshing;
}

export async function signOut() {
  try {
    await request<{ ok: boolean }>('/auth/logout', { method: 'POST' });
  } finally {
    accessToken = null;
  }
}

export function getMe() {
  return request<User & { email: string | null }>('/me');
}