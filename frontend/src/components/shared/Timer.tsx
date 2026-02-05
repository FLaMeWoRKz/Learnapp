import { useEffect, useState, useRef } from 'react';

interface TimerProps {
  duration: number; // in seconds
  onComplete?: () => void;
  onTick?: (remaining: number) => void;
  className?: string;
}

export default function Timer({ duration, onComplete, onTick, className = '' }: TimerProps) {
  const [remaining, setRemaining] = useState(duration);
  const onCompleteRef = useRef(onComplete);
  const onTickRef = useRef(onTick);
  const hasFiredRef = useRef(false);

  // Keep refs up to date without triggering effect re-run
  onCompleteRef.current = onComplete;
  onTickRef.current = onTick;

  useEffect(() => {
    // Reset state when duration or key changes (via parent remount)
    hasFiredRef.current = false;
    setRemaining(duration);
    
    if (duration <= 0) {
      onCompleteRef.current?.();
      return;
    }

    const startTime = Date.now();
    let animationFrameId: number;

    const update = () => {
      const now = Date.now();
      const elapsed = (now - startTime) / 1000;
      const newRemaining = Math.max(0, duration - elapsed);

      setRemaining(newRemaining);
      onTickRef.current?.(newRemaining);

      if (newRemaining <= 0 && !hasFiredRef.current) {
        hasFiredRef.current = true;
        onCompleteRef.current?.();
        return;
      }

      animationFrameId = requestAnimationFrame(update);
    };

    animationFrameId = requestAnimationFrame(update);

    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [duration]); // Nur duration - verhindert Doppeldurchlauf durch wechselnde Callback-Referenzen

  const percentage = (remaining / duration) * 100;
  const color = remaining <= 5 ? 'bg-red-500' : remaining <= 10 ? 'bg-yellow-500' : 'bg-primary-500';

  return (
    <div className={`w-full ${className}`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Verbleibende Zeit
        </span>
        <span className="text-lg font-bold text-gray-900 dark:text-white">
          {Math.ceil(remaining)}s
        </span>
      </div>
      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
        <div
          className={`${color} h-3 rounded-full`}
          style={{ 
            width: `${percentage}%`,
            transition: 'none' // No transition for smooth animation
          }}
        />
      </div>
    </div>
  );
}
