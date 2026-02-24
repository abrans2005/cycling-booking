import { useState, useMemo, useEffect } from 'react';
import { X, Clock, Calendar, Plus, Trash2, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import type { BusinessHoursConfig } from '@/types';

interface BusinessHoursManagerProps {
  isOpen: boolean;
  onClose: () => void;
  businessHours: BusinessHoursConfig;
  onSave: (config: BusinessHoursConfig) => void;
}

export function BusinessHoursManager({ isOpen, onClose, businessHours, onSave }: BusinessHoursManagerProps) {
  const [defaultOpen, setDefaultOpen] = useState('06:00');
  const [defaultClose, setDefaultClose] = useState('22:00');
  const [exceptions, setExceptions] = useState<Record<string, { isOpen: boolean; open?: string; close?: string }>>({});
  const [newExceptionDate, setNewExceptionDate] = useState('');
  const [newExceptionOpen, setNewExceptionOpen] = useState('06:00');
  const [newExceptionClose, setNewExceptionClose] = useState('22:00');
  const [newExceptionIsOpen, setNewExceptionIsOpen] = useState(true);

  // 每次打开弹窗时，从 props 重新加载数据
  // 使用 setTimeout 延迟状态更新，避免 React 19 级联渲染警告
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        setDefaultOpen(businessHours.default.open);
        setDefaultClose(businessHours.default.close);
        setExceptions(businessHours.exceptions || {});
        setNewExceptionDate('');
        setNewExceptionOpen('06:00');
        setNewExceptionClose('22:00');
        setNewExceptionIsOpen(true);
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [isOpen, businessHours]);

  // 生成未来30天的日期选项
  const dateOptions = useMemo(() => {
    const options = [];
    const today = new Date();
    for (let i = 0; i < 30; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      const dateStr = date.toISOString().split('T')[0];
      const displayStr = `${date.getMonth() + 1}月${date.getDate()}日`;
      options.push({ value: dateStr, label: displayStr });
    }
    return options;
  }, []);

  const handleAddException = () => {
    if (!newExceptionDate) return;
    
    setExceptions(prev => ({
      ...prev,
      [newExceptionDate]: {
        isOpen: newExceptionIsOpen,
        ...(newExceptionIsOpen ? { open: newExceptionOpen, close: newExceptionClose } : {}),
      },
    }));
    setNewExceptionDate('');
  };

  const handleRemoveException = (date: string) => {
    setExceptions(prev => {
      const next = { ...prev };
      delete next[date];
      return next;
    });
  };

  const handleSave = () => {
    onSave({
      default: { open: defaultOpen, close: defaultClose },
      exceptions,
    });
    onClose();
  };

  // 排序例外日期
  const sortedExceptions = useMemo(() => {
    return Object.entries(exceptions).sort(([a], [b]) => a.localeCompare(b));
  }, [exceptions]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-md max-h-[90vh] overflow-hidden flex flex-col">
        {/* 头部 */}
        <div className="px-4 py-3 border-b flex items-center justify-between bg-gray-50">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-orange-500" />
            <h3 className="font-bold text-gray-800">营业时间设置</h3>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-gray-200 rounded-full transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* 内容区域 */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {/* 默认营业时间 */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-gray-700 flex items-center gap-2">
              <RotateCcw className="w-4 h-4" />
              默认营业时间
            </h4>
            <div className="bg-orange-50 p-3 rounded-lg space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs text-gray-600">开始时间</Label>
                  <Input
                    type="time"
                    value={defaultOpen}
                    onChange={(e) => setDefaultOpen(e.target.value)}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label className="text-xs text-gray-600">结束时间</Label>
                  <Input
                    type="time"
                    value={defaultClose}
                    onChange={(e) => setDefaultClose(e.target.value)}
                    className="mt-1"
                  />
                </div>
              </div>
              <p className="text-xs text-gray-500">
                当前默认营业时间：{defaultOpen} - {defaultClose}
              </p>
            </div>
          </div>

          {/* 特殊日期设置 */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-gray-700 flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              特殊日期设置
            </h4>
            <p className="text-xs text-gray-500">设置特定日期的营业时间或休息日</p>

            {/* 添加新例外 */}
            <div className="bg-gray-50 p-3 rounded-lg space-y-3">
              <div>
                <Label className="text-xs text-gray-600">选择日期</Label>
                <select
                  value={newExceptionDate}
                  onChange={(e) => setNewExceptionDate(e.target.value)}
                  className="w-full mt-1 px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  <option value="">请选择日期</option>
                  {dateOptions.map(opt => (
                    <option key={opt.value} value={opt.value} disabled={!!exceptions[opt.value]}>
                      {opt.label} ({opt.value})
                      {exceptions[opt.value] ? ' - 已设置' : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-between">
                <Label className="text-xs text-gray-600">是否营业</Label>
                <Switch
                  checked={newExceptionIsOpen}
                  onCheckedChange={setNewExceptionIsOpen}
                />
              </div>

              {newExceptionIsOpen && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs text-gray-600">开始时间</Label>
                    <Input
                      type="time"
                      value={newExceptionOpen}
                      onChange={(e) => setNewExceptionOpen(e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-gray-600">结束时间</Label>
                    <Input
                      type="time"
                      value={newExceptionClose}
                      onChange={(e) => setNewExceptionClose(e.target.value)}
                      className="mt-1"
                    />
                  </div>
                </div>
              )}

              <Button
                onClick={handleAddException}
                disabled={!newExceptionDate}
                variant="outline"
                className="w-full"
                size="sm"
              >
                <Plus className="w-4 h-4 mr-1" />
                添加特殊日期
              </Button>
            </div>

            {/* 已设置的例外列表 */}
            {sortedExceptions.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs text-gray-500">已设置的特殊日期：</p>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {sortedExceptions.map(([date, config]) => {
                    const dateObj = new Date(date);
                    const displayDate = `${dateObj.getMonth() + 1}月${dateObj.getDate()}日`;
                    return (
                      <div
                        key={date}
                        className={cn(
                          'flex items-center justify-between p-3 rounded-lg border',
                          config.isOpen ? 'bg-white border-gray-200' : 'bg-gray-100 border-gray-200'
                        )}
                      >
                        <div>
                          <p className="text-sm font-medium text-gray-800">{displayDate}</p>
                          <p className="text-xs text-gray-500">
                            {config.isOpen
                              ? `营业时间: ${config.open || defaultOpen} - ${config.close || defaultClose}`
                              : '休息日'}
                          </p>
                        </div>
                        <button
                          onClick={() => handleRemoveException(date)}
                          className="p-1.5 text-red-500 hover:bg-red-50 rounded-full transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 底部按钮 */}
        <div className="p-4 border-t bg-gray-50 flex gap-3">
          <Button variant="outline" className="flex-1" onClick={onClose}>
            取消
          </Button>
          <Button
            className="flex-1 bg-orange-500 hover:bg-orange-600 text-white"
            onClick={handleSave}
          >
            保存设置
          </Button>
        </div>
      </div>
    </div>
  );
}
