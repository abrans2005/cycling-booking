-- 骑行预约系统数据库初始化脚本
-- 在 Supabase SQL Editor 中执行

-- 1. 创建预约表
CREATE TABLE IF NOT EXISTS bookings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  date DATE NOT NULL,
  start_time TEXT NOT NULL,
  end_time TEXT NOT NULL,
  station_id INTEGER NOT NULL,
  member_name TEXT NOT NULL,
  member_phone TEXT NOT NULL,
  notes TEXT DEFAULT '',
  status TEXT DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. 创建用户表
CREATE TABLE IF NOT EXISTS users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  phone TEXT UNIQUE NOT NULL,
  nickname TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_login_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. 创建系统配置表
CREATE TABLE IF NOT EXISTS config (
  id INTEGER PRIMARY KEY DEFAULT 1,
  price_per_hour INTEGER DEFAULT 100,
  stations JSONB DEFAULT '[
    {"stationId": 1, "bikeModelId": "stages", "status": "available", "name": "1号骑行台"},
    {"stationId": 2, "bikeModelId": "stages", "status": "available", "name": "2号骑行台"},
    {"stationId": 3, "bikeModelId": "neo", "status": "available", "name": "3号骑行台"},
    {"stationId": 4, "bikeModelId": "neo", "status": "available", "name": "4号骑行台"}
  ]'::jsonb,
  bike_models JSONB DEFAULT '[
    {"id": "stages", "name": "Stages Bike", "description": "专业功率训练骑行台"},
    {"id": "neo", "name": "Neo Bike", "description": "智能模拟骑行台"}
  ]'::jsonb,
  server_chan_key TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 插入默认配置
INSERT INTO config (id) VALUES (1) ON CONFLICT (id) DO NOTHING;

-- 4. 创建验证码表
CREATE TABLE IF NOT EXISTS sms_codes (
  phone TEXT PRIMARY KEY,
  code TEXT NOT NULL,
  expire_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. 启用 Realtime（用于消息通知）
-- 首先检查 publication 是否存在
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime'
  ) THEN
    CREATE PUBLICATION supabase_realtime;
  END IF;
END
$$;

-- 将 bookings 表添加到 realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE bookings;

-- 6. 设置 RLS (Row Level Security) 策略
-- 允许匿名用户读取所有数据
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE config ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- 创建策略：允许所有操作（简化版，适合内部使用）
CREATE POLICY "Allow all" ON bookings FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON config FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON users FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON sms_codes FOR ALL USING (true) WITH CHECK (true);

-- 7. 创建索引优化查询
CREATE INDEX IF NOT EXISTS idx_bookings_date ON bookings(date);
CREATE INDEX IF NOT EXISTS idx_bookings_station ON bookings(station_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone);

-- 完成
SELECT '数据库初始化完成！' AS message;
