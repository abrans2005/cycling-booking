import { useState } from 'react';
import { cn } from '@/lib/utils';
import { User, Phone, FileText, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

interface BookingFormProps {
  memberName: string;
  memberPhone: string;
  notes: string;
  onUpdateName: (name: string) => void;
  onUpdatePhone: (phone: string) => void;
  onUpdateNotes: (notes: string) => void;
  onSubmit: () => void;
  canSubmit: boolean;
}

export function BookingForm({
  memberName,
  memberPhone,
  notes,
  onUpdateName,
  onUpdatePhone,
  onUpdateNotes,
  onSubmit,
  canSubmit,
}: BookingFormProps) {
  const [errors, setErrors] = useState<{ name?: string; phone?: string }>({});

  const validatePhone = (phone: string) => {
    const regex = /^1[3-9]\d{9}$/;
    return regex.test(phone);
  };

  const handleSubmit = () => {
    const newErrors: { name?: string; phone?: string } = {};
    
    if (!memberName.trim()) {
      newErrors.name = '请输入姓名';
    }
    
    if (!memberPhone.trim()) {
      newErrors.phone = '请输入手机号';
    } else if (!validatePhone(memberPhone)) {
      newErrors.phone = '请输入正确的手机号';
    }
    
    setErrors(newErrors);
    
    if (Object.keys(newErrors).length === 0) {
      onSubmit();
    }
  };

  return (
    <div className="py-4 bg-white">
      <div className="px-4 mb-3 flex items-center gap-2">
        <User className="w-4 h-4 text-gray-500" />
        <h2 className="text-sm font-medium text-gray-700">预约信息</h2>
      </div>
      
      <div className="px-4 space-y-4">
        {/* 姓名 */}
        <div className="space-y-1.5">
          <Label htmlFor="name" className="text-sm text-gray-600">
            姓名 <span className="text-red-500">*</span>
          </Label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              id="name"
              placeholder="请输入您的姓名"
              value={memberName}
              onChange={(e) => {
                onUpdateName(e.target.value);
                if (errors.name) setErrors(prev => ({ ...prev, name: undefined }));
              }}
              className={cn(
                'pl-10',
                errors.name && 'border-red-500 focus-visible:ring-red-500'
              )}
            />
          </div>
          {errors.name && (
            <p className="text-xs text-red-500 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              {errors.name}
            </p>
          )}
        </div>

        {/* 手机号 */}
        <div className="space-y-1.5">
          <Label htmlFor="phone" className="text-sm text-gray-600">
            手机号 <span className="text-red-500">*</span>
          </Label>
          <div className="relative">
            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              id="phone"
              type="tel"
              placeholder="请输入您的手机号"
              value={memberPhone}
              onChange={(e) => {
                onUpdatePhone(e.target.value);
                if (errors.phone) setErrors(prev => ({ ...prev, phone: undefined }));
              }}
              maxLength={11}
              className={cn(
                'pl-10',
                errors.phone && 'border-red-500 focus-visible:ring-red-500'
              )}
            />
          </div>
          {errors.phone && (
            <p className="text-xs text-red-500 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              {errors.phone}
            </p>
          )}
        </div>

        {/* 备注 */}
        <div className="space-y-1.5">
          <Label htmlFor="notes" className="text-sm text-gray-600">
            备注 <span className="text-gray-400">（选填）</span>
          </Label>
          <div className="relative">
            <FileText className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
            <Textarea
              id="notes"
              placeholder="如有特殊需求请在此说明"
              value={notes}
              onChange={(e) => onUpdateNotes(e.target.value)}
              className="pl-10 min-h-[80px] resize-none"
            />
          </div>
        </div>

        {/* 提交按钮 */}
        <Button
          onClick={handleSubmit}
          disabled={!canSubmit}
          className={cn(
            'w-full py-6 text-lg font-medium rounded-xl transition-all mt-6',
            canSubmit
              ? 'bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white shadow-lg shadow-orange-500/30'
              : 'bg-gray-200 text-gray-400 cursor-not-allowed'
          )}
        >
          {canSubmit ? '确认预约' : '请完善预约信息'}
        </Button>

        <p className="text-xs text-gray-400 text-center">
          预约成功后，请按时到店开始训练
        </p>
      </div>
    </div>
  );
}
