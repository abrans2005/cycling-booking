import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

/**
 * 组件测试示例：时长选择器
 * 
 * 测试原则：
 * 1. 测试组件的行为，而不是实现细节
 * 2. 从用户角度思考：用户能看到什么、能点击什么
 * 3. 不要测试第三方库的内部逻辑
 */

// 简化版的 DurationSelector 组件（用于演示）
interface DurationSelectorProps {
  duration: number
  onSelectDuration: (duration: number) => void
}

function DurationSelector({ duration, onSelectDuration }: DurationSelectorProps) {
  const options = [0.5, 1, 1.5, 2, 2.5, 3]
  
  return (
    <div className="duration-selector">
      <h3>选择时长</h3>
      <div className="options" role="radiogroup" aria-label="选择预约时长">
        {options.map((option) => (
          <button
            key={option}
            role="radio"
            aria-checked={duration === option}
            className={`option ${duration === option ? 'selected' : ''}`}
            onClick={() => onSelectDuration(option)}
          >
            {option} 小时
          </button>
        ))}
      </div>
      <p className="current-selection">已选择: {duration} 小时</p>
    </div>
  )
}

// ==================== 测试用例 ====================

describe('DurationSelector', () => {
  it('should render all duration options', () => {
    render(<DurationSelector duration={1} onSelectDuration={() => {}} />)
    
    // 检查是否显示了所有选项
    expect(screen.getByRole('radio', { name: '0.5 小时' })).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: '1 小时' })).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: '1.5 小时' })).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: '2 小时' })).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: '2.5 小时' })).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: '3 小时' })).toBeInTheDocument()
  })

  it('should mark current duration as selected', () => {
    render(<DurationSelector duration={2} onSelectDuration={() => {}} />)
    
    // 检查当前选中的时长
    expect(screen.getByRole('radio', { name: '2 小时' })).toHaveAttribute('aria-checked', 'true')
    expect(screen.getByRole('radio', { name: '1 小时' })).toHaveAttribute('aria-checked', 'false')
  })

  it('should display current selection text', () => {
    render(<DurationSelector duration={1.5} onSelectDuration={() => {}} />)
    
    expect(screen.getByText('已选择: 1.5 小时')).toBeInTheDocument()
  })

  it('should call onSelectDuration when clicking a different option', async () => {
    const mockOnSelect = vi.fn()
    const user = userEvent.setup()
    
    render(<DurationSelector duration={1} onSelectDuration={mockOnSelect} />)
    
    // 点击 2 小时选项
    await user.click(screen.getByRole('radio', { name: '2 小时' }))
    
    // 验证回调被调用
    expect(mockOnSelect).toHaveBeenCalledTimes(1)
    expect(mockOnSelect).toHaveBeenCalledWith(2)
  })

  it('should call onSelectDuration when clicking the same option', async () => {
    const mockOnSelect = vi.fn()
    const user = userEvent.setup()
    
    render(<DurationSelector duration={1} onSelectDuration={mockOnSelect} />)
    
    // 点击已选中的选项
    await user.click(screen.getByRole('radio', { name: '1 小时' }))
    
    // 验证回调仍然被调用
    expect(mockOnSelect).toHaveBeenCalledWith(1)
  })
})
