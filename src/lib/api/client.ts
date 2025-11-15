export const buildApiUrl = (path: string, params: Record<string, string>): string => {
  const url = new URL(path, typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000');
  Object.entries(params).forEach(([key, value]) => {
    url.searchParams.append(key, value);
  });
  return url.toString();
};

export const fetchApi = async <T>(path: string, params?: Record<string, string>): Promise<T> => {
  const url = params ? buildApiUrl(path, params) : path;
  const response = await fetch(url);
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: response.statusText }));
    throw new Error(error.error || `API Error: ${response.status}`);
  }
  return response.json();
};
