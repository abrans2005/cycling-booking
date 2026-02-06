import { Bike } from 'lucide-react';
import type { BusinessHoursConfig } from '@/types';
import { getBusinessHoursForDate } from '@/lib/businessHours';

interface HeaderProps {
  businessHours?: BusinessHoursConfig;
}

const DEFAULT_HOURS = { open: '06:00', close: '22:00' };

export function Header({ businessHours }: HeaderProps) {
  // 获取今天的营业时间，使用默认值防止 undefined
  const today = new Date().toISOString().split('T')[0];
  const hours = businessHours 
    ? getBusinessHoursForDate(businessHours, today)
    : DEFAULT_HOURS;

  return (
    <header className="bg-gradient-to-r from-orange-500 to-red-500 text-white py-6 px-4">
      <div className="flex items-center justify-center gap-3">
        <div className="bg-white/20 p-2 rounded-full">
          <Bike className="w-8 h-8" />
        </div>
        <div className="text-center">
          <h1 className="text-xl font-bold">骑行工作室</h1>
          <p className="text-xs text-white/80">专业室内骑行训练</p>
        </div>
      </div>
      <div className="mt-4 text-center text-sm text-white/90">
        <p>营业时间：每日 {hours.open} - {hours.close}</p>
      </div>
    </header>
  );
}
