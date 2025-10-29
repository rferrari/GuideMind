import JSZip from 'jszip';
import { TutorialScaffold } from '@/types';
import { ProgressStep } from '../components/ProgressModal';

export class DownloadManager {

  private static progressCallback?: (step: any) => void;

  static setProgressCallback(callback: (step: any) => void) {
    this.progressCallback = callback;
  }

  private static addProgress(step: Omit<ProgressStep, 'id' | 'timestamp'>) {
    if (this.progressCallback) {
      this.progressCallback(step);
    }
    // Also support global window method for modal component
    if (typeof window !== 'undefined' && (window as any).addProgressStep) {
      (window as any).addProgressStep(step);
    }
  }

  static async generateMissingContent(
    tutorials: TutorialScaffold[],
    type: 'text' | 'video' | 'both',
    originalUrl: string
  ): Promise<{ tutorials: TutorialScaffold[], stats: { success: number, failed: number } }> {
    const updatedTutorials = [...tutorials];
    let successCount = 0;
    let failedCount = 0;

    const totalOperations = tutorials.length * (type === 'both' ? 2 : 1);
    let completedOperations = 0;

    this.addProgress({
      type: 'generating',
      message: `Starting generation of ${totalOperations} content pieces`,
      progress: 0
    });

    for (let i = 0; i < updatedTutorials.length; i++) {
      const tutorial = updatedTutorials[i];

      // Generate missing text content
      if ((type === 'text' || type === 'both') && !tutorial.generatedContent?.text) {
        const progress = Math.round((completedOperations / totalOperations) * 100);

        this.addProgress({
          type: 'generating',
          tutorialId: tutorial.id,
          tutorialTitle: tutorial.title,
          contentType: 'text',
          message: `Generating text tutorial: ${tutorial.title}`,
          progress
        });

        try {
          const textContent = await this.callGenerateTutorialAPI(tutorial, 'text', originalUrl);
          updatedTutorials[i] = {
            ...tutorial,
            generatedContent: {
              ...tutorial.generatedContent,
              text: textContent,
              lastUpdated: new Date()
            }
          };
          successCount++;

          completedOperations++;
          const newProgress = Math.round((completedOperations / totalOperations) * 100);
          this.addProgress({
            type: 'completed',
            tutorialId: tutorial.id,
            tutorialTitle: tutorial.title,
            contentType: 'text',
            message: `✓ Text tutorial generated: ${tutorial.title}`,
            progress: newProgress
          });
        } catch (error) {
          console.error(`❌ Failed to generate text for ${tutorial.title}:`, error);
          const fallbackContent = this.generateBasicTextTutorial(tutorial);
          updatedTutorials[i] = {
            ...tutorial,
            generatedContent: {
              ...tutorial.generatedContent,
              text: fallbackContent,
              lastUpdated: new Date()
            }
          };
          failedCount++;

          completedOperations++;
          const newProgress = Math.round((completedOperations / totalOperations) * 100);
          this.addProgress({
            type: 'error',
            tutorialId: tutorial.id,
            tutorialTitle: tutorial.title,
            contentType: 'text',
            message: `✕ Used template for: ${tutorial.title}`,
            progress: newProgress
          });
        }

        await new Promise(resolve => setTimeout(resolve, 10000));
      }

      // Generate missing video content (similar pattern)
      if ((type === 'video' || type === 'both') && !tutorial.generatedContent?.video) {
        const progress = Math.round((completedOperations / totalOperations) * 100);

        this.addProgress({
          type: 'generating',
          tutorialId: tutorial.id,
          tutorialTitle: tutorial.title,
          contentType: 'video',
          message: `Generating video script: ${tutorial.title}`,
          progress
        });

        try {
          const videoContent = await this.callGenerateTutorialAPI(tutorial, 'video', originalUrl);
          updatedTutorials[i] = {
            ...tutorial,
            generatedContent: {
              ...tutorial.generatedContent,
              video: videoContent,
              lastUpdated: new Date()
            }
          };
          successCount++;

          completedOperations++;
          const newProgress = Math.round((completedOperations / totalOperations) * 100);
          this.addProgress({
            type: 'completed',
            tutorialId: tutorial.id,
            tutorialTitle: tutorial.title,
            contentType: 'video',
            message: `✓ Video script generated: ${tutorial.title}`,
            progress: newProgress
          });
        } catch (error) {
          console.error(`❌ Failed to generate video for ${tutorial.title}:`, error);
          const fallbackContent = this.generateBasicVideoScript(tutorial);
          updatedTutorials[i] = {
            ...tutorial,
            generatedContent: {
              ...tutorial.generatedContent,
              video: fallbackContent,
              lastUpdated: new Date()
            }
          };
          failedCount++;

          completedOperations++;
          const newProgress = Math.round((completedOperations / totalOperations) * 100);
          this.addProgress({
            type: 'error',
            tutorialId: tutorial.id,
            tutorialTitle: tutorial.title,
            contentType: 'video',
            message: `✕ Used template for: ${tutorial.title}`,
            progress: newProgress
          });
        }

        await new Promise(resolve => setTimeout(resolve, 7000));
      }
    }

    this.addProgress({
      type: 'completed',
      message: `Generation complete: ${successCount} success, ${failedCount} failed`,
      progress: 100
    });

    return { tutorials: updatedTutorials, stats: { success: successCount, failed: failedCount } };
  }

