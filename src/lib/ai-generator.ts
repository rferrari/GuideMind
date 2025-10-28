import { OpenAI } from 'openai';
import { TutorialScaffold } from '@/types';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
  baseURL: process.env.OPENAI_BASE_URL,
});


function parseAIResponse(response: string): any {
  console.log('Raw AI response:', response);
  
  const parsingAttempts = [
    // Attempt 1: Direct parse
    () => JSON.parse(response.trim()),
    
    // Attempt 2: Remove markdown code blocks
    () => JSON.parse(response.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim()),
    
    // Attempt 3: Extract JSON from text
    () => {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error('No JSON found');
      return JSON.parse(jsonMatch[0]);
    },
    
    // Attempt 4: Remove "json" prefix
    () => JSON.parse(response.replace(/^json\s*/i, '').trim()),
  ];

  for (const attempt of parsingAttempts) {
    try {
      return attempt();
    } catch (error) {
      // Continue to next attempt
      console.log('Parsing attempt failed:', error.message);
    }
  }
  
  throw new Error('All parsing attempts failed');
}

export async function generateTutorialIdeas(content: string[]): Promise<TutorialScaffold[]> {
  const contentSample = content.slice(0, 5).join('\n\n');
  
  const prompt = `
You are an expert technical content strategist. Analyze this documentation content and suggest 3-5 tutorial ideas.

DOCUMENTATION CONTENT:
${contentSample}

Generate tutorial scaffolds with:
- Clear, action-oriented titles
- Brief summaries that explain the value
- Logical learning progression in the outline
- Appropriate difficulty level (beginner/intermediate/advanced)
- Realistic cost estimates for tutorial creation ($100-500 range)

Respond with valid JSON only, no additional text or markdown formatting:
{
  "tutorials": [
    {
      "id": "unique-id-1",
      "title": "Tutorial Title",
      "summary": "Brief description",
      "outline": ["Section 1", "Section 2", "Section 3"],
      "difficulty": "beginner",
      "estimatedCost": {"min": 100, "max": 300},
      "sourceUrl": "https://docs.github.com/en"
    }
  ]
}
`;

  try {
    const completion = await openai.chat.completions.create({
      model: process.env.OPENAI_LLM_MODEL,
      messages: [
        { 
          role: "system", 
          content: "You are a technical content expert. Respond with ONLY valid JSON, no other text." 
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
    return parsed.tutorials;
  } catch (error) {
    console.error('AI Generation error:', error);
    return getFallbackTutorials();
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

function getFallbackTutorials(): TutorialScaffold[] {
  return [
    {
      id: 'fallback-1',
      title: 'Understanding Basic Concepts',
      summary: 'Learn the fundamental concepts from this documentation',
      outline: ['Introduction', 'Core Concepts', 'Practical Examples', 'Next Steps'],
      difficulty: 'beginner',
      estimatedCost: { min: 150, max: 350 },
      sourceUrl: 'https://docs.github.com/en'
    }
  ];
}