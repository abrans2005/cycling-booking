import { useState, useEffect, useMemo } from 'react';
import { X, Info, AlertTriangle, CheckCircle, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Announcement } from '@/types';

interface AnnouncementBannerProps {
  announcements: Announcement[];
}

export function AnnouncementBanner({ announcements }: AnnouncementBannerProps) {
  const [dismissedIds, setDismissedIds] = useState<string[]>([]);

  // 从 localStorage 读取已关闭的公告
  useEffect(() => {
    const saved = localStorage.getItem('dismissed_announcements');
    if (saved) {
      try {
        setDismissedIds(JSON.parse(saved));
      } catch {
        // ignore
      }
    }
  }, []);

  // 保存到 localStorage
  const dismissAnnouncement = (id: string) => {
    const newDismissed = [...dismissedIds, id];
    setDismissedIds(newDismissed);
    localStorage.setItem('dismissed_announcements', JSON.stringify(newDismissed));
  };

  // 过滤出当前需要展示的公告
  const activeAnnouncements = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    
    return (announcements || [])
      .filter(a => a.isActive)  // 只显示启用的
      .filter(a => !dismissedIds.includes(a.id))  // 排除已关闭的
      .filter(a => {
        // 检查日期范围
        if (a.startDate && today < a.startDate) return false;
        if (a.endDate && today > a.endDate) return false;
        return true;
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());  // 最新的在前
  }, [announcements, dismissedIds]);

  if (activeAnnouncements.length === 0) return null;

  return (
    <div className="space-y-2">
      {activeAnnouncements.map(announcement => (
        <AnnouncementItem 
          key={announcement.id} 
          announcement={announcement} 
          onDismiss={() => dismissAnnouncement(announcement.id)}
        />
      ))}
    </div>
  );
}

interface AnnouncementItemProps {
  announcement: Announcement;
  onDismiss: () => void;
}

function AnnouncementItem({ announcement, onDismiss }: AnnouncementItemProps) {
  const icons = {
    info: Info,
    warning: AlertTriangle,
    success: CheckCircle,
    error: AlertCircle,
  };

  const colors = {
    info: 'bg-blue-50 border-blue-200 text-blue-800',
    warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
    success: 'bg-green-50 border-green-200 text-green-800',
    error: 'bg-red-50 border-red-200 text-red-800',
  };

  const iconColors = {
    info: 'text-blue-500',
    warning: 'text-yellow-500',
    success: 'text-green-500',
    error: 'text-red-500',
  };

  const Icon = icons[announcement.type];

  return (
    <div className={cn(
      'relative px-4 py-3 border rounded-lg',
      colors[announcement.type]
    )}>
      <div className="flex items-start gap-3 pr-6">
        <Icon className={cn('w-5 h-5 flex-shrink-0 mt-0.5', iconColors[announcement.type])} />
        <div className="flex-1 min-w-0">
          {announcement.title && (
            <p className="font-medium text-sm mb-1">{announcement.title}</p>
          )}
          <p className="text-sm opacity-90 whitespace-pre-wrap">{announcement.content}</p>
        </div>
      </div>
      <button
        onClick={onDismiss}
        className="absolute top-2 right-2 p-1 rounded-full hover:bg-black/5 transition-colors"
        title="关闭"
      >
        <X className="w-4 h-4 opacity-60" />
      </button>
    </div>
  );
}
