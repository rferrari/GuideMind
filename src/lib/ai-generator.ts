import { OpenAI } from 'openai';
import { TutorialScaffold } from '@/types';
import { CrawledPage } from './crawler';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
  baseURL: process.env.OPENAI_BASE_URL,
});


// not used anymore
// function parseAIResponse(response: string): any {
//   console.log('Raw AI response:', response);

//   const parsingAttempts = [
//     // Attempt 1: Direct parse
//     () => JSON.parse(response.trim()),

//     // Attempt 2: Remove markdown code blocks
//     () => JSON.parse(response.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim()),

//     // Attempt 3: Extract JSON from text
//     () => {
//       const jsonMatch = response.match(/\{[\s\S]*\}/);
//       if (!jsonMatch) throw new Error('No JSON found');
//       return JSON.parse(jsonMatch[0]);
//     },

//     // Attempt 4: Remove "json" prefix
//     () => JSON.parse(response.replace(/^json\s*/i, '').trim()),
//   ];

//   for (const attempt of parsingAttempts) {
//     try {
//       return attempt();
//     } catch (error) {
//       // Continue to next attempt
//       console.log('Parsing attempt failed:', error.message);
//     }
//   }

//   throw new Error('All parsing attempts failed');
// }

// export async function generateTutorialIdeas(content: string[]): Promise<TutorialScaffold[]> {
//   const contentSample = content.slice(0, 5).join('\n\n');

//   const prompt = `
// You are an expert technical content strategist. Analyze this documentation content and suggest 3-5 tutorial ideas.

// DOCUMENTATION CONTENT:
// ${contentSample}

// Generate tutorial scaffolds with:
// - Clear, action-oriented titles
// - Brief summaries that explain the value
// - Logical learning progression in the outline
// - Appropriate difficulty level (beginner/intermediate/advanced)
// - Realistic cost estimates for tutorial creation ($100-500 range)
// - Specific source URLs from the documentation that are most relevant to each tutorial

// Respond with valid JSON only:
// {
//   "tutorials": [
//     {
//       "id": "unique-id",
//       "title": "Tutorial Title",
//       "summary": "Brief description",
//       "outline": ["Section 1", "Section 2", "Section 3"],
//       "difficulty": "beginner|intermediate|advanced",
//       "estimatedCost": {"min": 100, "max": 300},
//       "sourceUrl": "https://specific-docs-page.com/relevant-section"
//     }
//   ]
// }
// `;

//   try {
//     const completion = await openai.chat.completions.create({
//       model: process.env.OPENAI_LLM_MODEL,
//       messages: [
//         { 
//           role: "system", 
//           content: "You are a technical content expert. Respond with ONLY valid JSON, no other text." 
//         },
//         { role: "user", content: prompt }
//       ],
//       temperature: 0.7,
//       max_tokens: 2000,
//       response_format: { type: "json_object" } // Force JSON mode if available
//     });

//     const response = completion.choices[0]?.message?.content;
//     if (!response) throw new Error('No response from AI');

//     const parsed = parseAIResponse(response);
//     return parsed.tutorials;
//   } catch (error) {
//     console.error('AI Generation error:', error);
//     return getFallbackTutorials();
//   }
// }



// export async function generateTutorialIdeas(crawledData: CrawledPage): Promise<TutorialScaffold[]> {
//   const contentSample = crawledData.content.slice(0, 5).join('\n\n');
//   const linksSample = crawledData.links.slice(0, 10).join('\n');

//   const prompt = `
// You are an expert technical content strategist. Analyze this documentation content and suggest 3-5 tutorial ideas.

// MAIN DOCUMENTATION PAGE: ${crawledData.title}
// URL: ${crawledData.url}

// DOCUMENTATION CONTENT:
// ${contentSample}

// AVAILABLE DOCUMENTATION LINKS (use these for sourceUrl):
// ${linksSample}

// Generate tutorial scaffolds with:
// - Clear, action-oriented titles
// - Brief summaries that explain the value
// - Logical learning progression in the outline
// - Appropriate difficulty level (beginner/intermediate/advanced)
// - Realistic cost estimates for tutorial creation ($100-500 range)
// - sourceUrl MUST be one of the available links above or the main URL

