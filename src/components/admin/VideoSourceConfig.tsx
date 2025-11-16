'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  closestCenter,
  DndContext,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  restrictToParentElement,
  restrictToVerticalAxis,
} from '@dnd-kit/modifiers';
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  AlertCircle,
  Check,
  GripVertical,
  RefreshCw,
  Search,
} from 'lucide-react';

import { AdminConfig } from '@/lib/admin.types';
import ImportExportModal from '@/components/ImportExportModal';
import SourceTestModule from '@/components/SourceTestModule';

// 统一按钮样式系统
const buttonStyles = {
  primary:
    'px-3 py-1.5 text-sm font-medium bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700 text-white rounded-lg transition-colors',
  success:
    'px-3 py-1.5 text-sm font-medium bg-green-600 hover:bg-green-700 dark:bg-green-600 dark:hover:bg-green-700 text-white rounded-lg transition-colors',
  danger:
    'px-3 py-1.5 text-sm font-medium bg-red-600 hover:bg-red-700 dark:bg-red-600 dark:hover:bg-red-700 text-white rounded-lg transition-colors',
  secondary:
    'px-3 py-1.5 text-sm font-medium bg-gray-600 hover:bg-gray-700 dark:bg-gray-600 dark:hover:bg-gray-700 text-white rounded-lg transition-colors',
  warning:
    'px-3 py-1.5 text-sm font-medium bg-yellow-600 hover:bg-yellow-700 dark:bg-yellow-600 dark:hover:bg-yellow-700 text-white rounded-lg transition-colors',
  disabled:
    'px-3 py-1.5 text-sm font-medium bg-gray-400 dark:bg-gray-600 cursor-not-allowed text-white rounded-lg transition-colors',
  roundedPrimary:
    'inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 hover:bg-blue-200 dark:bg-blue-900/40 dark:hover:bg-blue-900/60 dark:text-blue-200 transition-colors',
  roundedSuccess:
    'inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium bg-green-100 text-green-800 hover:bg-green-200 dark:bg-green-900/40 dark:hover:bg-green-900/60 dark:text-green-200 transition-colors',
  roundedDanger:
    'inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium bg-red-100 text-red-800 hover:bg-red-200 dark:bg-red-900/40 dark:hover:bg-red-900/60 dark:text-red-200 transition-colors',
  roundedSecondary:
    'inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 hover:bg-gray-200 dark:bg-gray-700/40 dark:hover:bg-gray-700/60 dark:text-gray-200 transition-colors',
  roundedWarning:
    'inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 hover:bg-yellow-200 dark:bg-yellow-900/40 dark:hover:bg-yellow-900/60 dark:text-yellow-200 transition-colors',
};

// 数据接口定义
interface DataSource {
  name: string;
  key: string;
  api: string;
  detail?: string;
  disabled?: boolean;
  is_adult?: boolean;
  from?: 'config' | 'custom';
}

// 通用弹窗组件
interface AlertModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'success' | 'error' | 'warning' | 'danger';
  title: string;
  message?: string;
  timer?: number;
  showConfirm?: boolean;
}

