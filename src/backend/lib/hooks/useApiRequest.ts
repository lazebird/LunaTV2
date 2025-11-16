import { useState, useCallback } from 'react';

export interface ApiRequestOptions<T> {
  onSuccess?: (data: T) => void;
  onError?: (error: Error) => void;
  onFinally?: () => void;
}

export interface ApiRequestState {
  loading: boolean;
  error: Error | null;
}

export function useApiRequest<T = any>() {
  const [state, setState] = useState<ApiRequestState>({
    loading: false,
    error: null,
  });

  const execute = useCallback(
    async (
      apiCall: () => Promise<T>,
      options?: ApiRequestOptions<T>
    ): Promise<T | null> => {
      setState({ loading: true, error: null });

      try {
        const result = await apiCall();
        options?.onSuccess?.(result);
        return result;
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        setState({ loading: false, error });
        options?.onError?.(error);
        return null;
      } finally {
        setState((prev) => ({ ...prev, loading: false }));
        options?.onFinally?.();
      }
    },
    []
  );

  const reset = useCallback(() => {
    setState({ loading: false, error: null });
  }, []);

  return {
    ...state,
    execute,
    reset,
  };
}
