'use client';

import { useState, useEffect } from 'react';
import { TutorialScaffold, GeneratedTutorial } from '@/types';

interface GenerationModalProps {
  isOpen: boolean;
  onClose: () => void;
  tutorial: TutorialScaffold;
  type: 'text' | 'video';
  originalUrl: string;
}

export default function GenerationModal({ 
  isOpen, 
  onClose, 
  tutorial, 
  type, 
  originalUrl 
}: GenerationModalProps) {
  const [generatedContent, setGeneratedContent] = useState<string>('');
  const [status, setStatus] = useState<'generating' | 'completed' | 'error'>('generating');

  useEffect(() => {
    if (isOpen) {
      generateTutorialContent();
    }
  }, [isOpen]);

  const generateTutorialContent = async () => {
    try {
      setStatus('generating');
      
      const response = await fetch('/api/generate-tutorial', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tutorial,
          type,
          originalUrl
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate content');
      }

      const data = await response.json();
      setGeneratedContent(data.content);
      setStatus('completed');
    } catch (error) {
      console.error('Generation error:', error);
      setStatus('error');
    }
  };

  const downloadContent = () => {
    const extension = type === 'text' ? 'md' : 'txt';
    const filename = `${tutorial.title.toLowerCase().replace(/[^a-z0-9]/g, '-')}.${extension}`;
    
    const blob = new Blob([generatedContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-gray-800 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-700">
          <div>
            <h2 className="text-xl font-bold text-white">
              {type === 'text' ? 'Text Tutorial' : 'Video Script'} - {tutorial.title}
            </h2>
            <p className="text-gray-400 text-sm mt-1">
              {type === 'text' ? 'Generating complete tutorial content...' : 'Generating video script with scene descriptions...'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6">
          {status === 'generating' && (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <svg className="animate-spin h-12 w-12 text-blue-500 mx-auto mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <p className="text-gray-300">Generating {type === 'text' ? 'tutorial content' : 'video script'}... This may take a minute.</p>
              </div>
            </div>
          )}

          {status === 'completed' && (
            <div className="space-y-4">
              <div className="flex justify-end">
                <button
                  onClick={downloadContent}
                  className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors"
                >
                  Download {type === 'text' ? 'Markdown' : 'Script'}
                </button>
              </div>
              <pre className="bg-gray-900 p-4 rounded-md text-gray-200 whitespace-pre-wrap text-sm max-h-96 overflow-auto">
                {generatedContent}
              </pre>
            </div>
          )}

          {status === 'error' && (
            <div className="text-center py-12">
              <div className="text-red-400 mb-4">
                <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-gray-300 mb-4">Failed to generate content. Please try again.</p>
              <button
                onClick={generateTutorialContent}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
              >
                Retry
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}