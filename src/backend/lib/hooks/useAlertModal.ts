import { useState } from 'react';

export interface AlertModalState {
  isOpen: boolean;
  type: 'success' | 'error' | 'warning';
  title: string;
  message?: string;
  timer?: number;
  showConfirm?: boolean;
}

export function useAlertModal() {
  const [alertModal, setAlertModal] = useState<AlertModalState>({
    isOpen: false,
    type: 'success',
    title: '',
  });

  const showAlert = (config: Omit<AlertModalState, 'isOpen'>) => {
    setAlertModal({ ...config, isOpen: true });
  };

  const hideAlert = () => {
    setAlertModal((prev) => ({ ...prev, isOpen: false }));
  };

  const showSuccess = (message: string, timer = 2000) => {
    showAlert({ type: 'success', title: '成功', message, timer });
  };

  const showError = (message: string, showConfirm = true) => {
    showAlert({ type: 'error', title: '错误', message, showConfirm });
  };

  const showWarning = (message: string, showConfirm = false) => {
    showAlert({ type: 'warning', title: '警告', message, showConfirm });
  };

  return {
    alertModal,
    showAlert,
    hideAlert,
    showSuccess,
    showError,
    showWarning,
  };
}
