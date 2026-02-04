import { useState, useEffect } from 'react';
import { api } from '@/lib/supabase';

export function DebugInfo() {
  const [envInfo, setEnvInfo] = useState({
    url: 'checking...',
    key: 'checking...',
  });
  const [connectionTest, setConnectionTest] = useState<string>('未测试');
  const [error, setError] = useState<string>('');

  useEffect(() => {
    // 检查环境变量
    const url = import.meta.env.VITE_SUPABASE_URL;
    const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
    
    setEnvInfo({
      url: url ? `${url.substring(0, 20)}... (${url.length} chars)` : '❌ 未设置',
      key: key ? `${key.substring(0, 20)}... (${key.length} chars)` : '❌ 未设置',
    });
  }, []);

  const testConnection = async () => {
    setConnectionTest('测试中...');
    setError('');
    try {
      // 测试获取配置
      const config = await api.getConfig();
      setConnectionTest('✅ 连接成功');
      console.log('Config:', config);
    } catch (err: any) {
      setConnectionTest('❌ 连接失败');
      setError(err.message || String(err));
      console.error('Connection test failed:', err);
    }
  };

  // 只在开发环境或管理员模式显示
  const isDev = import.meta.env.DEV;
  if (!isDev) return null;

  return (
    <div className="fixed bottom-4 right-4 bg-yellow-50 border border-yellow-300 p-4 rounded-lg shadow-lg z-50 max-w-sm">
      <h3 className="font-bold text-yellow-800 mb-2">🔧 调试信息</h3>
      <div className="text-xs space-y-1 text-yellow-700">
        <p><strong>VITE_SUPABASE_URL:</strong> {envInfo.url}</p>
        <p><strong>VITE_SUPABASE_KEY:</strong> {envInfo.key}</p>
        <p><strong>连接测试:</strong> {connectionTest}</p>
        {error && <p className="text-red-600">错误: {error}</p>}
      </div>
      <button
        onClick={testConnection}
        className="mt-2 px-3 py-1 bg-yellow-500 text-white text-xs rounded hover:bg-yellow-600"
      >
        测试连接
      </button>
    </div>
  );
}
