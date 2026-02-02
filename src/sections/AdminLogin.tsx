import { useState } from 'react';
import { Bike, Lock, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

interface AdminLoginProps {
  onLogin: () => void;
}

// 默认管理员密码（实际使用时应从环境变量或后端获取）
const ADMIN_PASSWORD = 'cycling2024';

export function AdminLogin({ onLogin }: AdminLoginProps) {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // 模拟验证延迟
    setTimeout(() => {
      if (password === ADMIN_PASSWORD) {
        // 保存登录状态到 sessionStorage
        sessionStorage.setItem('admin_logged_in', 'true');
        onLogin();
      } else {
        setError('密码错误');
      }
      setLoading(false);
    }, 500);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-500 via-orange-400 to-red-500 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
        {/* Logo */}
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-gradient-to-r from-orange-500 to-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <Bike className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-xl font-bold text-gray-800">管理后台</h1>
          <p className="text-sm text-gray-500 mt-1">骑行工作室预约系统</p>
        </div>

        {/* 登录表单 */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="password" className="text-sm text-gray-600">
              管理员密码
            </Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="请输入密码"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={cn(
                  'pl-10 pr-10',
                  error && 'border-red-500 focus-visible:ring-red-500'
                )}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
            {error && (
              <p className="text-xs text-red-500">{error}</p>
            )}
          </div>

          <Button
            type="submit"
            disabled={loading || !password}
            className={cn(
              'w-full py-6 text-base font-medium rounded-xl',
              'bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white'
            )}
          >
            {loading ? '验证中...' : '登录'}
          </Button>
        </form>

        {/* 提示 */}
        <div className="mt-6 p-3 bg-orange-50 rounded-lg">
          <p className="text-xs text-orange-700 text-center">
            默认密码：<span className="font-mono font-medium">cycling2024</span>
          </p>
          <p className="text-xs text-orange-600 text-center mt-1">
            首次使用后请及时修改
          </p>
        </div>

        {/* 返回预约页面 */}
        <button
          onClick={() => window.location.href = '/'}
          className="w-full mt-4 text-sm text-gray-500 hover:text-orange-500 transition-colors"
        >
          返回预约页面
        </button>
      </div>
    </div>
  );
}
