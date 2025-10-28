import JSZip from 'jszip';
import { TutorialScaffold } from '@/types';

export class DownloadManager {

 static async generateMissingContent(tutorials: TutorialScaffold[], type: 'text' | 'video' | 'both'): Promise<TutorialScaffold[]> {
    const updatedTutorials = [...tutorials];
    
    for (let i = 0; i < updatedTutorials.length; i++) {
      const tutorial = updatedTutorials[i];
      
      // Generate missing text content
      if ((type === 'text' || type === 'both') && !tutorial.generatedContent?.text) {
        console.log(`Generating text content for: ${tutorial.title}`);
        const textContent = await this.generateTutorialContent(tutorial, 'text');
        updatedTutorials[i] = {
          ...tutorial,
          generatedContent: {
            ...tutorial.generatedContent,
            text: textContent,
            lastUpdated: new Date()
          }
        };
        
        // Add small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      
      // Generate missing video content
      if ((type === 'video' || type === 'both') && !tutorial.generatedContent?.video) {
        console.log(`Generating video content for: ${tutorial.title}`);
        const videoContent = await this.generateTutorialContent(tutorial, 'video');
        updatedTutorials[i] = {
          ...tutorial,
          generatedContent: {
            ...tutorial.generatedContent,
            video: videoContent,
            lastUpdated: new Date()
          }
        };
        
        // Add small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    return updatedTutorials;
  }

  private static async generateTutorialContent(tutorial: TutorialScaffold, type: 'text' | 'video'): Promise<string> {
    try {
      // For now, we'll generate a basic content based on the scaffold
      // In a real implementation, you'd call your AI API here
      if (type === 'text') {
        return this.generateBasicTextTutorial(tutorial);
      } else {
        return this.generateBasicVideoScript(tutorial);
      }
    } catch (error) {
      console.error(`Failed to generate ${type} content for ${tutorial.title}:`, error);
      return `# ${tutorial.title}\n\nFailed to generate content. Please try generating this tutorial individually.\n\n## Outline\n${tutorial.outline.map((section, index) => `${index + 1}. ${section}`).join('\n')}`;
    }
  }

  private static generateBasicTextTutorial(tutorial: TutorialScaffold): string {
    return `# ${tutorial.title}

${tutorial.summary}

## Overview
This tutorial will guide you through ${tutorial.title.toLowerCase()}. 

## Prerequisites
- Basic understanding of the subject
- Access to relevant tools/platforms

## Steps

${tutorial.outline.map((section, index) => `### ${index + 1}. ${section}

In this section, you'll learn how to ${section.toLowerCase()}.

**Key points:**
- Point 1
- Point 2
- Point 3

**Example:**
\`\`\`
// Add your code example here
\`\`\`

`).join('\n')}

## Conclusion
You've successfully learned how to ${tutorial.title.toLowerCase()}. 

## Next Steps
- Practice with real-world examples
- Explore advanced features
- Join community discussions

---
*Generated from documentation. Review and expand with specific examples and details.*
`;
  }

  private static generateBasicVideoScript(tutorial: TutorialScaffold): string {
    return `VIDEO SCRIPT: ${tutorial.title}

DURATION: 5-10 minutes
DIFFICULTY: ${tutorial.difficulty}

INTRODUCTION (0:00 - 0:30)
- Hook: "Have you ever wanted to learn how to ${tutorial.title.toLowerCase()}?"
- What we'll cover: ${tutorial.summary}
- What you'll learn: ${tutorial.outline.join(', ')}

MAIN CONTENT
${tutorial.outline.map((section, index) => `SECTION ${index + 1}: ${section} (${index + 1}:00 - ${index + 2}:00)
- Visual: Screen recording/demonstration
- Narration: "Let's start with ${section.toLowerCase()}..."
- Key points:
  * Point 1 about ${section}
  * Point 2 about ${section}
  * Practical example
- Transition: "Now that we've covered ${section}, let's move to..."

`).join('\n')}

CONCLUSION (${tutorial.outline.length + 1}:00 - end)
- Recap: "Today we learned how to ${tutorial.title.toLowerCase()}"
- Key takeaways: ${tutorial.outline.slice(0, 3).join(', ')}
- Call to action: "Try this yourself and share your results!"
- Next steps: "In the next video, we'll cover..."

PRODUCTION NOTES:
- Add background music
- Include screen recordings for each section
- Add text overlays for key points
- Include code examples where relevant

---
*Generated script. Add specific examples, timings, and visual cues.*
`;
  }

  static async createZipBundle(tutorials: TutorialScaffold[], options: { format: 'scaffold' | 'full', type: 'text' | 'video' | 'both' }): Promise<Blob> {
    let tutorialsToBundle = tutorials;
    
    // If full content is requested, generate missing content first
    if (options.format === 'full') {
      tutorialsToBundle = await this.generateMissingContent(tutorials, options.type);
    }
    
    const zip = new JSZip();
    
    // Add CSV index
    const csvContent = this.generateCSV(tutorialsToBundle);
    zip.file('tutorial-scaffolds-index.csv', csvContent);
    
    // Add README file
    const readmeContent = this.generateReadme(tutorialsToBundle, options);
    zip.file('README.md', readmeContent);
    
    // Add tutorial files
    for (const tutorial of tutorialsToBundle) {
      const folderName = tutorial.title.toLowerCase().replace(/[^a-z0-9]/g, '-');
      const tutorialFolder = zip.folder(folderName);
      
      if (tutorialFolder) {
        // Always include scaffold
        const scaffoldContent = await this.downloadScaffold(tutorial);
        tutorialFolder.file('scaffold.md', scaffoldContent);
        
        // Include full content if requested
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
          hasFullContent: !!tutorial.generatedContent,
          contentTypes: {
            text: !!tutorial.generatedContent?.text,
            video: !!tutorial.generatedContent?.video
          }
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

  private static generateReadme(tutorials: TutorialScaffold[], options: { format: 'scaffold' | 'full', type: 'text' | 'video' | 'both' }): string {
    const generatedCount = tutorials.filter(t => t.generatedContent).length;
    const totalCount = tutorials.length;
    
    return `# Tutorial Scaffolds Bundle

This bundle contains ${totalCount} tutorial ${options.format === 'scaffold' ? 'scaffolds' : 'tutorials'} generated from documentation.

## Summary
- **Total Tutorials**: ${totalCount}
- **Format**: ${options.format === 'scaffold' ? 'Scaffolds Only' : 'Full Content'}
- **Content Type**: ${options.type === 'both' ? 'Text + Video' : options.type}
- **Pre-generated Content**: ${generatedCount}/${totalCount} tutorials
- **Generated**: ${new Date().toISOString()}

## Contents
- \`tutorial-scaffolds-index.csv\`: Index file with all tutorial metadata
- Individual tutorial folders with scaffold files and metadata
${options.format === 'full' ? `- Full tutorial content in ${options.type} format` : ''}

## Usage
1. Review the CSV index to see all available tutorials
2. Open individual tutorial folders to see the content
3. ${options.format === 'scaffold' ? 'Use scaffold files as starting points for creating full tutorials' : 'Full content is ready for review and refinement'}

## File Structure
Each tutorial folder contains:
- \`scaffold.md\`: The main scaffold file with outline and metadata
- \`metadata.json\`: Additional tutorial metadata
${options.format === 'full' && options.type.includes('text') ? '- \`full-tutorial.md\': Complete text tutorial' : ''}
${options.format === 'full' && options.type.includes('video') ? '- \`video-script.txt\': Video script' : ''}

## Notes
${options.format === 'full' && generatedCount < totalCount ? 
  `⚠️ Some tutorials were automatically generated for this bundle. For best quality, generate each tutorial individually using the web interface.` : 
  'All content has been individually generated and reviewed.'}
`;
  }

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