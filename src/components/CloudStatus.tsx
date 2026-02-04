import { useState, useEffect } from 'react';
import { api } from '@/lib/supabase';
import { APP_VERSION } from '@/lib/version';
import { Cloud, CloudOff, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';

export function CloudStatus() {
  const [status, setStatus] = useState<'checking' | 'online' | 'offline'>('checking');
  const [bookingCount, setBookingCount] = useState<number | null>(null);
  const [, setLastUpdate] = useState<string>('');

  const checkConnection = async () => {
    setStatus('checking');
    try {
      const today = new Date().toISOString().split('T')[0];
      const bookings = await api.getBookings(today);
      setBookingCount(bookings.length);
      setStatus('online');
      setLastUpdate(new Date().toLocaleTimeString());
    } catch (err) {
      setStatus('offline');
      console.error('[CloudStatus] Connection failed:', err);
    }
  };

  useEffect(() => {
    checkConnection();
    // 每30秒自动刷新
    const interval = setInterval(checkConnection, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex items-center gap-3 bg-white px-3 py-2 rounded-lg shadow-sm border">
      {/* 状态图标 */}
      <div className={cn(
        'flex items-center gap-1.5 text-xs font-medium',
        status === 'online' && 'text-green-600',
        status === 'offline' && 'text-red-600',
        status === 'checking' && 'text-gray-500'
      )}>
        {status === 'online' ? (
          <Cloud className="w-4 h-4" />
        ) : status === 'offline' ? (
          <CloudOff className="w-4 h-4" />
        ) : (
          <RefreshCw className="w-4 h-4 animate-spin" />
        )}
        <span>
          {status === 'online' ? '云端在线' : status === 'offline' ? '离线' : '检测中'}
        </span>
      </div>

      {/* 分隔线 */}
      <div className="w-px h-4 bg-gray-200" />

      {/* 预约数量 */}
      <div className="text-xs text-gray-600">
        今日预约: <span className="font-medium text-orange-600">{bookingCount ?? '-'}</span>
      </div>

      {/* 刷新按钮 */}
      <button
        onClick={checkConnection}
        disabled={status === 'checking'}
        className="p-1 hover:bg-gray-100 rounded transition-colors disabled:opacity-50"
        title="刷新数据"
      >
        <RefreshCw className={cn('w-3 h-3 text-gray-400', status === 'checking' && 'animate-spin')} />
      </button>

      {/* 版本号 */}
      <div className="hidden sm:block text-[10px] text-gray-400">
        v{APP_VERSION}
      </div>
    </div>
  );
}
