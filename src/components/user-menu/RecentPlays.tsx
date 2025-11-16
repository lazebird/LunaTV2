'use client';

import { PlayCircle } from 'lucide-react';
import type { PlayRecord } from '@/lib/types';

interface RecentPlaysProps {
  records: PlayRecord[];
  maxItems?: number;
}

export default function RecentPlays({ records, maxItems = 5 }: RecentPlaysProps) {
  const formatTime = (seconds: number) => {
    if (seconds < 60) return `${seconds}秒`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return remainingSeconds > 0 ? `${minutes}分${remainingSeconds}秒` : `${minutes}分钟`;
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return '今天';
    if (diffDays === 1) return '昨天';
    if (diffDays < 7) return `${diffDays}天前`;
    
    return date.toLocaleDateString('zh-CN');
  };

  const getProgressPercentage = (playTime: number, totalTime: number) => {
    if (totalTime === 0) return 0;
    return Math.min((playTime / totalTime) * 100, 100);
  };

  if (records.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500 dark:text-gray-400">
        <PlayCircle className="w-12 h-12 mx-auto mb-2 opacity-50" />
        <p>暂无播放记录</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {records.slice(0, maxItems).map((record) => {
        const progressPercentage = getProgressPercentage(record.play_time, record.total_time);
        
        return (
          <div key={`${record.source_name}+${record.search_title}`} className="group">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0">
                {record.cover ? (
                  <img
                    src={record.cover}
                    alt={record.title}
                    className="w-12 h-16 object-cover rounded"
                  />
                ) : (
                  <div className="w-12 h-16 bg-gray-200 dark:bg-gray-700 rounded flex items-center justify-center">
                    <PlayCircle className="w-6 h-6 text-gray-400" />
                  </div>
                )}
              </div>
              
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate group-hover:text-blue-600 dark:group-hover:text-blue-400">
                  {record.title}
                </h4>
                
                <div className="mt-1 flex items-center space-x-2 text-xs text-gray-500 dark:text-gray-400">
                  <span>第 {record.index} 集</span>
                  <span>•</span>
                  <span>{formatTime(record.play_time)}</span>
                  <span>•</span>
                  <span>{formatDate(record.save_time)}</span>
                </div>
                
                {/* 进度条 */}
                <div className="mt-2">
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1">
                    <div
                      className="bg-blue-500 h-1 rounded-full transition-all duration-300"
                      style={{ width: `${progressPercentage}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}