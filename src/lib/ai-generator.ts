import { OpenAI } from 'openai';
import { TutorialScaffold } from '@/types';
import { CrawledPage } from './crawler';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
  baseURL: process.env.OPENAI_BASE_URL,
});

/** Collects fallback models defined in .env */
const availableModels = Object.entries(process.env)
  .filter(([key]) => key.startsWith('OPENAI_LLM_MODEL'))
  .map(([_, value]) => value!)
  .filter(Boolean);

console.log('Available LLM Models:', availableModels);

/** --- UTILITIES --- **/

function parseAIResponse(raw: string): any {
  let cleaned = raw.trim()
    .replace(/```json\s*/g, '')
    .replace(/```/g, '')
    .replace(/^json\s*/i, '')
    .trim();

  try { return JSON.parse(cleaned); } catch { }

  const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    try { return JSON.parse(jsonMatch[0]); } catch { }
  }

  throw new Error('Failed to parse AI response');
}

export function getFallbackTutorials(mainUrl: string): TutorialScaffold[] {
  return [
    {
      id: 'fallback-1',
      title: '🤖 Robot Overload!',
      summary: 'Our AI assistant is having a moment. Even robots need to recharge!',
      outline: ['AI service temporarily unavailable', 'Network connection issue', 'Rate limit exceeded', 'Others'],
      difficulty: 'advanced',
      estimatedCost: { min: 100, max: 9999 },
      sourceUrl: mainUrl
    }
  ];
}

/** --- MAIN LOGIC --- **/

async function tryGenerateWithModel(model: string, prompt: string, crawledData: CrawledPage) {
  const completion = await openai.chat.completions.create({
    model,
    messages: [
      {
        role: "system",
        content: "You are a technical content expert. Always respond with valid JSON. Only use URLs from the provided list."
      },
      { role: "user", content: prompt }
    ],
    temperature: 0.7,
    max_tokens: 2000,
    response_format: { type: "json_object" } // Force JSON mode if available
  });

  const response = completion.choices[0]?.message?.content;
  if (!response) throw new Error('No response from AI');

  const parsed = parseAIResponse(response);

  // Validate that sourceUrls are from the allowed list
  const allowedUrls = [crawledData.url, ...crawledData.links];
  const validatedTutorials = parsed.tutorials.map((tutorial: any) => {
    if (!allowedUrls.includes(tutorial.sourceUrl)) {
      console.warn(`AI used invalid URL: ${tutorial.sourceUrl}, falling back to main URL`);
      tutorial.sourceUrl = crawledData.url;
    }
    return tutorial;
  });

  return validatedTutorials;
}

/** --- PUBLIC EXPORT --- **/

export async function generateTutorialIdeas(
  crawledData: CrawledPage
): Promise<{ tutorials: TutorialScaffold[] | null, rateLimit?: { retryAfter: number; message: string } }> {

  const contentSample = crawledData.content.slice(0, 5).join('\n\n');
  const linksSample = crawledData.links.slice(0, 10).join('\n');

  const generateIdeasPrompt = `
You are an expert technical content strategist. Analyze this documentation content and suggest 3-5 tutorial ideas.

MAIN DOCUMENTATION PAGE: ${crawledData.title}
URL: ${crawledData.url}

DOCUMENTATION CONTENT:
${contentSample}

AVAILABLE DOCUMENTATION LINKS (use these for sourceUrl):
${linksSample}

Generate tutorial scaffolds with:
- Clear, action-oriented titles
- Brief summaries that explain the value
- Logical learning progression in the outline
- Appropriate difficulty level (beginner/intermediate/advanced)
- Realistic cost estimates for tutorial creation ($100-500 range)
- sourceUrl MUST be one of the available links above or the main URL

Respond with valid JSON only:
{
  "tutorials": [
    {
      "id": "unique-id",
      "title": "Tutorial Title",
      "summary": "Brief description",
      "outline": ["Section 1", "Section 2", "Section 3"],
      "difficulty": "beginner|intermediate|advanced",
      "estimatedCost": {"min": 100, "max": 300},
      "sourceUrl": "https://real-existing-url-from-the-list.com/page"
    }
  ]
}
`;

  // Iterate over models sequentially
  for (const model of availableModels) {
    try {
      console.log(`🧠 Trying model: ${model}`);
      const tutorials = await tryGenerateWithModel(model, generateIdeasPrompt, crawledData);
      return { tutorials };
    } catch (error: any) {
      console.warn(`⚠️ Model ${model} failed: ${error.message}`);
      // Handle rate limit separately
      if (error.status === 429) {
        console.warn(`Rate limit on ${model}, trying next...`);
        continue;
      }
      // For other errors, just try next model
      continue;
    }
  }

  // If all models failed
  console.error('All models failed or rate-limited');
  return { tutorials: getFallbackTutorials(crawledData.url) };
}
