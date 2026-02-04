import { useState, useEffect } from 'react';
import { api } from '@/lib/supabase';

export function DebugInfo() {
  const [envInfo, setEnvInfo] = useState({
    url: 'checking...',
    key: 'checking...',
  });
  const [connectionTest, setConnectionTest] = useState<string>('未测试');
  const [error, setError] = useState<string>('');
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    // 检查环境变量
    const url = import.meta.env.VITE_SUPABASE_URL;
    const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
    
    setEnvInfo({
      url: url ? `✅ 已设置 (${url.length} chars)` : '❌ 未设置',
      key: key ? `✅ 已设置 (${key.length} chars)` : '❌ 未设置',
    });
    
    // 自动测试连接
    testConnection();
  }, []);

  const testConnection = async () => {
    setConnectionTest('测试中...');
    setError('');
    try {
      const config = await api.getConfig();
      setConnectionTest('✅ 云端连接正常');
      console.log('[DebugInfo] Config:', config);
    } catch (err: any) {
      setConnectionTest('❌ 连接失败');
      setError(err.message || String(err));
      console.error('[DebugInfo] Connection test failed:', err);
    }
  };

  return (
    <div className="fixed bottom-4 right-4 bg-blue-50 border border-blue-300 p-3 rounded-lg shadow-lg z-50 max-w-xs">
      <div 
        className="flex items-center justify-between cursor-pointer"
        onClick={() => setShowDetails(!showDetails)}
      >
        <h3 className="font-bold text-blue-800 text-sm">🔧 连接诊断</h3>
        <span className="text-blue-600 text-xs">{showDetails ? '▲' : '▼'}</span>
      </div>
      
      <div className="text-xs mt-2 text-blue-700">
        <p><strong>状态:</strong> {connectionTest}</p>
        {error && <p className="text-red-600 mt-1">{error}</p>}
      </div>
      
      {showDetails && (
        <div className="text-xs space-y-1 text-blue-600 mt-2 pt-2 border-t border-blue-200">
          <p><strong>SUPABASE_URL:</strong> {envInfo.url}</p>
          <p><strong>SUPABASE_KEY:</strong> {envInfo.key}</p>
          <button
            onClick={(e) => { e.stopPropagation(); testConnection(); }}
            className="mt-2 px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 w-full"
          >
            重新测试
          </button>
        </div>
      )}
    </div>
  );
}
