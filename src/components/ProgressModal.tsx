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
  onDownload?: (blob: Blob, filename: string) => void;
  onCancel?: () => void;
  downloadReady?: boolean;
  onClose?: () => void;
  // Add these new props for single button approach
  downloadState?: 'idle' | 'generating' | 'ready';
  downloadData?: { blob: Blob; filename: string } | null;
  onGenerateAndDownload?: () => void;
  onDownloadReady?: () => void;
}

export default function ProgressModal({
  isOpen,
  totalTutorials,
  downloadOptions,
  onDownload,
  onCancel,
  downloadReady = false,
  onClose,
  // New props
  downloadState = 'idle',
  downloadData = null,
  onGenerateAndDownload,
  onDownloadReady
}: ProgressModalProps) {
  const [steps, setSteps] = useState<ProgressStep[]>([]);
  const [currentProgress, setCurrentProgress] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [isDownloaded, setIsDownloaded] = useState(false);
  const [hasErrors, setHasErrors] = useState(false);

  // Reset state when modal opens
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
      setIsComplete(false);
      setHasErrors(false);
    }
  }, [isOpen]);

  // Function to add progress steps
  const addProgressStep = (step: Omit<ProgressStep, 'id' | 'timestamp'>) => {
    const newStep: ProgressStep = {
      ...step,
      id: `step-${Date.now()}-${Math.random()}`,
      timestamp: new Date()
    };

    setSteps(prev => [...prev, newStep]);
    setCurrentProgress(step.progress);

    // Check if complete or has errors
    if (step.progress === 100 &&
      step.type === 'completed' &&
      step.message.includes('DOWNLOAD READY')) {
      // if (step.type === 'completed' && step.progress === 100) {
      setIsComplete(true);
      // Notify parent that download is ready
      if (onDownloadReady) {
        onDownloadReady();
      }
    }
    if (step.type === 'error') {
      setHasErrors(true);
    }
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


  // Update the handleMainButtonClick
  const handleMainButtonClick = () => {
    if (downloadState === 'ready' && downloadData) {
      // Actually download the file
      if (onDownload) {
        onDownload(downloadData.blob, downloadData.filename);
        setIsDownloaded(true);
        // Auto-close after download
        setTimeout(() => {
          if (onClose) onClose();
        }, 2000);
      }
    } else if (downloadState === 'idle' && onGenerateAndDownload) {
      // Start the generation process
      onGenerateAndDownload();
    }
  };

  const handleClose = () => {
    if (onClose) {
      onClose();
    }
  };

  if (!isOpen) return null;

  const currentStep = steps[steps.length - 1];
  const isGenerating = steps.some(step => step.type === 'generating');
  const completedSteps = steps.filter(step => step.type === 'completed').length;
  const errorSteps = steps.filter(step => step.type === 'error').length;

  // Determine button state and text
  // Determine button state and text
  const getButtonConfig = () => {
    switch (downloadState) {
      case 'generating':
        return {
          text: (
            <span className="flex items-center gap-2">
              <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Generating...
            </span>
          ),
          bgColor: 'bg-blue-600',
          hoverColor: 'hover:bg-blue-700', // Add 'hover:' prefix
          disabled: true
        };
      case 'ready':
        return {
          text: '📥 Download Now!',
          bgColor: 'bg-green-600',
          hoverColor: 'hover:bg-green-700', // Add 'hover:' prefix
          disabled: false
        };
      default: // idle
        return {
          text: 'Generate & Download',
          bgColor: 'bg-blue-600',
          hoverColor: 'hover:bg-blue-700', // Add 'hover:' prefix
          disabled: false
        };
    }
  };

  const buttonConfig = getButtonConfig();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-gray-800 rounded-lg max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-700">
          <div>
            <h2 className="text-xl font-bold text-white">
              {downloadState === 'ready' ? 'Bundle Ready!' :
                downloadState === 'generating' ? 'Creating Tutorial Bundle' :
                  'Ready to Generate'}
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
              className={`h-2 rounded-full transition-all duration-500 ${hasErrors ? 'bg-red-500' :
                downloadState === 'ready' ? 'bg-green-500' :
                  'bg-blue-600'
                }`}
              style={{ width: `${currentProgress}%` }}
            />
          </div>
        </div>

        {/* Progress Steps */}
        <div className="flex-1 overflow-auto p-6">
          <div className="space-y-3">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-start gap-3">
                <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-sm ${step.type === 'completed' ? 'bg-green-500 text-white' :
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
                    <p className={`text-sm ${step.type === 'error' ? 'text-red-300' : 'text-gray-300'
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

          {/* Completion Message */}
          {downloadState === 'ready' && (
            <div className={`mt-6 p-4 rounded-lg ${hasErrors ? 'bg-yellow-900/20 border border-yellow-700' : 'bg-green-900/20 border border-green-700'
              }`}>
              <div className="flex items-center gap-3">
                <div className={`text-2xl ${hasErrors ? 'text-yellow-400' : 'text-green-400'}`}>
                  {hasErrors ? '⚠️' : '✅'}
                </div>
                <div>
                  <p className={`text-sm font-medium ${hasErrors ? 'text-yellow-300' : 'text-green-300'}`}>
                    {hasErrors ? 'Bundle created with some templates' : 'Bundle created successfully!'}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    {hasErrors
                      ? 'Some tutorials used fallback templates due to generation issues.'
                      : 'All content has been generated and bundled.'
                    }
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

          <div className="flex gap-2">
            {downloadState === 'generating' ? (
              <button
                onClick={onCancel}
                className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-500 transition-colors"
              >
                Cancel
              </button>
            ) : isDownloaded ? (
              <button
                onClick={handleClose}
                className="bg-green-600 text-white px-6 py-2 rounded-md hover:bg-green-700 transition-colors"
              >
                ✅ Download Complete - Close
              </button>
            ) : (
              <>
                <button
                  onClick={handleClose}
                  className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-500 transition-colors"
                >
                  Close
                </button>
                <button
                  onClick={handleMainButtonClick}
                  disabled={buttonConfig.disabled}
                  className={`${buttonConfig.bgColor} text-white px-6 py-2 rounded-md ${buttonConfig.hoverColor} transition-colors disabled:bg-gray-600 disabled:text-gray-400 disabled:cursor-not-allowed flex items-center gap-2`}
                >
                  {buttonConfig.text}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}