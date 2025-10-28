# Tutorial Generator

A powerful AI-powered tool that transforms documentation sites into ready-to-create tutorial scaffolds. Generate tutorial ideas, outlines, and complete content from any documentation with a single click.

![Tutorial Generator](https://img.shields.io/badge/Next.js-14-black?style=for-the-badge&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=for-the-badge&logo=typescript)
![AI Powered](https://img.shields.io/badge/AI-Powered-orange?style=for-the-badge&logo=openai)

## 🚀 Live Demo

[View Live Application](https://tutorial-generator.vercel.app)

## ✨ Features

- **🔍 Smart Documentation Crawling** - Automatically scans and analyzes documentation sites
- **🤖 AI-Powered Tutorial Generation** - Creates relevant tutorial ideas and outlines using OpenAI
- **📝 Interactive Content Creation** - Generate full text tutorials or video scripts with markdown editor
- **🎯 Scaffold & Full Content Modes** - Choose between basic outlines or complete AI-generated content
- **💾 Bulk Export** - Download all tutorials as organized ZIP bundles with CSV index
- **🎨 Dark Theme UI** - Beautiful, accessible interface optimized for content creation
- **⚡ Real-time Enhancements** - Refine and improve generated content with AI enhancements

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
│   ├── api/               # API routes (crawling, AI generation)
│   ├── layout.tsx         # Root layout with dark theme
│   └── page.tsx           # Main application page
├── components/            # React components
│   ├── UrlInputForm.tsx   # Main URL input and tutorial display
│   ├── GenerationModal.tsx# Tutorial generation modal
│   ├── MarkdownEditor.tsx # Markdown editor with preview
│   └── AnimatedCard.tsx   # Animation wrapper component
├── lib/                   # Core utilities
│   ├── crawler.ts         # Documentation scraping
│   ├── ai-generator.ts    # OpenAI integration
│   └── download-manager.ts# File export and ZIP creation
└── types/                 # TypeScript type definitions
```

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- OpenAI API key

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/tutorial-generator.git
   cd tutorial-generator
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   ```
   Edit `.env.local` and add your OpenAI API key:
   ```env
   OPENAI_API_KEY=your_openai_api_key_here
   ```

4. **Run the development server**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser.

### Deployment

1. **Deploy to Vercel**
   ```bash
   npm run build
   vercel --prod
   ```

2. **Set environment variables in Vercel**
   - Go to your project settings in Vercel
   - Add `OPENAI_API_KEY` with your OpenAI API key

## 💡 How to Use

### 1. Generate Tutorial Ideas
- Enter any documentation URL (e.g., `https://docs.github.com`)
- Click "Generate Tutorial Ideas"
- Browse through AI-generated tutorial concepts with outlines and difficulty ratings

### 2. Create Content
- **Scaffold Mode**: Download basic outlines for contributors to expand
- **Full Content Mode**: Generate complete tutorials or video scripts
- **Enhance Content**: Use AI to refine tone, add examples, or improve clarity

### 3. Export Results
- **Individual Files**: Download single tutorials as Markdown files
- **CSV Index**: Export metadata spreadsheet with all tutorial information
- **ZIP Bundle**: Download organized package with all content and metadata

## 🎯 Project Scope

This tool addresses the challenge of turning documentation into a steady pipeline of high-value tutorial tasks by:

### What it Does
- **Crawls documentation sites** and identifies tutorial-worthy topics
- **Generates scaffolded drafts** with titles, outlines, and key sections
- **Estimates creation costs** ($100-500 range) for each tutorial
- **Exports multiple formats** including Markdown files and CSV indexes

### Deliverables
- ✅ GitHub repository with full source code
- ✅ Hosted web app on Vercel
- ✅ Simple web interface for URL input
- ✅ Markdown file generation for tutorial scaffolds
- ✅ CSV index with tutorial metadata
- ✅ Bulk download functionality with ZIP bundles

### Use Cases
- **Content Teams**: Quickly generate tutorial ideas from product documentation
- **Open Source Projects**: Create contributor-friendly tutorial templates
- **Education Platforms**: Develop learning paths from technical documentation
- **Documentation Teams**: Identify gaps and opportunities for tutorial content

## 🔧 API Routes

### `/api/crawl` (POST)
Crawls documentation and generates tutorial ideas
```typescript
{
  url: string;           // Documentation URL to crawl
  regenerate?: boolean;  // Generate new ideas from same URL
}
```

### `/api/generate-tutorial` (POST)
Generates complete tutorial content
```typescript
{
  tutorial: TutorialScaffold;    // Tutorial scaffold to expand
  type: 'text' | 'video';        // Content type to generate
  originalUrl: string;           // Source documentation URL
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

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### Development Workflow
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [OpenAI](https://openai.com) for powerful AI capabilities
- [Next.js](https://nextjs.org) for the excellent React framework
- [Vercel](https://vercel.com) for seamless deployment
- [Tailwind CSS](https://tailwindcss.com) for beautiful styling

## 📞 Support

If you have any questions or need help:
- Open an [issue](https://github.com/your-username/tutorial-generator/issues)
- Check the [documentation](https://github.com/your-username/tutorial-generator/wiki)
- Contact the maintainers

---

**Transform your documentation into engaging tutorials with AI power!** 🚀

*Built with ❤️ for the developer community*