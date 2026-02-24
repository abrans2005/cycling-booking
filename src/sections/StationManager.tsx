import { useState, useEffect } from 'react';
import { Plus, Trash2, Wrench, Power, AlertCircle, X, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import type { StationConfig, BikeModel, Booking } from '@/types';

interface StationManagerProps {
  isOpen: boolean;
  onClose: () => void;
  stations: StationConfig[];
  bikeModels: BikeModel[];
  allBookings: Booking[];
  onSave: (stations: StationConfig[], bikeModels: BikeModel[]) => Promise<void>;
}

export function StationManager({ 
  isOpen, 
  onClose, 
  stations, 
  bikeModels, 
  allBookings,
  onSave 
}: StationManagerProps) {
  const [editingStations, setEditingStations] = useState<StationConfig[]>(stations);
  const [editingModels, setEditingModels] = useState<BikeModel[]>(bikeModels);
  const [activeTab, setActiveTab] = useState<'stations' | 'models'>('stations');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [expandedStation, setExpandedStation] = useState<number | null>(null);
  
  // 新型号表单
  const [newModelName, setNewModelName] = useState('');
  const [newModelDesc, setNewModelDesc] = useState('');
  const [showAddModel, setShowAddModel] = useState(false);

  // 当弹窗打开时，同步最新的数据
  useEffect(() => {
    if (isOpen) {
      // 使用 setTimeout 延迟 setState 调用，避免 React 19 级联渲染问题
      const timer = setTimeout(() => {
        setEditingStations(stations);
        setEditingModels(bikeModels);
        setError('');
        setExpandedStation(null);
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [isOpen, stations, bikeModels]);

  // 检查骑行台是否有未来预约
  const checkStationBookings = (stationId: number): Booking[] => {
    const today = new Date().toISOString().split('T')[0];
    return allBookings.filter(b => 
      b.stationId === stationId && 
      b.date >= today && 
      b.status !== 'cancelled'
    );
  };

  // 添加新骑行台
  const handleAddStation = () => {
    const maxId = Math.max(0, ...editingStations.map(s => s.stationId));
    const newStation: StationConfig = {
      stationId: maxId + 1,
      bikeModelId: editingModels[0]?.id || '',
      status: 'available',
      name: `${maxId + 1}号骑行台`,
    };
    setEditingStations([...editingStations, newStation]);
    setExpandedStation(newStation.stationId);
  };

  // 删除骑行台
  const handleDeleteStation = (stationId: number) => {
    const futureBookings = checkStationBookings(stationId);
    if (futureBookings.length > 0) {
      setError(`该骑行台有 ${futureBookings.length} 个未来预约，无法删除`);
      return;
    }
    
    if (!confirm(`确定要删除${stationId}号骑行台吗？`)) return;
    
    setEditingStations(editingStations.filter(s => s.stationId !== stationId));
    setError('');
  };

  // 更新骑行台状态
  const handleUpdateStation = (stationId: number, updates: Partial<StationConfig>) => {
    setEditingStations(editingStations.map(s => 
      s.stationId === stationId ? { ...s, ...updates } : s
    ));
  };

  // 添加新型号
  const handleAddModel = () => {
    if (!newModelName.trim()) {
      setError('请输入型号名称');
      return;
    }
    
    const newId = newModelName.toLowerCase().replace(/\s+/g, '-');
    const exists = editingModels.find(m => m.id === newId);
    if (exists) {
      setError('该型号已存在');
      return;
    }
    
    const newModel: BikeModel = {
      id: newId,
      name: newModelName.trim(),
      description: newModelDesc.trim() || undefined,
    };
    
    setEditingModels([...editingModels, newModel]);
    setNewModelName('');
    setNewModelDesc('');
    setShowAddModel(false);
    setError('');
  };

  // 删除型号
  const handleDeleteModel = (modelId: string) => {
    const usedByStations = editingStations.filter(s => s.bikeModelId === modelId);
    if (usedByStations.length > 0) {
      setError(`该型号正在被 ${usedByStations.length} 个骑行台使用，无法删除`);
      return;
    }
    
    if (!confirm('确定要删除该型号吗？')) return;
    setEditingModels(editingModels.filter(m => m.id !== modelId));
    setError('');
  };

  // 保存
  const handleSave = async () => {
    if (editingStations.length === 0) {
      setError('至少需要一个骑行台');
      return;
    }
    
    if (editingModels.length === 0) {
      setError('至少需要一个型号');
      return;
    }
    
    setLoading(true);
    try {
      await onSave(editingStations, editingModels);
      onClose();
    } catch (err) {
      console.error('保存失败:', err);
      setError('保存失败');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col animate-zoom-in">
        {/* 头部 */}
        <div className="px-6 py-4 border-b flex items-center justify-between">
          <h3 className="text-lg font-bold text-gray-800">骑行台管理</h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-full">
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* 标签页 */}
        <div className="flex border-b">
          <button
            onClick={() => setActiveTab('stations')}
            className={cn(
              'flex-1 py-3 text-sm font-medium transition-colors',
              activeTab === 'stations' 
                ? 'text-orange-600 border-b-2 border-orange-600' 
                : 'text-gray-500 hover:text-gray-700'
            )}
          >
            骑行台 ({editingStations.length})
          </button>
          <button
            onClick={() => setActiveTab('models')}
            className={cn(
              'flex-1 py-3 text-sm font-medium transition-colors',
              activeTab === 'models' 
                ? 'text-orange-600 border-b-2 border-orange-600' 
                : 'text-gray-500 hover:text-gray-700'
            )}
          >
            型号管理 ({editingModels.length})
          </button>
        </div>

        {/* 内容区域 */}
        <div className="flex-1 overflow-y-auto p-4">
          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              {error}
            </div>
          )}

          {activeTab === 'stations' ? (
            <div className="space-y-3">
              {editingStations.map((station) => {
                const futureBookings = checkStationBookings(station.stationId);
                const isExpanded = expandedStation === station.stationId;
                
                return (
                  <div 
                    key={station.stationId} 
                    className={cn(
                      'border rounded-xl overflow-hidden transition-all',
                      station.status === 'available' ? 'border-gray-200' :
                      station.status === 'maintenance' ? 'border-orange-200 bg-orange-50/30' :
                      'border-gray-300 bg-gray-50'
                    )}
                  >
                    {/* 骑行台标题栏 */}
                    <div 
                      className="p-3 flex items-center justify-between cursor-pointer"
                      onClick={() => setExpandedStation(isExpanded ? null : station.stationId)}
                    >
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          'w-10 h-10 rounded-full flex items-center justify-center',
                          station.status === 'available' ? 'bg-green-100 text-green-600' :
                          station.status === 'maintenance' ? 'bg-orange-100 text-orange-600' :
                          'bg-gray-200 text-gray-500'
                        )}>
                          {station.status === 'maintenance' ? (
                            <Wrench className="w-5 h-5" />
                          ) : (
                            <span className="font-bold">{station.stationId}</span>
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-gray-800">{station.name}</p>
                          <p className="text-xs text-gray-500">
                            {editingModels.find(m => m.id === station.bikeModelId)?.name || '未设置型号'}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {futureBookings.length > 0 && (
                          <span className="text-xs bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full">
                            {futureBookings.length}个预约
                          </span>
                        )}
                        {isExpanded ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
                      </div>
                    </div>

                    {/* 展开的编辑区域 */}
                    {isExpanded && (
                      <div className="px-3 pb-3 border-t bg-gray-50/50">
                        <div className="pt-3 space-y-3">
                          {/* 名称编辑 */}
                          <div>
                            <label className="text-xs text-gray-500 mb-1 block">名称</label>
                            <Input
                              value={station.name || ''}
                              onChange={(e) => handleUpdateStation(station.stationId, { name: e.target.value })}
                              placeholder="如：1号骑行台"
                              className="text-sm"
                            />
                          </div>

                          {/* 型号选择 */}
                          <div>
                            <label className="text-xs text-gray-500 mb-1 block">型号</label>
                            <select
                              value={station.bikeModelId}
                              onChange={(e) => handleUpdateStation(station.stationId, { bikeModelId: e.target.value })}
                              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                            >
                              {editingModels.map(model => (
                                <option key={model.id} value={model.id}>{model.name}</option>
                              ))}
                            </select>
                          </div>

                          {/* 状态切换 */}
                          <div>
                            <label className="text-xs text-gray-500 mb-1 block">状态</label>
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleUpdateStation(station.stationId, { status: 'available' })}
                                className={cn(
                                  'flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors',
                                  station.status === 'available' 
                                    ? 'bg-green-500 text-white' 
                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                )}
                              >
                                <Power className="w-4 h-4 inline mr-1" />
                                正常
                              </button>
                              <button
                                onClick={() => handleUpdateStation(station.stationId, { status: 'maintenance' })}
                                className={cn(
                                  'flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors',
                                  station.status === 'maintenance' 
                                    ? 'bg-orange-500 text-white' 
                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                )}
                              >
                                <Wrench className="w-4 h-4 inline mr-1" />
                                维护
                              </button>
                              <button
                                onClick={() => handleUpdateStation(station.stationId, { status: 'disabled' })}
                                className={cn(
                                  'flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors',
                                  station.status === 'disabled' 
                                    ? 'bg-gray-600 text-white' 
                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                )}
                              >
                                停用
                              </button>
                            </div>
                          </div>

                          {/* 删除按钮 */}
                          <button
                            onClick={() => handleDeleteStation(station.stationId)}
                            disabled={futureBookings.length > 0}
                            className={cn(
                              'w-full py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-1',
                              futureBookings.length > 0
                                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                : 'bg-red-50 text-red-600 hover:bg-red-100'
                            )}
                          >
                            <Trash2 className="w-4 h-4" />
                            {futureBookings.length > 0 ? `有${futureBookings.length}个预约，无法删除` : '删除骑行台'}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}

              {/* 添加按钮 */}
              <button
                onClick={handleAddStation}
                className="w-full py-3 border-2 border-dashed border-gray-300 rounded-xl text-gray-500 hover:border-orange-400 hover:text-orange-500 transition-colors flex items-center justify-center gap-2"
              >
                <Plus className="w-5 h-5" />
                添加骑行台
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {/* 现有型号列表 */}
              {editingModels.map((model) => {
                const usedCount = editingStations.filter(s => s.bikeModelId === model.id).length;
                
                return (
                  <div key={model.id} className="p-3 border rounded-xl bg-gray-50">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-800">{model.name}</p>
                        {model.description && (
                          <p className="text-xs text-gray-500">{model.description}</p>
                        )}
                        <p className="text-xs text-gray-400 mt-1">ID: {model.id}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full">
                          {usedCount}台使用
                        </span>
                        <button
                          onClick={() => handleDeleteModel(model.id)}
                          disabled={usedCount > 0}
                          className={cn(
                            'p-2 rounded-lg',
                            usedCount > 0 
                              ? 'text-gray-300 cursor-not-allowed' 
                              : 'text-red-500 hover:bg-red-50'
                          )}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* 添加新型号 */}
              {showAddModel ? (
                <div className="p-4 border-2 border-orange-200 rounded-xl bg-orange-50/30 space-y-3">
                  <Input
                    placeholder="型号名称，如：Wahoo Kickr"
                    value={newModelName}
                    onChange={(e) => setNewModelName(e.target.value)}
                    className="bg-white"
                  />
                  <Input
                    placeholder="型号描述（可选）"
                    value={newModelDesc}
                    onChange={(e) => setNewModelDesc(e.target.value)}
                    className="bg-white"
                  />
                  <div className="flex gap-2">
                    <Button variant="outline" className="flex-1" onClick={() => setShowAddModel(false)}>
                      取消
                    </Button>
                    <Button 
                      className="flex-1 bg-orange-500 hover:bg-orange-600 text-white"
                      onClick={handleAddModel}
                      disabled={!newModelName.trim()}
                    >
                      添加
                    </Button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setShowAddModel(true)}
                  className="w-full py-3 border-2 border-dashed border-gray-300 rounded-xl text-gray-500 hover:border-orange-400 hover:text-orange-500 transition-colors flex items-center justify-center gap-2"
                >
                  <Plus className="w-5 h-5" />
                  添加新型号
                </button>
              )}
            </div>
          )}
        </div>

        {/* 底部按钮 */}
        <div className="p-4 border-t flex gap-3">
          <Button variant="outline" className="flex-1" onClick={onClose}>
            取消
          </Button>
          <Button 
            className="flex-1 bg-orange-500 hover:bg-orange-600 text-white"
            onClick={handleSave}
            disabled={loading}
          >
            {loading ? '保存中...' : '保存'}
          </Button>
        </div>
      </div>
    </div>
  );
}
