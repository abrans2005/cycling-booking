import { useState, useEffect, useCallback } from 'react';
import type { WechatUserInfo } from '@/lib/wechat';
import {
  getStoredUserInfo,
  saveUserInfo,
  clearUserInfo,
  isWechatBrowser,
  mockWechatLogin,
  getWechatUserProfile,
} from '@/lib/wechat';

export interface UseUserReturn {
  userInfo: WechatUserInfo | null;
  isLoggedIn: boolean;
  isWechat: boolean;
  loading: boolean;
  login: () => Promise<void>;
  loginWithWechat: () => Promise<void>;
  logout: () => void;
  updateUserInfo: (updates: Partial<WechatUserInfo>) => void;
}

export const useUser = (): UseUserReturn => {
  const [userInfo, setUserInfo] = useState<WechatUserInfo | null>(null);
  const [loading, setLoading] = useState(true);

  // 初始化时从本地存储加载
  useEffect(() => {
    const stored = getStoredUserInfo();
    setUserInfo(stored);
    setLoading(false);
  }, []);

  // 模拟登录（生成随机用户信息）
  const login = useCallback(async () => {
    setLoading(true);
    try {
      const userInfo = mockWechatLogin();
      setUserInfo(userInfo);
    } finally {
      setLoading(false);
    }
  }, []);

  // 微信登录（尝试获取真实微信用户信息）
  const loginWithWechat = useCallback(async () => {
    setLoading(true);
    try {
      // 尝试获取真实微信用户信息
      const wxUser = await getWechatUserProfile();
      if (wxUser) {
        setUserInfo(wxUser);
      } else {
        // 如果获取失败，使用模拟登录
        const userInfo = mockWechatLogin();
        setUserInfo(userInfo);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  // 退出登录
  const logout = useCallback(() => {
    clearUserInfo();
    setUserInfo(null);
  }, []);

  // 更新用户信息
  const updateUserInfo = useCallback((updates: Partial<WechatUserInfo>) => {
    setUserInfo((prev) => {
      if (!prev) return prev;
      const updated = { ...prev, ...updates };
      saveUserInfo(updated);
      return updated;
    });
  }, []);

  return {
    userInfo,
    isLoggedIn: !!userInfo,
    isWechat: isWechatBrowser(),
    loading,
    login,
    loginWithWechat,
    logout,
    updateUserInfo,
  };
};
