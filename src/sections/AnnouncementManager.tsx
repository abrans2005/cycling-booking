import { useState, useMemo } from 'react';
import { X, Plus, Edit2, Trash2, Bell, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import type { Announcement } from '@/types';
import { cn } from '@/lib/utils';

interface AnnouncementManagerProps {
  isOpen: boolean;
  onClose: () => void;
  announcements: Announcement[];
  onSave: (announcements: Announcement[]) => void;
}

const generateId = () => `ann_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

export function AnnouncementManager({
  isOpen,
  onClose,
  announcements,
  onSave,
}: AnnouncementManagerProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<Announcement>>({
    title: '',
    content: '',
    type: 'info',
    isActive: true,
    startDate: '',
    endDate: '',
  });

  const sortedAnnouncements = useMemo(() => {
    return [...(announcements || [])].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }, [announcements]);

  const handleAdd = () => {
    setEditingId('new');
    setFormData({
      title: '',
      content: '',
      type: 'info',
      isActive: true,
      startDate: '',
      endDate: '',
    });
  };

  const handleEdit = (announcement: Announcement) => {
    setEditingId(announcement.id);
    setFormData({ ...announcement });
  };

  const handleDelete = (id: string) => {
    if (!confirm('确定要删除这条公告吗？')) return;
    const newAnnouncements = (announcements || []).filter(a => a.id !== id);
    onSave(newAnnouncements);
  };

  const handleSave = () => {
    if (!formData.content?.trim()) {
      alert('请输入公告内容');
      return;
    }

    const now = new Date().toISOString();
    const newAnnouncement: Announcement = {
      id: editingId === 'new' ? generateId() : (formData.id || generateId()),
      title: formData.title?.trim() || '',
      content: formData.content.trim(),
      type: formData.type as 'info' | 'warning' | 'success' | 'error',
      isActive: formData.isActive ?? true,
      startDate: formData.startDate || undefined,
      endDate: formData.endDate || undefined,
      createdAt: editingId === 'new' ? now : (formData.createdAt || now),
      updatedAt: now,
    };

    let newAnnouncements: Announcement[];
    if (editingId === 'new') {
      newAnnouncements = [...(announcements || []), newAnnouncement];
    } else {
      newAnnouncements = (announcements || []).map(a =>
        a.id === editingId ? newAnnouncement : a
      );
    }

    onSave(newAnnouncements);
    setEditingId(null);
  };

  const handleCancel = () => {
    setEditingId(null);
  };

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      info: 'ℹ️ 信息',
      warning: '⚠️ 警告',
      success: '✅ 成功',
      error: '❌ 错误',
    };
    return labels[type] || type;
  };

  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      info: 'bg-blue-100 text-blue-700',
      warning: 'bg-yellow-100 text-yellow-700',
      success: 'bg-green-100 text-green-700',
      error: 'bg-red-100 text-red-700',
    };
    return colors[type] || 'bg-gray-100 text-gray-700';
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-orange-500" />
            系统公告管理
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto -mx-6 px-6">
          {/* 公告列表 */}
          {!editingId && (
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <p className="text-sm text-gray-500">
                  共 {announcements?.length || 0} 条公告
                </p>
                <Button onClick={handleAdd} size="sm" className="gap-1">
                  <Plus className="w-4 h-4" />
                  新建公告
                </Button>
              </div>

              {sortedAnnouncements.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                  <Bell className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p>暂无公告</p>
                  <p className="text-sm mt-1">点击上方按钮创建新公告</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {sortedAnnouncements.map(announcement => {
                    const isExpired = announcement.endDate && 
                      new Date().toISOString().split('T')[0] > announcement.endDate;
                    const isNotStarted = announcement.startDate && 
                      new Date().toISOString().split('T')[0] < announcement.startDate;

                    return (
                      <div
                        key={announcement.id}
                        className={cn(
                          'border rounded-lg p-4 transition-all',
                          announcement.isActive && !isExpired && !isNotStarted
                            ? 'bg-white border-gray-200'
                            : 'bg-gray-50 border-gray-100 opacity-70'
                        )}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className={cn('text-xs px-2 py-0.5 rounded-full', getTypeColor(announcement.type))}>
                                {getTypeLabel(announcement.type)}
                              </span>
                              {!announcement.isActive && (
                                <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">
                                  已停用
                                </span>
                              )}
                              {isExpired && (
                                <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">
                                  已过期
                                </span>
                              )}
                              {isNotStarted && (
                                <span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-500">
                                  待生效
                                </span>
                              )}
                            </div>
                            {announcement.title && (
                              <p className="font-medium text-gray-800 mb-1">{announcement.title}</p>
                            )}
                            <p className="text-sm text-gray-600 whitespace-pre-wrap line-clamp-2">
                              {announcement.content}
                            </p>
                            {(announcement.startDate || announcement.endDate) && (
                              <div className="flex items-center gap-1 mt-2 text-xs text-gray-400">
                                <Calendar className="w-3 h-3" />
                                <span>
                                  {announcement.startDate || '即日起'}
                                  {' - '}
                                  {announcement.endDate || '长期有效'}
                                </span>
                              </div>
                            )}
                          </div>
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => handleEdit(announcement)}
                            >
                              <Edit2 className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-red-500 hover:text-red-600"
                              onClick={() => handleDelete(announcement.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* 编辑表单 */}
          {editingId && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-medium">
                  {editingId === 'new' ? '新建公告' : '编辑公告'}
                </h3>
                <Button variant="ghost" size="sm" onClick={handleCancel}>
                  <X className="w-4 h-4 mr-1" />
                  取消
                </Button>
              </div>

              <div className="space-y-4">
                <div>
                  <Label>公告标题（可选）</Label>
                  <Input
                    value={formData.title || ''}
                    onChange={e => setFormData({ ...formData, title: e.target.value })}
                    placeholder="例如：春节期间营业时间调整"
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label>公告内容 *</Label>
                  <Textarea
                    value={formData.content || ''}
                    onChange={e => setFormData({ ...formData, content: e.target.value })}
                    placeholder="请输入公告内容..."
                    className="mt-1 min-h-[100px]"
                  />
                </div>

                <div>
                  <Label>类型</Label>
                  <Select
                    value={formData.type}
                    onValueChange={(v: 'info' | 'warning' | 'success' | 'error') =>
                      setFormData({ ...formData, type: v })
                    }
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="info">ℹ️ 信息</SelectItem>
                      <SelectItem value="warning">⚠️ 警告</SelectItem>
                      <SelectItem value="success">✅ 成功</SelectItem>
                      <SelectItem value="error">❌ 错误</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>开始日期（可选）</Label>
                    <Input
                      type="date"
                      value={formData.startDate || ''}
                      onChange={e => setFormData({ ...formData, startDate: e.target.value })}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label>结束日期（可选）</Label>
                    <Input
                      type="date"
                      value={formData.endDate || ''}
                      onChange={e => setFormData({ ...formData, endDate: e.target.value })}
                      className="mt-1"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-sm">启用公告</p>
                    <p className="text-xs text-gray-500">关闭后用户将看不到此公告</p>
                  </div>
                  <Switch
                    checked={formData.isActive}
                    onCheckedChange={v => setFormData({ ...formData, isActive: v })}
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <Button variant="outline" className="flex-1" onClick={handleCancel}>
                  取消
                </Button>
                <Button className="flex-1 bg-orange-500 hover:bg-orange-600" onClick={handleSave}>
                  保存
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
