export interface TutorialScaffold {
  id: string;
  title: string;
  summary: string;
  outline: string[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedCost: {
    min: number;
    max: number;
  };
  sourceUrl: string;
}

export interface CrawlResult {
  url: string;
  title: string;
  content: string;
}