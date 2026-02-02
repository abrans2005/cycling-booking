import { CheckCircle2, Calendar, Clock, Bike, User, Phone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { Booking } from '@/types';
import { cn } from '@/lib/utils';

interface SuccessModalProps {
  booking: Booking | null;
  onClose: () => void;
}

export function SuccessModal({ booking, onClose }: SuccessModalProps) {
  if (!booking) return null;

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
    const durationHours = (endMinutes - startMinutes) / 60;
    return durationHours;
  };

  const duration = calculateDuration(booking.startTime, booking.endTime);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-300">
        {/* 顶部成功标识 */}
        <div className="bg-gradient-to-r from-green-500 to-emerald-500 py-8 px-6 text-center">
          <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
            <CheckCircle2 className="w-12 h-12 text-green-500" />
          </div>
          <h2 className="text-xl font-bold text-white">预约成功！</h2>
          <p className="text-white/80 text-sm mt-1">
            请按时到店开始训练
          </p>
        </div>

        {/* 预约详情 */}
        <div className="p-6 space-y-4">
          <div className="bg-gray-50 rounded-xl p-4 space-y-3">
            <h3 className="font-medium text-gray-800 mb-3">预约详情</h3>
            
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0">
                <Calendar className="w-4 h-4 text-orange-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">日期</p>
                <p className="text-sm font-medium text-gray-800">{formatDate(booking.date)}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                <Clock className="w-4 h-4 text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">时间</p>
                <p className="text-sm font-medium text-gray-800">
                  {booking.startTime} - {booking.endTime} ({duration}小时)
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                <Bike className="w-4 h-4 text-purple-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">骑行台</p>
                <p className="text-sm font-medium text-gray-800">{booking.stationId}号骑行台</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                <User className="w-4 h-4 text-green-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">预约人</p>
                <p className="text-sm font-medium text-gray-800">{booking.memberName}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-pink-100 rounded-full flex items-center justify-center flex-shrink-0">
                <Phone className="w-4 h-4 text-pink-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">联系电话</p>
                <p className="text-sm font-medium text-gray-800">{booking.memberPhone}</p>
              </div>
            </div>
          </div>

          {/* 提示信息 */}
          <div className="bg-blue-50 rounded-xl p-4">
            <p className="text-sm text-blue-700">
              <span className="font-medium">温馨提示：</span>
              请提前10分钟到店，我们会为您准备好骑行台。如需取消预约，请提前2小时联系教练。
            </p>
          </div>

          {/* 关闭按钮 */}
          <Button
            onClick={onClose}
            className={cn(
              'w-full py-6 text-lg font-medium rounded-xl',
              'bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white'
            )}
          >
            我知道了
          </Button>
        </div>
      </div>
    </div>
  );
}
