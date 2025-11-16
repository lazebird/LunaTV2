'use client';

import React from 'react';
import { PlayRecord } from '@/lib/types';
import { calculatePlayStats, formatPlayTime } from '@/lib/play-stats-data';
import { getLevelProgress, getLevelBadge } from '@/lib/user-levels';

interface StatsOverviewProps {
  records: PlayRecord[];
  loginCount: number;
}

export default function StatsOverview({ records, loginCount }: StatsOverviewProps) {
  const stats = calculatePlayStats(records);
  const levelProgress = getLevelProgress(loginCount);
  const levelBadge = getLevelBadge(levelProgress.current);

  return (
    <div className="space-y-6">
      {/* 用户等级卡片 */}
      <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 rounded-xl p-6 shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            用户等级
          </h3>
          <span className={levelBadge.className}>
            {levelBadge.text}
          </span>
        </div>
        
        <div className="mb-3">
          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-1">
            {levelProgress.current.name}
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {levelProgress.current.description}
          </p>
        </div>

        {levelProgress.next && (
          <div>
            <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-1">
              <span>距离下一级</span>
              <span>{Math.round(levelProgress.progress)}%</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div
                className={`bg-gradient-to-r ${levelProgress.next.gradient} h-2 rounded-full transition-all duration-300`}
                style={{ width: `${levelProgress.progress}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* 观看统计 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow">
          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400 mb-1">
            {stats.totalEpisodes}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            总观看集数
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow">
          <div className="text-2xl font-bold text-green-600 dark:text-green-400 mb-1">
            {formatPlayTime(stats.totalPlayTime)}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            总观看时长
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow">
          <div className="text-2xl font-bold text-purple-600 dark:text-purple-400 mb-1">
            {stats.playStreak}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            连续观看天数
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow">
          <div className="text-2xl font-bold text-orange-600 dark:text-orange-400 mb-1">
            {formatPlayTime(stats.averageEpisodeTime)}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            平均每集时长
          </div>
        </div>
      </div>

      {/* 热门源 */}
      {stats.topSources.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">
            热门源
          </h3>
          <div className="space-y-2">
            {stats.topSources.map((source, index) => (
              <div key={source.source} className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {index + 1}. {source.source}
                </span>
                <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  {source.count} 集
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}