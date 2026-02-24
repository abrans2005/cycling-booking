import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

/**
 * 基础组件测试：Button
 */

interface ButtonProps {
  children: React.ReactNode
  onClick?: () => void
  disabled?: boolean
  variant?: 'primary' | 'secondary' | 'danger'
  type?: 'button' | 'submit' | 'reset'
}

function Button({ 
  children, 
  onClick, 
  disabled = false, 
  variant = 'primary',
  type = 'button'
}: ButtonProps) {
  const variantClasses = {
    primary: 'btn-primary',
    secondary: 'btn-secondary',
    danger: 'btn-danger',
  }
  
  return (
    <button
      type={type}
      className={`btn ${variantClasses[variant]}`}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  )
}

// ==================== 测试用例 ====================

describe('Button', () => {
  it('should render children correctly', () => {
    render(<Button>点击我</Button>)
    expect(screen.getByRole('button', { name: '点击我' })).toBeInTheDocument()
  })

  it('should call onClick when clicked', async () => {
    const handleClick = vi.fn()
    const user = userEvent.setup()
    
    render(<Button onClick={handleClick}>点击我</Button>)
    
    await user.click(screen.getByRole('button'))
    
    expect(handleClick).toHaveBeenCalledTimes(1)
  })

  it('should not call onClick when disabled', async () => {
    const handleClick = vi.fn()
    const user = userEvent.setup()
    
    render(<Button onClick={handleClick} disabled>点击我</Button>)
    
    await user.click(screen.getByRole('button'))
    
    expect(handleClick).not.toHaveBeenCalled()
    expect(screen.getByRole('button')).toBeDisabled()
  })

  it('should apply correct variant class', () => {
    const { rerender } = render(<Button variant="primary">主要按钮</Button>)
    expect(screen.getByRole('button')).toHaveClass('btn-primary')
    
    rerender(<Button variant="secondary">次要按钮</Button>)
    expect(screen.getByRole('button')).toHaveClass('btn-secondary')
    
    rerender(<Button variant="danger">危险按钮</Button>)
    expect(screen.getByRole('button')).toHaveClass('btn-danger')
  })

  it('should have correct button type', () => {
    render(<Button type="submit">提交</Button>)
    expect(screen.getByRole('button')).toHaveAttribute('type', 'submit')
  })
})
