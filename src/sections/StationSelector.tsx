import { useState, useEffect, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { Bike, CheckCircle2, XCircle, Wrench } from 'lucide-react';
import { useBikeStations, useConfig } from '@/hooks/useBookingRealtime';
import { api } from '@/lib/supabase';

interface StationConfig {
  stationId: number;
  bikeModelId: string;
  status: 'available' | 'maintenance' | 'disabled';
  name?: string;
}

interface BikeModel {
  id: string;
  name: string;
}

interface StationSelectorProps {
  selectedStation: number | null;
  onSelectStation: (stationId: number) => void;
  selectedDate: Date | undefined;
  selectedTime: string;
  duration: number;
}

export function StationSelector({ 
  selectedStation, 
  onSelectStation, 
  selectedDate, 
  selectedTime, 
  duration 
}: StationSelectorProps) {
  const stations = useBikeStations();
  const { config } = useConfig();
  const [timeAvailableStationIds, setTimeAvailableStationIds] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);

  // 获取所有可用的骑行台（status === 'available'）
  const availableStations = useMemo(() => {
    if (!config?.stations) return stations; // 如果配置未加载，显示所有
    const stationConfigs: StationConfig[] = config.stations;
    return stations.filter(station => {
      const stationConfig = stationConfigs.find((s: StationConfig) => s.stationId === station.id);
      // 如果没有找到配置，默认显示；如果找到配置，只有 status === 'available' 才显示
      return !stationConfig || stationConfig.status === 'available';
    });
  }, [stations, config?.stations]);

  // 获取骑行台型号名称
  const getStationModel = (stationId: number) => {
    const stationConfigs: StationConfig[] = config?.stations || [];
    const bikeModels: BikeModel[] = config?.bikeModels || [];
    const stationConfig = stationConfigs.find((s: StationConfig) => s.stationId === stationId);
    if (stationConfig?.bikeModelId) {
      const model = bikeModels.find((m: BikeModel) => m.id === stationConfig.bikeModelId);
      return model?.name || 'Stages bike';
    }
    return 'Stages bike';
  };

  // 获取骑行台状态
  const getStationStatus = (stationId: number): 'available' | 'maintenance' | 'disabled' => {
    const stationConfigs: StationConfig[] = config?.stations || [];
    const stationConfig = stationConfigs.find((s: StationConfig) => s.stationId === stationId);
    return stationConfig?.status || 'available';
  };

  // 当初始化或可用骑行台列表变化时，更新 timeAvailableStationIds
  useEffect(() => {
    setTimeAvailableStationIds(availableStations.map(s => s.id));
  }, [availableStations.length]);

  // 当日期、时间变化时检查可用性
  useEffect(() => {
    const checkAvailability = async () => {
      // 如果没有选择日期或时间，初始化所有可用骑行台
      if (!selectedDate || !selectedTime) {
        setTimeAvailableStationIds(availableStations.map(s => s.id));
        return;
      }

      // 如果没有可用骑行台，直接返回
      if (availableStations.length === 0) {
        setTimeAvailableStationIds([]);
        return;
      }

      setLoading(true);
      try {
        const dateStr = selectedDate.toISOString().split('T')[0];
        const [hour, minute] = selectedTime.split(':').map(Number);
        const endHour = hour + Math.floor(duration);
        const endMinute = minute + (duration % 1) * 60;
        const endTime = `${endHour.toString().padStart(2, '0')}:${Math.round(endMinute).toString().padStart(2, '0')}`;

        const available: number[] = [];
        for (const station of availableStations) {
          try {
            const isAvailable = await api.checkStationAvailability(station.id, dateStr, selectedTime, endTime);
            if (isAvailable) {
              available.push(station.id);
            }
          } catch {
            // 如果检查失败，默认设为可用
            available.push(station.id);
          }
        }
        setTimeAvailableStationIds(available);
      } catch (err) {
        console.error('检查可用性失败:', err);
        setTimeAvailableStationIds(availableStations.map(s => s.id));
      } finally {
        setLoading(false);
      }
    };

    checkAvailability();
  }, [selectedDate, selectedTime, duration, availableStations.length]); // 使用 length 避免对象引用变化

  const isTimeAvailable = (stationId: number) => {
    return timeAvailableStationIds.includes(stationId);
  };

  return (
    <div className="py-4 bg-white border-b">
      <div className="px-4 mb-3 flex items-center gap-2">
        <Bike className="w-4 h-4 text-gray-500" />
        <h2 className="text-sm font-medium text-gray-700">选择骑行台</h2>
        <span className="text-xs text-gray-400 ml-auto">
          共{stations.length}台，可选{timeAvailableStationIds.length}台
        </span>
      </div>
      
      {!selectedDate || !selectedTime ? (
        <div className="px-4 py-8 text-center text-gray-400">
          <p>请先选择日期和时间</p>
        </div>
      ) : loading ? (
        <div className="px-4 py-8 text-center text-gray-400">
          <p>检查可用性...</p>
        </div>
      ) : (
        <div className="px-4 grid grid-cols-2 gap-3">
          {availableStations.map((station) => {
            const timeAvailable = isTimeAvailable(station.id);
            const isSelected = selectedStation === station.id;
            const bikeModel = getStationModel(station.id);
            const stationStatus = getStationStatus(station.id);
            
            return (
              <button
                key={station.id}
                onClick={() => timeAvailable && onSelectStation(station.id)}
                disabled={!timeAvailable}
                className={cn(
                  'relative py-4 px-3 rounded-xl border-2 transition-all',
                  isSelected
                    ? 'border-orange-500 bg-orange-50'
                    : timeAvailable
                    ? 'border-gray-200 bg-white hover:border-orange-300'
                    : 'border-gray-100 bg-gray-50 opacity-60 cursor-not-allowed'
                )}
              >
                <div className="flex items-center gap-3">
                  <div className={cn(
                    'w-10 h-10 rounded-full flex items-center justify-center',
                    isSelected
                      ? 'bg-orange-500 text-white'
                      : timeAvailable
                      ? 'bg-orange-100 text-orange-600'
                      : 'bg-gray-200 text-gray-400'
                  )}>
                    <Bike className="w-5 h-5" />
                  </div>
                  <div className="text-left flex-1 min-w-0">
                    <div className={cn(
                      'font-medium truncate',
                      isSelected ? 'text-orange-600' : timeAvailable ? 'text-gray-800' : 'text-gray-400'
                    )}>
                      {station.name}
                    </div>
                    <div className="flex items-center gap-1 mt-0.5">
                      {timeAvailable ? (
                        <>
                          <CheckCircle2 className="w-3 h-3 text-green-500 flex-shrink-0" />
                          <span className="text-xs text-green-600 truncate">{bikeModel}</span>
                        </>
                      ) : stationStatus === 'maintenance' ? (
                        <>
                          <Wrench className="w-3 h-3 text-orange-400 flex-shrink-0" />
                          <span className="text-xs text-orange-500 truncate">维护中</span>
                        </>
                      ) : (
                        <>
                          <XCircle className="w-3 h-3 text-gray-400 flex-shrink-0" />
                          <span className="text-xs text-gray-400 truncate">{bikeModel}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                
                {isSelected && (
                  <div className="absolute top-2 right-2">
                    <div className="w-4 h-4 bg-orange-500 rounded-full flex items-center justify-center">
                      <CheckCircle2 className="w-3 h-3 text-white" />
                    </div>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
