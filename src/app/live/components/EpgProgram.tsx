import { Clock, Calendar } from 'lucide-react';
import { EpgProgram } from '../types';
import { formatTime, formatDateTime } from '../utils/live-utils';

interface EpgProgramProps {
  program: EpgProgram | null;
  nextProgram?: EpgProgram | null;
  isLoading?: boolean;
}

export function EpgProgram({ program, nextProgram, isLoading = false }: EpgProgramProps) {
  if (isLoading) {
    return (
      <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
        <div className="animate-pulse space-y-2">
          <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-3/4"></div>
          <div className="h-3 bg-gray-300 dark:bg-gray-700 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  if (!program) {
    return (
      <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
        <div className="flex items-center justify-center text-gray-500">
          <Calendar className="w-5 h-5 mr-2" />
          <span>暂无节目信息</span>
        </div>
      </div>
    );
  }

  const getProgress = (): number => {
    const now = Date.now();
    const start = program.start;
    const end = program.stop;
    
    if (now < start) return 0;
    if (now > end) return 100;
    
    return ((now - start) / (end - start)) * 100;
  };

  return (
    <div className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow">
      {/* 当前节目 */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="font-medium text-gray-900 dark:text-gray-100">
            {program.title}
          </h3>
          <div className="flex items-center text-sm text-gray-500">
            <Clock className="w-4 h-4 mr-1" />
            <span>
              {formatTime(program.start)} - {formatTime(program.stop)}
            </span>
          </div>
        </div>

        {/* 节目描述 */}
        {program.description && (
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {program.description}
          </p>
        )}

        {/* 类别 */}
        {program.category && (
          <div className="flex items-center space-x-2">
            <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 rounded">
              {program.category}
            </span>
          </div>
        )}

        {/* 进度条 */}
        <div className="relative">
          <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-500 transition-all duration-1000"
              style={{ width: `${getProgress()}%` }}
            />
          </div>
        </div>
      </div>

      {/* 下一个节目 */}
      {nextProgram && (
        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-2 text-sm text-gray-500">
            <span>下一个:</span>
            <span className="font-medium text-gray-700 dark:text-gray-300">
              {nextProgram.title}
            </span>
            <span>{formatTime(nextProgram.start)}</span>
          </div>
        </div>
      )}
    </div>
  );
}