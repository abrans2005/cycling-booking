import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { DurationSelector } from '../DurationSelector'

/**
 * DurationSelector 真实组件测试
 */

describe('DurationSelector', () => {
  it('should render title correctly', () => {
    render(<DurationSelector duration={1} onSelectDuration={() => {}} />)
    
    expect(screen.getByText('选择时长')).toBeInTheDocument()
  })

  it('should render all duration options', () => {
    render(<DurationSelector duration={1} onSelectDuration={() => {}} />)
    
    // 检查所有时长选项
    expect(screen.getByText('1小时')).toBeInTheDocument()
    expect(screen.getByText('1.5小时')).toBeInTheDocument()
    expect(screen.getByText('2小时')).toBeInTheDocument()
    expect(screen.getByText('2.5小时')).toBeInTheDocument()
    expect(screen.getByText('3小时')).toBeInTheDocument()
  })

  it('should highlight selected duration', () => {
    render(<DurationSelector duration={2} onSelectDuration={() => {}} />)
    
    // 获取所有按钮
    const buttons = screen.getAllByRole('button')
    
    // 找到选中的按钮（2小时）
    const selectedButton = buttons.find(btn => btn.textContent === '2小时')
    expect(selectedButton).toHaveClass('border-orange-500', 'bg-orange-50')
    
    // 其他按钮不应该有选中样式
    const unselectedButton = buttons.find(btn => btn.textContent === '1小时')
    expect(unselectedButton).toHaveClass('border-gray-200', 'bg-white')
  })

  it('should call onSelectDuration when clicking a different option', async () => {
    const mockOnSelect = vi.fn()
    const user = userEvent.setup()
    
    render(<DurationSelector duration={1} onSelectDuration={mockOnSelect} />)
    
    // 点击 2 小时按钮
    const twoHourButton = screen.getByText('2小时')
    await user.click(twoHourButton)
    
    expect(mockOnSelect).toHaveBeenCalledTimes(1)
    expect(mockOnSelect).toHaveBeenCalledWith(2)
  })

  it('should call onSelectDuration with correct value for each option', async () => {
    const mockOnSelect = vi.fn()
    const user = userEvent.setup()
    
    render(<DurationSelector duration={1} onSelectDuration={mockOnSelect} />)
    
    // 测试点击不同的时长
    await user.click(screen.getByText('1.5小时'))
    expect(mockOnSelect).toHaveBeenLastCalledWith(1.5)
    
    await user.click(screen.getByText('2.5小时'))
    expect(mockOnSelect).toHaveBeenLastCalledWith(2.5)
    
    await user.click(screen.getByText('3小时'))
    expect(mockOnSelect).toHaveBeenLastCalledWith(3)
  })

  it('should have correct number of buttons', () => {
    render(<DurationSelector duration={1} onSelectDuration={() => {}} />)
    
    const buttons = screen.getAllByRole('button')
    expect(buttons).toHaveLength(5) // 5 个时长选项
  })
})
