import { useState, useCallback } from 'react';

export const useLoadingState = () => {
  const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>({});

  const setLoading = useCallback((key: string, loading: boolean) => {
    setLoadingStates((prev) => ({ ...prev, [key]: loading }));
  }, []);

  const isLoading = useCallback((key: string) => loadingStates[key] || false, [loadingStates]);

  const withLoading = useCallback(async (key: string, operation: () => Promise<any>): Promise<any> => {
    setLoading(key, true);
    try {
      return await operation();
    } finally {
      setLoading(key, false);
    }
  }, [setLoading]);

  return { loadingStates, setLoading, isLoading, withLoading };
};

export const useAlertModal = () => {
  const [alertModal, setAlertModal] = useState<{
    isOpen: boolean;
    type: 'success' | 'error' | 'warning';
    title: string;
    message?: string;
    timer?: number;
    showConfirm?: boolean;
  }>({
    isOpen: false,
    type: 'success',
    title: '',
  });

  const showAlert = useCallback((config: Omit<typeof alertModal, 'isOpen'>) => {
    setAlertModal({ ...config, isOpen: true });
  }, []);

  const hideAlert = useCallback(() => {
    setAlertModal((prev) => ({ ...prev, isOpen: false }));
  }, []);

  return { alertModal, showAlert, hideAlert };
};
