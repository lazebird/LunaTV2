/**
 * 统一API请求封装
 */

export interface ApiResponse<T = any> {
  success?: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export class ApiError extends Error {
  constructor(
    message: string,
    public status?: number,
    public data?: any
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export async function apiRequest<T = any>(
  url: string,
  options?: RequestInit
): Promise<T> {
  try {
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
      ...options,
    });

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      throw new ApiError(
        data.error || data.message || `请求失败: ${response.status}`,
        response.status,
        data
      );
    }

    return await response.json();
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(
      error instanceof Error ? error.message : '网络请求失败'
    );
  }
}

export async function apiPost<T = any>(
  url: string,
  data?: any,
  options?: RequestInit
): Promise<T> {
  return apiRequest<T>(url, {
    method: 'POST',
    body: data ? JSON.stringify(data) : undefined,
    ...options,
  });
}

export async function apiGet<T = any>(
  url: string,
  options?: RequestInit
): Promise<T> {
  return apiRequest<T>(url, {
    method: 'GET',
    ...options,
  });
}

export async function apiPut<T = any>(
  url: string,
  data?: any,
  options?: RequestInit
): Promise<T> {
  return apiRequest<T>(url, {
    method: 'PUT',
    body: data ? JSON.stringify(data) : undefined,
    ...options,
  });
}

export async function apiDelete<T = any>(
  url: string,
  options?: RequestInit
): Promise<T> {
  return apiRequest<T>(url, {
    method: 'DELETE',
    ...options,
  });
}
