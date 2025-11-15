import { useState, useEffect, useCallback } from 'react';
import { api } from '@/shared/utils/apiClient';

export function useUserManagement(refreshConfig: () => Promise<void>) {
  const [loading, setLoading] = useState(false);

  const handleUserAction = useCallback(async (
    action: string,
    targetUsername: string,
    targetPassword?: string,
    userGroup?: string
  ) => {
    setLoading(true);
    try {
      await api.post('/api/admin/user', {
        targetUsername,
        ...(targetPassword && { targetPassword }),
        ...(userGroup && { userGroup }),
        action,
      });
      await refreshConfig();
    } finally {
      setLoading(false);
    }
  }, [refreshConfig]);

  const addUser = useCallback((username: string, password: string, userGroup?: string) =>
    handleUserAction('add', username, password, userGroup), [handleUserAction]);

  const banUser = useCallback((username: string) =>
    handleUserAction('ban', username), [handleUserAction]);

  const unbanUser = useCallback((username: string) =>
    handleUserAction('unban', username), [handleUserAction]);

  const setAdmin = useCallback((username: string) =>
    handleUserAction('setAdmin', username), [handleUserAction]);

  const removeAdmin = useCallback((username: string) =>
    handleUserAction('cancelAdmin', username), [handleUserAction]);

  const changePassword = useCallback((username: string, password: string) =>
    handleUserAction('changePassword', username, password), [handleUserAction]);

  const deleteUser = useCallback((username: string) =>
    handleUserAction('deleteUser', username), [handleUserAction]);

  return {
    loading,
    addUser,
    banUser,
    unbanUser,
    setAdmin,
    removeAdmin,
    changePassword,
    deleteUser,
  };
}
