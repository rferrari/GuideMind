import axios from 'axios';
import * as cheerio from 'cheerio';

// Enhanced crawler (optional - for future improvement)
export async function crawlMultiplePages(baseUrl: string, maxPages: number = 5): Promise<string[]> {
  const visited = new Set<string>();
  const content: string[] = [];
  
  async function crawlPage(url: string) {
    if (visited.size >= maxPages) return;
    if (visited.has(url)) return;
    
    visited.add(url);
    
    try {
      const pageContent = await crawlDocumentation(url);
      content.push(...pageContent);
      
      // Extract links and crawl them (simplified example)
      // In a real implementation, you'd parse the HTML for links
      // and crawl relevant internal documentation pages
      
    } catch (error) {
      console.error(`Failed to crawl ${url}:`, error);
    }
  }
  
  await crawlPage(baseUrl);
  return content;
}
export async function crawlDocumentation(baseUrl: string): Promise<string[]> {
  // Validate URL
  if (!baseUrl || typeof baseUrl !== 'string') {
    console.error('Invalid URL provided to crawler:', baseUrl);
    return [];
  }

  try {
    // Ensure URL has protocol
    let urlToCrawl = baseUrl;
    if (!urlToCrawl.startsWith('http://') && !urlToCrawl.startsWith('https://')) {
      urlToCrawl = `https://${urlToCrawl}`;
    }

    console.log('Crawling URL:', urlToCrawl);
    
    const response = await axios.get(urlToCrawl, {
      timeout: 10000,
      headers: {
        'User-Agent': 'TutorialGenerator/1.0'
      },
      validateStatus: function (status) {
        return status >= 200 && status < 400; // Accept 2xx and 3xx status codes
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
    const uniqueContent = [...new Set(content)].slice(0, 50); // Limit to top 50 chunks
    console.log(`Crawled ${uniqueContent.length} unique content chunks from ${urlToCrawl}`);
    
    return uniqueContent;
    
  } catch (error: any) {
    console.error('Crawling failed for URL:', baseUrl, error.message);
    
    // Provide more specific error information
    if (error.code === 'ENOTFOUND') {
      console.error(`DNS lookup failed: ${baseUrl} does not exist or is unreachable`);
    } else if (error.response) {
      console.error(`HTTP ${error.response.status}: ${baseUrl}`);
    } else if (error.request) {
      console.error(`No response received from: ${baseUrl}`);
    }
    
    return [];
  }
}

// Add URL validation function
export async function validateUrl(url: string): Promise<{ isValid: boolean; status?: number; error?: string }> {
  try {
    let urlToCheck = url;
    if (!urlToCheck.startsWith('http://') && !urlToCheck.startsWith('https://')) {
      urlToCheck = `https://${urlToCheck}`;
    }

    const response = await axios.head(urlToCheck, {
      timeout: 5000,
      headers: {
        'User-Agent': 'TutorialGenerator/1.0'
      },
      validateStatus: null // Don't throw on any status code
    });

    return { 
      isValid: response.status < 400, 
      status: response.status 
    };
  } catch (error: any) {
    return { 
      isValid: false, 
      error: error.code === 'ENOTFOUND' ? 'DNS lookup failed - domain does not exist' : error.message 
    };
  }
}

function isNavigation(text: string): boolean {
  const navTerms = ['home', 'search', 'login', 'sign up', 'contact', 'about us'];
  return navTerms.some(term => text.toLowerCase().includes(term));
}