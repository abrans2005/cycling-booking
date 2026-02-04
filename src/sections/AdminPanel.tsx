import { useState, useEffect, useRef } from 'react';
import { api } from '@/lib/supabase';
import type { Booking, BookingNotification } from '@/types';
import { useNotifications } from '@/hooks/useNotifications';
import { CloudStatus } from '@/components/CloudStatus';
import { 
  Calendar, 
  Clock, 
  Bike, 
  User, 
  Phone, 
  Trash2, 
  XCircle, 
  CheckCircle2,
  LogOut,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Search,
  Bell,
  Check,
  Trash,
  X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface AdminPanelProps {
  onLogout: () => void;
}

export function AdminPanel({ onLogout }: AdminPanelProps) {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [searchPhone, setSearchPhone] = useState('');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  
  // 消息通知
  const {
    notifications,
    unreadCount,
    isOpen,
    toggleOpen,
    closePanel,
    markAsRead,
    markAllAsRead,
    removeNotification,
    clearAll,
  } = useNotifications();
  
  const notificationRef = useRef<HTMLDivElement>(null);

  // 加载预约数据
  const loadBookings = async () => {
    setLoading(true);
    try {
      const dateStr = currentDate.toISOString().split('T')[0];
      const data = await api.getBookings(dateStr);
      setBookings(data);
    } catch (error) {
      showMessage('error', '加载数据失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBookings();
  }, [currentDate]);

  // 显示消息
  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 3000);
  };

  // 取消预约
  const handleCancel = async (id: string) => {
    if (!confirm('确定要取消这个预约吗？')) return;
    try {
      await api.cancelBooking(id);
      showMessage('success', '预约已取消');
      loadBookings();
    } catch (error) {
      showMessage('error', '取消失败');
    }
  };

  // 删除预约
  const handleDelete = async (id: string) => {
    if (!confirm('确定要删除这个预约吗？此操作不可恢复。')) return;
    try {
      await api.deleteBooking(id);
      showMessage('success', '预约已删除');
      loadBookings();
    } catch (error) {
      showMessage('error', '删除失败');
    }
  };

  // 切换日期
  const changeDate = (days: number) => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() + days);
    setCurrentDate(newDate);
  };

  // 格式化日期
  const formatDate = (date: Date) => {
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
    const weekday = weekdays[date.getDay()];
    const isToday = date.toDateString() === new Date().toDateString();
    return { month, day, weekday, isToday };
  };

  // 计算时长
  const calculateDuration = (startTime: string, endTime: string) => {
    const [startHour, startMinute] = startTime.split(':').map(Number);
    const [endHour, endMinute] = endTime.split(':').map(Number);
    const startMinutes = startHour * 60 + startMinute;
    const endMinutes = endHour * 60 + endMinute;
    return (endMinutes - startMinutes) / 60;
  };

  const { month, day, weekday, isToday } = formatDate(currentDate);

  // 筛选预约
  const filteredBookings = bookings.filter(b => 
    searchPhone === '' || b.memberPhone.includes(searchPhone)
  );

  // 点击外部关闭通知面板
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        closePanel();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [closePanel]);

  // 统计
  const stats = {
    total: filteredBookings.length,
    confirmed: filteredBookings.filter(b => b.status === 'confirmed').length,
    cancelled: filteredBookings.filter(b => b.status === 'cancelled').length,
    revenue: filteredBookings
      .filter(b => b.status === 'confirmed')
      .reduce((sum, b) => sum + calculateDuration(b.startTime, b.endTime) * 100, 0),
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* 顶部导航 */}
      <header className="bg-gradient-to-r from-orange-500 to-red-500 text-white py-4 px-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-white/20 p-2 rounded-full">
              <Bike className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-lg font-bold">管理后台</h1>
              <p className="text-xs text-white/80">骑行工作室预约管理</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* 消息通知按钮 */}
            <div className="relative" ref={notificationRef}>
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleOpen}
                className="text-white hover:bg-white/20 relative"
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold min-w-[18px] h-[18px] rounded-full flex items-center justify-center px-1">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
              </Button>
              
              {/* 消息下拉面板 */}
              {isOpen && (
                <div className="absolute top-full right-0 mt-2 w-80 bg-white rounded-xl shadow-2xl border z-50 max-h-[400px] flex flex-col">
                  {/* 面板头部 */}
                  <div className="flex items-center justify-between px-4 py-3 border-b bg-gray-50 rounded-t-xl">
                    <div className="flex items-center gap-2">
                      <Bell className="w-4 h-4 text-orange-500" />
                      <span className="font-medium text-gray-800">预约通知</span>
                      {unreadCount > 0 && (
                        <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                          {unreadCount}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      {unreadCount > 0 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={markAllAsRead}
                          className="h-7 text-xs text-gray-600 hover:text-orange-600"
                        >
                          <Check className="w-3 h-3 mr-1" />
                          全部已读
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={clearAll}
                        className="h-7 text-xs text-gray-600 hover:text-red-600"
                      >
                        <Trash className="w-3 h-3 mr-1" />
                        清空
                      </Button>
                    </div>
                  </div>
                  
                  {/* 消息列表 */}
                  <div className="flex-1 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="py-8 text-center text-gray-400">
                        <Bell className="w-10 h-10 mx-auto mb-2 opacity-30" />
                        <p className="text-sm">暂无通知</p>
                      </div>
                    ) : (
                      <div className="divide-y">
                        {notifications.map((notification) => (
                          <NotificationItem
                            key={notification.id}
                            notification={notification}
                            onRead={() => markAsRead(notification.id)}
                            onRemove={() => removeNotification(notification.id)}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={onLogout}
              className="text-white hover:bg-white/20"
            >
              <LogOut className="w-4 h-4 mr-1" />
              退出
            </Button>
          </div>
        </div>
      </header>

      {/* 消息提示 */}
      {message && (
        <div className={cn(
          'fixed top-16 left-4 right-4 py-3 px-4 rounded-lg text-center text-sm z-50',
          message.type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
        )}>
          {message.text}
        </div>
      )}



      {/* 日期选择 */}
      <div className="bg-white mx-4 mt-4 p-4 rounded-xl shadow-sm">
        <div className="flex items-center justify-between">
          <button
            onClick={() => changeDate(-1)}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <ChevronLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-800">
              {month}月{day}日
            </p>
            <p className={cn(
              'text-sm',
              isToday ? 'text-orange-500 font-medium' : 'text-gray-500'
            )}>
              {isToday ? '今天' : weekday}
            </p>
          </div>
          <button
            onClick={() => changeDate(1)}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <ChevronRight className="w-5 h-5 text-gray-600" />
          </button>
        </div>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-3 gap-3 mx-4 mt-4">
        <div className="bg-white p-3 rounded-xl shadow-sm text-center">
          <p className="text-2xl font-bold text-orange-600">{stats.confirmed}</p>
          <p className="text-xs text-gray-500">有效预约</p>
        </div>
        <div className="bg-white p-3 rounded-xl shadow-sm text-center">
          <p className="text-2xl font-bold text-gray-600">{stats.total}</p>
          <p className="text-xs text-gray-500">总预约</p>
        </div>
        <div className="bg-white p-3 rounded-xl shadow-sm text-center">
          <p className="text-2xl font-bold text-green-600">¥{stats.revenue}</p>
          <p className="text-xs text-gray-500">预计收入</p>
        </div>
      </div>

      {/* 搜索 */}
      <div className="mx-4 mt-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="搜索手机号..."
            value={searchPhone}
            onChange={(e) => setSearchPhone(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* 刷新按钮和云端状态 */}
      <div className="mx-4 mt-3 flex items-center justify-between">
        <CloudStatus />
        <Button
          variant="outline"
          size="sm"
          onClick={loadBookings}
          disabled={loading}
          className="text-gray-600"
        >
          <RefreshCw className={cn('w-4 h-4 mr-1', loading && 'animate-spin')} />
          刷新
        </Button>
      </div>

      {/* 预约列表 */}
      <div className="mx-4 mt-4 pb-8">
        {filteredBookings.length === 0 ? (
          <div className="bg-white rounded-xl p-8 text-center">
            <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">今日暂无预约</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredBookings.map((booking) => {
              const duration = calculateDuration(booking.startTime, booking.endTime);
              const price = duration * 100;
              const isCancelled = booking.status === 'cancelled';

              return (
                <div
                  key={booking.id}
                  className={cn(
                    'bg-white rounded-xl p-4 shadow-sm',
                    isCancelled && 'opacity-60'
                  )}
                >
                  {/* 状态标签 */}
                  <div className="flex items-center justify-between mb-3">
                    <div className={cn(
                      'px-2 py-1 rounded-full text-xs font-medium',
                      isCancelled
                        ? 'bg-gray-100 text-gray-500'
                        : 'bg-green-100 text-green-600'
                    )}>
                      {isCancelled ? (
                        <span className="flex items-center gap-1">
                          <XCircle className="w-3 h-3" />
                          已取消
                        </span>
                      ) : (
                        <span className="flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" />
                          已确认
                        </span>
                      )}
                    </div>
                    <span className="text-lg font-bold text-orange-600">
                      ¥{price}
                    </span>
                  </div>

                  {/* 预约信息 */}
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-600">
                        {booking.startTime} - {booking.endTime}
                      </span>
                      <span className="text-gray-400">({duration}小时)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Bike className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-600">{booking.stationId}号骑行台</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-600">{booking.memberName}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-600">{booking.memberPhone}</span>
                    </div>
                    {booking.notes && (
                      <div className="text-gray-500 text-xs bg-gray-50 p-2 rounded">
                        备注：{booking.notes}
                      </div>
                    )}
                  </div>

                  {/* 操作按钮 */}
                  {!isCancelled && (
                    <div className="flex gap-2 mt-4 pt-3 border-t">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleCancel(booking.id)}
                        className="flex-1 text-orange-600 border-orange-200 hover:bg-orange-50"
                      >
                        <XCircle className="w-4 h-4 mr-1" />
                        取消
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(booking.id)}
                        className="flex-1 text-red-600 border-red-200 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4 mr-1" />
                        删除
                      </Button>
                    </div>
                  )}
                  {isCancelled && (
                    <div className="mt-4 pt-3 border-t">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(booking.id)}
                        className="w-full text-red-600 border-red-200 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4 mr-1" />
                        删除记录
                      </Button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// 通知项组件
interface NotificationItemProps {
  notification: BookingNotification;
  onRead: () => void;
  onRemove: () => void;
}

function NotificationItem({ notification, onRead, onRemove }: NotificationItemProps) {
  const formatTime = (isoString: string) => {
    const date = new Date(isoString);
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  return (
    <div
      className={cn(
        'p-3 hover:bg-gray-50 transition-colors cursor-pointer relative group',
        !notification.read && 'bg-orange-50/50'
      )}
      onClick={onRead}
    >
      {/* 未读指示器 */}
      {!notification.read && (
        <div className="absolute left-2 top-4 w-2 h-2 bg-orange-500 rounded-full" />
      )}
      
      <div className={cn('pl-4', !notification.read && 'pl-5')}>
        {/* 标题和时间 */}
        <div className="flex items-center justify-between mb-1">
          <span className={cn(
            'text-sm font-medium',
            notification.read ? 'text-gray-600' : 'text-gray-800'
          )}>
            {notification.title}
          </span>
          <span className="text-xs text-gray-400">
            {formatTime(notification.createdAt)}
          </span>
        </div>
        
        {/* 内容 */}
        <p className="text-xs text-gray-600 mb-1.5">
          {notification.content}
        </p>
        
        {/* 详细信息 */}
        <div className="text-xs text-gray-500 space-y-0.5 bg-gray-50 p-2 rounded">
          <div className="flex items-center gap-1">
            <User className="w-3 h-3" />
            <span>{notification.memberName}</span>
            <span className="text-gray-400">({notification.memberPhone})</span>
          </div>
          <div className="flex items-center gap-1">
            <Bike className="w-3 h-3" />
            <span>{notification.stationId}号骑行台</span>
          </div>
          <div className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            <span>{notification.startTime} - {notification.endTime}</span>
          </div>
        </div>
      </div>
      
      {/* 删除按钮 */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onRemove();
        }}
        className="absolute top-2 right-2 p-1 opacity-0 group-hover:opacity-100 hover:bg-gray-200 rounded transition-all"
      >
        <X className="w-3 h-3 text-gray-400" />
      </button>
    </div>
  );
}
