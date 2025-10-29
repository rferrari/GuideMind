import { NextRequest, NextResponse } from 'next/server';
import { OpenAI } from 'openai';
import { crawlDocumentation, validateUrl } from '@/lib/crawler';

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY!,
    baseURL: process.env.OPENAI_BASE_URL || "",
});

/** Collect fallback models defined in .env */
const availableModels = Object.entries(process.env)
    .filter(([key]) => key.startsWith('OPENAI_LLM_MODEL'))
    .map(([_, value]) => value!)
    .filter(Boolean);

console.log('Available LLM Models:', availableModels);

/** Try generating with a specific model */
async function tryGenerateWithModel(model: string, prompt: string) {
    const completion = await openai.chat.completions.create({
        model,
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

    const response = completion.choices[0]?.message?.content;
    if (!response) throw new Error('No response from AI');
    return response;
}

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

        // Crawl documentation unless enhancement request
        if (!enhancementPrompt) {
            let urlToCrawl = tutorial?.sourceUrl || originalUrl;

            if (urlToCrawl) {
                console.log('Validating URL:', urlToCrawl);
                const validation = await validateUrl(urlToCrawl);

                if (!validation.isValid) {
                    console.warn(`URL validation failed for ${urlToCrawl}:`, validation.error);

                    if (urlToCrawl !== originalUrl && originalUrl) {
                        console.log(`Falling back to original URL: ${originalUrl}`);
                        urlToCrawl = originalUrl;
                        usedFallbackUrl = true;

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
                    try {
                        console.log('Crawling documentation from:', urlToCrawl);
                        const content = await crawlDocumentation(urlToCrawl);
                        contentSample = content.slice(0, 10).join('\n\n');
                        console.log(`Crawled ${content.length} content chunks.`);
                    } catch (crawlError) {
                        console.error('Crawling failed:', crawlError);
                    }
                }
            }
        } else {
            console.log('Enhancement request, skipping crawl');
        }

        // Build the right prompt
        let prompt: string;
        if (enhancementPrompt) {
            prompt = generateEnhancementPrompt(existingContent, enhancementPrompt, type);
        } else if (type === 'text') {
            prompt = generateTextTutorialPrompt(tutorial, contentSample, usedFallbackUrl);
        } else {
            prompt = generateVideoScriptPrompt(tutorial, contentSample, usedFallbackUrl);
        }

        console.log('Sending request to LLM with prompt length:', prompt.length);

        // 🔁 Try all available models sequentially
        for (const model of availableModels) {
            try {
                console.log(`🧠 Trying model: ${model}`);
                const generatedContent = await tryGenerateWithModel(model, prompt);
                console.log(`✅ Success with model: ${model}`);
                return NextResponse.json({
                    content: generatedContent,
                    metadata: {
                        usedFallbackUrl,
                        crawledUrl: usedFallbackUrl ? originalUrl : tutorial?.sourceUrl,
                        usedModel: model,
                    },
                });
            } catch (error: any) {
                console.warn(`⚠️ Model ${model} failed: ${error.message}`);
                if (error.status === 429) {
                    console.warn(`Rate limit on ${model}, trying next...`);
                }
                continue; // try next model
            }
        }

        throw new Error("All defined models failed or hit rate limits.");

    } catch (error) {
        console.error('Tutorial generation error:', error);
        return NextResponse.json({
            error: 'Failed to generate tutorial',
            details: error instanceof Error ? error.message : 'Unknown error',
        }, { status: 500 });
    }
}

/* ---------- PROMPT HELPERS ---------- */

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
Create a detailed, engaging video script for a technical tutorial based on this outline and documentation.

Tutorial Title: ${tutorial.title}
Summary: ${tutorial.summary}
Difficulty: ${tutorial.difficulty}
Outline: ${tutorial.outline.join(' -> ')}

${urlNotice}

DOCUMENTATION CONTENT TO DRAW FROM:
${contentSample}

Create a professional video script with:

INTRODUCTION (0:00 - 0:45)
- Hook: Create an engaging opening question or statement
- What we'll cover: Brief overview of the tutorial value
- What you'll learn: Specific, actionable outcomes

MAIN CONTENT (Follow the outline sections)
For EACH outline section, include:
- Visual cues: Specific screen recordings, code demonstrations, diagrams
- Narration: Detailed, technical explanations with code examples
- Key points: 2-3 specific technical insights
- Practical example: Real code snippets or workflow demos
- Transition: Natural segue to next section

CONCLUSION (last 45 seconds)
- Recap: Summarize key achievements
- Key takeaways: 3 main technical points
- Call to action: Specific next steps or practice exercises
- Next steps: Related advanced topics

Make it technical, specific, and draw concrete examples from the documentation content.
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
