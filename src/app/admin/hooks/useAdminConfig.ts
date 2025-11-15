import { useCallback, useEffect, useState } from 'react';

import { AdminConfig, AdminConfigResult } from '@/lib/admin.types';

export function useAdminConfig() {
  const [config, setConfig] = useState<AdminConfig | null>(null);
  const [role, setRole] = useState<'owner' | 'admin' | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchConfig = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/config');
      if (!res.ok) {
        throw new Error(`获取配置失败: ${res.status}`);
      }
      const data: AdminConfigResult = await res.json();
      setConfig(data.Config);
      setRole(data.Role);
    } catch (err) {
      setError(err instanceof Error ? err.message : '获取配置失败');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchConfig();
  }, [fetchConfig]);

  return {
    config,
    role,
    loading,
    error,
    refreshConfig: fetchConfig,
  };
}
