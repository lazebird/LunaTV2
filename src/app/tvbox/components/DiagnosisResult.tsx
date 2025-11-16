import { CheckCircle2, XCircle, AlertTriangle, Activity, Monitor } from 'lucide-react';
import { DiagnosisResult } from '../types';

interface DiagnosisResultProps {
  result: DiagnosisResult | null;
  isLoading?: boolean;
}

export function DiagnosisResult({ result, isLoading = false }: DiagnosisResultProps) {
  if (isLoading) {
    return (
      <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow">
        <div className="flex items-center space-x-2">
          <Activity className="w-5 h-5 animate-pulse text-blue-500" />
          <span>正在诊断...</span>
        </div>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow">
        <p className="text-gray-500">暂无诊断结果</p>
      </div>
    );
  }

  const getStatusIcon = () => {
    if (result.pass) {
      return <CheckCircle2 className="w-5 h-5 text-green-500" />;
    }
    return <XCircle className="w-5 h-5 text-red-500" />;
  };

  const getStatusText = () => {
    if (result.pass) {
      return '诊断通过';
    }
    return '诊断失败';
  };

  return (
    <div className="space-y-4 p-6 bg-white dark:bg-gray-800 rounded-lg shadow">
      <h2 className="text-xl font-bold flex items-center">
        <Monitor className="w-5 h-5 mr-2" />
        诊断结果
      </h2>

      {/* 总体状态 */}
      <div className="flex items-center space-x-2 p-4 bg-gray-100 dark:bg-gray-700 rounded-lg">
        {getStatusIcon()}
        <span className="font-medium">{getStatusText()}</span>
      </div>

      {/* 详细信息 */}
      <div className="space-y-3">
        {/* Spider信息 */}
        {result.spider && (
          <div className="space-y-1">
            <h4 className="font-medium">Spider信息</h4>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="text-gray-500">URL:</span>
                <p className="break-all">{result.spider_url || result.spider}</p>
              </div>
              <div>
                <span className="text-gray-500">状态码:</span>
                <p>{result.spiderStatus || 'N/A'}</p>
              </div>
              <div>
                <span className="text-gray-500">大小:</span>
                <p>{result.spiderSizeKB ? `${result.spiderSizeKB} KB` : 'N/A'}</p>
              </div>
              <div>
                <span className="text-gray-500">最后修改:</span>
                <p>{result.spiderLastModified || 'N/A'}</p>
              </div>
              <div>
                <span className="text-gray-500">MD5:</span>
                <p className="font-mono text-xs break-all">{result.spider_md5 || 'N/A'}</p>
              </div>
              <div>
                <span className="text-gray-500">是否私有:</span>
                <p>{result.spiderPrivate ? '是' : '否'}</p>
              </div>
            </div>
          </div>
        )}

        {/* 配置信息 */}
        {(result.sitesCount !== undefined || result.livesCount !== undefined || result.parsesCount !== undefined) && (
          <div className="space-y-1">
            <h4 className="font-medium">配置统计</h4>
            <div className="grid grid-cols-2 gap-2 text-sm">
              {result.sitesCount !== undefined && (
                <div>
                  <span className="text-gray-500">站点数:</span>
                  <p>{result.sitesCount}</p>
                </div>
              )}
              {result.livesCount !== undefined && (
                <div>
                  <span className="text-gray-500">直播数:</span>
                  <p>{result.livesCount}</p>
                </div>
              )}
              {result.parsesCount !== undefined && (
                <div>
                  <span className="text-gray-500">解析数:</span>
                  <p>{result.parsesCount}</p>
                </div>
              )}
              {result.privateApis !== undefined && (
                <div>
                  <span className="text-gray-500">私有API:</span>
                  <p>{result.privateApis}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 问题列表 */}
        {result.issues && result.issues.length > 0 && (
          <div className="space-y-1">
            <h4 className="font-medium flex items-center">
              <AlertTriangle className="w-4 h-4 mr-1 text-yellow-500" />
              发现的问题
            </h4>
            <ul className="space-y-1">
              {result.issues.map((issue, index) => (
                <li key={index} className="text-sm text-red-600 dark:text-red-400 flex items-start">
                  <span className="mr-2">•</span>
                  <span>{issue}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* 备用链接 */}
        {result.spider_backup && (
          <div className="space-y-1">
            <h4 className="font-medium">备用链接</h4>
            <p className="text-sm font-mono break-all text-blue-600 dark:text-blue-400">
              {result.spider_backup}
            </p>
          </div>
        )}

        {/* 候选链接 */}
        {result.spider_candidates && result.spider_candidates.length > 0 && (
          <div className="space-y-1">
            <h4 className="font-medium">候选链接</h4>
            <ul className="space-y-1">
              {result.spider_candidates.map((candidate, index) => (
                <li key={index} className="text-sm font-mono break-all text-blue-600 dark:text-blue-400">
                  {candidate}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}