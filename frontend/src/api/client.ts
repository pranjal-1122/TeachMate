export interface APIError {
  code: string;
  message: string;
  details?: Record<string, any>;
  request_id?: string;
}

export class APIClientError extends Error {
  code: string;
  details?: Record<string, any>;
  status: number;
  requestId?: string;

  constructor(status: number, code: string, message: string, details?: Record<string, any>, requestId?: string) {
    super(message);
    this.name = 'APIClientError';
    this.status = status;
    this.code = code;
    this.details = details;
    this.requestId = requestId;
  }
}

const getBaseUrl = (): string => {
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  if (typeof window !== 'undefined' && window.location.port === '5173') {
    return `http://${window.location.hostname}:8000/api/v1`;
  }
  return '/api/v1';
};

const BASE_URL = getBaseUrl();

export async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

  const token = typeof window !== 'undefined' ? localStorage.getItem('teachmate_token') : null;

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };

  const response = await fetch(url, {
    ...options,
    headers,
    credentials: 'include', // Essential for HTTP-only cookies
  });

  // Handle 204 No Content
  if (response.status === 204) {
    return {} as T;
  }

  let data: any = {};
  try {
    data = await response.json();
  } catch (err) {
    // Non-JSON response
    if (!response.ok) {
      throw new APIClientError(
        response.status,
        'RESPONSE_PARSE_ERROR',
        `Server returned status ${response.status}`
      );
    }
  }

  if (!response.ok) {
    const err = data.error || {};
    throw new APIClientError(
      response.status,
      err.code || 'UNKNOWN_ERROR',
      err.message || 'An error occurred while communicating with the server.',
      err.details,
      err.request_id
    );
  }

  return data as T;
}
