# 微信小程序迁移指南

## 一、环境准备

### 1. 安装 Taro 脚手架
```bash
# 全局安装 Taro 开发工具
npm install -g @tarojs/cli

# 创建新项目（选择 React + TypeScript）
taro init cycling-booking-weapp
# 选择：React、TypeScript、Sass、Webpack5、微信
```

### 2. 项目结构
```
cycling-booking-weapp/
├── src/
│   ├── components/       # 公共组件
│   ├── pages/           # 页面
│   │   ├── index/       # 首页（预约页面）
│   │   ├── my-bookings/ # 我的预约
│   │   ├── admin/       # 管理后台
│   │   └── profile/     # 个人中心
│   ├── utils/           # 工具函数
│   ├── services/        # API 服务
│   ├── hooks/           # 自定义 Hooks
│   ├── app.config.ts    # 全局配置
│   ├── app.tsx          # 入口
│   └── app.scss         # 全局样式
├── cloud/               # 微信云开发
│   └── functions/       # 云函数
└── project.config.json  # 小程序配置
```

## 二、Supabase 迁移方案

### 方案 A：微信云开发（推荐）
将 Supabase 数据迁移到微信云开发的云数据库

**云函数示例：**
```typescript
// cloud/functions/bookings/index.ts
const cloud = require('wx-server-sdk');
cloud.init();
const db = cloud.database();

exports.main = async (event, context) => {
  const { action, data } = event;
  
  switch (action) {
    case 'getBookings':
      return await db.collection('bookings')
        .where({ date: data.date })
        .get();
    case 'createBooking':
      return await db.collection('bookings').add({ data });
    // ...
  }
};
```

### 方案 B：继续使用 Supabase
小程序直接访问 Supabase（需要配置 CORS）

```typescript
// src/services/supabase.ts
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://your-project.supabase.co',
  'your-anon-key'
);

export const api = {
  getBookings: async (date?: string) => {
    let query = supabase.from('bookings').select('*');
    if (date) query = query.eq('date', date);
    const { data } = await query;
    return data;
  }
};
```

## 三、组件迁移对照表

| Web 组件 | 小程序组件 | 替代方案 |
|---------|-----------|---------|
| `<div>` | `<View>` | Taro 的 View |
| `<span>`/`<p>` | `<Text>` | Taro 的 Text |
| `<input>` | `<Input>` | @tarojs/components |
| `<button>` | `<Button>` | @tarojs/components |
| `<img>` | `<Image>` | @tarojs/components |
| Lucide 图标 | 自定义/Icon 组件 | 使用小程序图标 |
| Tailwind | 小程序 WXSS | 需要重写样式 |
| Radix UI | 小程序组件 | 使用 Taro UI |
| Recharts | 小程序图表 | 使用 echarts-for-weixin |

## 四、关键代码迁移

### 1. 页面配置
```typescript
// src/pages/index/index.config.ts
export default {
  navigationBarTitleText: '骑行预约',
  navigationBarBackgroundColor: '#f97316',
  navigationBarTextStyle: 'white',
  enablePullDownRefresh: true,
  backgroundTextStyle: 'dark'
};
```

### 2. 首页迁移
```tsx
// src/pages/index/index.tsx
import { useState, useEffect } from 'react';
import { View, Text, Button, ScrollView } from '@tarojs/components';
import Taro from '@tarojs/taro';

export default function Index() {
  const [formData, setFormData] = useState({
    date: '',
    startTime: '',
    duration: 1,
    stationId: null as number | null,
    memberName: '',
    memberPhone: '',
    notes: ''
  });

  // 获取用户信息
  useEffect(() => {
    Taro.getUserProfile({
      desc: '用于完善会员资料',
      success: (res) => {
        console.log(res.userInfo);
      }
    });
  }, []);

  // 提交预约
  const submitBooking = async () => {
    try {
      const { result } = await Taro.cloud.callFunction({
        name: 'bookings',
        data: {
          action: 'createBooking',
          data: formData
        }
      });
      
      if (result.success) {
        Taro.showToast({ title: '预约成功', icon: 'success' });
      }
    } catch (err) {
      Taro.showToast({ title: '预约失败', icon: 'none' });
    }
  };

  return (
    <View className='container'>
      {/* 日期选择 */}
      <DateSelector 
        selectedDate={formData.date}
        onSelect={(date) => setFormData({ ...formData, date })}
      />
      
      {/* 时间选择 */}
      <TimeSelector
        selectedTime={formData.startTime}
        onSelect={(time) => setFormData({ ...formData, startTime: time })}
      />
      
      {/* 骑行台选择 */}
      <StationSelector
        selectedStation={formData.stationId}
        onSelect={(id) => setFormData({ ...formData, stationId: id })}
        selectedDate={formData.date}
        selectedTime={formData.startTime}
        duration={formData.duration}
      />
      
      {/* 表单 */}
      <View className='form-section'>
        <Input
          placeholder='姓名'
          value={formData.memberName}
          onInput={(e) => setFormData({ ...formData, memberName: e.detail.value })}
        />
        <Input
          placeholder='手机号'
          type='number'
          value={formData.memberPhone}
          onInput={(e) => setFormData({ ...formData, memberPhone: e.detail.value })}
        />
      </View>
      
      {/* 提交按钮 */}
      <Button 
        type='primary' 
        onClick={submitBooking}
        className='submit-btn'
      >
        立即预约
      </Button>
    </View>
  );
}
```

