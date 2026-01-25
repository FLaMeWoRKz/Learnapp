import { useEffect, useState } from 'react';

interface TimerProps {
  duration: number; // in seconds
  onComplete?: () => void;
  onTick?: (remaining: number) => void;
  className?: string;
}

export default function Timer({ duration, onComplete, onTick, className = '' }: TimerProps) {
  const [remaining, setRemaining] = useState(duration);

  useEffect(() => {
    if (remaining <= 0) {
      onComplete?.();
      return;
    }

    const interval = setInterval(() => {
      setRemaining((prev) => {
        const newValue = prev - 1;
        onTick?.(newValue);
        if (newValue <= 0) {
          onComplete?.();
        }
        return newValue;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [remaining, onComplete, onTick]);

  const percentage = (remaining / duration) * 100;
  const color = remaining <= 5 ? 'bg-red-500' : remaining <= 10 ? 'bg-yellow-500' : 'bg-primary-500';

  return (
    <div className={`w-full ${className}`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Verbleibende Zeit
        </span>
        <span className="text-lg font-bold text-gray-900 dark:text-white">
          {remaining}s
        </span>
      </div>
      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
        <div
          className={`${color} h-2 rounded-full transition-all duration-1000`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
