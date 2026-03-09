# AI Visibility Analyzer

A web application that analyzes how well your website is optimized for AI systems like ChatGPT, Claude, Perplexity, and other LLM-powered tools.

## What It Does

Enter a URL and get a comprehensive analysis across 6 categories:

- **AI Discovery Files** - Checks for llms.txt, llms-full.txt, /api/context, and .well-known/ai.txt
- **AI Crawler Permissions** - Analyzes robots.txt for GPTBot, ClaudeBot, PerplexityBot, and other AI crawlers
- **Structured Data** - Validates JSON-LD schemas (Organization, FAQPage, Product, etc.)
- **Meta & Content Quality** - Reviews title tags, meta descriptions, Open Graph, and heading structure
- **Technical Foundation** - Checks HTTPS, sitemap, mobile viewport, and page speed
- **Content for AI** - Evaluates factual content, clear definitions, and contact information

Each check provides a status (pass/warning/fail), details, and actionable recommendations.

## Getting Started

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Tech Stack

- Next.js 16
- React 19
- TypeScript
- Tailwind CSS

## TODO

The recommendations system needs improvement - currently provides generic suggestions that could be more specific and actionable based on the actual content analyzed.
