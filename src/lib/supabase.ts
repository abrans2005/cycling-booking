import { createClient } from '@supabase/supabase-js';
import type { Booking, AppConfig, User } from '@/types';

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
const USER_KEY = 'cycling_user';
const SMS_CODE_KEY = 'cycling_sms_codes';

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

  // 发送验证码（模拟）
  sendSmsCode: async (phone: string): Promise<boolean> => {
    const storage = getStorage();
    if (!storage) return false;
    
    // 生成6位随机验证码
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    
    // 存储验证码（5分钟有效）
    const codes = JSON.parse(storage.getItem(SMS_CODE_KEY) || '{}');
    codes[phone] = {
      code,
      expireAt: Date.now() + 5 * 60 * 1000, // 5分钟过期
    };
    storage.setItem(SMS_CODE_KEY, JSON.stringify(codes));
    
    // 模拟发送短信 - 在控制台输出
    console.log(`【骑行工作室】验证码：${code}，5分钟内有效。`);
    
    return true;
  },

  // 验证验证码
  verifySmsCode: async (phone: string, code: string): Promise<boolean> => {
    const storage = getStorage();
    if (!storage) return false;
    
    const codes = JSON.parse(storage.getItem(SMS_CODE_KEY) || '{}');
    const record = codes[phone];
    
    if (!record) return false;
    if (Date.now() > record.expireAt) return false;
    if (record.code !== code) return false;
    
    // 验证成功后删除验证码
    delete codes[phone];
    storage.setItem(SMS_CODE_KEY, JSON.stringify(codes));
    
    return true;
  },

  // 获取或创建用户
  getOrCreateUser: async (phone: string): Promise<User> => {
    const storage = getStorage();
    if (!storage) {
      // 返回临时用户
      return {
        id: 'temp-' + Date.now(),
        phone,
        nickname: '用户' + phone.slice(-4),
        createdAt: new Date().toISOString(),
        lastLoginAt: new Date().toISOString(),
      };
    }
    
    // 从本地存储获取用户列表
    const users = JSON.parse(storage.getItem(USER_KEY) || '[]');
    let user = users.find((u: User) => u.phone === phone);
    
    if (!user) {
      // 创建新用户
      user = {
        id: 'user-' + Date.now(),
        phone,
        nickname: '用户' + phone.slice(-4),
        createdAt: new Date().toISOString(),
        lastLoginAt: new Date().toISOString(),
      };
      users.push(user);
      storage.setItem(USER_KEY, JSON.stringify(users));
    } else {
      // 更新最后登录时间
      user.lastLoginAt = new Date().toISOString();
      storage.setItem(USER_KEY, JSON.stringify(users));
    }
    
    return user;
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

  // 发送验证码（模拟，真实环境需要对接短信服务商）
  sendSmsCode: async (phone: string): Promise<boolean> => {
    if (!supabase) return false;
    
    // 生成6位随机验证码
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    
    // 存储到 Supabase
    const { error } = await supabase
      .from('sms_codes')
      .upsert({
        phone,
        code,
        expire_at: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
        created_at: new Date().toISOString(),
      });
    
    if (error) {
      console.error('存储验证码失败:', error);
      return false;
    }
    
    // 模拟发送短信 - 在控制台输出
    console.log(`【骑行工作室】验证码：${code}，5分钟内有效。`);
    
    return true;
  },

  // 验证验证码
  verifySmsCode: async (phone: string, code: string): Promise<boolean> => {
    if (!supabase) return false;
    
    const { data, error } = await supabase
      .from('sms_codes')
      .select('*')
      .eq('phone', phone)
      .eq('code', code)
      .gt('expire_at', new Date().toISOString())
      .single();
    
    if (error || !data) return false;
    
    // 删除已使用的验证码
    await supabase.from('sms_codes').delete().eq('phone', phone);
    
    return true;
  },

  // 获取或创建用户
  getOrCreateUser: async (phone: string): Promise<User> => {
    if (!supabase) throw new Error('Supabase not initialized');
    
    // 先查找用户
    let { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('phone', phone)
      .single();
    
    if (error || !user) {
      // 创建新用户
      const { data: newUser, error: createError } = await supabase
        .from('users')
        .insert([{
          phone,
          nickname: '用户' + phone.slice(-4),
          created_at: new Date().toISOString(),
          last_login_at: new Date().toISOString(),
        }])
        .select()
        .single();
      
      if (createError) throw createError;
      user = newUser;
    } else {
      // 更新最后登录时间
      await supabase
        .from('users')
        .update({ last_login_at: new Date().toISOString() })
        .eq('id', user.id);
    }
    
    return {
      id: user.id,
      phone: user.phone,
      nickname: user.nickname,
      avatarUrl: user.avatar_url,
      createdAt: user.created_at,
      lastLoginAt: user.last_login_at,
    };
  },
};

export const api = useSupabase ? supabaseApi : localApi;
