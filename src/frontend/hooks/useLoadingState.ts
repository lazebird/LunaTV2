/* eslint-disable @typescript-eslint/no-explicit-any */

import { useState, useCallback } from 'react';

interface LoadingState {
  [key: string]: boolean;
}

/**
 * 加载状态管理Hook
 */
export function useLoadingState() {
  const [loadingStates, setLoadingStates] = useState<LoadingState>({});

  const setLoading = useCallback((key: string, loading: boolean) => {
    setLoadingStates(prev => ({
      ...prev,
      [key]: loading
    }));
  }, []);

  const isLoading = useCallback((key: string) => loadingStates[key] || false, [loadingStates]);

  const withLoading = useCallback(async <T>(
    key: string,
    operation: () => Promise<T>
  ): Promise<T> => {
    setLoading(key, true);
    try {
      const result = await operation();
      return result;
    } finally {
      setLoading(key, false);
    }
  }, [setLoading]);

  return {
    isLoading,
    setLoading,
    withLoading
  };
}