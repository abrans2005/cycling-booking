import { useState } from 'react';
import PullToRefresh from 'react-simple-pull-to-refresh';
import { api } from '@/lib/supabase';
import type { Booking } from '@/types';
import { 
  Calendar, 
  Clock, 
  Bike, 
  User, 
  Phone, 
  Search,
  CheckCircle2,
  XCircle,
  ArrowLeft,
  Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface MyBookingsProps {
  onBack: () => void;
}

export function MyBookings({ onBack }: MyBookingsProps) {
  const [phone, setPhone] = useState('');
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const handleSearch = async () => {
    if (!phone.trim()) return;
    
    setLoading(true);
    try {
      const allBookings = await api.getBookings();
      const myBookings = allBookings.filter(b => 
        b.memberPhone.includes(phone.trim())
      );
      setBookings(myBookings);
      setSearched(true);
    } catch (error) {
      console.error('查询失败:', error);
    } finally {
      setLoading(false);
    }
  };

  // 下拉刷新
  const handleRefresh = async () => {
    if (!phone.trim() || !searched) return;
    
    try {
      const allBookings = await api.getBookings();
      const myBookings = allBookings.filter(b => 
        b.memberPhone.includes(phone.trim())
      );
      setBookings(myBookings);
    } catch (error) {
      console.error('刷新失败:', error);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
    const weekday = weekdays[date.getDay()];
    return `${month}月${day}日 ${weekday}`;
  };

  const calculateDuration = (startTime: string, endTime: string) => {
    const [startHour, startMinute] = startTime.split(':').map(Number);
    const [endHour, endMinute] = endTime.split(':').map(Number);
    const startMinutes = startHour * 60 + startMinute;
    const endMinutes = endHour * 60 + endMinute;
    return (endMinutes - startMinutes) / 60;
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* 顶部导航 */}
      <header className="bg-gradient-to-r from-orange-500 to-red-500 text-white py-4 px-4">
        <div className="flex items-center gap-3">
          <button 
            onClick={onBack}
            className="p-2 hover:bg-white/20 rounded-full transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div>
            <h1 className="text-lg font-bold">我的预约</h1>
            <p className="text-xs text-white/80">查询预约记录</p>
          </div>
        </div>
      </header>

      {/* 搜索区域 */}
      <div className="bg-white p-4 border-b">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="请输入手机号查询"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              maxLength={11}
              className="pl-10"
            />
          </div>
          <Button 
            onClick={handleSearch}
            disabled={loading || !phone.trim()}
            className="bg-orange-500 hover:bg-orange-600"
          >
            <Search className="w-4 h-4 mr-1" />
            查询
          </Button>
        </div>
      </div>

      {/* 结果列表 */}
      <div className="p-4 pb-8">
        {!searched ? (
          <div className="bg-white rounded-xl p-8 text-center">
            <Search className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">请输入手机号查询预约记录</p>
          </div>
        ) : loading ? (
          <div className="bg-white rounded-xl p-8 text-center">
            <p className="text-gray-500">查询中...</p>
          </div>
        ) : bookings.length === 0 ? (
          <PullToRefresh onRefresh={handleRefresh}>
            <div className="bg-white rounded-xl p-8 text-center min-h-[200px]">
              <XCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">未找到预约记录</p>
              <p className="text-sm text-gray-400 mt-1">请检查手机号是否正确</p>
            </div>
          </PullToRefresh>
        ) : (
          <PullToRefresh 
            onRefresh={handleRefresh}
            pullingContent={
              <div className="flex items-center justify-center gap-2 py-3 text-gray-500">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-sm">下拉刷新</span>
              </div>
            }
            refreshingContent={
              <div className="flex items-center justify-center gap-2 py-3 text-orange-500">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-sm">刷新中...</span>
              </div>
            }
          >
            <div className="space-y-3">
              <p className="text-sm text-gray-500 mb-2">
                共找到 {bookings.length} 条预约记录
              </p>
              {bookings.map((booking) => {
              const duration = calculateDuration(booking.startTime, booking.endTime);
              const isCancelled = booking.status === 'cancelled';
              const isPast = new Date(booking.date) < new Date(new Date().toDateString());

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
                        : isPast
                        ? 'bg-blue-100 text-blue-600'
                        : 'bg-green-100 text-green-600'
                    )}>
                      {isCancelled ? (
                        <span className="flex items-center gap-1">
                          <XCircle className="w-3 h-3" />
                          已取消
                        </span>
                      ) : isPast ? (
                        <span className="flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" />
                          已完成
                        </span>
                      ) : (
                        <span className="flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" />
                          待训练
                        </span>
                      )}
                    </div>
                  </div>

                  {/* 预约信息 */}
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-600">{formatDate(booking.date)}</span>
                    </div>
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
                    {booking.notes && (
                      <div className="text-gray-500 text-xs bg-gray-50 p-2 rounded mt-2">
                        备注：{booking.notes}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
            </div>
          </PullToRefresh>
        )}
      </div>
    </div>
  );
}
