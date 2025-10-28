import { NextRequest, NextResponse } from 'next/server';
import { crawlDocumentation } from '@/lib/crawler';

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json();
    
    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    // Simple crawl for now
    const content = await crawlDocumentation(url);
    
    // Mock AI generation for prototype
    const mockTutorials = [
      {
        id: '1',
        title: 'Getting Started with Example Docs',
        summary: 'Learn the basics of this documentation',
        outline: ['Introduction', 'Setup', 'Basic Usage', 'Next Steps'],
        difficulty: 'beginner' as const,
        estimatedCost: { min: 100, max: 300 },
        sourceUrl: url,
      },
    ];

    return NextResponse.json({ tutorials: mockTutorials, contentSamples: content.slice(0, 3) });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}