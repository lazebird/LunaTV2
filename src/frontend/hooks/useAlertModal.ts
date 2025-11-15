/* eslint-disable @typescript-eslint/no-explicit-any */

import { useState, useCallback } from 'react';

interface AlertModalConfig {
  isOpen: boolean;
  title?: string;
  message?: string;
  type?: 'success' | 'error' | 'warning' | 'info';
  onConfirm?: () => void;
  onCancel?: () => void;
  confirmText?: string;
  cancelText?: string;
}

/**
 * 警告模态框管理Hook
 */
export function useAlertModal() {
  const [alertModal, setAlertModal] = useState<AlertModalConfig>({
    isOpen: false,
    title: '',
    message: '',
    type: 'info'
  });

  const showAlert = useCallback((config: Omit<AlertModalConfig, 'isOpen'>) => {
    setAlertModal({
      isOpen: true,
      ...config
    });
  }, []);

  const hideAlert = useCallback(() => {
    setAlertModal(prev => ({ ...prev, isOpen: false }));
  }, []);

  const showSuccess = useCallback((message: string, title?: string) => {
    showAlert({
      title: title || '成功',
      message,
      type: 'success'
    });
  }, [showAlert]);

  const showError = useCallback((message: string, title?: string) => {
    showAlert({
      title: title || '错误',
      message,
      type: 'error'
    });
  }, [showAlert]);

  const showWarning = useCallback((message: string, title?: string) => {
    showAlert({
      title: title || '警告',
      message,
      type: 'warning'
    });
  }, [showAlert]);

  const showInfo = useCallback((message: string, title?: string) => {
    showAlert({
      title: title || '提示',
      message,
      type: 'info'
    });
  }, [showAlert]);

  return {
    alertModal,
    showAlert,
    hideAlert,
    showSuccess,
    showError,
    showWarning,
    showInfo
  };
}