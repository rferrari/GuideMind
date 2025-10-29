import { NextRequest, NextResponse } from 'next/server';
import { crawlDocumentation } from '@/lib/crawler';
import { crawlDocumentationWithLinks } from '@/lib/crawler';
import { generateTutorialIdeas, getFallbackTutorials } from '@/lib/ai-generator';
import { TutorialScaffold } from '../../../types';



// v rate limit handler
export async function POST(request: NextRequest) {
  try {
    const { url, regenerate } = await request.json();

    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    console.log('Crawling with links:', url);

    const crawledData = await crawlDocumentationWithLinks(url);

    if (crawledData.content.length === 0) {
      return NextResponse.json({ error: 'No content found at the provided URL' }, { status: 400 });
    }

    console.log('Generating tutorials with AI using real links...');
    const result = await generateTutorialIdeas(crawledData);

    // Check if we hit a rate limit
    if (result.rateLimit) {
      return NextResponse.json({
        error: 'rate_limit_exceeded',
        rateLimit: {
          retryAfter: result.rateLimit.retryAfter, // Make sure this is the actual seconds (144)
          message: result.rateLimit.message
        },
        fallbackTutorials: getFallbackTutorials(crawledData.url)
      }, { status: 429 });
    }

    return NextResponse.json({
      tutorials: result.tutorials,
      crawledData: {
        mainUrl: crawledData.url,
        title: crawledData.title,
        contentSamples: crawledData.content.slice(0, 3),
        totalLinks: crawledData.links.length,
        totalContent: crawledData.content.length
      }
    });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// v2
// export async function POST(request: NextRequest) {
//   try {
//     const { url, regenerate } = await request.json();

//     if (!url) {
//       return NextResponse.json({ error: 'URL is required' }, { status: 400 });
//     }

//     console.log('Crawling with links:', url);

//     // Use the enhanced crawler that extracts links
//     const crawledData = await crawlDocumentationWithLinks(url);

//     if (crawledData.content.length === 0) {
//       return NextResponse.json({ error: 'No content found at the provided URL' }, { status: 400 });
//     }

//     console.log('Generating tutorials with AI using real links...');
//     const tutorials = await generateTutorialIdeas(crawledData);

//     return NextResponse.json({ 
//       tutorials,
//       crawledData: {
//         mainUrl: crawledData.url,
//         title: crawledData.title,
//         contentSamples: crawledData.content.slice(0, 3),
//         totalLinks: crawledData.links.length,
//         totalContent: crawledData.content.length
//       }
//     });
//   } catch (error) {
//     console.error('API Error:', error);
//     return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
//   }
// }





//v1
// export async function POST(request: NextRequest) {
//   try {
//     const { url } = await request.json();

//     if (!url) {
//       return NextResponse.json({ error: 'URL is required' }, { status: 400 });
//     }

//     console.log('Crawling:', url);
//     const content = await crawlDocumentation(url);

//     if (content.length === 0) {
//       return NextResponse.json({ error: 'No content found at the provided URL' }, { status: 400 });
//     }

//     console.log('Generating tutorials with AI...');
//     const tutorials = await generateTutorialIdeas(content);

//     return NextResponse.json({ 
//       tutorials,
//       contentSamples: content.slice(0, 3),
//       totalPagesFound: content.length 
//     });
//   } catch (error) {
//     console.error('API Error:', error);
//     return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
//   }
// }

export const maxDuration = 60; // 60 seconds timeout for Vercel