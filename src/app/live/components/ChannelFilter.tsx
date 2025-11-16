import { Search, ArrowUpDown, Filter } from 'lucide-react';
import { FilterState } from '../types';

interface ChannelFilterProps {
  filter: FilterState;
  groups: string[];
  onSearchChange: (query: string) => void;
  onGroupChange: (group: string) => void;
  onSortToggle: () => void;
  onSortOrderToggle: () => void;
}

export function ChannelFilter({
  filter,
  groups,
  onSearchChange,
  onGroupChange,
  onSortToggle,
  onSortOrderToggle,
}: ChannelFilterProps) {
  return (
    <div className="space-y-4 p-4 bg-white dark:bg-gray-800 rounded-lg shadow">
      {/* 搜索框 */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          placeholder="搜索频道..."
          value={filter.search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
        />
      </div>

      {/* 过滤器选项 */}
      <div className="flex flex-wrap gap-2">
        {/* 组过滤 */}
        <div className="flex items-center space-x-2">
          <Filter className="w-4 h-4 text-gray-500" />
          <select
            value={filter.group}
            onChange={(e) => onGroupChange(e.target.value)}
            className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
          >
            <option value="all">所有组</option>
            {groups.map((group) => (
              <option key={group} value={group}>
                {group}
              </option>
            ))}
          </select>
        </div>

        {/* 排序选项 */}
        <div className="flex items-center space-x-2">
          <ArrowUpDown className="w-4 h-4 text-gray-500" />
          <button
            onClick={onSortToggle}
            className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors dark:text-white"
          >
            按{filter.sortBy === 'name' ? '名称' : '分组'}
          </button>
          <button
            onClick={onSortOrderToggle}
            className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors dark:text-white"
          >
            {filter.sortOrder === 'asc' ? '升序' : '降序'}
          </button>
        </div>
      </div>

      {/* 结果统计 */}
      <div className="text-sm text-gray-500 dark:text-gray-400">
        {filter.search && `搜索: "${filter.search}"`}
        {filter.group !== 'all' && ` • 组: ${filter.group}`}
        {` • 排序: ${filter.sortBy === 'name' ? '名称' : '分组'} (${filter.sortOrder === 'asc' ? '升序' : '降序'})`}
      </div>
    </div>
  );
}