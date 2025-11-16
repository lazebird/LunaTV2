import { CheckCircle2, XCircle, AlertTriangle, Package, Activity } from 'lucide-react';
import { JarDiagnostic } from '../types';

interface JarDiagnosticProps {
  diagnostic: JarDiagnostic | null;
  isLoading?: boolean;
  onRunDiagnostic: () => void;
}

export function JarDiagnostic({ diagnostic, isLoading = false, onRunDiagnostic }: JarDiagnosticProps) {
  if (isLoading) {
    return (
      <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow">
        <div className="flex items-center space-x-2">
          <Activity className="w-5 h-5 animate-pulse text-blue-500" />
          <span>正在检测JAR环境...</span>
        </div>
      </div>
    );
  }

  if (!diagnostic) {
    return (
      <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow">
        <div className="flex items-center justify-between">
          <p className="text-gray-500">暂未检测JAR环境</p>
          <button
            onClick={onRunDiagnostic}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            开始检测
          </button>
        </div>
      </div>
    );
  }

  const getStatusIcon = () => {
    if (diagnostic.pass) {
      return <CheckCircle2 className="w-5 h-5 text-green-500" />;
    }
    return <XCircle className="w-5 h-5 text-red-500" />;
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-4 p-6 bg-white dark:bg-gray-800 rounded-lg shadow">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold flex items-center">
          <Package className="w-5 h-5 mr-2" />
          JAR环境检测
        </h2>
        <button
          onClick={onRunDiagnostic}
          disabled={isLoading}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          重新检测
        </button>
      </div>

      {/* 总体状态 */}
      <div className="flex items-center space-x-2 p-4 bg-gray-100 dark:bg-gray-700 rounded-lg">
        {getStatusIcon()}
        <span className="font-medium">
          {diagnostic.pass ? '环境正常' : '环境异常'}
        </span>
      </div>

      {/* 详细信息 */}
      <div className="space-y-3">
        {/* JAR文件信息 */}
        <div className="space-y-1">
          <h4 className="font-medium">JAR文件</h4>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <span className="text-gray-500">存在:</span>
              <p>{diagnostic.jarExists ? '是' : '否'}</p>
            </div>
            <div>
              <span className="text-gray-500">大小:</span>
              <p>{formatFileSize(diagnostic.jarSize)}</p>
            </div>
            <div>
              <span className="text-gray-500">最后修改:</span>
              <p>{new Date(diagnostic.jarLastModified).toLocaleString()}</p>
            </div>
          </div>
        </div>

        {/* Java环境信息 */}
        <div className="space-y-1">
          <h4 className="font-medium">Java环境</h4>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <span className="text-gray-500">已安装:</span>
              <p>{diagnostic.javaInstalled ? '是' : '否'}</p>
            </div>
            <div>
              <span className="text-gray-500">版本:</span>
              <p>{diagnostic.javaVersion || 'N/A'}</p>
            </div>
            <div className="col-span-2">
              <span className="text-gray-500">JAVA_HOME:</span>
              <p className="font-mono text-xs break-all">{diagnostic.javaHome || 'N/A'}</p>
            </div>
          </div>
        </div>

        {/* 系统环境 */}
        <div className="space-y-1">
          <h4 className="font-medium">系统环境</h4>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <span className="text-gray-500">架构:</span>
              <p>{diagnostic.environment.arch}</p>
            </div>
            <div>
              <span className="text-gray-500">平台:</span>
              <p>{diagnostic.environment.platform}</p>
            </div>
            <div className="col-span-2">
              <span className="text-gray-500">Node.js版本:</span>
              <p>{diagnostic.environment.nodeVersion}</p>
            </div>
          </div>
        </div>

        {/* 问题列表 */}
        {diagnostic.issues && diagnostic.issues.length > 0 && (
          <div className="space-y-1">
            <h4 className="font-medium flex items-center">
              <AlertTriangle className="w-4 h-4 mr-1 text-yellow-500" />
              发现的问题
            </h4>
            <ul className="space-y-1">
              {diagnostic.issues.map((issue, index) => (
                <li key={index} className="text-sm text-red-600 dark:text-red-400 flex items-start">
                  <span className="mr-2">•</span>
                  <span>{issue}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}