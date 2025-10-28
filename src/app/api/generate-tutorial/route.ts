import { NextRequest, NextResponse } from 'next/server';
import { OpenAI } from 'openai';
import { crawlDocumentation } from '@/lib/crawler';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
  baseURL: process.env.OPENAI_BASE_URL,
});

export async function POST(request: NextRequest) {
  try {
    const { tutorial, type, originalUrl, enhancementPrompt, existingContent } = await request.json();
    
    let contentSample = '';
    if (!enhancementPrompt) {
      // Only crawl for initial generation, not for enhancements
      const content = await crawlDocumentation(originalUrl);
      contentSample = content.slice(0, 10).join('\n\n');
    }

    const prompt = enhancementPrompt 
      ? generateEnhancementPrompt(existingContent, enhancementPrompt, type)
      : type === 'text' 
        ? generateTextTutorialPrompt(tutorial, contentSample)
        : generateVideoScriptPrompt(tutorial, contentSample);

    const completion = await openai.chat.completions.create({
      model: process.env.OPENAI_LLM_MODEL,
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

    return NextResponse.json({ content: generatedContent });
  } catch (error) {
    console.error('Tutorial generation error:', error);
    return NextResponse.json({ error: 'Failed to generate tutorial' }, { status: 500 });
  }
}

function generateTextTutorialPrompt(tutorial: any, contentSample: string): string {
  return `
Create a comprehensive text tutorial based on this outline and documentation.

Tutorial Title: ${tutorial.title}
Summary: ${tutorial.summary}
Difficulty: ${tutorial.difficulty}
Outline: ${tutorial.outline.join(' -> ')}

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

function generateVideoScriptPrompt(tutorial: any, contentSample: string): string {
  return `
Create a video script for a tutorial based on this outline and documentation.

Tutorial Title: ${tutorial.title}
Summary: ${tutorial.summary}
Difficulty: ${tutorial.difficulty}
Outline: ${tutorial.outline.join(' -> ')}

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