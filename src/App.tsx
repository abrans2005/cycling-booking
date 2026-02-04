import { useState, useEffect, useMemo } from 'react';
import PullToRefresh from 'react-simple-pull-to-refresh';
import { CloudStatus } from '@/components/CloudStatus';
import { Header } from '@/sections/Header';
import { DateSelector } from '@/sections/DateSelector';
import { TimeSelector } from '@/sections/TimeSelector';
import { DurationSelector } from '@/sections/DurationSelector';
import { StationSelector } from '@/sections/StationSelector';
import { BookingForm } from '@/sections/BookingForm';
import { SuccessModal } from '@/sections/SuccessModal';
import { MyBookings } from '@/sections/MyBookings';
import { useBooking, useConfig } from '@/hooks/useBookingRealtime';
import { useUser } from '@/hooks/useUser';
import { PhoneLogin } from '@/sections/PhoneLogin';
import { StationManager } from '@/sections/StationManager';
import { Toaster } from '@/components/ui/sonner';
import { toast } from 'sonner';
import { Search, Lock, Eye, EyeOff, Bike, LogOut, ArrowLeft, RefreshCw, ChevronLeft, ChevronRight, Calendar, Clock, User, Phone, Trash2, XCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { api } from '@/lib/supabase';
import type { Booking, AppConfig, BikeModel, StationConfig } from '@/types';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';

const ADMIN_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD || 'cycling2024';

// 主预约页面
function BookingPage({ onQueryClick, onAdminClick }: { onQueryClick: () => void; onAdminClick: () => void }) {
  const { config } = useConfig();
  const { user, isLoggedIn, showLoginModal, setShowLoginModal, login, logout } = useUser();
  const { formData, updateFormData, showSuccess, lastBooking, error, submitBooking, closeSuccess } = useBooking(config.pricePerHour);

  useEffect(() => { if (error) toast.error(error); }, [error]);

  // 用户登录后自动填充信息
  useEffect(() => {
    if (isLoggedIn && user) {
      if (!formData.memberName && user.nickname) {
        updateFormData('memberName', user.nickname);
      }
      if (!formData.memberPhone && user.phone) {
        updateFormData('memberPhone', user.phone);
      }
    }
  }, [isLoggedIn, user]);

  // 预约成功后发送通知
  useEffect(() => {
    if (showSuccess && lastBooking && config.serverChanKey) {
      const stationConfig = config.stations?.find(s => s.stationId === lastBooking.stationId);
      const duration = (() => {
        const [sh, sm] = lastBooking.startTime.split(':').map(Number);
        const [eh, em] = lastBooking.endTime.split(':').map(Number);
        return ((eh * 60 + em) - (sh * 60 + sm)) / 60;
      })();
      
      api.sendBookingNotification({
        memberName: lastBooking.memberName,
        memberPhone: lastBooking.memberPhone,
        date: lastBooking.date,
        startTime: lastBooking.startTime,
        endTime: lastBooking.endTime,
        stationId: lastBooking.stationId,
        bikeModelId: stationConfig?.bikeModelId,
        price: duration * config.pricePerHour,
        notes: lastBooking.notes,
      });
    }
  }, [showSuccess, lastBooking, config]);

  const canSubmit = formData.date && formData.startTime && formData.stationId && formData.memberName.trim() && formData.memberPhone.trim();

  const handleSelectDate = (date: Date) => {
    updateFormData('date', date);
    updateFormData('startTime', '');
    updateFormData('stationId', null);
  };

  const handleSelectTime = (time: string) => {
    updateFormData('startTime', time);
    updateFormData('stationId', null);
  };

  return (
    <div className="min-h-screen bg-gray-100 relative">
      <div className="fixed top-4 right-4 z-50 flex gap-2">
        <button onClick={onQueryClick} className="w-10 h-10 bg-white/90 backdrop-blur rounded-full shadow-lg flex items-center justify-center text-gray-600 hover:text-orange-500 transition-colors" title="查询我的预约">
          <Search className="w-5 h-5" />
        </button>
        <button onClick={onAdminClick} className="w-10 h-10 bg-white/90 backdrop-blur rounded-full shadow-lg flex items-center justify-center text-gray-600 hover:text-orange-500 transition-colors" title="教练登录">
          <Lock className="w-5 h-5" />
        </button>
      </div>

      <Header />

      {/* 用户登录状态栏 */}
      <div className="px-4 pt-2">
        {isLoggedIn ? (
          <div className="bg-white rounded-xl px-4 py-3 flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white font-bold text-sm overflow-hidden">
                {user?.nickname ? (
                  <span className="text-lg">{user.nickname.charAt(0)}</span>
                ) : (
                  <User className="w-5 h-5" />
                )}
              </div>
              <div>
                <p className="text-sm font-medium text-gray-800">{user?.nickname || user?.phone?.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2') || '用户'}</p>
                <p className="text-xs text-gray-500">已登录</p>
              </div>
            </div>
            <button onClick={logout} className="text-xs text-gray-400 hover:text-gray-600">
              退出
            </button>
          </div>
        ) : (
          <button 
            onClick={() => setShowLoginModal(true)}
            className="w-full bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl px-4 py-3 flex items-center justify-center gap-2 shadow-sm active:scale-95 transition-transform"
          >
            <Phone className="w-5 h-5" />
            <span className="font-medium">手机号登录</span>
          </button>
        )}
      </div>

      {/* 登录弹窗 */}
      <PhoneLogin
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        onSuccess={(phone, nickname) => login(phone, nickname)}
      />

      <main className="pb-8 pt-4">
        <DateSelector selectedDate={formData.date} onSelectDate={handleSelectDate} />
        <TimeSelector selectedTime={formData.startTime} onSelectTime={handleSelectTime} selectedDate={formData.date} />
        <DurationSelector duration={formData.duration} onSelectDuration={(d) => { updateFormData('duration', d); updateFormData('stationId', null); }} />
        <StationSelector selectedStation={formData.stationId} onSelectStation={(id) => updateFormData('stationId', id)} selectedDate={formData.date} selectedTime={formData.startTime} duration={formData.duration} />
        <BookingForm memberName={formData.memberName} memberPhone={formData.memberPhone} notes={formData.notes} onUpdateName={(n) => updateFormData('memberName', n)} onUpdatePhone={(p) => updateFormData('memberPhone', p)} onUpdateNotes={(n) => updateFormData('notes', n)} onSubmit={submitBooking} canSubmit={!!canSubmit} />
      </main>

      {showSuccess && <SuccessModal booking={lastBooking} onClose={closeSuccess} />}
      <Toaster position="top-center" />
    </div>
  );
}

// 教练登录
function AdminLogin({ onLogin, onBack }: { onLogin: () => void; onBack: () => void }) {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    setTimeout(() => {
      if (password === ADMIN_PASSWORD) {
        sessionStorage.setItem('admin_logged_in', 'true');
        onLogin();
      } else {
        setError('密码错误');
      }
      setLoading(false);
    }, 500);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-500 via-orange-400 to-red-500 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-gradient-to-r from-orange-500 to-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <Bike className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-xl font-bold text-gray-800">教练管理后台</h1>
          <p className="text-sm text-gray-500 mt-1">骑行工作室预约管理</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="password" className="text-sm text-gray-600">管理员密码</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input id="password" type={showPassword ? 'text' : 'password'} placeholder="请输入密码" value={password} onChange={(e) => setPassword(e.target.value)} className={cn('pl-10 pr-10', error && 'border-red-500')} />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {error && <p className="text-xs text-red-500">{error}</p>}
          </div>

          <button type="submit" disabled={loading || !password} className="w-full py-3 text-base font-medium rounded-xl bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white">
            {loading ? '验证中...' : '登录'}
          </button>
        </form>

        <button onClick={onBack} className="w-full mt-4 text-sm text-gray-500 hover:text-orange-500 transition-colors flex items-center justify-center gap-1">
          <ArrowLeft className="w-4 h-4" />返回会员预约页面
        </button>
      </div>
    </div>
  );
}

// 统计维度类型
type StatsViewType = 'day' | 'month' | 'year' | 'station';

// 计算时长的通用函数
const calculateDuration = (startTime: string, endTime: string) => {
  const [sh, sm] = startTime.split(':').map(Number);
  const [eh, em] = endTime.split(':').map(Number);
  return ((eh * 60 + em) - (sh * 60 + sm)) / 60;
};

// 计算预约金额
const calculateRevenue = (bookings: Booking[], pricePerHour: number) => {
  return bookings
    .filter(b => b.status === 'confirmed')
    .reduce((sum, b) => sum + calculateDuration(b.startTime, b.endTime) * pricePerHour, 0);
};

// 教练管理面板
function AdminPanel({ onLogout }: { onLogout: () => void }) {
  const [allBookings, setAllBookings] = useState<Booking[]>([]);
  const [config, setConfig] = useState<AppConfig>({
    pricePerHour: 100,
    bikeModels: [
      { id: 'stages', name: 'Stages Bike', description: '专业功率训练骑行台' },
      { id: 'neo', name: 'Neo Bike', description: '智能模拟骑行台' },
    ],
    stations: [
      { stationId: 1, bikeModelId: 'stages', status: 'available', name: '1号骑行台' },
      { stationId: 2, bikeModelId: 'stages', status: 'available', name: '2号骑行台' },
      { stationId: 3, bikeModelId: 'neo', status: 'available', name: '3号骑行台' },
      { stationId: 4, bikeModelId: 'neo', status: 'available', name: '4号骑行台' },
    ],
    updatedAt: new Date().toISOString(),
  });
  const [loading, setLoading] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [searchPhone, setSearchPhone] = useState('');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [statsView, setStatsView] = useState<StatsViewType>('day');
  const [showPriceModal, setShowPriceModal] = useState(false);
  const [newPrice, setNewPrice] = useState('');

  const [showServerChanModal, setShowServerChanModal] = useState(false);
  const [serverChanKey, setServerChanKey] = useState(config.serverChanKey || '');
  const [showStationManager, setShowStationManager] = useState(false);

  // 加载所有数据
  const loadAllBookings = async () => {
    setLoading(true);
    try {
      const data = await api.getBookings();
      setAllBookings(data);
    } catch {
      showMessage('error', '加载数据失败');
    } finally {
      setLoading(false);
    }
  };

  // 加载配置
  const loadConfig = async () => {
    try {
      const data = await api.getConfig();
      setConfig(data);
    } catch {
      console.error('加载配置失败');
    }
  };

  useEffect(() => { 
    loadAllBookings(); 
    loadConfig();
  }, []);

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 3000);
  };

  // 下拉刷新
  const handlePullRefresh = async () => {
    try {
      await Promise.all([loadAllBookings(), loadConfig()]);
    } catch (error) {
      console.error('刷新失败:', error);
    }
  };

  const handleCancel = async (id: string) => {
    if (!confirm('确定要取消这个预约吗？')) return;
    try { 
      await api.cancelBooking(id); 
      showMessage('success', '预约已取消'); 
      loadAllBookings();
    } catch { 
      showMessage('error', '取消失败'); 
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('确定要删除这个预约吗？此操作不可恢复。')) return;
    try { 
      await api.deleteBooking(id); 
      showMessage('success', '预约已删除'); 
      loadAllBookings();
    } catch { 
      showMessage('error', '删除失败'); 
    }
  };

  const changeDate = (days: number) => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() + days);
    setCurrentDate(newDate);
  };

  const changeMonth = (delta: number) => {
    let newMonth = currentMonth + delta;
    let newYear = currentYear;
    if (newMonth > 11) {
      newMonth = 0;
      newYear++;
    } else if (newMonth < 0) {
      newMonth = 11;
      newYear--;
    }
    setCurrentMonth(newMonth);
    setCurrentYear(newYear);
  };

  const changeYear = (delta: number) => {
    setCurrentYear(currentYear + delta);
  };

  // 保存价格设置
  const handleSavePrice = async () => {
    const price = parseFloat(newPrice);
    if (isNaN(price) || price <= 0) {
      showMessage('error', '请输入有效的价格');
      return;
    }
    try {
      const updated = await api.updateConfig({ pricePerHour: price });
      setConfig(updated);
      setShowPriceModal(false);
      setNewPrice('');
      showMessage('success', '价格已更新');
    } catch {
      showMessage('error', '保存失败');
    }
  };

  // 保存骑行台和型号配置
  const handleSaveStationConfig = async (stations: StationConfig[], bikeModels: BikeModel[]) => {
    try {
      const updated = await api.updateConfig({ stations, bikeModels });
      setConfig(updated);
      setShowStationManager(false);
      showMessage('success', '骑行台配置已更新');
    } catch {
      showMessage('error', '保存失败');
      throw new Error('保存失败');
    }
  };

  // 保存 Server酱 Key
  const handleSaveServerChanKey = async () => {
    try {
      const updated = await api.updateConfig({ serverChanKey: serverChanKey.trim() || undefined });
      setConfig(updated);
      setShowServerChanModal(false);
      showMessage('success', 'Server酱配置已更新');
    } catch {
      showMessage('error', '保存失败');
    }
  };

  const formatDate = (date: Date) => {
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
    const weekday = weekdays[date.getDay()];
    const isToday = date.toDateString() === new Date().toDateString();
    return { month, day, weekday, isToday };
  };

  // 统计数据计算
  const stats = useMemo(() => {
    let filteredBookings: Booking[] = [];

    switch (statsView) {
      case 'day':
        filteredBookings = allBookings.filter(b => b.date === currentDate.toISOString().split('T')[0]);
        break;
      case 'month':
        filteredBookings = allBookings.filter(b => {
          const date = new Date(b.date);
          return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
        });
        break;
      case 'year':
        filteredBookings = allBookings.filter(b => {
          const date = new Date(b.date);
          return date.getFullYear() === currentYear;
        });
        break;
      case 'station':
        filteredBookings = allBookings;
        break;
    }

    // 如果有手机号搜索，进一步过滤
    if (searchPhone) {
      filteredBookings = filteredBookings.filter(b => b.memberPhone.includes(searchPhone));
    }

    const confirmed = filteredBookings.filter(b => b.status === 'confirmed');
    const cancelled = filteredBookings.filter(b => b.status === 'cancelled');

    return {
      confirmedCount: confirmed.length,
      cancelledCount: cancelled.length,
      totalCount: filteredBookings.length,
      revenue: calculateRevenue(filteredBookings, config.pricePerHour),
      totalHours: confirmed.reduce((sum, b) => sum + calculateDuration(b.startTime, b.endTime), 0),
      // 骑行台统计（只统计启用的骑行台）
      stationStats: config.stations
        .filter(s => s.status !== 'disabled')
        .map(station => {
          const stationBookings = filteredBookings.filter(b => b.stationId === station.stationId && b.status === 'confirmed');
          return {
            stationId: station.stationId,
            stationName: station.name,
            bikeModel: config.bikeModels.find(m => m.id === station.bikeModelId)?.name || '未知型号',
            status: station.status,
            count: stationBookings.length,
            hours: stationBookings.reduce((sum, b) => sum + calculateDuration(b.startTime, b.endTime), 0),
            revenue: calculateRevenue(stationBookings, config.pricePerHour),
          };
        }),
    };
  }, [allBookings, statsView, currentDate, currentMonth, currentYear, searchPhone, config.pricePerHour]);

  const { month, day, weekday, isToday } = formatDate(currentDate);
  
  // 根据当前视图过滤预约列表
  const viewBookings = useMemo(() => {
    let result: Booking[] = [];
    
    switch (statsView) {
      case 'day':
        result = allBookings.filter(b => b.date === currentDate.toISOString().split('T')[0]);
        break;
      case 'month':
        result = allBookings.filter(b => {
          const date = new Date(b.date);
          return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
        });
        break;
      case 'year':
        result = allBookings.filter(b => {
          const date = new Date(b.date);
          return date.getFullYear() === currentYear;
        });
        break;
      case 'station':
        result = allBookings;
        break;
    }
    
    // 手机号搜索过滤
    if (searchPhone) {
      result = result.filter(b => b.memberPhone.includes(searchPhone));
    }
    
    // 按日期降序排序（最新的在前面）
    return result.sort((a, b) => {
      const dateCompare = new Date(b.date).getTime() - new Date(a.date).getTime();
      if (dateCompare !== 0) return dateCompare;
      return a.startTime.localeCompare(b.startTime);
    });
  }, [allBookings, statsView, currentDate, currentMonth, currentYear, searchPhone]);

  // 日期导航显示
  const getDateDisplay = () => {
    switch (statsView) {
      case 'day':
        return { title: `${month}月${day}日`, subtitle: isToday ? '今天' : weekday };
      case 'month':
        return { title: `${currentYear}年${currentMonth + 1}月`, subtitle: '月度统计' };
      case 'year':
        return { title: `${currentYear}年`, subtitle: '年度统计' };
      case 'station':
        return { title: '骑行台统计', subtitle: '全部时间' };
    }
  };

  const dateDisplay = getDateDisplay();

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-gradient-to-r from-orange-500 to-red-500 text-white py-4 px-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-white/20 p-2 rounded-full"><Bike className="w-6 h-6" /></div>
            <div>
              <h1 className="text-lg font-bold">教练管理后台</h1>
              <p className="text-xs text-white/80">骑行工作室预约管理</p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={onLogout} className="text-white hover:bg-white/20"><LogOut className="w-4 h-4 mr-1" />退出</Button>
        </div>
      </header>

      {message && <div className={cn('fixed top-16 left-4 right-4 py-3 px-4 rounded-lg text-center text-sm z-50', message.type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white')}>{message.text}</div>}

      {/* 统计维度切换 */}
      <div className="mx-4 mt-4">
        <div className="bg-white p-1 rounded-xl shadow-sm flex">
          {(['day', 'month', 'year', 'station'] as StatsViewType[]).map((view) => (
            <button
              key={view}
              onClick={() => setStatsView(view)}
              className={cn(
                'flex-1 py-2 text-sm font-medium rounded-lg transition-all',
                statsView === view
                  ? 'bg-orange-500 text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              )}
            >
              {view === 'day' && '按日'}
              {view === 'month' && '按月'}
              {view === 'year' && '按年'}
              {view === 'station' && '按骑行台'}
            </button>
          ))}
        </div>
      </div>

      {/* 日期/时间导航 */}
      {statsView !== 'station' && (
        <div className="bg-white mx-4 mt-4 p-4 rounded-xl shadow-sm">
          <div className="flex items-center justify-between">
            <button 
              onClick={() => {
                if (statsView === 'day') changeDate(-1);
                else if (statsView === 'month') changeMonth(-1);
                else if (statsView === 'year') changeYear(-1);
              }} 
              className="p-2 hover:bg-gray-100 rounded-full"
            >
              <ChevronLeft className="w-5 h-5 text-gray-600" />
            </button>
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-800">{dateDisplay.title}</p>
              <p className={cn('text-sm', isToday && statsView === 'day' ? 'text-orange-500 font-medium' : 'text-gray-500')}>
                {dateDisplay.subtitle}
              </p>
            </div>
            <button 
              onClick={() => {
                if (statsView === 'day') changeDate(1);
                else if (statsView === 'month') changeMonth(1);
                else if (statsView === 'year') changeYear(1);
              }} 
              className="p-2 hover:bg-gray-100 rounded-full"
            >
              <ChevronRight className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        </div>
      )}

      {/* 统计数据卡片 */}
      <div className="grid grid-cols-2 gap-3 mx-4 mt-4">
        <div className="bg-white p-3 rounded-xl shadow-sm text-center">
          <p className="text-2xl font-bold text-orange-600">{stats.confirmedCount}</p>
          <p className="text-xs text-gray-500">有效预约</p>
        </div>
        <div className="bg-white p-3 rounded-xl shadow-sm text-center">
          <p className="text-2xl font-bold text-green-600">¥{stats.revenue}</p>
          <p className="text-xs text-gray-500">预计收入</p>
        </div>
        <div className="bg-white p-3 rounded-xl shadow-sm text-center">
          <p className="text-2xl font-bold text-blue-600">{stats.totalHours.toFixed(1)}h</p>
          <p className="text-xs text-gray-500">总时长</p>
        </div>
        <div className="bg-white p-3 rounded-xl shadow-sm text-center">
          <p className="text-2xl font-bold text-gray-600">{stats.totalCount}</p>
          <p className="text-xs text-gray-500">总预约</p>
        </div>
      </div>

      {/* 骑行台统计（在骑行台视图下显示详情） */}
      {statsView === 'station' && (
        <div className="mx-4 mt-4">
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b bg-gray-50">
              <p className="font-medium text-gray-700">各骑行台使用情况</p>
            </div>
            {stats.stationStats.map((stat) => (
              <div key={stat.stationId} className="px-4 py-3 border-b last:border-b-0 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    'w-10 h-10 rounded-full flex items-center justify-center font-bold',
                    stat.status === 'maintenance' ? 'bg-orange-100 text-orange-600' : 'bg-green-100 text-green-600'
                  )}>
                    {stat.status === 'maintenance' ? '!' : `${stat.stationId}`}
                  </div>
                  <div>
                    <p className="font-medium text-gray-800">{stat.stationName}</p>
                    <p className="text-xs text-gray-500">{stat.bikeModel} · {stat.count} 次预约</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-green-600">¥{stat.revenue}</p>
                  <p className="text-xs text-gray-400">{stat.hours.toFixed(1)}小时</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 搜索 */}
      <div className="mx-4 mt-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input placeholder="搜索手机号..." value={searchPhone} onChange={(e) => setSearchPhone(e.target.value)} className="pl-10" />
        </div>
      </div>

      {/* 刷新和价格设置按钮 */}
      <div className="mx-4 mt-3 flex flex-wrap justify-between gap-2">
        <div className="flex gap-2 flex-wrap">
          <Button variant="outline" size="sm" onClick={() => { setNewPrice(config.pricePerHour.toString()); setShowPriceModal(true); }} className="text-orange-600 border-orange-200 hover:bg-orange-50">
            <span className="mr-1">💰</span>单价: ¥{config.pricePerHour}/小时
          </Button>
          <Button variant="outline" size="sm" onClick={() => setShowStationManager(true)} className="text-blue-600 border-blue-200 hover:bg-blue-50">
            <span className="mr-1">🚲</span>骑行台管理
          </Button>
          <Button variant="outline" size="sm" onClick={() => { setServerChanKey(config.serverChanKey || ''); setShowServerChanModal(true); }} className={cn("border-purple-200 hover:bg-purple-50", config.serverChanKey ? "text-purple-600" : "text-gray-400")}>
            <span className="mr-1">📢</span>微信通知{config.serverChanKey ? '已配置' : '未配置'}
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <CloudStatus />
          <Button variant="outline" size="sm" onClick={loadAllBookings} disabled={loading} className="text-gray-600">
            <RefreshCw className={cn('w-4 h-4 mr-1', loading && 'animate-spin')} />刷新
          </Button>
        </div>
      </div>

      {/* 预约列表 */}
      <div className="mx-4 mt-4 pb-8">
        <PullToRefresh 
          onRefresh={handlePullRefresh}
          pullingContent={
            <div className="flex items-center justify-center gap-2 py-3 text-gray-500">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-sm">下拉刷新</span>
            </div>
          }
          refreshingContent={
            <div className="flex items-center justify-center gap-2 py-3 text-orange-500">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-sm">刷新中...</span>
            </div>
          }
        >
          {viewBookings.length === 0 ? (
            <div className="bg-white rounded-xl p-8 text-center min-h-[200px]">
              <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">
                {statsView === 'day' && '今日暂无预约'}
                {statsView === 'month' && `${currentMonth + 1}月暂无预约`}
                {statsView === 'year' && `${currentYear}年暂无预约`}
                {statsView === 'station' && '暂无预约记录'}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-gray-500 px-1">
                共 {viewBookings.length} 条记录
              </p>
              {viewBookings.map((booking) => {
              const duration = calculateDuration(booking.startTime, booking.endTime);
              const price = duration * config.pricePerHour;
              const isCancelled = booking.status === 'cancelled';
              const bookingDate = new Date(booking.date);
              const month = bookingDate.getMonth() + 1;
              const day = bookingDate.getDate();
              return (
                <div key={booking.id} className={cn('bg-white rounded-xl p-4 shadow-sm', isCancelled && 'opacity-60')}>
                  <div className="flex items-center justify-between mb-3">
                    <div className={cn('px-2 py-1 rounded-full text-xs font-medium', isCancelled ? 'bg-gray-100 text-gray-500' : 'bg-green-100 text-green-600')}>
                      {isCancelled ? <span className="flex items-center gap-1"><XCircle className="w-3 h-3" />已取消</span> : <span className="flex items-center gap-1"><CheckCircle2 className="w-3 h-3" />已确认</span>}
                    </div>
                    <span className="text-lg font-bold text-orange-600">¥{price}</span>
                  </div>
                  <div className="space-y-2 text-sm">
                    {/* 在非日视图下显示日期 */}
                    {statsView !== 'day' && (
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-orange-500" />
                        <span className="text-orange-600 font-medium">{month}月{day}日</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2"><Clock className="w-4 h-4 text-gray-400" /><span className="text-gray-600">{booking.startTime} - {booking.endTime}</span><span className="text-gray-400">({duration}小时)</span></div>
                    <div className="flex items-center gap-2"><Bike className="w-4 h-4 text-gray-400" /><span className="text-gray-600">{booking.stationId}号骑行台</span></div>
                    <div className="flex items-center gap-2"><User className="w-4 h-4 text-gray-400" /><span className="text-gray-600">{booking.memberName}</span></div>
                    <div className="flex items-center gap-2"><Phone className="w-4 h-4 text-gray-400" /><span className="text-gray-600">{booking.memberPhone}</span></div>
                    {booking.notes && <div className="text-gray-500 text-xs bg-gray-50 p-2 rounded">备注：{booking.notes}</div>}
                  </div>
                  {!isCancelled ? (
                    <div className="flex gap-2 mt-4 pt-3 border-t">
                      <Button variant="outline" size="sm" onClick={() => handleCancel(booking.id)} className="flex-1 text-orange-600 border-orange-200 hover:bg-orange-50"><XCircle className="w-4 h-4 mr-1" />取消</Button>
                      <Button variant="outline" size="sm" onClick={() => handleDelete(booking.id)} className="flex-1 text-red-600 border-red-200 hover:bg-red-50"><Trash2 className="w-4 h-4 mr-1" />删除</Button>
                    </div>
                  ) : (
                    <div className="mt-4 pt-3 border-t">
                      <Button variant="outline" size="sm" onClick={() => handleDelete(booking.id)} className="w-full text-red-600 border-red-200 hover:bg-red-50"><Trash2 className="w-4 h-4 mr-1" />删除记录</Button>
                    </div>
                  )}
                </div>
              );
            })}
            </div>
          )}
        </PullToRefresh>
      </div>

      {/* 价格设置弹窗 */}
      {showPriceModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm p-6 animate-zoom-in">
            <h3 className="text-lg font-bold text-gray-800 mb-4">设置预约单价</h3>
            <div className="space-y-4">
              <div>
                <Label className="text-sm text-gray-600">每小时价格（元）</Label>
                <div className="relative mt-1">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">¥</span>
                  <Input
                    type="number"
                    min="1"
                    step="1"
                    placeholder="100"
                    value={newPrice}
                    onChange={(e) => setNewPrice(e.target.value)}
                    className="pl-8"
                  />
                </div>
                <p className="text-xs text-gray-400 mt-1">当前设置: ¥{config.pricePerHour}/小时</p>
              </div>
              <div className="flex gap-3 pt-2">
                <Button variant="outline" className="flex-1" onClick={() => { setShowPriceModal(false); setNewPrice(''); }}>
                  取消
                </Button>
                <Button 
                  className="flex-1 bg-orange-500 hover:bg-orange-600 text-white" 
                  onClick={handleSavePrice}
                  disabled={!newPrice || parseFloat(newPrice) <= 0}
                >
                  保存
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 骑行台管理弹窗 */}
      <StationManager
        isOpen={showStationManager}
        onClose={() => setShowStationManager(false)}
        stations={config.stations}
        bikeModels={config.bikeModels}
        allBookings={allBookings}
        onSave={handleSaveStationConfig}
      />

      {/* Server酱配置弹窗 */}
      {showServerChanModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm p-6 animate-zoom-in">
            <h3 className="text-lg font-bold text-gray-800 mb-2">配置 Server酱</h3>
            <p className="text-sm text-gray-500 mb-4">预约消息将推送到教练微信</p>
            <div className="space-y-4">
              <div>
                <label className="text-sm text-gray-600 mb-1.5 block">SendKey</label>
                <Input
                  type="text"
                  placeholder="SCTxxxxx..."
                  value={serverChanKey}
                  onChange={(e) => setServerChanKey(e.target.value)}
                  className="font-mono text-sm"
                />
                <p className="text-xs text-gray-400 mt-1.5">
                  从 <a href="https://sct.ftqq.com/" target="_blank" rel="noopener" className="text-purple-500 hover:underline">sct.ftqq.com</a> 获取
                </p>
              </div>
              <div className="bg-yellow-50 p-3 rounded-lg">
                <p className="text-xs text-yellow-700">
                  <strong>配置步骤：</strong><br/>
                  1. 访问 sct.ftqq.com 登录<br/>
                  2. 点击「Channel」→「添加通道」<br/>
                  3. 选择「企业微信应用」或「Server酱」<br/>
                  4. 复制 SendKey 粘贴到上方
                </p>
              </div>
              <div className="flex gap-3 pt-2">
                <Button variant="outline" className="flex-1" onClick={() => setShowServerChanModal(false)}>
                  取消
                </Button>
                <Button 
                  className="flex-1 bg-purple-500 hover:bg-purple-600 text-white" 
                  onClick={handleSaveServerChanKey}
                >
                  保存
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      <Toaster position="top-center" />
    </div>
  );
}

// 主应用
function App() {
  const [view, setView] = useState<'booking' | 'query' | 'adminLogin' | 'adminPanel'>('booking');
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);

  useEffect(() => {
    setIsAdminLoggedIn(sessionStorage.getItem('admin_logged_in') === 'true');
  }, []);

  const handleAdminClick = () => isAdminLoggedIn ? setView('adminPanel') : setView('adminLogin');
  const handleAdminLogin = () => { setIsAdminLoggedIn(true); setView('adminPanel'); };
  const handleAdminLogout = () => { sessionStorage.removeItem('admin_logged_in'); setIsAdminLoggedIn(false); setView('booking'); };

  switch (view) {
    case 'query': return <MyBookings onBack={() => setView('booking')} />;
    case 'adminLogin': return <AdminLogin onLogin={handleAdminLogin} onBack={() => setView('booking')} />;
    case 'adminPanel': return <AdminPanel onLogout={handleAdminLogout} />;
    default: return <BookingPage onQueryClick={() => setView('query')} onAdminClick={handleAdminClick} />;
  }
}

export default App;
