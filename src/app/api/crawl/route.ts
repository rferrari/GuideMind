import { NextRequest, NextResponse } from 'next/server';
import { crawlDocumentation } from '@/lib/crawler';
import { generateTutorialIdeas } from '@/lib/ai-generator';

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json();
    
    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    console.log('Crawling:', url);
    const content = await crawlDocumentation(url);
    
    if (content.length === 0) {
      return NextResponse.json({ error: 'No content found at the provided URL' }, { status: 400 });
    }

    console.log('Generating tutorials with AI...');
    const tutorials = await generateTutorialIdeas(content);
    
    return NextResponse.json({ 
      tutorials,
      contentSamples: content.slice(0, 3),
      totalPagesFound: content.length 
    });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export const maxDuration = 60; // 60 seconds timeout for Vercel