const AlertModal = ({
  isOpen,
  onClose,
  type,
  title,
  message,
  timer,
  showConfirm = false,
}: AlertModalProps) => {
  const [isVisible, setIsVisible] = useState(false);

  React.useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
      if (timer) {
        setTimeout(() => {
          onClose();
        }, timer);
      }
    } else {
      setTimeout(() => setIsVisible(false), 300);
    }
  }, [isOpen, onClose, timer]);

  const getIcon = () => {
    switch (type) {
      case 'success':
        return (
          <div className='mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 dark:bg-green-900/40 mb-4'>
            <Check className='h-6 w-6 text-green-600 dark:text-green-400' />
          </div>
        );
      case 'error':
        return (
          <div className='mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 dark:bg-red-900/40 mb-4'>
            <AlertCircle className='h-6 w-6 text-red-600 dark:text-red-400' />
          </div>
        );
      case 'warning':
        return (
          <div className='mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-yellow-100 dark:bg-yellow-900/40 mb-4'>
            <AlertCircle className='h-6 w-6 text-yellow-600 dark:text-yellow-400' />
          </div>
        );
      case 'danger':
        return (
          <div className='mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 dark:bg-red-900/40 mb-4'>
            <AlertCircle className='h-6 w-6 text-red-600 dark:text-red-400' />
          </div>
        );
    }
  };

  const getBgColor = () => {
    switch (type) {
      case 'success':
        return 'bg-green-50 dark:bg-green-900/20';
      case 'error':
        return 'bg-red-50 dark:bg-red-900/20';
      case 'warning':
        return 'bg-yellow-50 dark:bg-yellow-900/20';
      case 'danger':
        return 'bg-red-50 dark:bg-red-900/20';
    }
  };

  if (!isOpen && !isVisible) return null;

  return createPortal(
    <div className='fixed inset-0 z-50 overflow-y-auto'>
      <div className='flex min-h-screen items-center justify-center p-4 text-center sm:p-0'>
        <div
          className={`fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity ${
            isOpen ? 'opacity-100' : 'opacity-0'
          }`}
          onClick={onClose}
        />
        <div
          className={`relative transform overflow-hidden rounded-lg text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg ${
            isOpen && isVisible ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
          } ${getBgColor()}`}
        >
          <div className='px-4 pt-5 pb-4 sm:p-6 sm:pb-4'>
            {getIcon()}
            <div className='mt-3 text-center sm:mt-5'>
              <h3 className='text-lg leading-6 font-medium text-gray-900 dark:text-gray-100'>
                {title}
              </h3>
              {message && (
                <div className='mt-2'>
                  <p className='text-sm text-gray-500 dark:text-gray-400'>
                    {message}
                  </p>
                </div>
              )}
            </div>
          </div>
          <div className='bg-gray-50 dark:bg-gray-800 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6'>
            {showConfirm ? (
              <button
                type='button'
                className={`w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 text-base font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 sm:ml-3 sm:w-auto sm:text-sm ${
                  type === 'danger'
                    ? 'bg-red-600 hover:bg-red-700 focus:ring-red-500'
                    : 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500'
                }`}
                onClick={onClose}
              >
                确认
              </button>
            ) : null}
            <button
              type='button'
              className={`mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-600`}
              onClick={onClose}
            >
              {showConfirm ? '取消' : '关闭'}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

// Hook for alert modal
const useAlertModal = () => {
  const [alertModal, setAlertModal] = React.useState<{
    isOpen: boolean;
    type: 'success' | 'error' | 'warning';
    title: string;
    message?: string;
    timer?: number;
    showConfirm?: boolean;
  }>({
    isOpen: false,
    type: 'success',
    title: '',
  });

  const showAlert = (config: Omit<typeof alertModal, 'isOpen'>) => {
    setAlertModal({ ...config, isOpen: true });
  };

  const hideAlert = () => {
    setAlertModal((prev) => ({ ...prev, isOpen: false }));
  };

  const showError = (message: string, showAlert?: (config: any) => void) => {
    showAlert?.({
      type: 'error',
      title: '错误',
      message,
    });
  };

  const showSuccess = (message: string, showAlert?: (config: any) => void) => {
    showAlert?.({
      type: 'success',
      title: '成功',
      message,
    });
  };

  return { alertModal, showAlert, hideAlert, showError, showSuccess };
};

// Loading state hook
interface LoadingState {
  [key: string]: boolean;
}

const useLoadingState = () => {
  const [loadingStates, setLoadingStates] = useState<LoadingState>({});

  const setLoading = (key: string, loading: boolean) => {
    setLoadingStates((prev) => ({ ...prev, [key]: loading }));
  };

  const isLoading = (key: string) => loadingStates[key] || false;

  const withLoading = async <T,>(
    key: string,
    operation: () => Promise<T>
  ): Promise<T> => {
    setLoading(key, true);
    try {
      const result = await operation();
      return result;
    } finally {
      setLoading(key, false);
    }
  };

  return { isLoading, withLoading };
};



interface VideoSourceConfigProps {
  config: AdminConfig | null;
  refreshConfig: () => Promise<void>;
}

export default function VideoSourceConfig({
  config,
  refreshConfig,
}: VideoSourceConfigProps) {
  const { alertModal, showAlert, hideAlert, showError, showSuccess } = useAlertModal();
  const { isLoading, withLoading } = useLoadingState();
  const [sources, setSources] = useState<DataSource[]>([]);
  const [filteredSources, setFilteredSources] = useState<DataSource[]>([]);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [orderChanged, setOrderChanged] = useState(false);
  const [newSource, setNewSource] = useState<DataSource>({
    name: '',
    key: '',
    api: '',
    detail: '',
    disabled: false,
    from: 'config',
  });

  const [selectedSources, setSelectedSources] = useState<Set<string>>(new Set());
  const [importExportModal, setImportExportModal] = useState<{
    isOpen: boolean;
    mode: 'import' | 'export' | 'result';
    result?: any;
  }>({
    isOpen: false,
    mode: 'export',
  });

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 150,
        tolerance: 5,
      },
    })
  );

  const selectAll = useMemo(() => {
    return (
      selectedSources.size === filteredSources.length &&
      selectedSources.size > 0
    );
  }, [selectedSources.size, filteredSources.length]);

  useEffect(() => {
    if (config?.SourceConfig) {
      setSources(config.SourceConfig);
      setOrderChanged(false);
      setSelectedSources(new Set());
    }
  }, [config]);

  useEffect(() => {
    if (!searchKeyword.trim()) {
      setFilteredSources(sources);
    } else {
      const keyword = searchKeyword.toLowerCase();
      const filtered = sources.filter((source) => {
        const sourceString = JSON.stringify(source).toLowerCase();
        return sourceString.includes(keyword);
      });
      setFilteredSources(filtered);
    }
  }, [sources, searchKeyword]);

  const callSourceApi = async (body: Record<string, any>) => {
    try {
      const resp = await fetch('/api/admin/source', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!resp.ok) {
        const data = await resp.json().catch(() => ({}));
        throw new Error(data.error || `操作失败: ${resp.status}`);
      }

      await refreshConfig();
    } catch (err) {
      showError(err instanceof Error ? err.message : '操作失败', showAlert);
      throw err;
    }
  };

  const handleAddSource = () => {
    if (!newSource.name || !newSource.key || !newSource.api) {
      showError('请填写完整的源信息', showAlert);
      return;
    }

    withLoading('addSource', async () => {
      try {
        await callSourceApi({
          action: 'add',
          source: newSource,
        });
        
        setNewSource({
          name: '',
          key: '',
          api: '',
          detail: '',
          disabled: false,
          from: 'config',
        });
        setShowAddForm(false);
        showSuccess('视频源添加成功', showAlert);
      } catch (err) {
        // 错误处理已在 callSourceApi 中完成
      }
    });
  };

  const handleToggleEnable = (key: string) => {
    withLoading(`toggle_${key}`, async () => {
      try {
        const source = sources.find(s => s.key === key);
        const action = source?.disabled ? 'enable' : 'disable';
        await callSourceApi({
          action,
          key,
        });
        showSuccess('更新成功', showAlert);
      } catch (err) {
        // 错误处理已在 callSourceApi 中完成
      }
    });
  };

  const handleDelete = (key: string) => {
    withLoading(`delete_${key}`, async () => {
      try {
        await callSourceApi({
          action: 'delete',
          key,
        });
        showSuccess('删除成功', showAlert);
      } catch (err) {
        // 错误处理已在 callSourceApi 中完成
      }
    });
  };

  const handleToggleAdult = (key: string, is_adult: boolean) => {
    withLoading(`toggleAdult_${key}`, async () => {
      try {
        await callSourceApi({
          action: 'update_adult',
          key,
          is_adult,
        });
        showSuccess('更新成功', showAlert);
      } catch (err) {
        // 错误处理已在 callSourceApi 中完成
      }
    });
  };

  const handleDragEnd = (event: any) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = sources.findIndex((s) => s.key === active.id);
      const newIndex = sources.findIndex((s) => s.key === over.id);

      if (oldIndex !== -1 && newIndex !== -1) {
        const reorderedSources = arrayMove(sources, oldIndex, newIndex);
        setSources(reorderedSources);
        setFilteredSources(
          arrayMove(filteredSources, oldIndex, newIndex)
        );
        setOrderChanged(true);
      }
    }
  };

  // 批量操作函数
  const handleBatchEnable = async (enable: boolean) => {
    if (selectedSources.size === 0) return;

    withLoading('batchEnable', async () => {
      try {
        const action = enable ? 'batch_enable' : 'batch_disable';
        await callSourceApi({
          action,
          keys: Array.from(selectedSources),
        });
        showSuccess(`${enable ? '启用' : '禁用'}成功`, showAlert);
        setSelectedSources(new Set());
      } catch (err) {
        showError(err instanceof Error ? err.message : '操作失败', showAlert);
      }
    });
  };

  const handleBatchDelete = async () => {
    if (selectedSources.size === 0) return;
    
    if (!confirm(`确定要删除选中的 ${selectedSources.size} 个视频源吗？`)) return;

    withLoading('batchDelete', async () => {
      try {
        await callSourceApi({
          action: 'batch_delete',
          keys: Array.from(selectedSources),
        });
        showSuccess('删除成功', showAlert);
        setSelectedSources(new Set());
      } catch (err) {
        showError(err instanceof Error ? err.message : '操作失败', showAlert);
      }
    });
  };

  const handleBatchMarkAdult = async (isAdult: boolean) => {
    if (selectedSources.size === 0) return;

    withLoading('batchMarkAdult', async () => {
      try {
        const action = isAdult ? 'batch_mark_adult' : 'batch_unmark_adult';
        const promises = Array.from(selectedSources).map(key =>
          callSourceApi({
            action,
            keys: [key], // 使用 keys 数组参数
          })
        );
        await Promise.all(promises);
        showSuccess(`${isAdult ? '标记' : '取消标记'}成功`, showAlert);
        setSelectedSources(new Set());
      } catch (err) {
        showError(err instanceof Error ? err.message : '操作失败', showAlert);
      }
    });
  };

  const handleBatchTest = async () => {
    if (selectedSources.size === 0) return;

    // 暂时禁用测试功能，因为后端API不支持
    showError('测试功能暂未实现', showAlert);
  };

  const handleSaveOrder = () => {
    const order = sources.map((s) => s.key);

    withLoading('saveOrder', async () => {
      try {
        await callSourceApi({ action: 'sort', order });
        setOrderChanged(false);
        showSuccess('顺序保存成功', showAlert);
      } catch (err) {
        // 错误处理已在 callSourceApi 中完成
      }
    });
  };

  const handleSelectSource = useCallback((key: string, checked: boolean) => {
    setSelectedSources((prev) => {
      const newSelected = new Set(prev);
      if (checked) {
        newSelected.add(key);
      } else {
        newSelected.delete(key);
      }
      return newSelected;
    });
  }, []);

  const handleSelectAll = useCallback(
    (selectAll: boolean) => {
      if (selectAll) {
        setSelectedSources(new Set(filteredSources.map((s) => s.key)));
      } else {
        setSelectedSources(new Set());
      }
    },
    [filteredSources]
  );

  const handleExportSources = (exportFormat: 'array' | 'config' = 'array') => {
    const exportData = exportFormat === 'array' 
      ? filteredSources.filter(s => selectedSources.size === 0 || selectedSources.has(s.key))
      : { sources: filteredSources.filter(s => selectedSources.size === 0 || selectedSources.has(s.key)) };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `video-sources-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className='space-y-4'>
      {/* 搜索和操作栏 */}
      <div className='flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between'>
        <div className='relative flex-1 max-w-md'>
          <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400' />
          <input
            type='text'
            placeholder='搜索视频源...'
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
            className='w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent'
          />
        </div>
        
        <div className='flex flex-wrap gap-2'>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className={`${buttonStyles.success}`}
          >
            {showAddForm ? '收起表单' : '添加视频源'}
          </button>
          
          <button
            onClick={() => setImportExportModal({ isOpen: true, mode: 'import' })}
            className={`${buttonStyles.primary}`}
          >
            导入
          </button>
          
          <button
            onClick={() => handleExportSources()}
            className={`${buttonStyles.primary}`}
          >
            导出
          </button>
          
          {orderChanged && (
            <button
              onClick={handleSaveOrder}
              disabled={isLoading('saveOrder')}
              className={`${buttonStyles.warning}`}
            >
              {isLoading('saveOrder') ? '保存中...' : '保存顺序'}
            </button>
          )}
        </div>
      </div>

      {/* 添加源表单 */}
      {showAddForm && (
        <div className='border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-gray-50 dark:bg-gray-800'>
          <h3 className='text-lg font-medium text-gray-900 dark:text-gray-100 mb-4'>
            添加新视频源
          </h3>
          <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
            <input
              type='text'
              placeholder='源名称'
              value={newSource.name}
              onChange={(e) =>
                setNewSource((prev) => ({ ...prev, name: e.target.value }))
              }
              className='px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent'
            />
            <input
              type='text'
              placeholder='源Key'
              value={newSource.key}
              onChange={(e) =>
                setNewSource((prev) => ({ ...prev, key: e.target.value }))
              }
              className='px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent'
            />
            <input
              type='text'
              placeholder='API地址'
              value={newSource.api}
              onChange={(e) =>
                setNewSource((prev) => ({ ...prev, api: e.target.value }))
              }
              className='px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent md:col-span-2'
            />
            <input
              type='text'
              placeholder='详细描述（可选）'
              value={newSource.detail}
              onChange={(e) =>
                setNewSource((prev) => ({ ...prev, detail: e.target.value }))
              }
              className='px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent md:col-span-2'
            />
          </div>
          <div className='flex flex-col sm:flex-row gap-4 mt-4'>
            <button
              onClick={handleAddSource}
              disabled={isLoading('addSource')}
              className={`${buttonStyles.success}`}
            >
              {isLoading('addSource') ? '添加中...' : '添加视频源'}
            </button>
            <button
              onClick={() => {
                setShowAddForm(false);
                setNewSource({
                  name: '',
                  key: '',
                  api: '',
                  detail: '',
                  disabled: false,
                  from: 'config',
                });
              }}
              className={`${buttonStyles.secondary}`}
            >
              取消
            </button>
          </div>
        </div>
      )}

      {/* 批量选择操作栏 */}
      {selectedSources.size > 0 && (
        <div className='border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-blue-50 dark:bg-blue-900/20'>
          <div className='flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4'>
            <span className='text-sm text-blue-800 dark:text-blue-200'>
              已选择 {selectedSources.size} 个视频源
            </span>
            <div className='flex flex-wrap gap-2'>
              <button
                onClick={() => handleBatchEnable(true)}
                className={`${buttonStyles.success}`}
              >
                批量启用
              </button>
              <button
                onClick={() => handleBatchEnable(false)}
                className={`${buttonStyles.secondary}`}
              >
                批量禁用
              </button>
              <button
                onClick={() => handleBatchDelete()}
                className={`${buttonStyles.danger}`}
              >
                批量删除
              </button>
              <button
                onClick={() => handleBatchMarkAdult(true)}
                className={`${buttonStyles.warning}`}
              >
                标记成人
              </button>
              <button
                onClick={() => handleBatchMarkAdult(false)}
                className={`${buttonStyles.secondary}`}
              >
                取消标记
              </button>
              <button
                onClick={() => handleExportSources()}
                className={`${buttonStyles.primary}`}
              >
                导出已选({selectedSources.size})
              </button>
              <button
                onClick={() => handleBatchTest()}
                className={`${buttonStyles.primary}`}
              >
                有效性检测
              </button>
              <button
                onClick={() => setSelectedSources(new Set())}
                className={`${buttonStyles.secondary}`}
              >
                取消选择
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 视频源列表 */}
      <div className='border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden'>
        <div className='p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900'>
          <div className='flex items-center justify-between'>
            <h3 className='text-lg font-medium text-gray-900 dark:text-gray-100'>
              视频源列表 ({filteredSources.length})
            </h3>
            <div className='flex items-center space-x-2'>
              <input
                type='checkbox'
                checked={selectAll}
                onChange={(e) => handleSelectAll(e.target.checked)}
                className='w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600'
              />
              <span className='text-sm text-gray-600 dark:text-gray-400'>
                全选
              </span>
            </div>
          </div>
        </div>
        
        <div className='overflow-x-auto'>
          <table className='w-full'>
            <thead className='bg-gray-50 dark:bg-gray-800'>
              <tr>
                <th className='px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider'>
                  选择
                </th>
                <th className='px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider'>
                  名称
                </th>
                <th className='px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider'>
                  Key
                </th>
                <th className='px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider'>
                  API 地址
                </th>
                <th className='px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider'>
                  Detail 地址
                </th>
                <th className='px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider'>
                  状态
                </th>
                <th className='px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider'>
                  成人资源
                </th>
                <th className='px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider'>
                  有效性
                </th>
                <th className='px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider'>
                  操作
                </th>
              </tr>
            </thead>
            <tbody className='divide-y divide-gray-200 dark:divide-gray-700'>
              {filteredSources.map((source) => (
                <tr key={source.key} className='hover:bg-gray-50 dark:hover:bg-gray-800'>
                  <td className='px-4 py-3'>
                    <input
                      type='checkbox'
                      checked={selectedSources.has(source.key)}
                      onChange={(e) => handleSelectSource(source.key, e.target.checked)}
                      className='w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600'
                    />
                  </td>
                  <td className='px-4 py-3 text-sm font-medium text-gray-900 dark:text-gray-100'>
                    {source.name}
                  </td>
                  <td className='px-4 py-3 text-sm text-gray-500 dark:text-gray-400'>
                    {source.key}
                  </td>
                  <td className='px-4 py-3 text-sm text-gray-500 dark:text-gray-400'>
                    {source.api}
                  </td>
                  <td className='px-4 py-3 text-sm text-gray-500 dark:text-gray-400'>
                    {source.detail || '-'}
                  </td>
                  <td className='px-4 py-3 text-sm'>
                    {source.disabled ? (
                      <span className='inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-200'>
                        禁用
                      </span>
                    ) : (
                      <span className='inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-200'>
                        启用
                      </span>
                    )}
                  </td>
                  <td className='px-4 py-3 text-sm'>
                    {source.is_adult ? (
                      <span className='inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-pink-100 text-pink-800 dark:bg-pink-900/40 dark:text-pink-200'>
                        成人
                      </span>
                    ) : (
                      <span className='inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700/40 dark:text-gray-200'>
                        普通
                      </span>
                    )}
                  </td>
                  <td className='px-4 py-3 text-sm'>
                    <span className='inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700/40 dark:text-gray-200'>
                      待检测
                    </span>
                  </td>
                  <td className='px-4 py-3 text-sm'>
                    <div className='flex space-x-2'>
                      <button
                        onClick={() => handleToggleEnable(source.key)}
                        disabled={isLoading(`toggle_${source.key}`)}
                        className={`text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 ${isLoading(`toggle_${source.key}`) ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        {source.disabled ? '启用' : '禁用'}
                      </button>
                      <button
                        onClick={() => handleToggleAdult(source.key, !source.is_adult)}
                        disabled={isLoading(`toggleAdult_${source.key}`)}
                        className={`text-pink-600 hover:text-pink-900 dark:text-pink-400 dark:hover:text-pink-300 ${isLoading(`toggleAdult_${source.key}`) ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        {source.is_adult ? '取消标记' : '标记成人'}
                      </button>
                      <button
                        onClick={() => handleDelete(source.key)}
                        disabled={isLoading(`delete_${source.key}`)}
                        className={`text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 ${isLoading(`delete_${source.key}`) ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        删除
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 导入导出模态框 */}
      <ImportExportModal
        isOpen={importExportModal.isOpen}
        onClose={() =>
          setImportExportModal({ isOpen: false, mode: 'export' })
        }
        mode={importExportModal.mode}
        onImport={async (data) => {
          // 实现导入逻辑
          console.log('Import data:', data);
          return { 
            success: 0, 
            failed: 0, 
            skipped: 0, 
            details: [] 
          };
        }}
        onExport={() => {
          handleExportSources();
        }}
        result={importExportModal.result}
      />

      {/* 提示弹窗 */}
      <AlertModal
        isOpen={alertModal.isOpen}
        onClose={hideAlert}
        type={alertModal.type}
        title={alertModal.title}
        message={alertModal.message}
        timer={alertModal.timer}
        showConfirm={alertModal.showConfirm}
      />
    </div>
  );
}