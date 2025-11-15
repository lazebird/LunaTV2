import { useState } from 'react';

interface RequestOptions<T> {
  onSuccess?: (data: T) => void;
  onError?: (error: Error) => void;
  showLoading?: boolean;
}

export function useApiRequest<T = any>() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [data, setData] = useState<T | null>(null);

  const request = async (
    fn: () => Promise<T>,
    options?: RequestOptions<T>
  ): Promise<T> => {
    if (options?.showLoading !== false) {
      setLoading(true);
    }
    setError(null);

    try {
      const result = await fn();
      setData(result);
      options?.onSuccess?.(result);
      return result;
    } catch (err) {
      const error = err as Error;
      setError(error);
      options?.onError?.(error);
      throw error;
    } finally {
      if (options?.showLoading !== false) {
        setLoading(false);
      }
    }
  };

  const reset = () => {
    setLoading(false);
    setError(null);
    setData(null);
  };

  return { request, loading, error, data, reset };
}
