import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/supabase';
import { APP_VERSION } from '@/lib/version';

export function DebugInfo() {
  const [envInfo, setEnvInfo] = useState({
    url: 'checking...',
    key: 'checking...',
  });
  const [connectionTest, setConnectionTest] = useState<string>('未测试');
  const [bookingCount, setBookingCount] = useState<number | null>(null);
  const [error, setError] = useState<string>('');
  const [showDetails, setShowDetails] = useState(false);

  const testConnection = useCallback(async () => {
    setConnectionTest('测试中...');
    setError('');
    setBookingCount(null);
    try {
      // 测试获取今天的预约
      const today = new Date().toISOString().split('T')[0];
      const bookings = await api.getBookings(today);
      setBookingCount(bookings.length);
      setConnectionTest('✅ 云端连接正常');
      console.log('[DebugInfo] 今日预约数:', bookings.length);
    } catch (err: unknown) {
      setConnectionTest('❌ 连接失败');
      setError(err instanceof Error ? err.message : String(err));
      console.error('[DebugInfo] Connection test failed:', err);
    }
  }, []);

  useEffect(() => {
    // 检查环境变量
    const url = import.meta.env.VITE_SUPABASE_URL;
    const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
    
    // 延迟状态更新到下一个事件循环，避免 React 19 级联渲染警告
    const timer = setTimeout(() => {
      setEnvInfo({
        url: url ? `✅ 已设置` : '❌ 未设置',
        key: key ? `✅ 已设置` : '❌ 未设置',
      });
      
      // 自动测试连接
      testConnection();
    }, 0);
    
    return () => clearTimeout(timer);
  }, [testConnection]);

  return (
    <div className="fixed bottom-4 right-4 bg-green-50 border border-green-300 p-3 rounded-lg shadow-lg z-50 max-w-xs">
      <div 
        className="flex items-center justify-between cursor-pointer"
        onClick={() => setShowDetails(!showDetails)}
      >
        <div>
          <h3 className="font-bold text-green-800 text-sm">☁️ 云端模式 v{APP_VERSION}</h3>
          <p className="text-xs text-green-600">{connectionTest}</p>
        </div>
        <span className="text-green-600 text-xs">{showDetails ? '▲' : '▼'}</span>
      </div>
      
      {showDetails && (
        <div className="text-xs space-y-1 text-green-700 mt-2 pt-2 border-t border-green-200">
          <p><strong>环境变量:</strong> {envInfo.url} / {envInfo.key}</p>
          <p><strong>今日预约:</strong> {bookingCount !== null ? `${bookingCount} 条` : '未获取'}</p>
          {error && <p className="text-red-600">❌ {error}</p>}
          <button
            onClick={(e) => { e.stopPropagation(); testConnection(); }}
            className="mt-2 px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600 w-full"
          >
            刷新数据
          </button>
          <p className="text-[10px] text-gray-500 mt-2">
            如果数据不同步，请检查另一设备是否显示相同预约数
          </p>
        </div>
      )}
    </div>
  );
}
