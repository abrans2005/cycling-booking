import { describe, it, expect } from 'vitest'

/**
 * 日期工具函数测试
 * 
 * 测试命名规范: should [expected behavior] when [condition]
 * 例如: should return true when date is today
 */

// 简单的日期格式化函数
export function formatDate(date: Date): string {
  const month = date.getMonth() + 1
  const day = date.getDate()
  const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
  const weekday = weekdays[date.getDay()]
  return `${month}月${day}日 ${weekday}`
}

// 判断是否为今天
export function isToday(date: Date): boolean {
  const today = new Date()
  return date.toDateString() === today.toDateString()
}

// 计算两个时间的差值（小时）
export function calculateDuration(startTime: string, endTime: string): number {
  const [sh, sm] = startTime.split(':').map(Number)
  const [eh, em] = endTime.split(':').map(Number)
  return ((eh * 60 + em) - (sh * 60 + sm)) / 60
}

// ==================== 测试用例 ====================

describe('formatDate', () => {
  it('should format date correctly', () => {
    const date = new Date('2024-03-15') // 周五
    expect(formatDate(date)).toBe('3月15日 周五')
  })

  it('should handle month and day without leading zero', () => {
    const date = new Date('2024-01-05') // 周五
    expect(formatDate(date)).toBe('1月5日 周五')
  })
})

describe('isToday', () => {
  it('should return true when date is today', () => {
    const today = new Date()
    expect(isToday(today)).toBe(true)
  })

  it('should return false when date is yesterday', () => {
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    expect(isToday(yesterday)).toBe(false)
  })

  it('should return false when date is tomorrow', () => {
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    expect(isToday(tomorrow)).toBe(false)
  })
})

describe('calculateDuration', () => {
  it('should calculate duration correctly for same hour', () => {
    expect(calculateDuration('09:00', '09:30')).toBe(0.5)
  })

  it('should calculate duration correctly for different hours', () => {
    expect(calculateDuration('09:00', '11:00')).toBe(2)
  })

  it('should calculate duration correctly with minutes', () => {
    expect(calculateDuration('09:15', '11:45')).toBe(2.5)
  })

  it('should return negative when end time is before start time', () => {
    expect(calculateDuration('11:00', '09:00')).toBe(-2)
  })
})
