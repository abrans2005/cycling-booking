import { cn } from '@/lib/utils';
import { isBusinessOpen } from '@/lib/businessHours';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useRef, useState, useEffect } from 'react';
import type { BusinessHoursConfig } from '@/types';

interface DateSelectorProps {
  selectedDate: Date | undefined;
  onSelectDate: (date: Date) => void;
  businessHours: BusinessHoursConfig;
}

export function DateSelector({ selectedDate, onSelectDate, businessHours }: DateSelectorProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  // 生成未来14天的日期
  const dates = (() => {
    const result = [];
    const today = new Date();
    for (let i = 0; i < 14; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      result.push(date);
    }
    return result;
  })();

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
            const dateStr = date.toISOString().split('T')[0];
            const isOpen = isBusinessOpen(businessHours, dateStr);
            
            return (
              <button
                key={index}
                onClick={() => isOpen && onSelectDate(date)}
                disabled={!isOpen}
                className={cn(
                  'flex-shrink-0 flex flex-col items-center justify-center w-16 h-20 rounded-xl border-2 transition-all',
                  isSelected
                    ? 'border-orange-500 bg-orange-50'
                    : isOpen
                    ? 'border-gray-200 bg-white hover:border-orange-300'
                    : 'border-gray-100 bg-gray-50 cursor-not-allowed',
                  isToday && !isSelected && isOpen && 'border-orange-200 bg-orange-50/50'
                )}
              >
                <span className={cn(
                  'text-xs',
                  isOpen ? 'text-gray-500' : 'text-gray-400'
                )}>{month}月</span>
                <span className={cn(
                  'text-xl font-bold',
                  isSelected ? 'text-orange-600' : isOpen ? 'text-gray-800' : 'text-gray-400'
                )}>
                  {day}
                </span>
                <span className={cn(
                  'text-xs',
                  isSelected ? 'text-orange-500' : isOpen ? 'text-gray-500' : 'text-gray-400'
                )}>
                  {isOpen ? (isToday ? '今天' : weekday) : '休息'}
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
