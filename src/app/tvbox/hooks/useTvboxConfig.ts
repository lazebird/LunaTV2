import { useState, useCallback, useEffect } from 'react';
import { SecurityConfig, Source, DiagnosisResult, JarDiagnostic, HealthStatus } from '../types';

export function useTvboxConfig() {
  const [config, setConfig] = useState<SecurityConfig>({
    enableAuth: false,
    token: '',
    enableIpWhitelist: false,
    allowedIPs: [],
    enableRateLimit: false,
    rateLimit: 100,
  });
  
  const [sources, setSources] = useState<Source[]>([]);
  const [diagnosis, setDiagnosis] = useState<DiagnosisResult | null>(null);
  const [jarDiagnostic, setJarDiagnostic] = useState<JarDiagnostic | null>(null);
  const [healthStatus, setHealthStatus] = useState<HealthStatus | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 加载配置
  const loadConfig = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetch('/api/tvbox-config');
      if (!response.ok) {
        throw new Error('加载配置失败');
      }
      
      const data = await response.json();
      setConfig(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载配置失败');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 保存配置
  const saveConfig = useCallback(async (newConfig: Partial<SecurityConfig>) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetch('/api/tvbox-config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ...config, ...newConfig }),
      });
      
      if (!response.ok) {
        throw new Error('保存配置失败');
      }
      
      const data = await response.json();
      setConfig(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : '保存配置失败');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [config]);

  // 加载源列表
  const loadSources = useCallback(async () => {
    try {
      const response = await fetch('/api/sources');
      if (!response.ok) {
        throw new Error('加载源列表失败');
      }
      
      const data = await response.json();
      setSources(data);
    } catch (err) {
      console.error('加载源列表失败:', err);
    }
  }, []);

  // 运行诊断
  const runDiagnosis = useCallback(async (configUrl?: string) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const url = configUrl 
        ? `/api/tvbox/diagnose?url=${encodeURIComponent(configUrl)}`
        : '/api/tvbox/diagnose';
      
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('诊断失败');
      }
      
      const data = await response.json();
      setDiagnosis(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : '诊断失败');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // JAR诊断
  const runJarDiagnostic = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetch('/api/tvbox/jar-diagnostic');
      if (!response.ok) {
        throw new Error('JAR诊断失败');
      }
      
      const data = await response.json();
      setJarDiagnostic(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'JAR诊断失败');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 健康检查
  const runHealthCheck = useCallback(async () => {
    try {
      const response = await fetch('/api/tvbox/health');
      if (!response.ok) {
        throw new Error('健康检查失败');
      }
      
      const data = await response.json();
      setHealthStatus(data);
    } catch (err) {
      console.error('健康检查失败:', err);
    }
  }, []);

  // 更新配置项
  const updateConfig = useCallback(<K extends keyof SecurityConfig>(
    key: K,
    value: SecurityConfig[K]
  ) => {
    setConfig(prev => ({ ...prev, [key]: value }));
  }, []);

  // 添加IP到白名单
  const addAllowedIP = useCallback((ip: string) => {
    if (!config.allowedIPs.includes(ip)) {
      updateConfig('allowedIPs', [...config.allowedIPs, ip]);
    }
  }, [config.allowedIPs, updateConfig]);

  // 移除IP从白名单
  const removeAllowedIP = useCallback((ip: string) => {
    updateConfig('allowedIPs', config.allowedIPs.filter(allowedIP => allowedIP !== ip));
  }, [config.allowedIPs, updateConfig]);

  // 生成随机token
  const generateToken = useCallback(() => {
    const token = Math.random().toString(36).substring(2, 15) + 
                  Math.random().toString(36).substring(2, 15);
    updateConfig('token', token);
  }, [updateConfig]);

  // 初始化
  useEffect(() => {
    loadConfig();
    loadSources();
    runHealthCheck();
  }, [loadConfig, loadSources, runHealthCheck]);

  return {
    config,
    sources,
    diagnosis,
    jarDiagnostic,
    healthStatus,
    isLoading,
    error,
    loadConfig,
    saveConfig,
    runDiagnosis,
    runJarDiagnostic,
    runHealthCheck,
    updateConfig,
    addAllowedIP,
    removeAllowedIP,
    generateToken,
  };
}