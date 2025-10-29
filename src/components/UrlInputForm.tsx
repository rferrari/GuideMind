'use client';

import { useState } from 'react';
import { TutorialScaffold, DownloadOptions } from '@/types';
import { AnimatedCard } from './AnimatedCard';
import GenerationModal from './GenerationModal';
import { DownloadManager } from '@/lib/download-manager';

export default function UrlInputForm() {
  const [url, setUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [tutorials, setTutorials] = useState<TutorialScaffold[]>([]);
  const [error, setError] = useState<string>('');
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedTutorial, setSelectedTutorial] = useState<TutorialScaffold | null>(null);
  const [generationType, setGenerationType] = useState<'text' | 'video'>('text');
  const [downloadOptions, setDownloadOptions] = useState<DownloadOptions>({
    format: 'scaffold',
    type: 'text',
    includeEdited: true
  });

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

  const updateTutorialContent = (tutorialId: string, content: string, type: 'text' | 'video') => {
    setTutorials(prev => prev.map(tutorial => {
      if (tutorial.id === tutorialId) {
        return {
          ...tutorial,
          generatedContent: {
            ...tutorial.generatedContent,
            [type]: content,
            lastUpdated: new Date()
          }
        };
      }
      return tutorial;
    }));
  };

 const downloadIndividualTutorial = async (tutorial: TutorialScaffold, type: 'text' | 'video' = 'text') => {
  let content: string;
  
  if (downloadOptions.format === 'scaffold') {
    content = await DownloadManager.downloadScaffold(tutorial);
  } else {
    content = await DownloadManager.downloadFullContent(tutorial, type);
  }
  
  const extension = type === 'text' ? 'md' : 'txt';
  const prefix = downloadOptions.format === 'scaffold' ? 'scaffold' : type;
  const filename = `${prefix}-${tutorial.title.toLowerCase().replace(/[^a-z0-9]/g, '-')}.${extension}`;
  
  DownloadManager.downloadFile(content, filename);
};

const downloadAllTutorials = async () => {
  if (!url) {
    alert('Please enter a documentation URL first');
    return;
  }

  try {
    // Show loading state
    setIsLoading(true);
    
    console.log(`Starting bulk download for ${tutorials.length} tutorials from: ${url}`);
    
    // Use ZIP bundle for better user experience
    await DownloadManager.downloadZipBundle(
      tutorials, 
      {
        format: downloadOptions.format,
        type: downloadOptions.type
      },
      url // Pass the original URL for API calls
    );
    
    console.log('Bulk download completed successfully');
    
  } catch (error) {
    console.error('Download error:', error);
    alert('Failed to create download bundle. Please try again.');
  } finally {
    setIsLoading(false);
  }
};

const downloadCSVOnly = () => {
  const csvContent = DownloadManager.generateCSV(tutorials);
  DownloadManager.downloadFile(csvContent, 'tutorial-scaffolds-index.csv');
};

  const openGenerationModal = (tutorial: TutorialScaffold, type: 'text' | 'video') => {
    setSelectedTutorial(tutorial);
    setGenerationType(type);
    setModalOpen(true);
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
          {/* Download Options Bar */}
          <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
            <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">Download Options</h3>
                <div className="flex flex-wrap gap-4 text-sm">
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      checked={downloadOptions.format === 'scaffold'}
                      onChange={() => setDownloadOptions(prev => ({ ...prev, format: 'scaffold' }))}
                      className="text-blue-600"
                    />
                    <span className="text-gray-300">Scaffolds Only</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      checked={downloadOptions.format === 'full'}
                      onChange={() => setDownloadOptions(prev => ({ ...prev, format: 'full' }))}
                      className="text-blue-600"
                    />
                    <span className="text-gray-300">Full Content</span>
                  </label>
                  
                  <label className="flex items-center gap-2">
                    <span className="text-gray-300">Type:</span>
                    <select
                      value={downloadOptions.type}
                      onChange={(e) => setDownloadOptions(prev => ({ ...prev, type: e.target.value as any }))}
                      className="bg-gray-700 border border-gray-600 text-white rounded px-2 py-1 text-sm"
                    >
                      <option value="text">Text Only</option>
                      <option value="video">Video Only</option>
                      <option value="both">Both</option>
                    </select>
                  </label>
                </div>
              </div>
              
              <div className="flex gap-2">
                <button
                  onClick={downloadCSVOnly}
                  className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors text-sm"
                >
                  Download CSV Only
                </button>
                <button
  onClick={downloadAllTutorials}
  disabled={isLoading}
  className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors text-sm"
>
  {isLoading ? (
    <span className="flex items-center gap-2">
      <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
      {downloadOptions.format === 'full' ? 'Generating Content...' : 'Creating Bundle...'}
    </span>
  ) : (
    'Download All Files'
  )}
</button>
              </div>
            </div>
            
            <div className="mt-3 text-xs text-gray-400">
              {downloadOptions.format === 'scaffold' 
                ? 'Scaffolds include titles, outlines, and metadata - perfect for contributors to expand upon.'
                : 'Full content includes AI-generated tutorials or video scripts.'}
            </div>
          </div>

          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-white">Generated Tutorials ({tutorials.length})</h2>
          </div>
          
          <div className="grid gap-6">
            {tutorials.map((tutorial, index) => (
              <AnimatedCard key={tutorial.id} index={index}>
                <div className="border border-gray-700 rounded-lg p-6 bg-gray-800 shadow-lg">
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="font-bold text-xl text-white">{tutorial.title}</h3>
                    <div className="flex gap-2">
                      {/* <button
                        onClick={() => downloadIndividualTutorial(tutorial, 'text')}
                        className="bg-gray-700 text-gray-200 px-3 py-1 rounded-md hover:bg-gray-600 transition-colors text-sm"
                        title="Download scaffold"
                      >
                        📥 Scaffold
                      </button> */}
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
                    {tutorial.generatedContent && (
                      <span className="text-blue-400 bg-blue-900/30 px-3 py-1 rounded-full text-sm">
                        ✨ Enhanced
                      </span>
                    )}
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

      <GenerationModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        tutorial={selectedTutorial!}
        type={generationType}
        originalUrl={url}
        onContentUpdate={(content) => {
          if (selectedTutorial) {
            updateTutorialContent(selectedTutorial.id, content, generationType);
          }
        }}
      />
    </div>
  );
}