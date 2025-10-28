import axios from 'axios';
import * as cheerio from 'cheerio';

export async function crawlDocumentation(baseUrl: string): Promise<string[]> {
  try {
    const response = await axios.get(baseUrl);
    const $ = cheerio.load(response.data);
    
    // Extract all text content (simplified)
    const content: string[] = [];
    
    $('h1, h2, h3, p').each((_, element) => {
      const text = $(element).text().trim();
      if (text && text.length > 10) {
        content.push(text);
      }
    });
    
    return content;
  } catch (error) {
    console.error('Crawling failed:', error);
    return [];
  }
}