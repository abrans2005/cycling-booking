import { useState, useEffect } from 'react';
import { Phone, Lock, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { api } from '@/lib/supabase';

interface PhoneLoginProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (phone: string, nickname?: string) => void;
}

export function PhoneLogin({ isOpen, onClose, onSuccess }: PhoneLoginProps) {
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [countdown, setCountdown] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState<'phone' | 'code'>('phone');

  // 倒计时
  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setTimeout(() => setCountdown(c => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown]);

  // 验证手机号
  const validatePhone = (phone: string): boolean => {
    const regex = /^1[3-9]\d{9}$/;
    return regex.test(phone);
  };

  // 发送验证码
  const handleSendCode = async () => {
    if (!validatePhone(phone)) {
      setError('请输入正确的手机号');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      const success = await api.sendSmsCode(phone);
      if (success) {
        setCountdown(60);
        setStep('code');
        // 提示用户
        alert(`验证码已发送！\n本次验证码为：查看浏览器控制台\n（实际项目中会发送到手机）`);
      } else {
        setError('发送失败，请重试');
      }
    } catch {
      setError('发送失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  // 登录
  const handleLogin = async () => {
    if (code.length !== 6) {
      setError('请输入6位验证码');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      const valid = await api.verifySmsCode(phone, code);
      if (valid) {
        // 获取或创建用户
        const user = await api.getOrCreateUser(phone);
        onSuccess(phone, user.nickname);
        onClose();
        // 重置状态
        setPhone('');
        setCode('');
        setStep('phone');
      } else {
        setError('验证码错误或已过期');
      }
    } catch {
      setError('登录失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  // 关闭时重置
  const handleClose = () => {
    onClose();
    setTimeout(() => {
      setPhone('');
      setCode('');
      setError('');
      setStep('phone');
      setCountdown(0);
    }, 300);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-sm p-6 animate-zoom-in">
        {/* 头部 */}
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-bold text-gray-800">
            {step === 'phone' ? '手机号登录' : '输入验证码'}
          </h3>
          <button onClick={handleClose} className="p-1 hover:bg-gray-100 rounded-full">
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* 步骤指示器 */}
        <div className="flex items-center gap-2 mb-6">
          <div className={cn('flex-1 h-1 rounded-full', step === 'phone' ? 'bg-orange-500' : 'bg-green-500')} />
          <div className={cn('flex-1 h-1 rounded-full', step === 'code' ? 'bg-orange-500' : 'bg-gray-200')} />
        </div>

        {/* 手机号输入 */}
        <div className="space-y-4">
          <div>
            <label className="text-sm text-gray-600 mb-1.5 block">手机号</label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                type="tel"
                placeholder="请输入手机号"
                value={phone}
                onChange={(e) => {
                  setPhone(e.target.value);
                  setError('');
                }}
                maxLength={11}
                disabled={step === 'code'}
                className={cn('pl-10', step === 'code' && 'bg-gray-50')}
              />
            </div>
          </div>

          {/* 验证码输入 */}
          {step === 'code' && (
            <div>
              <label className="text-sm text-gray-600 mb-1.5 block">验证码</label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    type="text"
                    placeholder="6位验证码"
                    value={code}
                    onChange={(e) => {
                      setCode(e.target.value.replace(/\D/g, '').slice(0, 6));
                      setError('');
                    }}
                    maxLength={6}
                    className="pl-10 text-center tracking-widest"
                  />
                </div>
                <Button
                  variant="outline"
                  onClick={handleSendCode}
                  disabled={countdown > 0 || loading}
                  className="whitespace-nowrap min-w-[100px]"
                >
                  {countdown > 0 ? `${countdown}s` : '重新发送'}
                </Button>
              </div>
              <p className="text-xs text-gray-400 mt-2">
                验证码已发送至 {phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2')}
              </p>
              <p className="text-xs text-orange-500 mt-1">
                💡 演示模式：查看浏览器控制台获取验证码
              </p>
            </div>
          )}

          {/* 错误提示 */}
          {error && (
            <p className="text-sm text-red-500 text-center">{error}</p>
          )}

          {/* 按钮 */}
          {step === 'phone' ? (
            <Button
              className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white"
              onClick={handleSendCode}
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                '获取验证码'
              )}
            </Button>
          ) : (
            <Button
              className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white"
              onClick={handleLogin}
              disabled={loading || code.length !== 6}
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                '登录'
              )}
            </Button>
          )}
        </div>

        {/* 提示 */}
        <p className="text-xs text-gray-400 text-center mt-4">
          未注册的手机号将自动创建账号
        </p>
      </div>
    </div>
  );
}
