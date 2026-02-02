import { useTimeSlots } from '@/hooks/useBookingRealtime';
import { cn } from '@/lib/utils';
import { Clock } from 'lucide-react';

interface TimeSelectorProps {
  selectedTime: string;
  onSelectTime: (time: string) => void;
  selectedDate: Date | undefined;
}

export function TimeSelector({ selectedTime, onSelectTime, selectedDate }: TimeSelectorProps) {
  const timeSlots = useTimeSlots();

  // 过滤掉已过期的时间段（如果是今天）
  const availableSlots = timeSlots.filter(slot => {
    if (!selectedDate) return true;
    
    const now = new Date();
    const isToday = selectedDate.toDateString() === now.toDateString();
    
    if (!isToday) return true;
    
    const slotMinutes = slot.hour * 60 + slot.minute;
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    
    // 只保留当前时间之后的时间段（预留15分钟缓冲）
    return slotMinutes > currentMinutes + 15;
  });

  return (
    <div className="py-4 bg-white border-b">
      <div className="px-4 mb-3 flex items-center gap-2">
        <Clock className="w-4 h-4 text-gray-500" />
        <h2 className="text-sm font-medium text-gray-700">选择开始时间</h2>
      </div>
      
      {!selectedDate ? (
        <div className="px-4 py-8 text-center text-gray-400">
          <p>请先选择日期</p>
        </div>
      ) : availableSlots.length === 0 ? (
        <div className="px-4 py-8 text-center text-gray-400">
          <p>今日无可预约时段</p>
        </div>
      ) : (
        <div className="px-4 grid grid-cols-4 gap-2">
          {availableSlots.map((slot) => (
            <button
              key={slot.label}
              onClick={() => onSelectTime(slot.label)}
              className={cn(
                'py-2 px-1 rounded-lg border text-sm font-medium transition-all',
                selectedTime === slot.label
                  ? 'border-orange-500 bg-orange-50 text-orange-600'
                  : 'border-gray-200 bg-white text-gray-700 hover:border-orange-300'
              )}
            >
              {slot.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
