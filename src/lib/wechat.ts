// 微信工具函数

// 检测是否在微信浏览器
export const isWechatBrowser = (): boolean => {
  if (typeof window === 'undefined') return false;
  const ua = window.navigator.userAgent.toLowerCase();
  return ua.includes('micromessenger');
};

// 微信用户信息
export interface WechatUserInfo {
  openid?: string;
  nickname: string;
  avatarUrl: string;
  phone?: string;
  loginTime: string;
}

const USER_INFO_KEY = 'cycling_user_info';

// 获取存储的用户信息
export const getStoredUserInfo = (): WechatUserInfo | null => {
  if (typeof window === 'undefined') return null;
  try {
    const data = localStorage.getItem(USER_INFO_KEY);
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
};

// 保存用户信息
export const saveUserInfo = (userInfo: WechatUserInfo): void => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(USER_INFO_KEY, JSON.stringify(userInfo));
  } catch {
    // ignore
  }
};

// 清除用户信息
export const clearUserInfo = (): void => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(USER_INFO_KEY);
  } catch {
    // ignore
  }
};

// 生成随机昵称（微信风格）
export const generateRandomNickname = (): string => {
  const prefixes = ['骑行', '单车', '运动', '健身', '活力'];
  const suffixes = ['达人', '爱好者', '骑士', '骑手', '健将'];
  const randomNum = Math.floor(Math.random() * 10000);
  const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
  const suffix = suffixes[Math.floor(Math.random() * suffixes.length)];
  return `微信${prefix}${suffix}${randomNum}`;
};

// 模拟获取微信用户信息（简化版）
// 实际项目中需要调用 wx.login 和 wx.getUserProfile
export const mockWechatLogin = (): WechatUserInfo => {
  const nickname = generateRandomNickname();
  // 使用随机头像
  const avatarUrl = `https://api.dicebear.com/7.x/avataaars/svg?seed=${nickname}`;
  
  const userInfo: WechatUserInfo = {
    nickname,
    avatarUrl,
    loginTime: new Date().toISOString(),
  };
  
  saveUserInfo(userInfo);
  return userInfo;
};

// 初始化微信 JS-SDK（需要后端配合获取签名）
export const initWechatSDK = async (config: {
  appId: string;
  timestamp: string;
  nonceStr: string;
  signature: string;
}): Promise<boolean> => {
  if (!isWechatBrowser()) return false;
  
  return new Promise((resolve) => {
    // 动态加载微信 JS-SDK
    if (!(window as Record<string, unknown>).wx) {
      const script = document.createElement('script');
      script.src = 'https://res.wx.qq.com/open/js/jweixin-1.6.0.js';
      script.onload = () => {
        configureWX(config, resolve);
      };
      script.onerror = () => resolve(false);
      document.head.appendChild(script);
    } else {
      configureWX(config, resolve);
    }
  });
};

// 配置微信 JS-SDK
interface WechatConfig {
  appId: string;
  timestamp: string;
  nonceStr: string;
  signature: string;
}

const configureWX = (config: WechatConfig, callback: (success: boolean) => void) => {
  const wx = (window as Record<string, unknown>).wx as Record<string, ((...args: unknown[]) => void) | unknown>;
  if (!wx) {
    callback(false);
    return;
  }
  
  wx.config({
    debug: false,
    appId: config.appId,
    timestamp: config.timestamp,
    nonceStr: config.nonceStr,
    signature: config.signature,
    jsApiList: ['updateAppMessageShareData', 'updateTimelineShareData', 'getUserProfile'],
  });
  
  wx.ready(() => {
    callback(true);
  });
  
  wx.error(() => {
    callback(false);
  });
};

// 获取微信用户信息（需要用户点击触发）
export const getWechatUserProfile = (): Promise<WechatUserInfo | null> => {
  return new Promise((resolve) => {
    const wx = (window as any).wx;
    if (!wx) {
      resolve(null);
      return;
    }
    
    // 注意：wx.getUserProfile 需要用户点击触发
    wx.getUserProfile({
      desc: '用于完善会员资料',
      success: (res: { userInfo: { nickName: string; avatarUrl: string } }) => {
        const userInfo: WechatUserInfo = {
          nickname: res.userInfo.nickName,
          avatarUrl: res.userInfo.avatarUrl,
          loginTime: new Date().toISOString(),
        };
        saveUserInfo(userInfo);
        resolve(userInfo);
      },
      fail: () => {
        resolve(null);
      },
    });
  });
};
