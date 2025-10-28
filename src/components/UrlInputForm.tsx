'use client';

import { useState } from 'react';
import { TutorialScaffold } from '@/types';

export default function UrlInputForm() {
  const [url, setUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [tutorials, setTutorials] = useState<TutorialScaffold[]>([]);
  const [error, setError] = useState<string>('');

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
      console.log('Generated tutorials:', result);
    } catch (error) {
      console.error('Error:', error);
      setError(error instanceof Error ? error.message : 'Something went wrong');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="url" className="block text-sm font-medium text-gray-700">
            Documentation URL
          </label>
          <input
            type="url"
            id="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://docs.github.com/en"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 border"
            required
          />
        </div>
        <button
          type="submit"
          disabled={isLoading}
          className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 disabled:bg-gray-400"
        >
          {isLoading ? 'Generating Tutorials...' : 'Generate Tutorial Scaffolds'}
        </button>
      </form>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {tutorials.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Generated Tutorials ({tutorials.length})</h2>
          {tutorials.map((tutorial) => (
            <div key={tutorial.id} className="border rounded-lg p-4 bg-white shadow-sm">
              <h3 className="font-semibold text-lg">{tutorial.title}</h3>
              <p className="text-gray-600 mt-1">{tutorial.summary}</p>
              <div className="flex gap-4 mt-2 text-sm">
                <span className={`px-2 py-1 rounded ${
                  tutorial.difficulty === 'beginner' ? 'bg-green-100 text-green-800' :
                  tutorial.difficulty === 'intermediate' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {tutorial.difficulty}
                </span>
                <span className="text-gray-500">
                  ${tutorial.estimatedCost.min} - ${tutorial.estimatedCost.max}
                </span>
              </div>
              <div className="mt-3">
                <h4 className="font-medium text-sm">Outline:</h4>
                <ol className="list-decimal list-inside mt-1 text-sm text-gray-700">
                  {tutorial.outline.map((section, index) => (
                    <li key={index}>{section}</li>
                  ))}
                </ol>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}