// Respond with valid JSON only:
// {
//   "tutorials": [
//     {
//       "id": "unique-id",
//       "title": "Tutorial Title",
//       "summary": "Brief description",
//       "outline": ["Section 1", "Section 2", "Section 3"],
//       "difficulty": "beginner|intermediate|advanced",
//       "estimatedCost": {"min": 100, "max": 300},
//       "sourceUrl": "https://real-existing-url-from-the-list.com/page"
//     }
//   ]
// }
// `;

//   try {
//     const completion = await openai.chat.completions.create({
//       model: process.env.OPENAI_LLM_MODEL || "gpt-3.5-turbo",
//       messages: [
//         { 
//           role: "system", 
//           content: "You are a technical content expert. Always respond with valid JSON. Only use URLs from the provided list." 
//         },
//         { role: "user", content: prompt }
//       ],
//       temperature: 0.7,
//       max_tokens: 2000,
//     });

//     const response = completion.choices[0]?.message?.content;
//     if (!response) throw new Error('No response from AI');

//     const cleanedResponse = cleanJsonResponse(response);
//     const parsed = JSON.parse(cleanedResponse);

//     // Validate that sourceUrls are from the allowed list
//     const allowedUrls = [crawledData.url, ...crawledData.links];
//     const validatedTutorials = parsed.tutorials.map((tutorial: any) => {
//       if (!allowedUrls.includes(tutorial.sourceUrl)) {
//         console.warn(`AI used invalid URL: ${tutorial.sourceUrl}, falling back to main URL`);
//         tutorial.sourceUrl = crawledData.url;
//       }
//       return tutorial;
//     });

//     return validatedTutorials;
//   } catch (error) {
//     console.error('AI Generation error:', error);
//     return getFallbackTutorials(crawledData.url);
//   }
// }


export async function generateTutorialIdeas(crawledData: CrawledPage): Promise<{ tutorials: TutorialScaffold[] | null, rateLimit?: { retryAfter: number; message: string } }> {
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


  try {
    const completion = await openai.chat.completions.create({
      model: process.env.OPENAI_LLM_MODEL || "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "You are a technical content expert. Always respond with valid JSON. Only use URLs from the provided list."
        },
        { role: "user", content: generateIdeasPrompt }
      ],
      temperature: 0.7,
      max_tokens: 2000,
    });

    const response = completion.choices[0]?.message?.content;
    if (!response) throw new Error('No response from AI');

    const cleanedResponse = cleanJsonResponse(response);
    const parsed = JSON.parse(cleanedResponse);

    // Validate that sourceUrls are from the allowed list
    const allowedUrls = [crawledData.url, ...crawledData.links];
    const validatedTutorials = parsed.tutorials.map((tutorial: any) => {
      if (!allowedUrls.includes(tutorial.sourceUrl)) {
        console.warn(`AI used invalid URL: ${tutorial.sourceUrl}, falling back to main URL`);
        tutorial.sourceUrl = crawledData.url;
      }
      return tutorial;
    });

    return { tutorials: validatedTutorials };
  } catch (error: any) {
    console.error('AI Generation error:', error);

    // Check for rate limit errors
    if (error.status === 429) {
      // const retryAfter = error.headers["#headersList"].entries["retry-after"] ? parseInt(error.headers["#headersList"].entries["retry-after"]) : 300;
      const retryAfter = 300;
      const message = error.message || 'Rate limit exceeded';

      console.log(`Rate limit detected. Retry after: ${retryAfter} seconds`);

      return {
        tutorials: null,
        rateLimit: {
          retryAfter,
          message
        }
      };
    }

    // For other errors, return fallback tutorials
    return { tutorials: getFallbackTutorials(crawledData.url) };
  }
}

function cleanJsonResponse(response: string): string {
  console.log('Raw AI response:', response);

  // Remove markdown code blocks
  let cleaned = response.replace(/```json\s*/g, '').replace(/```\s*/g, '');

  // Remove any leading/trailing whitespace
  cleaned = cleaned.trim();

  // If the response starts with "json" remove it
  if (cleaned.startsWith('json')) {
    cleaned = cleaned.slice(4).trim();
  }

  // Try to extract JSON if there's other text
  const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    cleaned = jsonMatch[0];
  }

  console.log('Cleaned response:', cleaned);
  return cleaned;
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