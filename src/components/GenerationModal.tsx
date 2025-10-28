'use client';

import { useState, useEffect } from 'react';
import { TutorialScaffold } from '@/types';
import MarkdownEditor from './MarkdownEditor';

interface GenerationModalProps {
  isOpen: boolean;
  onClose: () => void;
  tutorial: TutorialScaffold;
  type: 'text' | 'video';
  originalUrl: string;
  onContentUpdate: (content: string) => void;
}

export default function GenerationModal({ 
  isOpen, 
  onClose, 
  tutorial, 
  type, 
  originalUrl,
  onContentUpdate 
}: GenerationModalProps) {
  const [generatedContent, setGeneratedContent] = useState<string>('');
  const [status, setStatus] = useState<'generating' | 'completed' | 'error'>('generating');
  const [isEnhancing, setIsEnhancing] = useState(false);

  // Reset state when tutorial changes or modal opens
  useEffect(() => {
    if (isOpen) {
      // Reset content and status when modal opens with a new tutorial
      setGeneratedContent('');
      setStatus('generating');
      setIsEnhancing(false);
      generateTutorialContent();
    }
  }, [isOpen, tutorial.id, type]); // Reset when tutorial ID or type changes

  const generateTutorialContent = async (enhancementPrompt?: string) => {
    try {
      if (enhancementPrompt) {
        setIsEnhancing(true);
      } else {
        setStatus('generating');
        setGeneratedContent(''); // Clear previous content
      }
      
      const response = await fetch('/api/generate-tutorial', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tutorial,
          type,
          originalUrl,
          enhancementPrompt,
          existingContent: enhancementPrompt ? generatedContent : undefined
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate content');
      }

      const data = await response.json();
      setGeneratedContent(data.content);
      setStatus('completed');
      setIsEnhancing(false);
      
      // Notify parent component about the new content
      onContentUpdate(data.content);
    } catch (error) {
      console.error('Generation error:', error);
      setStatus('error');
      setIsEnhancing(false);
    }
  };

  const handleEnhance = (enhancementPrompt: string) => {
    generateTutorialContent(enhancementPrompt);
  };

  const handleContentChange = (content: string) => {
    setGeneratedContent(content);
    onContentUpdate(content);
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

  // Reset when modal closes
  const handleClose = () => {
    setGeneratedContent('');
    setStatus('generating');
    setIsEnhancing(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-gray-800 rounded-lg max-w-7xl w-full max-h-[95vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-700">
          <div>
            <h2 className="text-xl font-bold text-white">
              {type === 'text' ? 'Text Tutorial' : 'Video Script'} - {tutorial.title}
            </h2>
            <p className="text-gray-400 text-sm mt-1">
              {isEnhancing ? 'Enhancing content...' : 
               status === 'generating' ? 'Generating content...' :
               status === 'completed' ? 'Content ready! Edit and enhance below.' : 
               'Error generating content'}
            </p>
          </div>
          <div className="flex gap-2">
            {status === 'completed' && (
              <button
                onClick={downloadContent}
                className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors text-sm"
              >
                Download {type === 'text' ? 'Markdown' : 'Script'}
              </button>
            )}
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-white transition-colors p-2"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
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
                <p className="text-gray-400 text-sm mt-2">Creating content for: {tutorial.title}</p>
              </div>
            </div>
          )}

          {status === 'completed' && (
            <div className="space-y-6">
              <MarkdownEditor 
                content={generatedContent}
                onContentChange={handleContentChange}
                onEnhance={handleEnhance}
              />
              
              {isEnhancing && (
                <div className="flex items-center justify-center py-4 bg-blue-900/20 rounded-md">
                  <svg className="animate-spin h-5 w-5 text-blue-500 mr-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span className="text-blue-300">Applying enhancements...</span>
                </div>
              )}
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
                onClick={() => generateTutorialContent()}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
              >
                Retry Generation
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}