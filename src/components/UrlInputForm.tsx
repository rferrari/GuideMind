'use client';

import { useState } from 'react';
import { TutorialScaffold } from '@/types';
import { AnimatedCard } from './AnimatedCard';
import GenerationModal from './GenerationModal';

export default function UrlInputForm() {
  const [url, setUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [tutorials, setTutorials] = useState<TutorialScaffold[]>([]);
  const [error, setError] = useState<string>('');
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedTutorial, setSelectedTutorial] = useState<TutorialScaffold | null>(null);
  const [generationType, setGenerationType] = useState<'text' | 'video'>('text');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setTutorials([]);
    
    try {
      const response = await fetch('/api/crawl', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to generate tutorials');
      }
      
      setTutorials(result.tutorials);
    } catch (error) {
      console.error('Error:', error);
      setError(error instanceof Error ? error.message : 'Something went wrong');
    } finally {
      setIsLoading(false);
    }
  };

  const generateNewIdeas = async () => {
    if (!url) return;
    
    setIsLoading(true);
    setTutorials([]);
    
    try {
      const response = await fetch('/api/crawl', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, regenerate: true }),
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to generate tutorials');
      }
      
      setTutorials(result.tutorials);
    } catch (error) {
      console.error('Error:', error);
      setError(error instanceof Error ? error.message : 'Something went wrong');
    } finally {
      setIsLoading(false);
    }
  };

  const openGenerationModal = (tutorial: TutorialScaffold, type: 'text' | 'video') => {
    setSelectedTutorial(tutorial);
    setGenerationType(type);
    setModalOpen(true);
  };

  const downloadCSV = () => {
    const headers = ['Title', 'Summary', 'Difficulty', 'Estimated Cost Min', 'Estimated Cost Max', 'Outline'];
    const csvContent = [
      headers.join(','),
      ...tutorials.map(tutorial => [
        `"${tutorial.title.replace(/"/g, '""')}"`,
        `"${tutorial.summary.replace(/"/g, '""')}"`,
        tutorial.difficulty,
        tutorial.estimatedCost.min,
        tutorial.estimatedCost.max,
        `"${tutorial.outline.join('; ').replace(/"/g, '""')}"`
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'tutorial-scaffolds.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="url" className="block text-sm font-medium text-gray-200">
            Documentation URL
          </label>
          <input
            type="url"
            id="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://docs.github.com/en"
            className="mt-1 block w-full rounded-md bg-gray-800 border-gray-600 text-white placeholder-gray-400 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 border"
            required
          />
        </div>
        <div className="flex gap-4">
          <button
            type="submit"
            disabled={isLoading}
            className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors flex-1"
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Generating Tutorials...
              </span>
            ) : (
              'Generate Tutorial Ideas'
            )}
          </button>
          
          {tutorials.length > 0 && (
            <button
              type="button"
              onClick={generateNewIdeas}
              disabled={isLoading}
              className="bg-purple-600 text-white px-6 py-2 rounded-md hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors flex-1"
            >
              Generate Different Ideas
            </button>
          )}
        </div>
      </form>

      {error && (
        <div className="bg-red-900/50 border border-red-700 rounded-md p-4">
          <p className="text-red-200">{error}</p>
        </div>
      )}

      {tutorials.length > 0 && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-white">Generated Tutorials ({tutorials.length})</h2>
            <button
              onClick={downloadCSV}
              className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors text-sm"
            >
              Download CSV
            </button>
          </div>
          
          <div className="grid gap-6">
            {tutorials.map((tutorial, index) => (
              <AnimatedCard key={tutorial.id} index={index}>
                <div className="border border-gray-700 rounded-lg p-6 bg-gray-800 shadow-lg">
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="font-bold text-xl text-white">{tutorial.title}</h3>
                    <div className="flex gap-2">
                      <button
                        onClick={() => openGenerationModal(tutorial, 'text')}
                        className="bg-blue-600 text-white px-3 py-1 rounded-md hover:bg-blue-700 transition-colors text-sm"
                      >
                        Generate Text Tutorial
                      </button>
                      <button
                        onClick={() => openGenerationModal(tutorial, 'video')}
                        className="bg-orange-600 text-white px-3 py-1 rounded-md hover:bg-orange-700 transition-colors text-sm"
                      >
                        Generate Video Script
                      </button>
                    </div>
                  </div>
                  
                  <p className="text-gray-300 mb-4 leading-relaxed">{tutorial.summary}</p>
                  
                  <div className="flex gap-4 mb-4">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      tutorial.difficulty === 'beginner' ? 'bg-green-900/50 text-green-300 border border-green-700' :
                      tutorial.difficulty === 'intermediate' ? 'bg-yellow-900/50 text-yellow-300 border border-yellow-700' :
                      'bg-red-900/50 text-red-300 border border-red-700'
                    }`}>
                      {tutorial.difficulty}
                    </span>
                    <span className="text-gray-400 bg-gray-700 px-3 py-1 rounded-full text-sm">
                      ${tutorial.estimatedCost.min} - ${tutorial.estimatedCost.max}
                    </span>
                  </div>
                  
                  <div className="mt-4">
                    <h4 className="font-semibold text-gray-200 mb-3 text-lg">Outline</h4>
                    <ol className="space-y-2">
                      {tutorial.outline.map((section, index) => (
                        <li key={index} className="flex items-start gap-3 text-gray-300">
                          <span className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-medium flex-shrink-0 mt-0.5">
                            {index + 1}
                          </span>
                          <span className="leading-relaxed">{section}</span>
                        </li>
                      ))}
                    </ol>
                  </div>
                </div>
              </AnimatedCard>
            ))}
          </div>
        </div>
      )}

      {/* Generation Modal */}
      <GenerationModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        tutorial={selectedTutorial!}
        type={generationType}
        originalUrl={url}
      />
    </div>
  );
}