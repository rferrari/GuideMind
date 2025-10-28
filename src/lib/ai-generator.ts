import { OpenAI } from 'openai';
import { TutorialScaffold } from '@/types';

const openai = new OpenAI({
  apiKey: process.env.GROQ_API_KEY!,
  baseURL: "https://api.groq.com/openai/v1",
});

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
      "sourceUrl": "https://docs.github.com/en"
    }
  ]
}
`;

  try {
    const completion = await openai.chat.completions.create({
      model: "openai/gpt-oss-20b",
      messages: [
        { role: "system", content: "You are a technical content expert. Always respond with valid JSON." },
        { role: "user", content: prompt }
      ],
      temperature: 0.7,
      max_tokens: 2000,
    });

    const response = completion.choices[0]?.message?.content;
    if (!response) throw new Error('No response from AI');

    const parsed = JSON.parse(response);
    return parsed.tutorials;
  } catch (error) {
    console.error('AI Generation error:', error);
    // Fallback to mock data if AI fails
    return getFallbackTutorials();
  }
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
      sourceUrl: 'https://docs.example.com/en'
    }
  ];
}