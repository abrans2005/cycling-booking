// 版本信息 - 每次重大更新时修改
export const APP_VERSION = '2.0.0-cloud';
export const APP_BUILD_TIME = new Date().toISOString();

// 检测是否为云端模式
export const isCloudMode = true; // 强制云端模式

console.log(`[App Version] ${APP_VERSION} - Build: ${APP_BUILD_TIME}`);
