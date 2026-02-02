import { createClient } from '@supabase/supabase-js';
import type { Booking, AppConfig } from '@/types';

// Supabase 配置
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// 是否使用 Supabase
export const useSupabase = !!(SUPABASE_URL && SUPABASE_ANON_KEY);

// 创建 Supabase 客户端（仅在配置完整时）
export const supabase = useSupabase 
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  : null;

// 本地存储备份
const STORAGE_KEY = 'cycling_bookings';
const CONFIG_KEY = 'cycling_config';

// 默认配置
const DEFAULT_CONFIG: AppConfig = {
  pricePerHour: 100,
  stations: [
    { stationId: 1, bikeModel: 'Stages bike' },
    { stationId: 2, bikeModel: 'Stages bike' },
    { stationId: 3, bikeModel: 'Neo bike' },
    { stationId: 4, bikeModel: 'Neo bike' },
  ],
  updatedAt: new Date().toISOString(),
};

// 安全地获取 localStorage
const getStorage = () => {
  if (typeof window === 'undefined') return null;
  try {
    return window.localStorage;
  } catch {
    return null;
  }
};

const getStoredBookings = (): Booking[] => {
  const storage = getStorage();
  if (!storage) return [];
  try {
    const data = storage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
};

const setStoredBookings = (bookings: Booking[]) => {
  const storage = getStorage();
  if (!storage) return;
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(bookings));
  } catch {
    // ignore
  }
};

// API 实现
const localApi = {
  getBookings: async (date?: string): Promise<Booking[]> => {
    const bookings = getStoredBookings();
    if (date) {
      return bookings.filter(b => b.date === date);
    }
    return bookings;
  },

  createBooking: async (booking: Omit<Booking, 'id' | 'createdAt'>): Promise<Booking> => {
    const bookings = getStoredBookings();
    const newBooking: Booking = {
      ...booking,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
    };
    bookings.push(newBooking);
    setStoredBookings(bookings);
    return newBooking;
  },

  cancelBooking: async (id: string): Promise<void> => {
    const bookings = getStoredBookings();
    const booking = bookings.find(b => b.id === id);
    if (booking) {
      booking.status = 'cancelled';
      setStoredBookings(bookings);
    }
  },

  deleteBooking: async (id: string): Promise<void> => {
    const bookings = getStoredBookings();
    const filtered = bookings.filter(b => b.id !== id);
    setStoredBookings(filtered);
  },

  checkStationAvailability: async (
    stationId: number,
    date: string,
    startTime: string,
    endTime: string,
    excludeBookingId?: string
  ): Promise<boolean> => {
    const bookings = getStoredBookings().filter(
      b => b.stationId === stationId && b.date === date && b.status !== 'cancelled'
    );

    const [startHour, startMinute] = startTime.split(':').map(Number);
    const [endHour, endMinute] = endTime.split(':').map(Number);
    const startMinutes = startHour * 60 + startMinute;
    const endMinutes = endHour * 60 + endMinute;

    return !bookings.some(booking => {
      if (excludeBookingId && booking.id === excludeBookingId) return false;
      
      const [bStartHour, bStartMinute] = booking.startTime.split(':').map(Number);
      const [bEndHour, bEndMinute] = booking.endTime.split(':').map(Number);
      const bStartMinutes = bStartHour * 60 + bStartMinute;
      const bEndMinutes = bEndHour * 60 + bEndMinute;

      return (
        (startMinutes < bEndMinutes && endMinutes > bStartMinutes) ||
        (bStartMinutes < endMinutes && bEndMinutes > startMinutes)
      );
    });
  },

  getConfig: async (): Promise<AppConfig> => {
    const storage = getStorage();
    if (!storage) return DEFAULT_CONFIG;
    try {
      const data = storage.getItem(CONFIG_KEY);
      return data ? JSON.parse(data) : DEFAULT_CONFIG;
    } catch {
      return DEFAULT_CONFIG;
    }
  },

  updateConfig: async (config: Partial<AppConfig>): Promise<AppConfig> => {
    const storage = getStorage();
    const current = await localApi.getConfig();
    const updated: AppConfig = {
      ...current,
      ...config,
      updatedAt: new Date().toISOString(),
    };
    if (storage) {
      storage.setItem(CONFIG_KEY, JSON.stringify(updated));
    }
    return updated;
  },
};

