'use client';

import { useState } from 'react';

interface MarkdownPreviewProps {
  content: string;
  onEnhance: (enhancementPrompt: string) => void;
}

export default function MarkdownPreview({ content, onEnhance }: MarkdownPreviewProps) {
  const [showPreview, setShowPreview] = useState(true);
  const [customPrompt, setCustomPrompt] = useState('');

  const enhancementPrompts: EnhancementPrompt[] = [
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
      {/* Toggle Buttons */}
      <div className="flex gap-2 border-b border-gray-700 pb-2">
        <button
          onClick={() => setShowPreview(true)}
          className={`px-4 py-2 rounded-t-md transition-colors ${
            showPreview 
              ? 'bg-gray-700 text-white border-b-2 border-blue-500' 
              : 'bg-gray-800 text-gray-400 hover:text-white'
          }`}
        >
          Preview
        </button>
        <button
          onClick={() => setShowPreview(false)}
          className={`px-4 py-2 rounded-t-md transition-colors ${
            !showPreview 
              ? 'bg-gray-700 text-white border-b-2 border-blue-500' 
              : 'bg-gray-800 text-gray-400 hover:text-white'
          }`}
        >
          Enhance
        </button>
      </div>

      {/* Preview Mode */}
      {showPreview && (
        <div className="bg-white text-gray-900 p-6 rounded-md max-h-96 overflow-auto">
          <div className="prose prose-sm max-w-none">
            {content.split('\n').map((line, index) => {
              if (line.startsWith('# ')) {
                return <h1 key={index} className="text-2xl font-bold mt-4 mb-2">{line.replace('# ', '')}</h1>;
              } else if (line.startsWith('## ')) {
                return <h2 key={index} className="text-xl font-bold mt-3 mb-2">{line.replace('## ', '')}</h2>;
              } else if (line.startsWith('### ')) {
                return <h3 key={index} className="text-lg font-bold mt-2 mb-1">{line.replace('### ', '')}</h3>;
              } else if (line.startsWith('**') && line.endsWith('**')) {
                return <strong key={index} className="font-bold">{line.replace(/\*\*/g, '')}</strong>;
              } else if (line.startsWith('* ') || line.startsWith('- ')) {
                return <li key={index} className="ml-4">{line.substring(2)}</li>;
              } else if (line.match(/^\d+\./)) {
                return <li key={index} className="ml-4">{line.replace(/^\d+\.\s*/, '')}</li>;
              } else if (line.trim() === '') {
                return <br key={index} />;
              } else if (line.includes('`')) {
                const parts = line.split('`');
                return (
                  <p key={index}>
                    {parts.map((part, i) => 
                      i % 2 === 0 ? part : <code key={i} className="bg-gray-100 px-1 rounded">{part}</code>
                    )}
                  </p>
                );
              } else {
                return <p key={index} className="mb-2">{line}</p>;
              }
            })}
          </div>
        </div>
      )}

      {/* Enhance Mode */}
      {!showPreview && (
        <div className="space-y-4">
          {/* Quick Enhancement Prompts */}
          <div>
            <h4 className="text-sm font-medium text-gray-300 mb-3">Quick Enhancements:</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-4">
              {enhancementPrompts.map((prompt) => (
                <button
                  key={prompt.id}
                  onClick={() => handleQuickEnhance(prompt.text)}
                  className="bg-gray-700 text-gray-200 px-3 py-2 rounded-md hover:bg-gray-600 transition-colors text-left text-sm"
                >
                  <div className="font-medium">{prompt.description}</div>
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
                className="flex-1 bg-gray-700 border border-gray-600 text-white placeholder-gray-400 rounded-md px-3 py-2 text-sm"
                onKeyPress={(e) => e.key === 'Enter' && handleCustomEnhance()}
              />
              <button
                onClick={handleCustomEnhance}
                disabled={!customPrompt.trim()}
                className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors text-sm"
              >
                Enhance
              </button>
            </div>
            <p className="text-gray-400 text-xs mt-2">
              Describe how you want to improve the content. Be specific for better results.
            </p>
          </div>

          {/* Enhancement Examples */}
          <div className="bg-gray-700 rounded-md p-3">
            <h5 className="text-sm font-medium text-gray-300 mb-2">Enhancement Examples:</h5>
            <ul className="text-gray-400 text-xs space-y-1">
              <li>• "Add step-by-step code examples for each section"</li>
              <li>• "Include troubleshooting tips and common errors"</li>
              <li>• "Make it more practical with real-world use cases"</li>
              <li>• "Focus on performance optimization techniques"</li>
              <li>• "Add comparison tables for different approaches"</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}