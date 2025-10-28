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

  static downloadFile(content: string, filename: string) {
    const blob = new Blob([content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  static async createZipBundle(tutorials: TutorialScaffold[], options: { format: 'scaffold' | 'full', type: 'text' | 'video' | 'both' }): Promise<Blob> {
    const zip = new JSZip();
    
    // Add CSV index
    const csvContent = this.generateCSV(tutorials);
    zip.file('tutorial-scaffolds-index.csv', csvContent);
    
    // Add README file
    const readmeContent = `# Tutorial Scaffolds Bundle

This bundle contains ${tutorials.length} tutorial scaffolds generated from documentation.

## Contents
- \`tutorial-scaffolds-index.csv\`: Index file with all tutorial metadata
- Individual tutorial folders with scaffold files and metadata

## Usage
1. Review the CSV index to see all available tutorials
2. Open individual tutorial folders to see the scaffold content
3. Use the scaffold files as starting points for creating full tutorials

## File Structure
Each tutorial folder contains:
- \`scaffold.md\`: The main scaffold file with outline and metadata
- \`metadata.json\`: Additional tutorial metadata
${options.type === 'both' ? '- \`video-script.txt\`: Video script scaffold (if available)' : ''}

Generated on: ${new Date().toISOString()}
`;
    zip.file('README.md', readmeContent);
    
    // Add tutorial files
    for (const tutorial of tutorials) {
      const folderName = tutorial.title.toLowerCase().replace(/[^a-z0-9]/g, '-');
      const tutorialFolder = zip.folder(folderName);
      
      if (tutorialFolder) {
        // Always include scaffold
        const scaffoldContent = await this.downloadScaffold(tutorial);
        tutorialFolder.file('scaffold.md', scaffoldContent);
        
        // Include full content if requested and available
        if (options.format === 'full') {
          if (options.type === 'text' || options.type === 'both') {
            const textContent = await this.downloadFullContent(tutorial, 'text');
            tutorialFolder.file('full-tutorial.md', textContent);
          }
          
          if (options.type === 'video' || options.type === 'both') {
            const videoContent = await this.downloadFullContent(tutorial, 'video');
            tutorialFolder.file('video-script.txt', videoContent);
          }
        }
        
        // Add metadata file
        const metadata = {
          title: tutorial.title,
          summary: tutorial.summary,
          difficulty: tutorial.difficulty,
          estimatedCost: tutorial.estimatedCost,
          outline: tutorial.outline,
          sourceUrl: tutorial.sourceUrl,
          lastUpdated: tutorial.generatedContent?.lastUpdated || new Date().toISOString(),
          hasFullContent: !!tutorial.generatedContent
        };
        tutorialFolder.file('metadata.json', JSON.stringify(metadata, null, 2));
      }
    }
    
    // Generate ZIP file
    return await zip.generateAsync({ 
      type: 'blob',
      compression: 'DEFLATE',
      compressionOptions: { level: 6 }
    });
  }

  static async downloadZipBundle(tutorials: TutorialScaffold[], options: { format: 'scaffold' | 'full', type: 'text' | 'video' | 'both' }) {
    try {
      const zipBlob = await this.createZipBundle(tutorials, options);
      const url = URL.createObjectURL(zipBlob);
      const a = document.createElement('a');
      a.href = url;
      
      const dateStr = new Date().toISOString().split('T')[0];
      const typeStr = options.format === 'scaffold' ? 'scaffolds' : 'full-content';
      a.download = `tutorial-${typeStr}-${dateStr}.zip`;
      
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error creating ZIP bundle:', error);
      throw new Error('Failed to create download bundle');
    }
  }
}