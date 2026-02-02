import { useState, useCallback, useMemo } from 'react';
import type { BookingFormData, BikeStation, Booking } from '@/types';

// 生成未来14天的日期选项
export const useDateOptions = () => {
  return useMemo(() => {
    const dates = [];
    const today = new Date();
    for (let i = 0; i < 14; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      dates.push(date);
    }
    return dates;
  }, []);
};

// 生成时间段选项（6:00 - 22:00，每30分钟一个时段）
export const useTimeSlots = () => {
  return useMemo(() => {
    const slots = [];
    for (let hour = 6; hour < 22; hour++) {
      slots.push(
        { hour, minute: 0, label: `${hour.toString().padStart(2, '0')}:00`, available: true },
        { hour, minute: 30, label: `${hour.toString().padStart(2, '0')}:30`, available: true }
      );
    }
    // 添加22:00
    slots.push({ hour: 22, minute: 0, label: '22:00', available: true });
    return slots;
  }, []);
};

// 骑行台数据
export const useBikeStations = () => {
  const [stations] = useState<BikeStation[]>([
    { id: 1, name: '1号骑行台', status: 'available' },
    { id: 2, name: '2号骑行台', status: 'available' },
    { id: 3, name: '3号骑行台', status: 'available' },
    { id: 4, name: '4号骑行台', status: 'available' },
  ]);
  return stations;
};

// 模拟已存在的预约数据
const MOCK_BOOKINGS: Booking[] = [
  {
    id: '1',
    date: new Date().toISOString().split('T')[0],
    startTime: '10:00',
    endTime: '11:00',
    stationId: 1,
    memberName: '张三',
    memberPhone: '13800138000',
    status: 'confirmed',
    createdAt: new Date().toISOString(),
  },
  {
    id: '2',
    date: new Date().toISOString().split('T')[0],
    startTime: '14:00',
    endTime: '15:30',
    stationId: 2,
    memberName: '李四',
    memberPhone: '13900139000',
    status: 'confirmed',
    createdAt: new Date().toISOString(),
  },
];

// 预约逻辑Hook
export const useBooking = (pricePerHour: number = 100) => {
  const [bookings, setBookings] = useState<Booking[]>(MOCK_BOOKINGS);
  const [formData, setFormData] = useState<BookingFormData>({
    date: undefined,
    startTime: '',
    duration: 1,
    stationId: null,
    memberName: '',
    memberPhone: '',
    notes: '',
  });
  const [showSuccess, setShowSuccess] = useState(false);
  const [lastBooking, setLastBooking] = useState<Booking | null>(null);

  // 更新表单数据
  const updateFormData = useCallback(<K extends keyof BookingFormData>(
    key: K,
    value: BookingFormData[K]
  ) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  }, []);

  // 检查某个骑行台在指定时间段是否可用
  const isStationAvailable = useCallback((
    stationId: number,
    date: string,
    startTime: string,
    duration: number
  ): boolean => {
    const [startHour, startMinute] = startTime.split(':').map(Number);
    const startMinutes = startHour * 60 + startMinute;
    const endMinutes = startMinutes + duration * 60;

    return !bookings.some(booking => {
      if (booking.stationId !== stationId || booking.date !== date) return false;
      if (booking.status === 'cancelled') return false;

      const [bStartHour, bStartMinute] = booking.startTime.split(':').map(Number);
      const bStartMinutes = bStartHour * 60 + bStartMinute;
      const [bEndHour, bEndMinute] = booking.endTime.split(':').map(Number);
      const bEndMinutes = bEndHour * 60 + bEndMinute;

      // 检查时间段是否重叠
      return (
        (startMinutes < bEndMinutes && endMinutes > bStartMinutes) ||
        (bStartMinutes < endMinutes && bEndMinutes > startMinutes)
      );
    });
  }, [bookings]);

  // 获取指定日期和时间的可用骑行台
  const getAvailableStations = useCallback((
    date: string | undefined,
    startTime: string,
    duration: number
  ): number[] => {
    if (!date) return [1, 2, 3, 4];
    return [1, 2, 3, 4].filter(stationId => 
      isStationAvailable(stationId, date, startTime, duration)
    );
  }, [isStationAvailable]);

  // 提交预约
  const submitBooking = useCallback((): boolean => {
    if (!formData.date || !formData.startTime || !formData.stationId || 
        !formData.memberName || !formData.memberPhone) {
      return false;
    }

    const [hour, minute] = formData.startTime.split(':').map(Number);
    const endHour = hour + formData.duration;
    const endTime = `${endHour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;

    const newBooking: Booking = {
      id: Date.now().toString(),
      date: formData.date.toISOString().split('T')[0],
      startTime: formData.startTime,
      endTime,
      stationId: formData.stationId,
      memberName: formData.memberName,
      memberPhone: formData.memberPhone,
      notes: formData.notes,
      status: 'confirmed',
      createdAt: new Date().toISOString(),
    };

    setBookings(prev => [...prev, newBooking]);
    setLastBooking(newBooking);
    setShowSuccess(true);
    
    // 重置表单
    setFormData({
      date: undefined,
      startTime: '',
      duration: 1,
      stationId: null,
      memberName: '',
      memberPhone: '',
      notes: '',
    });

    return true;
  }, [formData]);

  // 关闭成功弹窗
  const closeSuccess = useCallback(() => {
    setShowSuccess(false);
  }, []);

  // 计算总价
  const totalPrice = useMemo(() => {
    return formData.duration * pricePerHour;
  }, [formData.duration, pricePerHour]);

  return {
    formData,
    updateFormData,
    bookings,
    showSuccess,
    lastBooking,
    totalPrice,
    submitBooking,
    closeSuccess,
    getAvailableStations,
    isStationAvailable,
  };
};
