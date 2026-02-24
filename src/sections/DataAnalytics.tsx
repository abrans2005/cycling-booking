import { useState, useMemo } from 'react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
} from 'recharts';
import type { Booking, AppConfig } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  TrendingUp,
  Calendar,
  Bike,
  Clock,
  Users,
  DollarSign,
  ArrowLeft,
  Download,
} from 'lucide-react';
import { format, subDays, parseISO } from 'date-fns';

interface DataAnalyticsProps {
  bookings: Booking[];
  config: AppConfig;
  onBack: () => void;
}

type TimeRange = '7days' | '30days' | '90days' | 'thisYear' | 'all';

const COLORS = ['#f97316', '#22c55e', '#3b82f6', '#8b5cf6', '#ef4444', '#14b8a6'];

export function DataAnalytics({ bookings, config, onBack }: DataAnalyticsProps) {
  const [timeRange, setTimeRange] = useState<TimeRange>('30days');

  // 根据时间范围过滤预约
  const filteredBookings = useMemo(() => {
    const now = new Date();
    let startDate: Date;

    switch (timeRange) {
      case '7days':
        startDate = subDays(now, 7);
        break;
      case '30days':
        startDate = subDays(now, 30);
        break;
      case '90days':
        startDate = subDays(now, 90);
        break;
      case 'thisYear':
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
      case 'all':
      default:
        return bookings.filter(b => b.status === 'confirmed');
    }

    return bookings.filter(b => {
      const bookingDate = parseISO(b.date);
      return b.status === 'confirmed' && bookingDate >= startDate;
    });
  }, [bookings, timeRange]);

  // 核心指标
  const metrics = useMemo(() => {
    // 计算时长
    const calcDuration = (startTime: string, endTime: string) => {
      const [sh, sm] = startTime.split(':').map(Number);
      const [eh, em] = endTime.split(':').map(Number);
      return ((eh * 60 + em) - (sh * 60 + sm)) / 60;
    };

    // 计算收入
    const calcRevenue = (booking: Booking) => {
      return calcDuration(booking.startTime, booking.endTime) * config.pricePerHour;
    };

    const confirmed = filteredBookings;
    const totalRevenue = confirmed.reduce((sum, b) => sum + calcRevenue(b), 0);
    const totalHours = confirmed.reduce((sum, b) => sum + calcDuration(b.startTime, b.endTime), 0);
    const uniqueUsers = new Set(confirmed.map(b => b.memberPhone)).size;
    const avgOrderValue = confirmed.length > 0 ? totalRevenue / confirmed.length : 0;

    return {
      totalBookings: confirmed.length,
      totalRevenue,
      totalHours,
      uniqueUsers,
      avgOrderValue,
    };
  }, [filteredBookings, config.pricePerHour]);

  // 趋势数据（按日期）
  const trendData = useMemo(() => {
    // 计算时长和收入的辅助函数
    const calcDuration = (startTime: string, endTime: string) => {
      const [sh, sm] = startTime.split(':').map(Number);
      const [eh, em] = endTime.split(':').map(Number);
      return ((eh * 60 + em) - (sh * 60 + sm)) / 60;
    };
    const calcRevenue = (booking: Booking) => {
      return calcDuration(booking.startTime, booking.endTime) * config.pricePerHour;
    };

    const dateMap = new Map<string, { date: string; bookings: number; revenue: number; hours: number }>();

    // 初始化日期范围
    if (timeRange === '7days' || timeRange === '30days' || timeRange === '90days') {
      const days = timeRange === '7days' ? 7 : timeRange === '30days' ? 30 : 90;
      for (let i = days - 1; i >= 0; i--) {
        const date = format(subDays(new Date(), i), 'yyyy-MM-dd');
        dateMap.set(date, { date, bookings: 0, revenue: 0, hours: 0 });
      }
    }

    filteredBookings.forEach(booking => {
      const existing = dateMap.get(booking.date);
      const duration = calcDuration(booking.startTime, booking.endTime);
      const revenue = calcRevenue(booking);

      if (existing) {
        existing.bookings += 1;
        existing.revenue += revenue;
        existing.hours += duration;
      } else {
        dateMap.set(booking.date, {
          date: booking.date,
          bookings: 1,
          revenue,
          hours: duration,
        });
      }
    });

    return Array.from(dateMap.values())
      .sort((a, b) => a.date.localeCompare(b.date))
      .map(item => ({
        ...item,
        displayDate: format(parseISO(item.date), timeRange === '7days' ? 'MM-dd' : 'MM-dd'),
      }));
  }, [filteredBookings, timeRange, config.pricePerHour]);

  // 时段热度数据
  const hourlyData = useMemo(() => {
    // 计算收入的辅助函数
    const calcDuration = (startTime: string, endTime: string) => {
      const [sh, sm] = startTime.split(':').map(Number);
      const [eh, em] = endTime.split(':').map(Number);
      return ((eh * 60 + em) - (sh * 60 + sm)) / 60;
    };
    const calcRevenue = (booking: Booking) => {
      return calcDuration(booking.startTime, booking.endTime) * config.pricePerHour;
    };

    const hourMap = new Map<number, { hour: number; bookings: number; revenue: number }>();

    // 初始化 6-22 点
    for (let i = 6; i <= 22; i++) {
      hourMap.set(i, { hour: i, bookings: 0, revenue: 0 });
    }

    filteredBookings.forEach(booking => {
      const hour = parseInt(booking.startTime.split(':')[0]);
      const existing = hourMap.get(hour);
      if (existing) {
        existing.bookings += 1;
        existing.revenue += calcRevenue(booking);
      }
    });

    return Array.from(hourMap.values()).map(item => ({
      ...item,
      displayHour: `${item.hour}:00`,
    }));
  }, [filteredBookings, config.pricePerHour]);

  // 骑行台使用数据
  const stationData = useMemo(() => {
    // 计算时长和收入的辅助函数
    const calcDuration = (startTime: string, endTime: string) => {
      const [sh, sm] = startTime.split(':').map(Number);
      const [eh, em] = endTime.split(':').map(Number);
      return ((eh * 60 + em) - (sh * 60 + sm)) / 60;
    };
    const calcRevenue = (booking: Booking) => {
      return calcDuration(booking.startTime, booking.endTime) * config.pricePerHour;
    };

    return config.stations
      .filter(s => s.status !== 'disabled')
      .map(station => {
        const stationBookings = filteredBookings.filter(b => b.stationId === station.stationId);
        const totalHours = stationBookings.reduce(
          (sum, b) => sum + calcDuration(b.startTime, b.endTime),
          0
        );
        const revenue = stationBookings.reduce((sum, b) => sum + calcRevenue(b), 0);

        return {
          name: station.name || `${station.stationId}号骑行台`,
          bookings: stationBookings.length,
          hours: totalHours,
          revenue,
          bikeModel: config.bikeModels.find(m => m.id === station.bikeModelId)?.name || '未知',
        };
      })
      .sort((a, b) => b.bookings - a.bookings);
  }, [filteredBookings, config]);

  // 星期分布数据
  const weekdayData = useMemo(() => {
    // 计算收入的辅助函数
    const calcDuration = (startTime: string, endTime: string) => {
      const [sh, sm] = startTime.split(':').map(Number);
      const [eh, em] = endTime.split(':').map(Number);
      return ((eh * 60 + em) - (sh * 60 + sm)) / 60;
    };
    const calcRevenue = (booking: Booking) => {
      return calcDuration(booking.startTime, booking.endTime) * config.pricePerHour;
    };

    const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
    const data = weekdays.map((day) => ({
      name: day,
      bookings: 0,
      revenue: 0,
    }));

    filteredBookings.forEach(booking => {
      const date = parseISO(booking.date);
      const dayIndex = date.getDay();
      data[dayIndex].bookings += 1;
      data[dayIndex].revenue += calcRevenue(booking);
    });

    return data;
  }, [filteredBookings, config.pricePerHour]);

  // 导出数据
  const handleExport = () => {
    const csvContent = [
      ['日期', '预约数', '收入(元)', '时长(小时)'].join(','),
      ...trendData.map(row =>
        [row.date, row.bookings, row.revenue.toFixed(2), row.hours.toFixed(1)].join(',')
      ),
    ].join('\n');

    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `数据分析_${format(new Date(), 'yyyy-MM-dd')}.csv`;
    link.click();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 头部 */}
      <header className="bg-gradient-to-r from-orange-500 to-red-500 text-white py-4 px-4 sticky top-0 z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={onBack}
              className="text-white hover:bg-white/20"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-lg font-bold">数据分析中心</h1>
              <p className="text-xs text-white/80">可视化数据洞察</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleExport}
            className="text-white hover:bg-white/20"
          >
            <Download className="w-4 h-4 mr-1" />
            导出
          </Button>
        </div>
      </header>

      {/* 时间范围选择 */}
      <div className="px-4 py-4">
        <Select value={timeRange} onValueChange={(v) => setTimeRange(v as TimeRange)}>
          <SelectTrigger className="w-full bg-white">
            <SelectValue placeholder="选择时间范围" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7days">最近7天</SelectItem>
            <SelectItem value="30days">最近30天</SelectItem>
            <SelectItem value="90days">最近90天</SelectItem>
            <SelectItem value="thisYear">今年</SelectItem>
            <SelectItem value="all">全部数据</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* 核心指标卡片 */}
      <div className="px-4 grid grid-cols-2 gap-3 mb-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="w-4 h-4 text-orange-500" />
              <span className="text-sm text-gray-500">预约总数</span>
            </div>
            <p className="text-2xl font-bold text-gray-800">{metrics.totalBookings}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="w-4 h-4 text-green-500" />
              <span className="text-sm text-gray-500">总收入</span>
            </div>
            <p className="text-2xl font-bold text-gray-800">¥{metrics.totalRevenue.toFixed(0)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-4 h-4 text-blue-500" />
              <span className="text-sm text-gray-500">总时长</span>
            </div>
            <p className="text-2xl font-bold text-gray-800">{metrics.totalHours.toFixed(1)}h</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Users className="w-4 h-4 text-purple-500" />
              <span className="text-sm text-gray-500">用户数</span>
            </div>
            <p className="text-2xl font-bold text-gray-800">{metrics.uniqueUsers}</p>
          </CardContent>
        </Card>
      </div>

      {/* 图表区域 */}
      <div className="px-4 pb-8 space-y-4">
        <Tabs defaultValue="trend" className="w-full">
          <TabsList className="grid w-full grid-cols-4 bg-gray-100 p-1">
            <TabsTrigger 
              value="trend"
              className="data-[state=active]:bg-orange-500 data-[state=active]:text-white text-gray-600 rounded-md transition-all"
            >
              趋势
            </TabsTrigger>
            <TabsTrigger 
              value="hourly"
              className="data-[state=active]:bg-blue-500 data-[state=active]:text-white text-gray-600 rounded-md transition-all"
            >
              时段
            </TabsTrigger>
            <TabsTrigger 
              value="station"
              className="data-[state=active]:bg-green-500 data-[state=active]:text-white text-gray-600 rounded-md transition-all"
            >
              骑行台
            </TabsTrigger>
            <TabsTrigger 
              value="weekday"
              className="data-[state=active]:bg-purple-500 data-[state=active]:text-white text-gray-600 rounded-md transition-all"
            >
              星期
            </TabsTrigger>
          </TabsList>

          {/* 趋势图 */}
          <TabsContent value="trend">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-orange-500" />
                  收入趋势
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={trendData}>
                      <defs>
                        <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#f97316" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis
                        dataKey="displayDate"
                        tick={{ fontSize: 12 }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis
                        tick={{ fontSize: 12 }}
                        axisLine={false}
                        tickLine={false}
                        tickFormatter={(v) => `¥${v}`}
                      />
                      <Tooltip
                        formatter={(v: number) => [`¥${v.toFixed(2)}`, '收入']}
                        labelFormatter={(l) => `${l}`}
                      />
                      <Area
                        type="monotone"
                        dataKey="revenue"
                        stroke="#f97316"
                        fillOpacity={1}
                        fill="url(#colorRevenue)"
                        strokeWidth={2}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>

                {/* 预约量趋势 */}
                <div className="h-48 mt-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={trendData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis
                        dataKey="displayDate"
                        tick={{ fontSize: 12 }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis
                        tick={{ fontSize: 12 }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <Tooltip formatter={(v: number) => [`${v}单`, '预约量']} />
                      <Line
                        type="monotone"
                        dataKey="bookings"
                        stroke="#3b82f6"
                        strokeWidth={2}
                        dot={{ r: 3 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* 时段热度图 */}
          <TabsContent value="hourly">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Clock className="w-4 h-4 text-blue-500" />
                  时段热度分布
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={hourlyData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis
                        dataKey="displayHour"
                        tick={{ fontSize: 11 }}
                        axisLine={false}
                        tickLine={false}
                        interval={1}
                      />
                      <YAxis
                        tick={{ fontSize: 12 }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <Tooltip formatter={(v: number) => [`${v}单`, '预约数']} />
                      <Bar dataKey="bookings" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <p className="text-xs text-gray-500 mt-2 text-center">
                  显示各时间段的预约数量，帮助优化营业时间安排
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          {/* 骑行台统计 */}
          <TabsContent value="station">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Bike className="w-4 h-4 text-green-500" />
                  骑行台使用情况
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={stationData} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis
                        type="number"
                        tick={{ fontSize: 12 }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis
                        type="category"
                        dataKey="name"
                        tick={{ fontSize: 12 }}
                        axisLine={false}
                        tickLine={false}
                        width={80}
                      />
                      <Tooltip
                        formatter={(v: number, name: string) => {
                          if (name === 'bookings') return [`${v}单`, '预约数'];
                          if (name === 'hours') return [`${v.toFixed(1)}h`, '使用时长'];
                          return [v, name];
                        }}
                      />
                      <Legend />
                      <Bar dataKey="bookings" name="预约数" fill="#22c55e" radius={[0, 4, 4, 0]} />
                      <Bar dataKey="hours" name="使用时长" fill="#3b82f6" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* 收入占比饼图 */}
                <div className="h-48 mt-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={stationData}
                        cx="50%"
                        cy="50%"
                        innerRadius={40}
                        outerRadius={70}
                        paddingAngle={5}
                        dataKey="revenue"
                        nameKey="name"
                      >
                        {stationData.map((_entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(v: number) => `¥${v.toFixed(2)}`} />
                      <Legend verticalAlign="middle" align="right" layout="vertical" />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* 星期分布 */}
          <TabsContent value="weekday">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-purple-500" />
                  星期分布
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={weekdayData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis
                        dataKey="name"
                        tick={{ fontSize: 12 }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis
                        tick={{ fontSize: 12 }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <Tooltip formatter={(v: number) => [`${v}单`, '预约数']} />
                      <Bar dataKey="bookings" fill="#8b5cf6" radius={[4, 4, 0, 0]}>
                        {weekdayData.map((_, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={index === 0 || index === 6 ? '#f97316' : '#8b5cf6'}
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex items-center justify-center gap-4 mt-2 text-xs">
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 rounded bg-purple-500" />
                    <span className="text-gray-500">工作日</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 rounded bg-orange-500" />
                    <span className="text-gray-500">周末</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
