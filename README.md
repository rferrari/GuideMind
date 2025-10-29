# GuideMind — AI that understands docs and teaches them back.

A AI-powered tool that transforms documentation sites into ready-to-create tutorial scaffolds. Generate tutorial ideas, outlines, and complete content from any documentation with few clicks.

![GuideMind](https://img.shields.io/badge/Next.js-14-black?style=for-the-badge&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=for-the-badge&logo=typescript)
![AI Powered](https://img.shields.io/badge/AI-Powered-orange?style=for-the-badge&logo=openai)

## 🚀 Live Demo

<a href="https://guide-mind.vercel.app/" target="_blank">View Live Application</a>

## ✨ Features

- **🔍 Smart Documentation Crawling** - Automatically scans and analyzes documentation sites with intelligent URL discovery
- **🤖 AI-Powered Tutorial Generation** - Creates relevant tutorial ideas and outlines using LLM
- **🎯 Targeted Content Creation** - Generates tutorials from specific documentation pages for maximum relevance
- **📝 Interactive Content Creation** - Generate full text tutorials or video scripts with markdown editor
- **🎯 Scaffold & Full Content Modes** - Choose between basic outlines or complete AI-generated content
- **💾 Bulk Export** - Download all tutorials as organized ZIP bundles with CSV index
- **🎨 Dark Theme UI** - Accessible interface optimized for content creation
- **⚡ Real-time Enhancements** - Refine and improve generated content with AI enhancements

## 🧠 Intelligent Crawling Strategy

The tool uses a sophisticated two-phase crawling approach to ensure high-quality, relevant tutorial content:

### Phase 1: Discovery & Idea Generation
```
User enters: https://developers.hive.io/
         │
         ▼
Crawls main documentation page
         │
         ▼
AI analyzes content and identifies tutorial opportunities
         │
         ▼
Generates tutorial ideas with specific source URLs:
• "Node Setup" → https://developers.hive.io/nodeop/
• "JSON RPC API" → https://developers.hive.io/apidefinitions/#jsonrpc.get_methods
• "Authentication" → https://developers.hive.io/quickstart/#quickstart-authentication
```

### Phase 2: Targeted Content Generation
```
For each tutorial idea:
         │
         ▼
Crawls the specific documentation URL
         │
         ▼
AI generates content using the most relevant documentation
         │
         ▼
High-quality, focused tutorials matching the actual documentation
```

### Benefits of This Approach:
- **🎯 Precision**: Each tutorial uses content from its most relevant documentation page
- **📈 Quality**: AI has better context from focused, specific documentation
- **🔍 Accuracy**: Tutorials match the actual documentation structure and content
- **⚡ Efficiency**: No need to crawl the entire site for every tutorial

## 🛠️ Tech Stack

- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **AI Integration**: OpenAI GPT-4/GPT-3.5-turbo
- **Editor**: @uiw/react-md-editor
- **File Export**: JSZip for bundle downloads
- **Deployment**: Vercel

## 🏗️ Architecture

```
tutorial-generator/
├── app/                    # Next.js 14 App Router
│   ├── api/                # API routes (crawling, AI generation)
│   ├── layout.tsx          # Root layout with dark theme
│   └── page.tsx            # Main application page
├── components/             # React components
│   ├── UrlInputForm.tsx    # Main URL input and tutorial display
│   ├── GenerationModal.tsx # Tutorial generation modal
│   ├── MarkdownEditor.tsx  # Markdown editor with preview
│   └── AnimatedCard.tsx    # Tutorial Card wrapper component
│   └── MarkdownPreview.tsx # Markdown editor with preview
│   └── ProgressModal.tsx   # Generation Progress Modal
│   └── RateLimitCard.tsx   # Rate Limit Card for errors and retries
├── lib/                    # Core utilities
│   ├── crawler.ts          # Documentation scraping
│   ├── ai-generator.ts     # OpenAI integration
│   └── download-manager.ts # File export and ZIP creation
└── types/                  # TypeScript type definitions
```

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- OpenAI API key or Compatible

### Installation

1. **Clone the repository**
   ```bash
   gh repo clone rferrari/GuideMind
   cd tutorial-generator
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Set up environment variables**
   ```bash
   cp sample-env.txt .env
   ```
   Edit `.env` and add your OpenAI API key:
   ```env
   OPENAI_API_KEY=your_openai_api_key_here
   ```
   Edit `.env` and add your OpenAI Compatible base url and model (optional):
   ```env
   OPENAI_BASE_URL=https://api.groq.com/openai/v1
   #OPENAI_LLM_MODEL=openai/gpt-oss-20b
   ```
   If no model selected `gpt-3.5-turbo` will be used.

4. **Run the development server**
   ```bash
   pnpm dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser.

### Deployment

1. **Deploy to Vercel**
   ```bash
   pnpm build
   vercel --prod
   ```

2. **Set environment variables in Vercel**
   - Go to your project settings in Vercel
   - Add `OPENAI_API_KEY` with your OpenAI API key or compatible

## 💡 How to Use

### 1. Generate Tutorial Ideas
- Enter any documentation URL (e.g., `https://docs.github.com`)
- Click "Generate Tutorial Ideas"
- Browse through AI-generated tutorial concepts with outlines, difficulty ratings.
- Generate to preview and/or enhance it with quick prompts or custom prompts

### 2. Create Content
- **Scaffold Mode**: Download basic outlines for contributors to expand
- **Full Content Mode**: Generate complete tutorials or video scripts using targeted documentation
- **Enhance Content**: Use AI to refine tone, add examples, or improve clarity

### 3. Export Results
- **Individual Files**: Download single tutorials as Markdown files
- **CSV Index**: Export metadata spreadsheet with all tutorial information including source URLs
- **ZIP Bundle**: Download organized package with all content and metadata

## 🎯 Project Scope

This tool addresses the challenge of turning documentation into a steady pipeline of high-value tutorial tasks by:

### What it Does
- **Crawls documentation sites** and identifies tutorial-worthy topics using intelligent URL discovery
- **Generates scaffolded drafts** with titles, outlines, key sections, and specific source URLs
- **Estimates creation costs** ($100-500 range) for each tutorial
- **Exports multiple formats** including Markdown files and CSV indexes

### Deliverables
- ✅ Web interface for URL input
- ✅ Markdown file generation for tutorial scaffolds
- ✅ CSV index with tutorial metadata including source URLs
- ✅ Bulk download functionality with ZIP bundles
- ✅ Intelligent crawling with targeted content generation

### Use Cases
- **Content Teams**: Quickly generate tutorial ideas from product documentation with precise source targeting
- **Open Source Projects**: Create contributor-friendly tutorial templates from specific documentation sections
- **Education Platforms**: Develop learning paths from technical documentation with accurate content matching
- **Documentation Teams**: Identify gaps and opportunities for tutorial content across documentation sections

## 🔧 API Routes

### `/api/crawl` (POST)
Crawls documentation and generates tutorial ideas with specific source URLs
```typescript
{
  url: string;           // Documentation URL to crawl
  regenerate?: boolean;  // Generate new ideas from same URL
}
```

### `/api/generate-tutorial` (POST)
Generates complete tutorial content using targeted documentation URLs
```typescript
{
  tutorial: TutorialScaffold;    // Tutorial scaffold with specific sourceUrl
  type: 'text' | 'video';        // Content type to generate
  originalUrl: string;           // Original documentation URL
  enhancementPrompt?: string;    // Optional enhancement instructions
  existingContent?: string;      // Existing content to enhance
}
```

## 🎨 Customization

### Adding Enhancement Prompts
Edit `src/components/MarkdownEditor.tsx` to add new quick-enhancement options:

```typescript
const enhancementPrompts = [
  {
    id: 'your-custom-prompt',
    text: 'Your enhancement instructions',
    description: 'User-friendly description'
  }
];
```

### Modifying AI Prompts
Adjust tutorial generation in `src/lib/ai-generator.ts`:

```typescript
const prompt = `
Customize the AI generation prompt here...
`;
```

## 🤝 Contributing

We welcome contributions!

### Development Workflow
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License.

## 🙏 Acknowledgments

- [OpenAI](https://openai.com) for powerful AI capabilities
- [Groq](https://groq.com/) delivers fast, low cost inference that doesn’t flake when things get real.
- [Next.js](https://nextjs.org) for the excellent React framework
- [Vercel](https://vercel.com) for seamless deployment
- [Tailwind CSS](https://tailwindcss.com) for beautiful styling

## 📞 Support

If you have any questions or need help:
- Open an [issue](https://github.com/rferrari/GuideMind/issues)

---

**Transform your documentation into engaging tutorials with intelligent AI-powered content generation!**

*Built with ❤️ for the ns.com community*



---

## 💡 **Enhancements Ideas**


**Goal:** Improve robustness, scalability, and extraction quality of the documentation crawler and tutorial generation pipeline.

---

#### Architecture & Structure

* [ ] Refactor crawler into modular files (`core`, `extractors`, `filters`, `utils`)
* [ ] Add unit tests for URL validation, extraction, and link filtering

---

#### Crawling Improvements

* [ ] Add request throttling / rate limiting (e.g., [`p-queue`](https://www.npmjs.com/package/p-queue))
* [ ] Respect `robots.txt` rules (`robots-parser`)
* [ ] Improve content extraction (remove `nav`, `footer`, `header`, `aside`)
* [ ] Integrate [`@mozilla/readability`](https://www.npmjs.com/package/@mozilla/readability) for cleaner text extraction
* [ ] Add link scoring and prioritization (prefer `/docs/`, `/guide/`, `/tutorial/`)
* [ ] Implement async recursive crawling with depth + concurrency control

---

#### Content Processing

* [ ] Implement **semantic chunking** (group text by heading hierarchy for LLM)
* [ ] Normalize encoding (handle non-UTF8 pages safely)
* [ ] Extract metadata (`meta[name="description"]`, `keywords`, `og:title`)
* [ ] Improve deduplication and text block filtering logic

---

#### Prompt & Generation Logic

* [ ] Auto-summarize long crawled docs before sending to LLM
* [ ] Dynamically choose LLM model (e.g., `gpt-4-turbo` for large inputs, `gpt-4o-mini` for short)
* [ ] Add adaptive prompt templates per tutorial type (text, video, short-form)
* [ ] Add support for structured prompt logging (track tokens & content size)

---

#### Logging, Error Handling & Monitoring

* [ ] Replace `console.log` with structured logger (`pino` or `winston`)
* [ ] Categorize errors clearly (network / parsing / OpenAI / validation)
* [ ] Add retry with exponential backoff for transient HTTP errors
* [ ] Include crawl performance metrics (time, chunk count, links parsed)

---

#### Advanced Features

* [ ] Add caching (Redis or local JSON store) to avoid re-crawling same URLs
* [ ] Support `sitemap.xml` discovery for documentation domains
* [ ] Enable parallel summarization for multi-page docs
* [ ] Add embeddings + vector retrieval for “Ask the Docs” functionality
* [ ] Introduce plugin system for framework-specific docs (e.g., React, Next.js, Hive API)

---

#### Polish & UX

* [ ] Normalize URLs (strip trailing slashes, ignore JS or anchor-only links)
* [ ] Add configurable `CRAWLER_USER_AGENT` in `.env`
* [ ] Clean up logs and remove verbose console output in production
* [ ] Add fallback rules when URLs fail validation or return 404
* [ ] Improve UX feedback during crawl (progress logs, visual indicators)

---

