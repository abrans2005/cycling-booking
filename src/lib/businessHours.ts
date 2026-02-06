import type { BusinessHoursConfig } from '@/types';

// 默认营业时间
const DEFAULT_BUSINESS_HOURS: BusinessHoursConfig = {
  default: { open: '06:00', close: '22:00' },
  exceptions: {},
};

/**
 * 检查指定日期是否营业
 */
export function isBusinessOpen(
  businessHours: BusinessHoursConfig | undefined,
  dateStr: string  // 'YYYY-MM-DD'
): boolean {
  // 如果没有配置，使用默认配置（默认营业）
  const hours = businessHours || DEFAULT_BUSINESS_HOURS;
  
  // 先检查是否有特殊日期配置
  const exception = hours.exceptions[dateStr];
  if (exception) {
    return exception.isOpen;
  }
  // 默认营业
  return true;
}

/**
 * 获取指定日期的营业时间
 * @returns { open: string, close: string } 格式 "HH:MM"
 */
export function getBusinessHoursForDate(
  businessHours: BusinessHoursConfig | undefined,
  dateStr: string
): { open: string; close: string } {
  // 如果没有配置，使用默认配置
  const hours = businessHours || DEFAULT_BUSINESS_HOURS;
  
  const exception = hours.exceptions[dateStr];
  if (exception && exception.isOpen) {
    return {
      open: exception.open || hours.default.open,
      close: exception.close || hours.default.close,
    };
  }
  return hours.default;
}

/**
 * 生成时间段选项
 * @param openTime - 开始时间 "HH:MM"
 * @param closeTime - 结束时间 "HH:MM"
 * @param intervalMinutes - 间隔分钟数（默认30）
 */
export function generateTimeSlots(
  openTime: string,
  closeTime: string,
  intervalMinutes: number = 30
): { hour: number; minute: number; label: string; value: string }[] {
  const [openHour, openMinute] = openTime.split(':').map(Number);
  const [closeHour, closeMinute] = closeTime.split(':').map(Number);
  
  const openMinutes = openHour * 60 + openMinute;
  const closeMinutes = closeHour * 60 + closeMinute;
  
  const slots: { hour: number; minute: number; label: string; value: string }[] = [];
  
  for (let minutes = openMinutes; minutes < closeMinutes; minutes += intervalMinutes) {
    const hour = Math.floor(minutes / 60);
    const minute = minutes % 60;
    const label = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
    slots.push({ hour, minute, label, value: label });
  }
  
  return slots;
}

/**
 * 格式化时间为显示格式
 */
export function formatTimeDisplay(timeStr: string): string {
  return timeStr;
}

/**
 * 获取未来N天的营业状态列表
 */
export function getBusinessStatusForDateRange(
  businessHours: BusinessHoursConfig,
  days: number = 14
): { date: string; isOpen: boolean; hours: { open: string; close: string } }[] {
  const result = [];
  const today = new Date();
  
  for (let i = 0; i < days; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);
    const dateStr = date.toISOString().split('T')[0];
    
    result.push({
      date: dateStr,
      isOpen: isBusinessOpen(businessHours, dateStr),
      hours: getBusinessHoursForDate(businessHours, dateStr),
    });
  }
  
  return result;
}
