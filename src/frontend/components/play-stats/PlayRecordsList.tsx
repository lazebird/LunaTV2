'use client';

import React, { useState } from 'react';
import { PlayRecord } from '@/frontend/lib/types';
import { formatPlayTime } from '@/frontend/lib/play-stats-data';
import { ChevronDown, ChevronUp, Calendar, Clock, Film } from 'lucide-react';

interface PlayRecordsListProps {
  records: PlayRecord[];
}

export default function PlayRecordsList({ records }: PlayRecordsListProps) {
  const [expandedRecords, setExpandedRecords] = useState<Set<string>>(new Set());

  const toggleExpanded = (key: string) => {
    const newExpanded = new Set(expandedRecords);
    if (newExpanded.has(key)) {
      newExpanded.delete(key);
    } else {
      newExpanded.add(key);
    }
    setExpandedRecords(newExpanded);
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString('zh-CN');
  };

  const getProgressPercentage = (playTime: number, totalTime: number) => {
    if (totalTime === 0) return 0;
    return Math.min((playTime / totalTime) * 100, 100);
  };

  const getProgressColor = (percentage: number) => {
    if (percentage >= 90) return 'bg-green-500';
    if (percentage >= 50) return 'bg-blue-500';
    if (percentage >= 20) return 'bg-yellow-500';
    return 'bg-gray-300';
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          最近观看记录
        </h3>
      </div>
      
      <div className="divide-y divide-gray-200 dark:divide-gray-700 max-h-96 overflow-y-auto">
        {records.map((record) => {
          const key = `${record.source_name}+${record.search_title}`;
          const isExpanded = expandedRecords.has(key);
          const progressPercentage = getProgressPercentage(record.play_time, record.total_time);
          const progressColor = getProgressColor(progressPercentage);

          return (
            <div key={key} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                    {record.title}
                  </h4>
                  
                  <div className="mt-1 flex items-center space-x-4 text-xs text-gray-500 dark:text-gray-400">
                    <div className="flex items-center space-x-1">
                      <Film className="w-3 h-3" />
                      <span>第 {record.index} 集</span>
                    </div>
                    
                    <div className="flex items-center space-x-1">
                      <Clock className="w-3 h-3" />
                      <span>{formatPlayTime(record.play_time)}</span>
                    </div>
                    
                    <div className="flex items-center space-x-1">
                      <Calendar className="w-3 h-3" />
                      <span>{formatDate(record.save_time)}</span>
                    </div>
                  </div>

                  {/* 进度条 */}
                  <div className="mt-2">
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                      <div
                        className={`${progressColor} h-1.5 rounded-full transition-all duration-300`}
                        style={{ width: `${progressPercentage}%` }}
                      />
                    </div>
                    <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      {progressPercentage.toFixed(1)}% 已观看
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => toggleExpanded(key)}
                  className="ml-2 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                >
                  {isExpanded ? (
                    <ChevronUp className="w-4 h-4" />
                  ) : (
                    <ChevronDown className="w-4 h-4" />
                  )}
                </button>
              </div>

              {/* 展开的详细信息 */}
              {isExpanded && (
                <div className="mt-3 pl-4 border-l-2 border-gray-200 dark:border-gray-600 space-y-1">
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    <span className="font-medium">源:</span> {record.source_name}
                  </div>
                  {record.year && (
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      <span className="font-medium">年份:</span> {record.year}
                    </div>
                  )}
                  {record.search_title && (
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      <span className="font-medium">搜索词:</span> {record.search_title}
                    </div>
                  )}
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    <span className="font-medium">总时长:</span> {formatPlayTime(record.total_time)}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    <span className="font-medium">总集数:</span> {record.total_episodes} 集
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}