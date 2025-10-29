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
  sourceUrl: string; // The specific documentation URL for this tutorial
  originalBaseUrl?: string; // The original URL the user entered
  generatedContent?: {
    text?: string;
    video?: string;
    lastUpdated: Date;
  };
}

export interface DownloadOptions {
  format: 'scaffold' | 'full';
  type: 'text' | 'video' | 'both';
  includeEdited: boolean;
}

export interface GeneratedTutorial {
  id: string;
  scaffold: TutorialScaffold;
  type: 'text' | 'video';
  content: string;
  status: 'generating' | 'completed' | 'error';
}

export interface EnhancementPrompt {
  id: string;
  text: string;
  description: string;
}

export interface CrawlResult {
  url: string;
  title: string;
  content: string;
}