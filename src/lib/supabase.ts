import { createClient } from '@supabase/supabase-js';
import type { Booking, AppConfig, User } from '@/types';
import { sendBookingNotification, sendCancelNotification } from './serverchan';
import { APP_VERSION } from './version';

// 预约通知数据类型
export interface BookingNotificationData {
  memberName: string;
  memberPhone: string;
  date: string;
  startTime: string;
  endTime: string;
  stationId: number;
  bikeModel?: string;
  price: number;
  notes?: string;
}

// 取消预约通知数据类型
export interface CancelNotificationData {
  memberName: string;
  memberPhone: string;
  date: string;
  startTime: string;
  stationId: number;
}

console.log('[System] App Version:', APP_VERSION);
console.log('[System] Storage Mode: CLOUD ONLY (Supabase)');

// Supabase 配置
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// 调试信息（部署后会显示在浏览器控制台）
console.log('[Supabase] Environment check:');
console.log('[Supabase] URL configured:', SUPABASE_URL ? 'YES' : 'NO');
console.log('[Supabase] KEY configured:', SUPABASE_ANON_KEY ? 'YES' : 'NO');

// 验证配置
if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('[Supabase] ❌ 配置缺失！');
  console.error('  - URL:', SUPABASE_URL ? 'OK' : 'MISSING');
  console.error('  - KEY:', SUPABASE_ANON_KEY ? 'OK' : 'MISSING');
  throw new Error(
    'Supabase 配置缺失！请检查 Vercel 环境变量是否设置了 VITE_SUPABASE_URL 和 VITE_SUPABASE_ANON_KEY'
  );
}

console.log('[Supabase] ✅ 配置正常，使用云端存储');

// 创建 Supabase 客户端
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// 默认配置（仅在数据库无配置时使用）
const DEFAULT_CONFIG: AppConfig = {
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
  businessHours: {
    default: { open: '06:00', close: '22:00' },
    exceptions: {},
  },
  updatedAt: new Date().toISOString(),
};

