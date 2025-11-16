import { useState } from 'react';
import { Shield, Key, Globe, Zap, RefreshCw } from 'lucide-react';
import { SecurityConfig } from '../types';

interface SecurityConfigPanelProps {
  config: SecurityConfig;
  onUpdate: (updates: Partial<SecurityConfig>) => void;
  onGenerateToken: () => void;
  onAddIP: (ip: string) => void;
  onRemoveIP: (ip: string) => void;
  isLoading?: boolean;
}

export function SecurityConfigPanel({
  config,
  onUpdate,
  onGenerateToken,
  onAddIP,
  onRemoveIP,
  isLoading = false,
}: SecurityConfigPanelProps) {
  const [newIP, setNewIP] = useState('');

  const handleAddIP = () => {
    if (newIP.trim()) {
      onAddIP(newIP.trim());
      setNewIP('');
    }
  };

  return (
    <div className="space-y-6 p-6 bg-white dark:bg-gray-800 rounded-lg shadow">
      <h2 className="text-xl font-bold flex items-center">
        <Shield className="w-5 h-5 mr-2" />
        安全配置
      </h2>

      {/* 认证设置 */}
      <div className="space-y-4">
        <h3 className="font-medium flex items-center">
          <Key className="w-4 h-4 mr-2" />
          认证设置
        </h3>
        
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="enableAuth"
            checked={config.enableAuth}
            onChange={(e) => onUpdate({ enableAuth: e.target.checked })}
            className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
          />
          <label htmlFor="enableAuth" className="text-sm font-medium">
            启用Token认证
          </label>
        </div>

        {config.enableAuth && (
          <div className="space-y-2">
            <div className="flex space-x-2">
              <input
                type="text"
                value={config.token}
                onChange={(e) => onUpdate({ token: e.target.value })}
                placeholder="请输入Token"
                className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              />
              <button
                onClick={onGenerateToken}
                disabled={isLoading}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                生成
              </button>
            </div>
            <p className="text-xs text-gray-500">
              Token用于API访问认证，请妥善保管
            </p>
          </div>
        )}
      </div>

      {/* IP白名单 */}
      <div className="space-y-4">
        <h3 className="font-medium flex items-center">
          <Globe className="w-4 h-4 mr-2" />
          IP白名单
        </h3>
        
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="enableIpWhitelist"
            checked={config.enableIpWhitelist}
            onChange={(e) => onUpdate({ enableIpWhitelist: e.target.checked })}
            className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
          />
          <label htmlFor="enableIpWhitelist" className="text-sm font-medium">
            启用IP白名单
          </label>
        </div>

        {config.enableIpWhitelist && (
          <div className="space-y-2">
            <div className="flex space-x-2">
              <input
                type="text"
                value={newIP}
                onChange={(e) => setNewIP(e.target.value)}
                placeholder="输入IP地址 (如: 192.168.1.100)"
                className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              />
              <button
                onClick={handleAddIP}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                添加
              </button>
            </div>
            
            {config.allowedIPs.length > 0 && (
              <div className="space-y-1">
                {config.allowedIPs.map((ip) => (
                  <div
                    key={ip}
                    className="flex items-center justify-between p-2 bg-gray-100 dark:bg-gray-700 rounded"
                  >
                    <span className="text-sm">{ip}</span>
                    <button
                      onClick={() => onRemoveIP(ip)}
                      className="text-red-500 hover:text-red-700 text-sm"
                    >
                      移除
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* 速率限制 */}
      <div className="space-y-4">
        <h3 className="font-medium flex items-center">
          <Zap className="w-4 h-4 mr-2" />
          速率限制
        </h3>
        
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="enableRateLimit"
            checked={config.enableRateLimit}
            onChange={(e) => onUpdate({ enableRateLimit: e.target.checked })}
            className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
          />
          <label htmlFor="enableRateLimit" className="text-sm font-medium">
            启用速率限制
          </label>
        </div>

        {config.enableRateLimit && (
          <div className="space-y-2">
            <label className="text-sm text-gray-600 dark:text-gray-400">
              每分钟请求限制
            </label>
            <input
              type="number"
              min="1"
              max="1000"
              value={config.rateLimit}
              onChange={(e) => onUpdate({ rateLimit: parseInt(e.target.value) || 100 })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            />
            <p className="text-xs text-gray-500">
              限制每个IP每分钟的请求数量，防止滥用
            </p>
          </div>
        )}
      </div>
    </div>
  );
}