import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { api } from '@/lib/supabase';
import type { Booking, BookingFormData, AppConfig } from '@/types';

// 生成未来14天的日期选项
export const useDateOptions = () => {
  return useCallback(() => {
    return Array.from({ length: 14 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() + i);
      return date;
    });
  }, [])();
};

// 生成时间段选项
export const useTimeSlots = () => {
  return useCallback(() => {
    return Array.from({ length: 33 }, (_, i) => {
      const hour = Math.floor(i / 2) + 6;
      const minute = (i % 2) * 30;
      return {
        hour,
        minute,
        label: `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`,
      };
    });
  }, [])();
};

// 默认配置
const DEFAULT_APP_CONFIG: AppConfig = {
  pricePerHour: 100,
  bikeModels: [
    { id: 'stages', name: 'Stages Bike', description: '专业功率训练骑行台' },
    { id: 'neo', name: 'Neo Bike', description: '智能模拟骑行台' },
  ],
  stations: [
    { stationId: 1, bikeModelId: 'stages', status: 'available', name: '1号骑行台' },
    { stationId: 2, bikeModelId: 'stages', status: 'available', name: '2号骑行台' },
    { stationId: 3, bikeModelId: 'neo', status: 'available', name: '3号骑行台' },
    { stationId: 4, bikeModelId: 'neo', status: 'available', name: '4号骑行台' },
  ],
  updatedAt: new Date().toISOString(),
};

// 配置 Hook
export const useConfig = () => {
  const [config, setConfig] = useState<AppConfig>(DEFAULT_APP_CONFIG);
  const [loading, setLoading] = useState(false);

  const loadConfig = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.getConfig();
      setConfig(data);
    } catch {
      console.error('加载配置失败');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadConfig();
  }, [loadConfig]);

  return { config, loading, reloadConfig: loadConfig };
};

// 骑行台数据 Hook - 从配置中动态获取
export const useBikeStations = () => {
  const { config } = useConfig();
  
  // 从配置中构建骑行台列表
  return useMemo(() => {
    if (!config?.stations || config.stations.length === 0) {
      // 默认返回4个骑行台
      return [
        { id: 1, name: '1号骑行台', bikeModelId: 'stages', status: 'available' as const },
        { id: 2, name: '2号骑行台', bikeModelId: 'stages', status: 'available' as const },
        { id: 3, name: '3号骑行台', bikeModelId: 'neo', status: 'available' as const },
        { id: 4, name: '4号骑行台', bikeModelId: 'neo', status: 'available' as const },
      ];
    }
    
    return config.stations.map(s => ({
      id: s.stationId,
      name: s.name || `${s.stationId}号骑行台`,
      bikeModelId: s.bikeModelId,
      status: s.status,
    }));
  }, [config?.stations]);
};

// 主预约 Hook
export const useBooking = (pricePerHour: number = 100) => {
  const [bookings, setBookings] = useState<Booking[]>([]);
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
  const [error, setError] = useState<string | null>(null);
  const isInitialized = useRef(false);

  // 加载预约数据
  const loadBookings = useCallback(async () => {
    try {
      const date = formData.date?.toISOString().split('T')[0];
      const data = await api.getBookings(date);
      setBookings(data);
    } catch (err) {
      console.error('加载预约失败:', err);
    }
  }, [formData.date]);

  // 初始加载（只执行一次）
  useEffect(() => {
    if (!isInitialized.current) {
      isInitialized.current = true;
      loadBookings();
    }
  }, [loadBookings]);

  // 更新表单数据
  const updateFormData = useCallback(<K extends keyof BookingFormData>(
    key: K,
    value: BookingFormData[K]
  ) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  }, []);

  // 提交预约
  const submitBooking = useCallback(async (): Promise<boolean> => {
    if (!formData.date || !formData.startTime || !formData.stationId || 
        !formData.memberName || !formData.memberPhone) {
      return false;
    }

    const [hour, minute] = formData.startTime.split(':').map(Number);
    const endHour = hour + Math.floor(formData.duration);
    const endMinute = minute + (formData.duration % 1) * 60;
    const endTime = `${endHour.toString().padStart(2, '0')}:${Math.round(endMinute).toString().padStart(2, '0')}`;

    try {
      const newBooking = await api.createBooking({
        date: formData.date.toISOString().split('T')[0],
        startTime: formData.startTime,
        endTime,
        stationId: formData.stationId,
        memberName: formData.memberName,
        memberPhone: formData.memberPhone,
        notes: formData.notes,
        status: 'confirmed',
      });

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

      // 刷新预约列表
      await loadBookings();
      setError(null);
      return true;
    } catch (err) {
      setError('创建预约失败，请重试');
      console.error(err);
      return false;
    }
  }, [formData, loadBookings]);

  // 关闭成功弹窗
  const closeSuccess = useCallback(() => {
    setShowSuccess(false);
  }, []);

  // 计算总价
  const totalPrice = formData.duration * pricePerHour;

  return {
    formData,
    updateFormData,
    bookings,
    showSuccess,
    lastBooking,
    totalPrice,
    error,
    submitBooking,
    closeSuccess,
    refreshBookings: loadBookings,
  };
};
