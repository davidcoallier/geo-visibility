export type CheckStatus = "pass" | "fail" | "warning" | "not_found";

export interface CheckResult {
  id: string;
  category: string;
  name: string;
  description: string;
  status: CheckStatus;
  details?: string;
  value?: string | string[] | Record<string, unknown>;
  recommendation?: string;
  priority: "critical" | "high" | "medium" | "low";
}

export interface CategoryResult {
  category: string;
  description: string;
  checks: CheckResult[];
  score: number;
  maxScore: number;
}

export interface AnalysisResult {
  url: string;
  analyzedAt: string;
  overallScore: number;
  maxScore: number;
  categories: CategoryResult[];
  summary: {
    passed: number;
    failed: number;
    warnings: number;
    notFound: number;
  };
}

// GEO Check Categories and their checks
export const GEO_CHECKS = {
  ai_discovery: {
    name: "AI Discovery Files",
    description: "Files that help AI systems understand your site",
    checks: [
      {
        id: "llms_txt",
        name: "llms.txt",
        description: "Markdown file for LLM consumption at /llms.txt",
        priority: "critical" as const,
        recommendation: "Create a /llms.txt file with a clear summary of your site, key features, and links to important pages.",
      },
      {
        id: "llms_full_txt",
        name: "llms-full.txt",
        description: "Comprehensive content file at /llms-full.txt",
        priority: "high" as const,
        recommendation: "Create /llms-full.txt with complete content including blog posts and detailed documentation.",
      },
      {
        id: "context_api",
        name: "Context API Endpoint",
        description: "JSON endpoint for structured data (e.g., /api/context)",
        priority: "high" as const,
        recommendation: "Create a JSON API endpoint that returns structured data about your site for AI consumption.",
      },
      {
        id: "well_known_ai",
        name: "/.well-known/ai.txt",
        description: "AI configuration file in well-known directory",
        priority: "medium" as const,
        recommendation: "Consider adding /.well-known/ai.txt with AI interaction preferences.",
      },
    ],
  },
  robots_ai_crawlers: {
    name: "AI Crawler Permissions",
    description: "robots.txt rules for AI crawlers",
    checks: [
      {
        id: "robots_txt_exists",
        name: "robots.txt Exists",
        description: "robots.txt file is accessible",
        priority: "critical" as const,
        recommendation: "Create a robots.txt file at the root of your domain.",
      },
      {
        id: "gptbot_allowed",
        name: "GPTBot Allowed",
        description: "OpenAI's GPTBot crawler is allowed",
        priority: "critical" as const,
        recommendation: "Add 'User-agent: GPTBot' with 'Allow: /' to your robots.txt.",
      },
      {
        id: "chatgpt_user_allowed",
        name: "ChatGPT-User Allowed",
        description: "ChatGPT user browsing crawler allowed",
        priority: "high" as const,
        recommendation: "Add 'User-agent: ChatGPT-User' with 'Allow: /' to your robots.txt.",
      },
      {
        id: "claudebot_allowed",
        name: "ClaudeBot Allowed",
        description: "Anthropic's ClaudeBot crawler allowed",
        priority: "critical" as const,
        recommendation: "Add 'User-agent: ClaudeBot' with 'Allow: /' to your robots.txt.",
      },
      {
        id: "claude_web_allowed",
        name: "Claude-Web Allowed",
        description: "Claude web browsing crawler allowed",
        priority: "high" as const,
        recommendation: "Add 'User-agent: Claude-Web' with 'Allow: /' to your robots.txt.",
      },
      {
        id: "perplexitybot_allowed",
        name: "PerplexityBot Allowed",
        description: "Perplexity AI crawler allowed",
        priority: "high" as const,
        recommendation: "Add 'User-agent: PerplexityBot' with 'Allow: /' to your robots.txt.",
      },
      {
        id: "google_extended_allowed",
        name: "Google-Extended Allowed",
        description: "Google AI training crawler allowed",
        priority: "medium" as const,
        recommendation: "Add 'User-agent: Google-Extended' with 'Allow: /' if you want Google AI to use your content.",
      },
      {
        id: "cohere_allowed",
        name: "Cohere-AI Allowed",
        description: "Cohere AI crawler allowed",
        priority: "medium" as const,
        recommendation: "Add 'User-agent: Cohere-AI' with 'Allow: /' to your robots.txt.",
      },
      {
        id: "anthropic_ai_allowed",
        name: "Anthropic-AI Allowed",
        description: "Anthropic AI general crawler allowed",
        priority: "high" as const,
        recommendation: "Add 'User-agent: Anthropic-AI' with 'Allow: /' to your robots.txt.",
      },
      {
        id: "meta_ai_allowed",
        name: "Meta AI Allowed",
        description: "Meta/Facebook AI crawler allowed",
        priority: "medium" as const,
        recommendation: "Add 'User-agent: Meta-ExternalAgent' with 'Allow: /' to your robots.txt.",
      },
      {
        id: "llms_txt_in_robots",
        name: "llms.txt Referenced",
        description: "robots.txt explicitly allows /llms.txt",
        priority: "medium" as const,
        recommendation: "Add explicit 'Allow: /llms.txt' rules for AI crawlers in robots.txt.",
      },
    ],
  },
  structured_data: {
    name: "Structured Data (JSON-LD)",
    description: "Schema.org markup for AI understanding",
    checks: [
      {
        id: "has_jsonld",
        name: "JSON-LD Present",
        description: "Page contains JSON-LD structured data",
        priority: "critical" as const,
        recommendation: "Add JSON-LD structured data using Schema.org vocabulary.",
      },
      {
        id: "organization_schema",
        name: "Organization Schema",
        description: "Organization structured data present",
        priority: "high" as const,
        recommendation: "Add Organization schema with name, logo, contact info, and social profiles.",
      },
      {
        id: "website_schema",
        name: "WebSite Schema",
        description: "WebSite structured data with search action",
        priority: "high" as const,
        recommendation: "Add WebSite schema with name, URL, and optionally SearchAction.",
      },
      {
        id: "faq_schema",
        name: "FAQPage Schema",
        description: "FAQ structured data present",
        priority: "high" as const,
        recommendation: "Add FAQPage schema for frequently asked questions to improve AI responses.",
      },
      {
        id: "product_schema",
        name: "Product/Service Schema",
        description: "Product or Service structured data",
        priority: "medium" as const,
        recommendation: "Add Product or Service schema with pricing, features, and descriptions.",
      },
      {
        id: "localbusiness_schema",
        name: "LocalBusiness Schema",
        description: "Local business structured data",
        priority: "medium" as const,
        recommendation: "Add LocalBusiness schema for local businesses with address and hours.",
      },
      {
        id: "breadcrumb_schema",
        name: "BreadcrumbList Schema",
        description: "Breadcrumb navigation structured data",
        priority: "low" as const,
        recommendation: "Add BreadcrumbList schema to help AI understand site hierarchy.",
      },
      {
        id: "howto_schema",
        name: "HowTo Schema",
        description: "How-to guide structured data",
        priority: "medium" as const,
        recommendation: "Add HowTo schema for instructional content.",
      },
      {
        id: "article_schema",
        name: "Article Schema",
        description: "Article or BlogPosting structured data",
        priority: "medium" as const,
        recommendation: "Add Article or BlogPosting schema for blog content.",
      },
      {
        id: "review_schema",
        name: "Review/Rating Schema",
        description: "Review or AggregateRating structured data",
        priority: "medium" as const,
        recommendation: "Add Review or AggregateRating schema for testimonials and ratings.",
      },
      {
        id: "speakable_schema",
        name: "Speakable Schema",
        description: "Speakable structured data for voice assistants",
        priority: "low" as const,
        recommendation: "Add Speakable schema to indicate content suitable for voice responses.",
      },
    ],
  },
  meta_content: {
    name: "Meta & Content Quality",
    description: "HTML meta tags and content structure",
    checks: [
      {
        id: "title_tag",
        name: "Title Tag",
        description: "Page has a descriptive title tag",
        priority: "critical" as const,
        recommendation: "Add a clear, descriptive title tag under 60 characters.",
      },
      {
        id: "meta_description",
        name: "Meta Description",
        description: "Page has a meta description",
        priority: "critical" as const,
        recommendation: "Add a compelling meta description under 160 characters.",
      },
      {
        id: "canonical_url",
        name: "Canonical URL",
        description: "Page specifies canonical URL",
        priority: "high" as const,
        recommendation: "Add a canonical link tag to prevent duplicate content issues.",
      },
      {
        id: "lang_attribute",
        name: "Language Attribute",
        description: "HTML lang attribute set",
        priority: "high" as const,
        recommendation: "Add lang attribute to the <html> tag (e.g., lang=\"en\").",
      },
      {
        id: "h1_tag",
        name: "H1 Heading",
        description: "Page has exactly one H1 heading",
        priority: "high" as const,
        recommendation: "Ensure page has exactly one H1 tag that describes the main topic.",
      },
      {
        id: "heading_hierarchy",
        name: "Heading Hierarchy",
        description: "Proper heading structure (H1 > H2 > H3)",
        priority: "medium" as const,
        recommendation: "Use proper heading hierarchy without skipping levels.",
      },
      {
        id: "og_tags",
        name: "Open Graph Tags",
        description: "Open Graph meta tags present",
        priority: "medium" as const,
        recommendation: "Add og:title, og:description, og:image, and og:url tags.",
      },
      {
        id: "twitter_cards",
        name: "Twitter Cards",
        description: "Twitter card meta tags present",
        priority: "low" as const,
        recommendation: "Add twitter:card, twitter:title, twitter:description tags.",
      },
      {
        id: "content_freshness",
        name: "Content Freshness",
        description: "Last modified or published date indicated",
        priority: "medium" as const,
        recommendation: "Include dateModified or datePublished in structured data.",
      },
    ],
  },
  technical_seo: {
    name: "Technical Foundation",
    description: "Core technical requirements",
    checks: [
      {
        id: "https",
        name: "HTTPS",
        description: "Site uses HTTPS",
        priority: "critical" as const,
        recommendation: "Ensure your site uses HTTPS for security and trust.",
      },
      {
        id: "sitemap_exists",
        name: "Sitemap.xml",
        description: "XML sitemap is accessible",
        priority: "high" as const,
        recommendation: "Create and submit an XML sitemap at /sitemap.xml.",
      },
      {
        id: "sitemap_in_robots",
        name: "Sitemap in robots.txt",
        description: "Sitemap URL referenced in robots.txt",
        priority: "medium" as const,
        recommendation: "Add 'Sitemap: https://yoursite.com/sitemap.xml' to robots.txt.",
      },
      {
        id: "mobile_friendly",
        name: "Mobile Viewport",
        description: "Mobile viewport meta tag present",
        priority: "high" as const,
        recommendation: "Add viewport meta tag for mobile responsiveness.",
      },
      {
        id: "clean_urls",
        name: "Clean URLs",
        description: "URL is clean and readable",
        priority: "medium" as const,
        recommendation: "Use clean, descriptive URLs without excessive parameters.",
      },
      {
        id: "page_speed",
        name: "Page Loads",
        description: "Page responds within reasonable time",
        priority: "high" as const,
        recommendation: "Optimize page load time to under 3 seconds.",
      },
    ],
  },
  content_quality: {
    name: "Content for AI",
    description: "Content characteristics that help AI systems",
    checks: [
      {
        id: "factual_content",
        name: "Factual Content",
        description: "Page contains factual, verifiable content",
        priority: "high" as const,
        recommendation: "Include specific facts, numbers, and verifiable claims.",
      },
      {
        id: "clear_definitions",
        name: "Clear Definitions",
        description: "Key terms and products clearly defined",
        priority: "high" as const,
        recommendation: "Clearly define what your product/service is in the first paragraph.",
      },
      {
        id: "contact_info",
        name: "Contact Information",
        description: "Contact information is present",
        priority: "medium" as const,
        recommendation: "Include visible contact information (email, phone, address).",
      },
      {
        id: "about_info",
        name: "About/Company Info",
        description: "Company or author information present",
        priority: "medium" as const,
        recommendation: "Include about page or company information for credibility.",
      },
      {
        id: "citations_sources",
        name: "Citations/Sources",
        description: "External citations or sources referenced",
        priority: "low" as const,
        recommendation: "Link to authoritative sources when making claims.",
      },
      {
        id: "no_ai_blocking",
        name: "No AI Blocking Meta",
        description: "No meta tags blocking AI indexing",
        priority: "critical" as const,
        recommendation: "Remove any 'noai' or 'noimageai' meta tags if you want AI visibility.",
      },
    ],
  },
} as const;

export type CheckId = keyof typeof GEO_CHECKS;
