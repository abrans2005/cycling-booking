import { useState, useEffect } from 'react';
import { api, useSupabase } from '@/lib/supabase';
import type { Booking } from '@/types';
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
  AlertCircle,
  Search
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

      {/* 数据存储模式提示 */}
      {!useSupabase && (
        <div className="bg-yellow-50 border border-yellow-200 mx-4 mt-4 p-3 rounded-lg">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-yellow-600 mt-0.5" />
            <div className="text-sm text-yellow-800">
              <p className="font-medium">本地存储模式</p>
              <p className="text-xs mt-1">数据保存在浏览器本地，更换设备或清除缓存会丢失。建议配置 Supabase 进行云端存储。</p>
            </div>
          </div>
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

      {/* 刷新按钮 */}
      <div className="mx-4 mt-3 flex justify-end">
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
