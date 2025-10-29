'use client';

import { useState, useEffect } from 'react';

interface RateLimitCardProps {
  retryAfter?: number; // in seconds
  onRetry?: () => void;
}

export default function RateLimitCard({ retryAfter, onRetry }: RateLimitCardProps) {
  const [timeLeft, setTimeLeft] = useState(retryAfter || 0);
  const [canRetry, setCanRetry] = useState(retryAfter ? false : true);

  useEffect(() => {
    if (retryAfter && retryAfter > 0) {
      setTimeLeft(retryAfter);
      setCanRetry(false);

      const timer = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            setCanRetry(true);
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
    <div className="border border-orange-500 rounded-lg p-6 bg-orange-50 dark:bg-orange-900/20 shadow-lg">
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0">
          <div className="w-12 h-12 bg-orange-100 dark:bg-orange-800 rounded-full flex items-center justify-center">
            <svg className="w-6 h-6 text-orange-600 dark:text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </div>
        
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-orange-800 dark:text-orange-300 mb-2">
            ⏳ Rate Limit Reached - Demo Version
          </h3>
          
          <div className="space-y-3 text-orange-700 dark:text-orange-400">
            <p className="text-sm">
              This is a demo version with limited AI credits. We've hit the daily rate limit for tutorial generation.
            </p>
            
            <div className="bg-orange-100 dark:bg-orange-800/50 rounded-lg p-3">
              <p className="text-xs font-medium mb-1">What you can do:</p>
              <ul className="text-xs space-y-1">
                <li>• Wait a few minutes and try again</li>
                <li>• Use the "Generate Different Ideas" button for new suggestions</li>
                <li>• Download existing tutorial scaffolds to work with manually</li>
                <li>• Check back later when limits reset</li>
              </ul>
            </div>

            {!canRetry && retryAfter && (
              <div className="flex items-center gap-2 text-sm">
                <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>You can retry in: <strong>{formatTime(timeLeft)}</strong></span>
              </div>
            )}

            {canRetry && onRetry && (
              <button
                onClick={onRetry}
                className="bg-orange-600 text-white px-4 py-2 rounded-md hover:bg-orange-700 transition-colors text-sm"
              >
                Try Again Now
              </button>
            )}
          </div>
        </div>
      </div>
      
      <div className="mt-4 pt-3 border-t border-orange-200 dark:border-orange-700">
        <p className="text-xs text-orange-600 dark:text-orange-500">
          💡 <strong>Pro Tip:</strong> For unlimited access, consider setting up your own API key in the environment variables.
        </p>
      </div>
    </div>
  );
}