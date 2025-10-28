import axios from 'axios';
import * as cheerio from 'cheerio';

export async function crawlDocumentation(baseUrl: string): Promise<string[]> {
  try {
    const response = await axios.get(baseUrl, {
      timeout: 10000,
      headers: {
        'User-Agent': 'TutorialGenerator/1.0'
      }
    });
    
    const $ = cheerio.load(response.data);
    const content: string[] = [];
    
    // Extract meaningful content in priority order
    const selectors = [
      'h1', 'h2', 'h3', 
      'p', 'li', 
      '.content', '.documentation', '#main', 'main', 'article'
    ];
    
    $(selectors.join(', ')).each((_, element) => {
      const text = $(element).text()
        .trim()
        .replace(/\s+/g, ' ')
        .replace(/\[\d+\]/g, ''); // Remove citation numbers
      
      // Only include substantial content
      if (text && text.length > 20 && !isNavigation(text)) {
        content.push(text);
      }
    });
    
    // Remove duplicates and return unique content
    return [...new Set(content)].slice(0, 50); // Limit to top 50 chunks
    
  } catch (error) {
    console.error('Crawling failed:', error);
    return [];
  }
}

function isNavigation(text: string): boolean {
  const navTerms = ['home', 'search', 'login', 'sign up', 'contact', 'about us'];
  return navTerms.some(term => text.toLowerCase().includes(term));
}