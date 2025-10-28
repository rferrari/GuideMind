import JSZip from 'jszip';
import { TutorialScaffold } from '@/types';

export class DownloadManager {
  static async downloadScaffold(tutorial: TutorialScaffold): Promise<string> {
    return `# ${tutorial.title}

${tutorial.summary}

## Outline
${tutorial.outline.map((section, index) => `${index + 1}. ${section}`).join('\n')}

## Metadata
- **Difficulty**: ${tutorial.difficulty}
- **Estimated Cost**: $${tutorial.estimatedCost.min} - $${tutorial.estimatedCost.max}
- **Source**: ${tutorial.sourceUrl}
- **Generated**: ${new Date().toISOString().split('T')[0]}

## Notes for Contributors
<!-- Add your tutorial content below this line. Use the outline above as your guide. -->
`;
  }

  static async downloadFullContent(tutorial: TutorialScaffold, type: 'text' | 'video'): Promise<string> {
    if (type === 'text' && tutorial.generatedContent?.text) {
      return tutorial.generatedContent.text;
    }
    
    if (type === 'video' && tutorial.generatedContent?.video) {
      return tutorial.generatedContent.video;
    }
    
    // Fallback to scaffold if no generated content
    return this.downloadScaffold(tutorial);
  }

  static generateCSV(tutorials: TutorialScaffold[]): string {
    const headers = ['Title', 'Summary', 'Difficulty', 'Estimated Cost Min', 'Estimated Cost Max', 'Outline', 'Source URL'];
    const csvContent = [
      headers.join(','),
      ...tutorials.map(tutorial => [
        `"${tutorial.title.replace(/"/g, '""')}"`,
        `"${tutorial.summary.replace(/"/g, '""')}"`,
        tutorial.difficulty,
        tutorial.estimatedCost.min,
        tutorial.estimatedCost.max,
        `"${tutorial.outline.join('; ').replace(/"/g, '""')}"`,
        `"${tutorial.sourceUrl.replace(/"/g, '""')}"`
      ].join(','))
    ].join('\n');
    
    return csvContent;
  }

  static async createZipBundle(tutorials: TutorialScaffold[], options: { format: 'scaffold' | 'full', type: 'text' | 'video' | 'both' }): Promise<Blob> {
    const zip = new JSZip();
    
    // Add CSV index
    const csvContent = this.generateCSV(tutorials);
    zip.file('tutorial-scaffolds-index.csv', csvContent);
    
    // Add tutorial files
    for (const tutorial of tutorials) {
      const tutorialFolder = zip.folder(tutorial.title.toLowerCase().replace(/[^a-z0-9]/g, '-'));
      
      if (options.type === 'text' || options.type === 'both') {
        const content = options.format === 'scaffold' 
          ? await this.downloadScaffold(tutorial)
          : await this.downloadFullContent(tutorial, 'text');
        
        const extension = options.format === 'scaffold' ? 'md' : 'md';
        tutorialFolder?.file(`tutorial.${extension}`, content);
      }
      
      if (options.type === 'video' || options.type === 'both') {
        const content = options.format === 'scaffold'
          ? await this.downloadScaffold(tutorial)
          : await this.downloadFullContent(tutorial, 'video');
        
        tutorialFolder?.file('video-script.txt', content);
      }
      
      // Add metadata file
      const metadata = {
        title: tutorial.title,
        summary: tutorial.summary,
        difficulty: tutorial.difficulty,
        estimatedCost: tutorial.estimatedCost,
        outline: tutorial.outline,
        sourceUrl: tutorial.sourceUrl,
        lastUpdated: tutorial.generatedContent?.lastUpdated || new Date()
      };
      tutorialFolder?.file('metadata.json', JSON.stringify(metadata, null, 2));
    }
    
    // Generate ZIP file
    return await zip.generateAsync({ type: 'blob' });
  }

  static async downloadZipBundle(tutorials: TutorialScaffold[], options: { format: 'scaffold' | 'full', type: 'text' | 'video' | 'both' }) {
    const zipBlob = await this.createZipBundle(tutorials, options);
    const url = URL.createObjectURL(zipBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tutorial-scaffolds-${new Date().toISOString().split('T')[0]}.zip`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
}