// src/components/RateLimitCard.tsx
'use client';

import { useState, useEffect } from 'react';

interface RateLimitCardProps {
  retryAfter?: number;
  onRetry?: () => void;
}

export default function RateLimitCard({ retryAfter, onRetry }: RateLimitCardProps) {
  const [timeLeft, setTimeLeft] = useState(retryAfter || 0);

  useEffect(() => {
    if (retryAfter && retryAfter > 0) {
      setTimeLeft(retryAfter);

      const timer = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [retryAfter]);

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="border border-orange-500 rounded-lg p-6 bg-orange-50 dark:bg-orange-900/20">
      <div className="flex items-center gap-3">
        <div className="text-2xl">⏰</div>
        <div className="flex-1">
          <h3 className="font-semibold text-orange-800 dark:text-orange-300">
            Rate Limit Reached
          </h3>
          <p className="text-orange-700 dark:text-orange-400 text-sm mt-1">
            Our AI service needs a quick break. 
          </p>
          
          {timeLeft > 0 ? (
            <div className="flex items-center gap-2 mt-2">
              <svg className="w-4 h-4 animate-spin text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-orange-600 dark:text-orange-400 text-sm">
                Try again in: <strong>{formatTime(timeLeft)}</strong>
              </span>
            </div>
          ) : (
            <p className="text-green-600 dark:text-green-400 text-sm mt-2">
              ✅ Ready to try again!
            </p>
          )}
          
          {onRetry && (
            <button
              onClick={onRetry}
              disabled={timeLeft > 0}
              className="mt-3 bg-orange-600 text-white px-4 py-2 rounded-md hover:bg-orange-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-sm transition-colors"
            >
              {timeLeft > 0 ? 'Please wait...' : 'Try Again Now'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}