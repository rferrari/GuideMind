'use client';

import { useState } from 'react';
import MDEditor from '@uiw/react-md-editor';

interface MarkdownEditorProps {
  content: string;
  onContentChange: (content: string) => void;
  onEnhance: (enhancementPrompt: string) => void;
}

export default function MarkdownEditor({ content, onContentChange, onEnhance }: MarkdownEditorProps) {
  const [viewMode, setViewMode] = useState<'edit' | 'preview'>('edit');
  const [customPrompt, setCustomPrompt] = useState('');

  const enhancementPrompts = [
    {
      id: 'more-engaging',
      text: 'Make this more engaging and conversational. Add storytelling elements and practical examples.',
      description: 'Add storytelling & examples'
    },
    {
      id: 'informal',
      text: 'Rewrite in a more informal, friendly tone. Use casual language and avoid technical jargon where possible.',
      description: 'Casual & friendly tone'
    },
    {
      id: 'professional',
      text: 'Make this more professional and formal. Use precise technical language and structured explanations.',
      description: 'Professional & formal'
    },
    {
      id: 'beginner',
      text: 'Simplify for absolute beginners. Break down complex concepts, add more explanations, and use analogies.',
      description: 'Beginner-friendly'
    },
    {
      id: 'advanced',
      text: 'Make this more advanced and in-depth. Assume technical expertise and dive deeper into complex topics.',
      description: 'Advanced & technical'
    },
    {
      id: 'concise',
      text: 'Make this more concise and to the point. Remove unnecessary explanations and focus on key information.',
      description: 'Concise & direct'
    },
    {
      id: 'code-examples',
      text: 'Add more code examples and practical implementations. Include code snippets for each major concept.',
      description: 'More code examples'
    },
    {
      id: 'troubleshooting',
      text: 'Add troubleshooting section and common pitfalls. Include solutions for typical problems users might encounter.',
      description: 'Add troubleshooting'
    }
  ];

  const handleQuickEnhance = (promptText: string) => {
    onEnhance(promptText);
  };

  const handleCustomEnhance = () => {
    if (customPrompt.trim()) {
      onEnhance(customPrompt.trim());
      setCustomPrompt('');
    }
  };

  return (
    <div className="space-y-4">
      {/* Header with View Mode Toggle */}
      <div className="flex justify-between items-center">
        <div className="flex gap-1 bg-gray-700 rounded-md p-1">
          <button
            onClick={() => setViewMode('edit')}
            className={`px-3 py-1 rounded text-sm transition-colors ${viewMode === 'edit'
              ? 'bg-gray-600 text-white'
              : 'text-gray-300 hover:text-white'
              }`}
          >
            Edit
          </button>
          <button
            onClick={() => setViewMode('preview')}
            className={`px-3 py-1 rounded text-sm transition-colors ${viewMode === 'preview'
              ? 'bg-gray-600 text-white'
              : 'text-gray-300 hover:text-white'
              }`}
          >
            Preview
          </button>
          {/* <button
            onClick={() => setViewMode('split')}
            className={`px-3 py-1 rounded text-sm transition-colors ${
              viewMode === 'split' 
                ? 'bg-gray-600 text-white' 
                : 'text-gray-300 hover:text-white'
            }`}
          >
            Split
          </button> */}
        </div>

        <div className="text-sm text-gray-400">
          {viewMode === 'edit' && 'Editing Mode'}
          {viewMode === 'preview' && 'Preview Mode'}
          {/* {viewMode === 'split' && 'Split View'} */}
        </div>
      </div>

      {/* Markdown Editor */}
      <div className="border border-gray-600 rounded-md overflow-hidden" data-color-mode="dark">
        <MDEditor
          value={content}
          onChange={(value) => onContentChange(value || '')}
          height={400}
          visibleDragbar={false}
          preview={viewMode}
          style={{
            backgroundColor: '#1f2937',
            color: 'white'
          }}
        />
      </div>

      {/* Enhancement Section */}
      <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
        <h3 className="text-lg font-semibold text-white mb-4">Enhance Content with AI</h3>

        {/* Quick Enhancement Prompts */}
        <div className="mb-6">
          <h4 className="text-sm font-medium text-gray-300 mb-3">Quick Enhancements:</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2">
            {enhancementPrompts.map((prompt) => (
              <button
                key={prompt.id}
                onClick={() => handleQuickEnhance(prompt.text)}
                className="bg-gray-700 text-gray-200 px-3 py-2 rounded-md hover:bg-gray-600 transition-colors text-left text-sm group"
              >
                <div className="font-medium group-hover:text-white">{prompt.description}</div>
                <div className="text-gray-400 text-xs mt-1 line-clamp-2">{prompt.text}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Custom Enhancement */}
        <div>
          <h4 className="text-sm font-medium text-gray-300 mb-2">Custom Enhancement:</h4>
          <div className="flex gap-2">
            <input
              type="text"
              value={customPrompt}
              onChange={(e) => setCustomPrompt(e.target.value)}
              placeholder="E.g., 'Add more code examples', 'Make it shorter', 'Focus on security aspects'..."
              className="flex-1 bg-gray-700 border border-gray-600 text-white placeholder-gray-400 rounded-md px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              onKeyPress={(e) => e.key === 'Enter' && handleCustomEnhance()}
            />
            <button
              onClick={handleCustomEnhance}
              disabled={!customPrompt.trim()}
              className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors text-sm whitespace-nowrap"
            >
              Enhance
            </button>
          </div>

          {/* Enhancement Examples */}
          <div className="mt-3 p-3 bg-gray-750 rounded-md">
            <h5 className="text-xs font-medium text-gray-300 mb-2">Enhancement Examples:</h5>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-1 text-gray-400 text-xs">
              <div>• "Add step-by-step code examples"</div>
              <div>• "Include troubleshooting tips"</div>
              <div>• "Make it more practical with real-world use cases"</div>
              <div>• "Focus on performance optimization"</div>
              <div>• "Add comparison tables"</div>
              <div>• "Include screenshots or diagrams"</div>
              <div>• "Make it more concise"</div>
              <div>• "Add exercises or challenges"</div>
            </div>
          </div>
        </div>
      </div>

      {/* Editor Tips */}
      <div className="bg-blue-900/20 border border-blue-800 rounded-md p-3">
        <h4 className="text-sm font-medium text-blue-300 mb-1">Editor Tips</h4>
        <ul className="text-blue-200 text-xs space-y-1">
          <li>• Use <code className="bg-blue-900/50 px-1 rounded">#</code> for headings, <code className="bg-blue-900/50 px-1 rounded">**text**</code> for bold</li>
          <li>• Use <code className="bg-blue-900/50 px-1 rounded">```code```</code> for code blocks with syntax highlighting</li>
          <li>• Use <code className="bg-blue-900/50 px-1 rounded">-</code> for bullet points and <code className="bg-blue-900/50 px-1 rounded">1.</code> for numbered lists</li>
          <li>• Enhance sections with AI to improve clarity, tone, or add examples</li>
        </ul>
      </div>
    </div>
  );
}