const supabaseApi = {
  getBookings: async (date?: string): Promise<Booking[]> => {
    if (!supabase) return [];
    let query = supabase
      .from('bookings')
      .select('*')
      .order('date', { ascending: true })
      .order('start_time', { ascending: true });

    if (date) {
      query = query.eq('date', date);
    }

    const { data, error } = await query;
    if (error) throw error;

    return (data || []).map(item => ({
      id: item.id,
      date: item.date,
      startTime: item.start_time,
      endTime: item.end_time,
      stationId: item.station_id,
      memberName: item.member_name,
      memberPhone: item.member_phone,
      notes: item.notes || '',
      status: item.status,
      createdAt: item.created_at,
    }));
  },

  createBooking: async (booking: Omit<Booking, 'id' | 'createdAt'>): Promise<Booking> => {
    if (!supabase) throw new Error('Supabase not initialized');
    const { data, error } = await supabase
      .from('bookings')
      .insert([{
        date: booking.date,
        start_time: booking.startTime,
        end_time: booking.endTime,
        station_id: booking.stationId,
        member_name: booking.memberName,
        member_phone: booking.memberPhone,
        notes: booking.notes,
        status: booking.status,
      }])
      .select()
      .single();

    if (error) throw error;

    return {
      id: data.id,
      date: data.date,
      startTime: data.start_time,
      endTime: data.end_time,
      stationId: data.station_id,
      memberName: data.member_name,
      memberPhone: data.member_phone,
      notes: data.notes || '',
      status: data.status,
      createdAt: data.created_at,
    };
  },

  cancelBooking: async (id: string): Promise<void> => {
    if (!supabase) throw new Error('Supabase not initialized');
    const { error } = await supabase
      .from('bookings')
      .update({ status: 'cancelled' })
      .eq('id', id);
    if (error) throw error;
  },

  deleteBooking: async (id: string): Promise<void> => {
    if (!supabase) throw new Error('Supabase not initialized');
    const { error } = await supabase
      .from('bookings')
      .delete()
      .eq('id', id);
    if (error) throw error;
  },

  checkStationAvailability: async (
    stationId: number,
    date: string,
    startTime: string,
    endTime: string,
    excludeBookingId?: string
  ): Promise<boolean> => {
    if (!supabase) return true;
    let query = supabase
      .from('bookings')
      .select('*')
      .eq('station_id', stationId)
      .eq('date', date)
      .neq('status', 'cancelled');

    if (excludeBookingId) {
      query = query.neq('id', excludeBookingId);
    }

    const { data, error } = await query;
    if (error) throw error;

    const [startHour, startMinute] = startTime.split(':').map(Number);
    const [endHour, endMinute] = endTime.split(':').map(Number);
    const startMinutes = startHour * 60 + startMinute;
    const endMinutes = endHour * 60 + endMinute;

    return !(data || []).some((booking: any) => {
      const [bStartHour, bStartMinute] = booking.start_time.split(':').map(Number);
      const [bEndHour, bEndMinute] = booking.end_time.split(':').map(Number);
      const bStartMinutes = bStartHour * 60 + bStartMinute;
      const bEndMinutes = bEndHour * 60 + bEndMinute;

      return (
        (startMinutes < bEndMinutes && endMinutes > bStartMinutes) ||
        (bStartMinutes < endMinutes && bEndMinutes > startMinutes)
      );
    });
  },

  getConfig: async (): Promise<AppConfig> => {
    if (!supabase) return DEFAULT_CONFIG;
    const { data, error } = await supabase
      .from('config')
      .select('*')
      .eq('id', 1)
      .single();
    
    if (error || !data) {
      // 如果没有配置，返回默认配置
      return DEFAULT_CONFIG;
    }
    
    return {
      pricePerHour: data.price_per_hour,
      stations: data.stations || DEFAULT_CONFIG.stations,
      updatedAt: data.updated_at,
    };
  },

  updateConfig: async (config: Partial<AppConfig>): Promise<AppConfig> => {
    if (!supabase) throw new Error('Supabase not initialized');
    
    const updateData: any = {
      id: 1,
      updated_at: new Date().toISOString(),
    };
    
    if (config.pricePerHour !== undefined) {
      updateData.price_per_hour = config.pricePerHour;
    }
    if (config.stations !== undefined) {
      updateData.stations = config.stations;
    }
    
    const { data, error } = await supabase
      .from('config')
      .upsert(updateData)
      .select()
      .single();
    
    if (error) throw error;
    
    return {
      pricePerHour: data.price_per_hour,
      stations: data.stations || DEFAULT_CONFIG.stations,
      updatedAt: data.updated_at,
    };
  },
};

export const api = useSupabase ? supabaseApi : localApi;
