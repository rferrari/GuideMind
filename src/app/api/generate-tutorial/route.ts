import { NextRequest, NextResponse } from 'next/server';
import { OpenAI } from 'openai';
import { crawlDocumentation } from '@/lib/crawler';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

export async function POST(request: NextRequest) {
  try {
    const { tutorial, type, originalUrl } = await request.json();
    
    // Get fresh content from the documentation
    const content = await crawlDocumentation(originalUrl);
    const contentSample = content.slice(0, 10).join('\n\n');

    const prompt = type === 'text' 
      ? generateTextTutorialPrompt(tutorial, contentSample)
      : generateVideoScriptPrompt(tutorial, contentSample);

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        { 
          role: "system", 
          content: "You are an expert technical content creator. Create comprehensive, engaging content that helps people learn effectively." 
        },
        { role: "user", content: prompt }
      ],
      temperature: 0.7,
      max_tokens: 3000,
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