import { describe, it, expect } from 'vitest'
import type { Booking } from '@/types'

/**
 * 预约业务逻辑测试
 */

// 计算预约收入
export function calculateRevenue(bookings: Booking[], pricePerHour: number): number {
  return bookings
    .filter(b => b.status === 'confirmed')
    .reduce((sum, b) => sum + calculateDuration(b.startTime, b.endTime) * pricePerHour, 0)
}

// 计算时长
function calculateDuration(startTime: string, endTime: string): number {
  const [sh, sm] = startTime.split(':').map(Number)
  const [eh, em] = endTime.split(':').map(Number)
  return ((eh * 60 + em) - (sh * 60 + sm)) / 60
}

// 检查时段是否可用
export function isTimeSlotAvailable(
  bookings: Booking[],
  date: string,
  startTime: string,
  endTime: string,
  stationId: number
): boolean {
  const conflictingBooking = bookings.find(b => {
    if (b.status !== 'confirmed') return false
    if (b.date !== date) return false
    if (b.stationId !== stationId) return false
    
    // 检查时间是否冲突
    const bStart = timeToMinutes(b.startTime)
    const bEnd = timeToMinutes(b.endTime)
    const newStart = timeToMinutes(startTime)
    const newEnd = timeToMinutes(endTime)
    
    return (newStart < bEnd && newEnd > bStart)
  })
  
  return !conflictingBooking
}

function timeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number)
  return h * 60 + m
}

// ==================== 测试用例 ====================

describe('calculateRevenue', () => {
  const mockBookings: Booking[] = [
    {
      id: '1',
      date: '2024-03-15',
      startTime: '09:00',
      endTime: '11:00',
      stationId: 1,
      memberName: '张三',
      memberPhone: '13800138000',
      status: 'confirmed',
      createdAt: '2024-03-10T10:00:00Z',
    },
    {
      id: '2',
      date: '2024-03-15',
      startTime: '14:00',
      endTime: '15:30',
      stationId: 2,
      memberName: '李四',
      memberPhone: '13800138001',
      status: 'confirmed',
      createdAt: '2024-03-10T11:00:00Z',
    },
    {
      id: '3',
      date: '2024-03-15',
      startTime: '16:00',
      endTime: '17:00',
      stationId: 1,
      memberName: '王五',
      memberPhone: '13800138002',
      status: 'cancelled', // 已取消，不应计入
      createdAt: '2024-03-10T12:00:00Z',
    },
  ]

  it('should calculate revenue for confirmed bookings only', () => {
    const revenue = calculateRevenue(mockBookings, 100)
    // 张三 2小时 + 李四 1.5小时 = 3.5小时 * 100 = 350
    expect(revenue).toBe(350)
  })

  it('should return 0 for empty bookings', () => {
    expect(calculateRevenue([], 100)).toBe(0)
  })

  it('should calculate with different price', () => {
    const revenue = calculateRevenue(mockBookings, 80)
    // 3.5小时 * 80 = 280
    expect(revenue).toBe(280)
  })
})

describe('isTimeSlotAvailable', () => {
  const existingBookings: Booking[] = [
    {
      id: '1',
      date: '2024-03-15',
      startTime: '09:00',
      endTime: '11:00',
      stationId: 1,
      memberName: '张三',
      memberPhone: '13800138000',
      status: 'confirmed',
      createdAt: '2024-03-10T10:00:00Z',
    },
  ]

  it('should return true when no conflict', () => {
    expect(
      isTimeSlotAvailable(existingBookings, '2024-03-15', '11:00', '12:00', 1)
    ).toBe(true)
  })

  it('should return false when time overlaps', () => {
    expect(
      isTimeSlotAvailable(existingBookings, '2024-03-15', '10:00', '12:00', 1)
    ).toBe(false)
  })

  it('should return true for different date', () => {
    expect(
      isTimeSlotAvailable(existingBookings, '2024-03-16', '09:00', '11:00', 1)
    ).toBe(true)
  })

  it('should return true for different station', () => {
    expect(
      isTimeSlotAvailable(existingBookings, '2024-03-15', '09:00', '11:00', 2)
    ).toBe(true)
  })

  it('should return true for cancelled booking conflict', () => {
    const cancelledBooking: Booking = {
      ...existingBookings[0],
      id: '2',
      status: 'cancelled',
    }
    expect(
      isTimeSlotAvailable([cancelledBooking], '2024-03-15', '09:00', '11:00', 1)
    ).toBe(true)
  })
})
