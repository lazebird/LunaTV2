'use client';

import React from 'react';
import { PlayRecord } from '@/frontend/lib/types';
import { getPlayTimeDistribution } from '@/frontend/lib/play-stats-data';

interface WatchTimeChartProps {
  records: PlayRecord[];
}

export default function WatchTimeChart({ records }: WatchTimeChartProps) {
  const distribution = getPlayTimeDistribution(records);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
        观看时长分布
      </h3>
      
      <div className="space-y-3">
        {distribution.map((item, index) => (
          <div key={index} className="space-y-1">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">
                {item.range}
              </span>
              <span className="font-medium text-gray-900 dark:text-gray-100">
                {item.count} ({item.percentage}%)
              </span>
            </div>
            
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div
                className="bg-blue-500 h-2 rounded-full transition-all duration-500"
                style={{ width: `${item.percentage}%` }}
              />
            </div>
          </div>
        ))}
      </div>
      
      {records.length === 0 && (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          暂无观看数据
        </div>
      )}
    </div>
  );
}