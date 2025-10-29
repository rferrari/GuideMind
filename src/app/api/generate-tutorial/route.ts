import { NextRequest, NextResponse } from 'next/server';
import { OpenAI } from 'openai';
import { crawlDocumentation } from '@/lib/crawler';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
  baseURL: process.env.OPENAI_BASE_URL || "",
});

export async function POST(request: NextRequest) {
  try {
    const { tutorial, type, originalUrl, enhancementPrompt, existingContent } = await request.json();
    
    console.log('Generate tutorial request:', { 
      tutorialTitle: tutorial?.title, 
      type, 
      originalUrl,
      tutorialSourceUrl: tutorial?.sourceUrl,
      hasEnhancement: !!enhancementPrompt,
      hasExistingContent: !!existingContent 
    });

    let contentSample = '';
    let usedFallbackUrl = false;
    
    // Only crawl for initial generation, not for enhancements
    if (!enhancementPrompt) {
      let urlToCrawl = tutorial?.sourceUrl || originalUrl;
      
      if (urlToCrawl) {
        // Validate the URL before crawling
        console.log('Validating URL:', urlToCrawl);
        const validation = await validateUrl(urlToCrawl);
        
        if (!validation.isValid) {
          console.warn(`URL validation failed for ${urlToCrawl}:`, validation.error);
          
          // If the specific URL fails, fall back to the original URL
          if (urlToCrawl !== originalUrl && originalUrl) {
            console.log(`Falling back to original URL: ${originalUrl}`);
            urlToCrawl = originalUrl;
            usedFallbackUrl = true;
            
            // Validate the fallback URL
            const fallbackValidation = await validateUrl(originalUrl);
            if (!fallbackValidation.isValid) {
              console.error(`Fallback URL also invalid: ${originalUrl}`);
              urlToCrawl = null;
            }
          } else {
            urlToCrawl = null;
          }
        }
        
        if (urlToCrawl) {
          console.log('Crawling documentation from:', urlToCrawl);
          try {
            const content = await crawlDocumentation(urlToCrawl);
            contentSample = content.slice(0, 10).join('\n\n');
            console.log(`Crawled ${content.length} content chunks from ${urlToCrawl}`);
            
            if (usedFallbackUrl) {
              console.log('⚠️ Used fallback URL for content generation');
            }
          } catch (crawlError) {
            console.error('Crawling failed, continuing without fresh content:', crawlError);
            // Continue without fresh content - we'll use the tutorial outline
          }
        } else {
          console.log('No valid URL available for crawling');
        }
      } else {
        console.log('No URL available for crawling');
      }
    } else {
      console.log('Enhancement request, skipping crawl');
    }

    // Reconstruct the prompt based on the conditions
    let prompt: string;
    if (enhancementPrompt) {
      prompt = generateEnhancementPrompt(existingContent, enhancementPrompt, type);
    } else if (type === 'text') {
      prompt = generateTextTutorialPrompt(tutorial, contentSample, usedFallbackUrl);
    } else {
      prompt = generateVideoScriptPrompt(tutorial, contentSample, usedFallbackUrl);
    }

    console.log('Sending request to OpenAI with prompt length:', prompt.length);

    const completion = await openai.chat.completions.create({
      model: process.env.OPENAI_LLM_MODEL || "gpt-3.5-turbo",
      messages: [
        { 
          role: "system", 
          content: "You are an expert technical content creator. Create comprehensive, engaging content that helps people learn effectively." 
        },
        { role: "user", content: prompt }
      ],
      temperature: 0.7,
      max_tokens: 4000,
    });

    const generatedContent = completion.choices[0]?.message?.content || '';
    console.log('Successfully generated content, length:', generatedContent.length);

    return NextResponse.json({ 
      content: generatedContent,
      metadata: {
        usedFallbackUrl,
        crawledUrl: usedFallbackUrl ? originalUrl : tutorial?.sourceUrl
      }
    });
  } catch (error) {
    console.error('Tutorial generation error:', error);
    return NextResponse.json({ 
      error: 'Failed to generate tutorial',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

function generateTextTutorialPrompt(tutorial: any, contentSample: string, usedFallbackUrl: boolean): string {
  const urlNotice = usedFallbackUrl 
    ? "NOTE: The specific documentation page was unavailable, so general documentation content was used instead."
    : "";

  return `
Create a comprehensive text tutorial based on this outline and documentation.

Tutorial Title: ${tutorial.title}
Summary: ${tutorial.summary}
Difficulty: ${tutorial.difficulty}
Outline: ${tutorial.outline.join(' -> ')}

${urlNotice}

Documentation Content:
${contentSample}

Create a complete tutorial in Markdown format with:
- Engaging introduction
- Step-by-step instructions for each outline item
- Code examples where relevant
- Practical tips and best practices
- Common pitfalls to avoid
- Conclusion with next steps

Make it practical, actionable, and suitable for the ${tutorial.difficulty} level.
`;
}

function generateVideoScriptPrompt(tutorial: any, contentSample: string, usedFallbackUrl: boolean): string {
  const urlNotice = usedFallbackUrl 
    ? "NOTE: The specific documentation page was unavailable, so general documentation content was used instead."
    : "";

  return `
Create a video script for a tutorial based on this outline and documentation.

Tutorial Title: ${tutorial.title}
Summary: ${tutorial.summary}
Difficulty: ${tutorial.difficulty}
Outline: ${tutorial.outline.join(' -> ')}

${urlNotice}

Documentation Content:
${contentSample}

Create a video script with:
- Scene descriptions and visual cues
- Narration/dialogue
- Timing estimates
- On-screen text suggestions
- Transitions between sections
- Call-to-action at the end

Make it engaging, visual, and suitable for the ${tutorial.difficulty} level. Include time markers and keep it around 5-10 minutes total.
`;
}

function generateEnhancementPrompt(existingContent: string, enhancementPrompt: string, type: string): string {
  return `
Please enhance the following ${type === 'text' ? 'tutorial content' : 'video script'} based on the user's request.

USER'S ENHANCEMENT REQUEST: ${enhancementPrompt}

EXISTING CONTENT:
${existingContent}

Please apply the requested enhancements while maintaining:
- The core structure and information
- Technical accuracy
- Completeness of the content
- Appropriate format (${type === 'text' ? 'Markdown' : 'script format'})

Return the enhanced content in the same format as the original.
`;
}

function generateEnhancementPrompt(existingContent: string, enhancementPrompt: string, type: string): string {
  return `
Please enhance the following ${type === 'text' ? 'tutorial content' : 'video script'} based on the user's request.

USER'S ENHANCEMENT REQUEST: ${enhancementPrompt}

EXISTING CONTENT:
${existingContent}

Please apply the requested enhancements while maintaining:
- The core structure and information
- Technical accuracy
- Completeness of the content
- Appropriate format (${type === 'text' ? 'Markdown' : 'script format'})

Return the enhanced content in the same format as the original.
`;
}