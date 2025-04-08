import { useEffect, useCallback, useRef, useState } from "react";

interface TimerProps {
  color: "white" | "black";
  isActive: boolean;
  isCurrentTurn: boolean;
  className?: string;
  onTimeOut: (color: "white" | "black") => void;
  reset?: boolean;
}

export const TimerComponent = ({
  color,
  isActive,
  isCurrentTurn,
  className,
  onTimeOut,
  reset
}: TimerProps) => {
  const [time, setTime] = useState<number>(300); // 5 minutes in seconds
  const timerInterval = useRef<NodeJS.Timeout | null>(null);
  const warningSound = useRef<HTMLAudioElement | null>(null);

  const formatTime = useCallback((seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }, []);

  const startTimer = useCallback(() => {
    if (!isActive || !isCurrentTurn) return;
    
    timerInterval.current = setInterval(() => {
      setTime(prev => {
        if (prev <= 0) {
          clearInterval(timerInterval.current!);
          onTimeOut(color);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, [isActive, isCurrentTurn, color, onTimeOut]);

  const stopTimer = useCallback(() => {
    if (timerInterval.current) {
      clearInterval(timerInterval.current);
      timerInterval.current = null;
    }
  }, []);

  useEffect(() => {
    // Handle timer activation/state changes
    if (isActive && isCurrentTurn) {
      startTimer();
    } else {
      stopTimer();
    }
    
    return () => stopTimer();
  }, [isActive, isCurrentTurn, startTimer, stopTimer]);

  useEffect(() => {
    // Play warning sound when time is low
    if (time <= 10 && time > 0 && isCurrentTurn) {
      warningSound.current = new Audio('/sounds/time-warning.mp3');
      warningSound.current.play();
    }
    
    return () => {
      if (warningSound.current) {
        warningSound.current.pause();
        warningSound.current = null;
      }
    };
  }, [time, isCurrentTurn]);

  useEffect(() => {
    // Reset timer when reset prop changes
    if (reset) {
      setTime(300);
      stopTimer();
    }
  }, [reset, stopTimer]);

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className={`p-2 rounded-lg ${
        isCurrentTurn ? 'bg-amber-100 border-2 border-amber-400' : 'bg-gray-100'
      }`}>
        <span className={`font-mono text-lg ${
          time <= 10 ? 'text-red-600' : 'text-gray-800'
        }`}>
          {formatTime(time)}
        </span>
      </div>
      <span className="text-sm text-gray-600 hidden sm:block">
        {color.charAt(0).toUpperCase() + color.slice(1)}
      </span>
    </div>
  );
};