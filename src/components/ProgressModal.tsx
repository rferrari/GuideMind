'use client';

import { useState, useEffect } from 'react';

export interface ProgressStep {
  id: string;
  type: 'generating' | 'creating' | 'completed' | 'error';
  tutorialId?: string;
  tutorialTitle?: string;
  contentType?: 'text' | 'video';
  message: string;
  progress: number;
  timestamp: Date;
}

interface ProgressModalProps {
  isOpen: boolean;
  totalTutorials: number;
  downloadOptions: { format: 'scaffold' | 'full', type: 'text' | 'video' | 'both' };
  onCancel?: () => void;
}

export default function ProgressModal({ 
  isOpen, 
  totalTutorials, 
  downloadOptions,
  onCancel 
}: ProgressModalProps) {
  const [steps, setSteps] = useState<ProgressStep[]>([]);
  const [currentProgress, setCurrentProgress] = useState(0);
  const [rateLimit, setRateLimit] = useState<{ retryAfter: number; message: string } | null>(null);

  // Add initial steps when modal opens
  useEffect(() => {
    if (isOpen) {
      const initialSteps: ProgressStep[] = [
        {
          id: 'start',
          type: 'creating',
          message: 'Starting bundle creation...',
          progress: 0,
          timestamp: new Date()
        }
      ];
      setSteps(initialSteps);
      setCurrentProgress(0);
    }
  }, [isOpen]);

  // Function to add progress steps (to be called from DownloadManager)
  const addProgressStep = (step: Omit<ProgressStep, 'id' | 'timestamp'>) => {
    const newStep: ProgressStep = {
      ...step,
      id: `step-${Date.now()}-${Math.random()}`,
      timestamp: new Date()
    };
    
    setSteps(prev => [...prev, newStep]);
    setCurrentProgress(step.progress);
  };

  // Expose addProgressStep to parent
  useEffect(() => {
    if (isOpen && typeof window !== 'undefined') {
      (window as any).addProgressStep = addProgressStep;
    }
    
    return () => {
      if (typeof window !== 'undefined') {
        delete (window as any).addProgressStep;
      }
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const currentStep = steps[steps.length - 1];
  const isGenerating = steps.some(step => step.type === 'generating');
  const completedSteps = steps.filter(step => step.type === 'completed').length;
  const errorSteps = steps.filter(step => step.type === 'error').length;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-gray-800 rounded-lg max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-700">
          <div>
            <h2 className="text-xl font-bold text-white">
              Creating Tutorial Bundle
            </h2>
            <p className="text-gray-400 text-sm mt-1">
              {downloadOptions.format === 'scaffold' ? 'Scaffolds Only' : 'Full Content'} • {downloadOptions.type}
            </p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-blue-400">{currentProgress}%</div>
            <div className="text-gray-400 text-sm">
              {completedSteps} completed • {errorSteps} failed
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="px-6 pt-4">
          <div className="w-full bg-gray-700 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-500"
              style={{ width: `${currentProgress}%` }}
            />
          </div>
        </div>

        {/* Progress Steps */}
        <div className="flex-1 overflow-auto p-6">
          <div className="space-y-3">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-start gap-3">
                <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-sm ${
                  step.type === 'completed' ? 'bg-green-500 text-white' :
                  step.type === 'error' ? 'bg-red-500 text-white' :
                  step.type === 'generating' ? 'bg-blue-500 text-white animate-pulse' :
                  'bg-gray-600 text-gray-300'
                }`}>
                  {step.type === 'completed' ? '✓' :
                   step.type === 'error' ? '✕' :
                   step.type === 'generating' ? '⟳' : '●'}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start">
                    <p className={`text-sm ${
                      step.type === 'error' ? 'text-red-300' : 'text-gray-300'
                    }`}>
                      {step.message}
                    </p>
                    <span className="text-xs text-gray-500 flex-shrink-0 ml-2">
                      {step.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  
                  {step.tutorialTitle && step.contentType && (
                    <p className="text-xs text-gray-500 mt-1">
                      {step.tutorialTitle} • {step.contentType}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>

{rateLimit && (
  <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
    <div className="flex items-center gap-3">
      <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <div>
        <p className="text-sm font-medium text-red-800 dark:text-red-300">Rate Limit Reached</p>
        <p className="text-xs text-red-600 dark:text-red-400 mt-1">
          Please wait {Math.ceil(rateLimit.retryAfter / 60)} minutes before retrying
        </p>
      </div>
    </div>
  </div>
)}

          {/* Current Status */}
          {currentStep && (
            <div className="mt-6 p-4 bg-gray-700 rounded-lg">
              <div className="flex items-center gap-3">
                {isGenerating ? (
                  <svg className="animate-spin h-5 w-5 text-blue-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                ) : (
                  <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                )}
                <div>
                  <p className="text-sm font-medium text-white">{currentStep.message}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    Processing {totalTutorials} tutorials • {downloadOptions.type} content
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center p-6 border-t border-gray-700">
          <div className="text-sm text-gray-400">
            {steps.length} steps • {Math.round((Date.now() - (steps[0]?.timestamp.getTime() || Date.now())) / 1000)}s
          </div>
          <button
            onClick={onCancel}
            disabled={!isGenerating}
            className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-500 disabled:bg-gray-700 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}