// API 实现（仅 Supabase 云端）
export const api = {
  // 获取预约列表
  getBookings: async (date?: string): Promise<Booking[]> => {
    let query = supabase
      .from('bookings')
      .select('*')
      .order('date', { ascending: true })
      .order('start_time', { ascending: true });

    if (date) {
      query = query.eq('date', date);
    }

    const { data, error } = await query;
    if (error) {
      console.error('[Supabase] getBookings error:', error);
      throw new Error(`获取预约失败: ${error.message}`);
    }

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

  // 创建预约
  createBooking: async (booking: Omit<Booking, 'id' | 'createdAt'>): Promise<Booking> => {
    // 校验营业时间
    const config = await api.getConfig();
    const { isBusinessOpen, getBusinessHoursForDate } = await import('./businessHours');
    
    // 如果没有营业时间配置，跳过校验（兼容旧数据）
    if (config.businessHours) {
      if (!isBusinessOpen(config.businessHours, booking.date)) {
        throw new Error('该日期不营业，请选择其他日期');
      }
      
      const hours = getBusinessHoursForDate(config.businessHours, booking.date);
      const [startHour, startMinute] = booking.startTime.split(':').map(Number);
      const [endHour, endMinute] = booking.endTime.split(':').map(Number);
      const [openHour, openMinute] = hours.open.split(':').map(Number);
      const [closeHour, closeMinute] = hours.close.split(':').map(Number);
      
      const startMinutes = startHour * 60 + startMinute;
      const endMinutes = endHour * 60 + endMinute;
      const openMinutes = openHour * 60 + openMinute;
      const closeMinutes = closeHour * 60 + closeMinute;
      
      if (startMinutes < openMinutes || endMinutes > closeMinutes) {
        throw new Error(`预约时间必须在营业时间内 (${hours.open} - ${hours.close})`);
      }
    }

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

    if (error) {
      console.error('[Supabase] createBooking error:', error);
      throw new Error(`创建预约失败: ${error.message}`);
    }

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

  // 取消预约
  cancelBooking: async (id: string): Promise<void> => {
    const { error } = await supabase
      .from('bookings')
      .update({ status: 'cancelled' })
      .eq('id', id);
    
    if (error) {
      console.error('[Supabase] cancelBooking error:', error);
      throw new Error(`取消预约失败: ${error.message}`);
    }
  },

  // 删除预约
  deleteBooking: async (id: string): Promise<void> => {
    const { error } = await supabase
      .from('bookings')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error('[Supabase] deleteBooking error:', error);
      throw new Error(`删除预约失败: ${error.message}`);
    }
  },

  // 检查骑行台是否可用
  checkStationAvailability: async (
    stationId: number,
    date: string,
    startTime: string,
    endTime: string,
    excludeBookingId?: string
  ): Promise<boolean> => {
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
    if (error) {
      console.error('[Supabase] checkStationAvailability error:', error);
      throw new Error(`检查可用性失败: ${error.message}`);
    }

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

  // 获取系统配置
  getConfig: async (): Promise<AppConfig> => {
    const { data, error } = await supabase
      .from('config')
      .select('*')
      .eq('id', 1)
      .single();
    
    if (error) {
      // 如果没有配置记录，返回默认配置
      if (error.code === 'PGRST116') {
        return DEFAULT_CONFIG;
      }
      console.error('[Supabase] getConfig error:', error);
      throw new Error(`获取配置失败: ${error.message}`);
    }
    
    return {
      pricePerHour: data.price_per_hour ?? DEFAULT_CONFIG.pricePerHour,
      stations: data.stations || DEFAULT_CONFIG.stations,
      bikeModels: data.bike_models || DEFAULT_CONFIG.bikeModels,
      businessHours: data.business_hours || DEFAULT_CONFIG.businessHours,
      serverChanKey: data.server_chan_key,
      updatedAt: data.updated_at,
    };
  },

  // 更新系统配置
  updateConfig: async (config: Partial<AppConfig>): Promise<AppConfig> => {
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
    if (config.serverChanKey !== undefined) {
      updateData.server_chan_key = config.serverChanKey;
    }
    if (config.bikeModels !== undefined) {
      updateData.bike_models = config.bikeModels;
    }
    if (config.businessHours !== undefined) {
      updateData.business_hours = config.businessHours;
    }
    
    const { data, error } = await supabase
      .from('config')
      .upsert(updateData)
      .select()
      .single();
    
    if (error) {
      console.error('[Supabase] updateConfig error:', error);
      throw new Error(`更新配置失败: ${error.message}`);
    }
    
    return {
      pricePerHour: data.price_per_hour ?? DEFAULT_CONFIG.pricePerHour,
      stations: data.stations || DEFAULT_CONFIG.stations,
      serverChanKey: data.server_chan_key,
      bikeModels: data.bike_models || DEFAULT_CONFIG.bikeModels,
      businessHours: data.business_hours || DEFAULT_CONFIG.businessHours,
      updatedAt: data.updated_at,
    };
  },

  // 发送验证码
  sendSmsCode: async (phone: string): Promise<boolean> => {
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    
    const { error } = await supabase
      .from('sms_codes')
      .upsert({
        phone,
        code,
        expire_at: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
        created_at: new Date().toISOString(),
      });
    
    if (error) {
      console.error('[Supabase] sendSmsCode error:', error);
      throw new Error(`发送验证码失败: ${error.message}`);
    }
    
    // 模拟发送短信 - 在控制台输出
    console.log(`【骑行工作室】验证码：${code}，5分钟内有效。`);
    
    return true;
  },

  // 验证验证码
  verifySmsCode: async (phone: string, code: string): Promise<boolean> => {
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
      
      if (createError) {
        console.error('[Supabase] createUser error:', createError);
        throw new Error(`创建用户失败: ${createError.message}`);
      }
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

  // 发送预约通知
  sendBookingNotification: async (booking: BookingNotificationData): Promise<boolean> => {
    const config = await api.getConfig();
    if (!config.serverChanKey) {
      console.log('Server酱未配置，跳过通知');
      return false;
    }
    return sendBookingNotification(config.serverChanKey, booking);
  },

  // 发送取消通知
  sendCancelNotification: async (booking: CancelNotificationData): Promise<boolean> => {
    const config = await api.getConfig();
    if (!config.serverChanKey) {
      console.log('Server酱未配置，跳过通知');
      return false;
    }
    return sendCancelNotification(config.serverChanKey, booking);
  },
};

// 导出类型
export type Api = typeof api;
