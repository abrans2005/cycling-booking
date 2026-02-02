import { useDateOptions } from '@/hooks/useBookingRealtime';
import { cn } from '@/lib/utils';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useRef, useState, useEffect } from 'react';

interface DateSelectorProps {
  selectedDate: Date | undefined;
  onSelectDate: (date: Date) => void;
}

export function DateSelector({ selectedDate, onSelectDate }: DateSelectorProps) {
  const dates = useDateOptions();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const checkScroll = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
    }
  };

  useEffect(() => {
    checkScroll();
    const el = scrollRef.current;
    if (el) {
      el.addEventListener('scroll', checkScroll);
      return () => el.removeEventListener('scroll', checkScroll);
    }
  }, []);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = 280;
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      });
    }
  };

  const formatDate = (date: Date) => {
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
    const weekday = weekdays[date.getDay()];
    const isToday = date.toDateString() === new Date().toDateString();
    
    return { month, day, weekday, isToday };
  };

  return (
    <div className="py-4 bg-white border-b">
      <div className="px-4 mb-3">
        <h2 className="text-sm font-medium text-gray-700">选择日期</h2>
      </div>
      
      <div className="relative">
        {/* 左滚动按钮 */}
        {canScrollLeft && (
          <button
            onClick={() => scroll('left')}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white/90 shadow-md rounded-full p-1"
          >
            <ChevronLeft className="w-5 h-5 text-gray-600" />
          </button>
        )}

        {/* 日期列表 */}
        <div
          ref={scrollRef}
          className="flex gap-2 px-4 overflow-x-auto scrollbar-hide"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {dates.map((date, index) => {
            const { month, day, weekday, isToday } = formatDate(date);
            const isSelected = selectedDate?.toDateString() === date.toDateString();
            
            return (
              <button
                key={index}
                onClick={() => onSelectDate(date)}
                className={cn(
                  'flex-shrink-0 flex flex-col items-center justify-center w-16 h-20 rounded-xl border-2 transition-all',
                  isSelected
                    ? 'border-orange-500 bg-orange-50'
                    : 'border-gray-200 bg-white hover:border-orange-300',
                  isToday && !isSelected && 'border-orange-200 bg-orange-50/50'
                )}
              >
                <span className="text-xs text-gray-500">{month}月</span>
                <span className={cn(
                  'text-xl font-bold',
                  isSelected ? 'text-orange-600' : 'text-gray-800'
                )}>
                  {day}
                </span>
                <span className={cn(
                  'text-xs',
                  isSelected ? 'text-orange-500' : 'text-gray-500'
                )}>
                  {isToday ? '今天' : weekday}
                </span>
              </button>
            );
          })}
        </div>

        {/* 右滚动按钮 */}
        {canScrollRight && (
          <button
            onClick={() => scroll('right')}
            className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white/90 shadow-md rounded-full p-1"
          >
            <ChevronRight className="w-5 h-5 text-gray-600" />
          </button>
        )}
      </div>
    </div>
  );
}