### 3. 样式迁移
```scss
// src/pages/index/index.scss
.container {
  padding: 20rpx;
  background-color: #f5f5f5;
  min-height: 100vh;
}

.form-section {
  background: #fff;
  border-radius: 16rpx;
  padding: 30rpx;
  margin-bottom: 20rpx;
}

.submit-btn {
  background: linear-gradient(135deg, #f97316, #ef4444);
  color: #fff;
  border-radius: 40rpx;
  margin-top: 40rpx;
}
```

## 五、云开发数据库设计

```javascript
// cloud/database/bookings.json
{
  "bookings": {
    "_id": "String",          // 自动生成的 ID
    "date": "String",         // 日期 YYYY-MM-DD
    "startTime": "String",    // 开始时间 HH:MM
    "endTime": "String",      // 结束时间 HH:MM
    "stationId": "Number",    // 骑行台 ID
    "memberName": "String",   // 会员姓名
    "memberPhone": "String",  // 手机号
    "notes": "String",        // 备注
    "status": "String",       // confirmed/cancelled
    "createdAt": "Date",      // 创建时间
    "_openid": "String"       // 用户 openid（自动）
  }
}

// cloud/database/config.json
{
  "config": {
    "_id": "String",
    "pricePerHour": "Number",
    "stations": "Array",      // 骑行台配置
    "bikeModels": "Array",    // 车型配置
    "businessHours": "Object",// 营业时间
    "announcements": "Array"  // 公告
  }
}

// cloud/database/users.json
{
  "users": {
    "_openid": "String",      // 微信 openid
    "nickname": "String",     // 昵称
    "avatarUrl": "String",    // 头像
    "phone": "String",        // 手机号
    "createdAt": "Date",
    "lastLoginAt": "Date"
  }
}
```

## 六、需要重写/适配的功能

### 1. 图表（数据分析）
```bash
# 安装 echarts-for-weixin
npm install echarts-for-weixin
```

```tsx
// 使用 echarts
import { EChart } from 'echarts-for-weixin';

<EChart option={chartOption} />
```

### 2. 消息通知
- 使用微信小程序的 **订阅消息** 替代 Server 酱
- 在管理后台发送订阅消息给用户

### 3. 实时数据
- 使用云开发的 **实时数据推送**
- 或使用轮询方案

### 4. 手机号登录
- 使用 `button` 组件的 `open-type="getPhoneNumber"`
- 调用云函数解密手机号

```tsx
<Button 
  openType="getPhoneNumber" 
  onGetPhoneNumber={getPhoneNumber}
>
  手机号登录
</Button>

const getPhoneNumber = async (e) => {
  const { code } = e.detail;
  // 调用云函数获取手机号
  const { result } = await Taro.cloud.callFunction({
    name: 'getPhoneNumber',
    data: { code }
  });
};
```

## 七、开发检查清单

- [ ] Taro 项目初始化
- [ ] 云开发环境配置
- [ ] 数据库集合创建
- [ ] 云函数部署
- [ ] 页面逐个迁移
- [ ] 样式适配（rpx）
- [ ] 接口测试
- [ ] 真机测试
- [ ] 提交审核

## 八、预计工作量

| 模块 | 工作量 | 说明 |
|------|--------|------|
| 基础框架搭建 | 1 天 | Taro + 云开发配置 |
| 云函数开发 | 2 天 | 数据层迁移 |
| 页面迁移 | 3-4 天 | 5 个主要页面 |
| 样式重构 | 2 天 | WXSS 重写 |
| 测试优化 | 2 天 | 真机测试 |
| **总计** | **10-12 天** | 1 个开发人员 |

## 九、参考资料

- [Taro 官方文档](https://taro.zone/)
- [微信云开发文档](https://developers.weixin.qq.com/miniprogram/dev/wxcloud/basis/getting-started.html)
- [微信小程序设计指南](https://developers.weixin.qq.com/miniprogram/design/)

---

需要我帮你开始迁移的具体步骤吗？比如先创建 Taro 项目结构和云函数？