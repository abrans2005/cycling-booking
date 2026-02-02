import { cn } from '@/lib/utils';
import { Timer } from 'lucide-react';

interface DurationSelectorProps {
  duration: number;
  onSelectDuration: (duration: number) => void;
}

const durationOptions = [
  { value: 1, label: '1小时', price: 100 },
  { value: 1.5, label: '1.5小时', price: 150 },
  { value: 2, label: '2小时', price: 200 },
  { value: 2.5, label: '2.5小时', price: 250 },
  { value: 3, label: '3小时', price: 300 },
];

export function DurationSelector({ duration, onSelectDuration }: DurationSelectorProps) {
  return (
    <div className="py-4 bg-white border-b">
      <div className="px-4 mb-3 flex items-center gap-2">
        <Timer className="w-4 h-4 text-gray-500" />
        <h2 className="text-sm font-medium text-gray-700">选择时长</h2>
      </div>
      
      <div className="px-4 grid grid-cols-3 gap-2">
        {durationOptions.map((option) => (
          <button
            key={option.value}
            onClick={() => onSelectDuration(option.value)}
            className={cn(
              'py-4 px-2 rounded-lg border text-center transition-all',
              duration === option.value
                ? 'border-orange-500 bg-orange-50'
                : 'border-gray-200 bg-white hover:border-orange-300'
            )}
          >
            <div className={cn(
              'text-base font-medium',
              duration === option.value ? 'text-orange-600' : 'text-gray-700'
            )}>
              {option.label}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
