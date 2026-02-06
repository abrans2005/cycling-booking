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

// 单车型号定义
export interface BikeModel {
  id: string;           // 唯一标识，如 "stages", "neo", "wahoo"
  name: string;         // 显示名称，如 "Stages Bike"
  description?: string; // 可选描述
}

// 骑行台配置
export interface StationConfig {
  stationId: number;
  bikeModelId: string;  // 关联 BikeModel.id
  status: 'available' | 'maintenance' | 'disabled';  // 可用、维护中、停用
  name?: string;        // 可选自定义名称，如 "1号骑行台"
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

// 营业时间配置
export interface BusinessHoursConfig {
  default: {
    open: string;    // 格式: "HH:MM"
    close: string;   // 格式: "HH:MM"
  };
  exceptions: Record<string, {    // key: 日期 "YYYY-MM-DD"
    isOpen: boolean;
    open?: string;
    close?: string;
  }>;
}

// 系统配置
export interface AppConfig {
  pricePerHour: number;
  stations: StationConfig[];      // 骑行台列表
  bikeModels: BikeModel[];        // 型号列表
  businessHours: BusinessHoursConfig;  // 营业时间配置
  serverChanKey?: string;         // Server酱 SendKey
  updatedAt: string;
}

// 消息通知
export interface BookingNotification {
  id: string;
  bookingId: string;
  title: string;
  content: string;
  memberName: string;
  memberPhone: string;
  stationId: number;
  date: string;
  startTime: string;
  endTime: string;
  read: boolean;
  createdAt: string;
}