  private static async callGenerateTutorialAPI(
    tutorial: TutorialScaffold,
    contentType: 'text' | 'video',
    originalUrl: string
  ): Promise<string> {
    try {
      console.log(`Calling API for ${tutorial.title} (${contentType}) with URL: ${originalUrl}`);

      const response = await fetch('/api/generate-tutorial', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tutorial,
          type: contentType,
          originalUrl: originalUrl
        }),
      });

      if (!response.ok) {
        let errorMessage = `API returned ${response.status}`;

        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorData.details || errorMessage;
        } catch {
          // If we can't parse JSON, use status text
          errorMessage = response.statusText || errorMessage;
        }

        throw new Error(errorMessage);
      }

      const data = await response.json();

      if (!data.content) {
        throw new Error('No content returned from API');
      }

      return data.content;
    } catch (error) {
      console.error(`API call failed for ${tutorial.title}:`, error);
      throw error;
    }
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


  static async createDownloadBundle(
    tutorials: TutorialScaffold[],
    options: { format: 'scaffold' | 'full', type: 'text' | 'video' | 'both' },
    originalUrl: string
  ): Promise<{ blob: Blob; stats: { success: number; failed: number; total: number }; filename: string }> {
    try {
      const { blob, stats } = await this.createZipBundle(tutorials, options, originalUrl);

      const dateStr = new Date().toISOString().split('T')[0];
      const typeStr = options.format === 'scaffold' ? 'scaffolds' : 'full-content';
      const filename = `tutorial-${typeStr}-${dateStr}.zip`;

      // Add final success message
      this.addProgress({
        type: 'completed',
        message: `✅ Bundle ready! ${stats.success} AI-generated, ${stats.failed} used templates`,
        progress: 100
      });

      return { blob, stats, filename };

    } catch (error) {
      console.error('Error creating ZIP bundle:', error);

      // Show error in progress modal
      this.addProgress({
        type: 'error',
        message: `❌ Failed to create bundle: ${error instanceof Error ? error.message : 'Unknown error'}`,
        progress: 100
      });

      throw new Error('Failed to create download bundle');
    }
  }

  static downloadBlob(blob: Blob, filename: string) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  static async createZipBundle(
    tutorials: TutorialScaffold[],
    options: { format: 'scaffold' | 'full', type: 'text' | 'video' | 'both' },
    originalUrl: string
  ): Promise<{ blob: Blob, stats: { success: number, failed: number, total: number } }> {
    let tutorialsToBundle = tutorials;
    let generationStats = { success: 0, failed: 0, total: 0 };

    this.addProgress({
      type: 'creating',
      message: 'Preparing bundle creation...',
      progress: 0
    });

    // If full content is requested, generate missing content first
    if (options.format === 'full') {
      this.addProgress({
        type: 'generating',
        message: `Generating missing content for ${tutorials.length} tutorials`,
        progress: 10
      });

      const result = await this.generateMissingContent(tutorials, options.type, originalUrl);
      tutorialsToBundle = result.tutorials;
      generationStats = { ...result.stats, total: tutorials.length };

      this.addProgress({
        type: 'completed',
        message: 'Content generation completed',
        progress: 60
      });
    } else {
      this.addProgress({
        type: 'creating',
        message: 'Using existing scaffolds only',
        progress: 30
      });
    }

    const zip = new JSZip();

    // Add CSV index
    this.addProgress({
      type: 'creating',
      message: 'Creating CSV index...',
      progress: options.format === 'full' ? 70 : 40
    });
    const csvContent = this.generateCSV(tutorialsToBundle);
    zip.file('tutorial-scaffolds-index.csv', csvContent);

    // Add README file
    this.addProgress({
      type: 'creating',
      message: 'Creating README...',
      progress: options.format === 'full' ? 75 : 45
    });
    const readmeContent = this.generateReadme(tutorialsToBundle, options, generationStats);
    zip.file('README.md', readmeContent);

    // Add tutorial files
    this.addProgress({
      type: 'creating',
      message: 'Creating tutorial folders and files...',
      progress: options.format === 'full' ? 80 : 50
    });

    for (let i = 0; i < tutorialsToBundle.length; i++) {
      const tutorial = tutorialsToBundle[i];
      const folderProgress = options.format === 'full'
        ? 80 + Math.round((i / tutorialsToBundle.length) * 15)
        : 50 + Math.round((i / tutorialsToBundle.length) * 45);

      this.addProgress({
        type: 'creating',
        tutorialId: tutorial.id,
        tutorialTitle: tutorial.title,
        message: `Creating folder: ${tutorial.title}`,
        progress: folderProgress
      });

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
          },
          generatedBy: tutorial.generatedContent ? 'AI API' : 'Template (Fallback)'
        };
        tutorialFolder.file('metadata.json', JSON.stringify(metadata, null, 2));
      }
    }

    // Generate ZIP file
    this.addProgress({
      type: 'creating',
      message: 'Compressing files into ZIP bundle...',
      progress: 95
    });

    const blob = await zip.generateAsync({
      type: 'blob',
      compression: 'DEFLATE',
      compressionOptions: { level: 6 }
    });

    this.addProgress({
      type: 'completed',
      message: 'ZIP bundle created successfully!',
      progress: 100
    });

    return { blob, stats: generationStats };
  }

  private static generateReadme(
    tutorials: TutorialScaffold[],
    options: { format: 'scaffold' | 'full', type: 'text' | 'video' | 'both' },
    stats: { success: number, failed: number, total: number }
  ): string {
    const preGeneratedCount = tutorials.filter(t =>
      (options.type === 'text' || options.type === 'both') && t.generatedContent?.text ||
      (options.type === 'video' || options.type === 'both') && t.generatedContent?.video
    ).length;

    return `# Tutorial Scaffolds Bundle

This bundle contains ${tutorials.length} tutorial ${options.format === 'scaffold' ? 'scaffolds' : 'tutorials'} generated from documentation.

## Generation Summary
- **Total Tutorials**: ${tutorials.length}
- **Format**: ${options.format === 'scaffold' ? 'Scaffolds Only' : 'Full Content'}
- **Content Type**: ${options.type === 'both' ? 'Text + Video' : options.type}
- **Pre-generated Content**: ${preGeneratedCount}/${tutorials.length} tutorials
${options.format === 'full' ? `- **AI Generation Results**: ${stats.success} successful, ${stats.failed} used fallbacks` : ''}
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
- \`metadata.json\`: Additional tutorial metadata and generation info
${options.format === 'full' && options.type.includes('text') ? '- \`full-tutorial.md\': Complete text tutorial' : ''}
${options.format === 'full' && options.type.includes('video') ? '- \`video-script.txt\': Video script' : ''}

## Quality Notes
${options.format === 'full' && stats.failed > 0 ?
        `⚠️ ${stats.failed} tutorial(s) used template fallbacks due to generation issues. For best quality, generate these individually:\n${tutorials.filter(t => !t.generatedContent?.text && !t.generatedContent?.video).map(t => `- ${t.title}`).join('\n')}` :
        options.format === 'full' ? '✅ All tutorials were successfully generated using AI' :
          'Scaffolds are ready for manual content creation'}
`;
  }

  static async downloadScaffold(tutorial: TutorialScaffold): Promise<string> {
    return `# ${tutorial.title}

${tutorial.summary}

## Outline
${tutorial.outline.map((section, index) => `${index + 1}. ${section}`).join('\n')}

## Metadata
- **Difficulty**: ${tutorial.difficulty}
- **Estimated Task Payout**: $${tutorial.estimatedCost.min} - $${tutorial.estimatedCost.max}
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


  static async downloadZipBundle(
    tutorials: TutorialScaffold[],
    options: { format: 'scaffold' | 'full', type: 'text' | 'video' | 'both' },
    originalUrl: string
  ) {
    try {
      const { blob, stats } = await this.createZipBundle(tutorials, options, originalUrl);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;

      const dateStr = new Date().toISOString().split('T')[0];
      const typeStr = options.format === 'scaffold' ? 'scaffolds' : 'full-content';
      a.download = `tutorial-${typeStr}-${dateStr}.zip`;

      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      // Add final success message and keep modal open for 2 seconds
      this.addProgress({
        type: 'completed',
        message: `✅ Download complete! ${stats.success} AI-generated, ${stats.failed} used templates`,
        progress: 100
      });

      // Wait 2 seconds before closing so user can see final status
      await new Promise(resolve => setTimeout(resolve, 2000));

    } catch (error) {
      console.error('Error creating ZIP bundle:', error);

      // Show error in progress modal
      this.addProgress({
        type: 'error',
        message: `❌ Failed to create bundle: ${error instanceof Error ? error.message : 'Unknown error'}`,
        progress: 100
      });

      // Keep error visible for 7 seconds
      await new Promise(resolve => setTimeout(resolve, 7000));

      throw new Error('Failed to create download bundle');
    }
  }
}