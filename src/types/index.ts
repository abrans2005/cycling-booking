// 预约系统类型定义

export interface TimeSlot {
  hour: number;
  minute: number;
  label: string;
  available: boolean;
}

export interface BikeStation {
  id: number;
  name: string;
  status: 'available' | 'occupied' | 'maintenance';
}

export interface Booking {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  stationId: number;
  memberName: string;
  memberPhone: string;
  notes?: string;
  status: 'pending' | 'confirmed' | 'cancelled';
  createdAt: string;
}

export interface BookingFormData {
  date: Date | undefined;
  startTime: string;
  duration: number;
  stationId: number | null;
  memberName: string;
  memberPhone: string;
  notes: string;
}

// 单车型号
export type BikeModel = 'Stages bike' | 'Neo bike';

// 骑行台配置
export interface StationConfig {
  stationId: number;
  bikeModel: BikeModel;
}

// 用户信息
export interface User {
  id: string;
  phone: string;
  nickname?: string;
  avatarUrl?: string;
  createdAt: string;
  lastLoginAt: string;
}

// 系统配置
export interface AppConfig {
  pricePerHour: number;
  stations: StationConfig[];
  serverChanKey?: string;  // Server酱 SendKey
  updatedAt: string;
}
