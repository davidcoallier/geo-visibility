import { CheckResult, CategoryResult, AnalysisResult, GEO_CHECKS, CheckStatus } from "./types";

interface FetchedContent {
  html: string;
  robotsTxt: string | null;
  llmsTxt: string | null;
  llmsFullTxt: string | null;
  contextApi: Record<string, unknown> | null;
  wellKnownAi: string | null;
  sitemapXml: string | null;
  responseTime: number;
}

function getBaseUrl(url: string): string {
  const parsed = new URL(url);
  return `${parsed.protocol}//${parsed.host}`;
}

async function fetchWithTimeout(url: string, timeout = 10000): Promise<Response | null> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent": "GEO-Analyzer/1.0",
      },
    });
    clearTimeout(id);
    return response;
  } catch {
    clearTimeout(id);
    return null;
  }
}

async function fetchContent(url: string): Promise<FetchedContent> {
  const baseUrl = getBaseUrl(url);
  const startTime = Date.now();

  const [htmlRes, robotsRes, llmsRes, llmsFullRes, contextRes, wellKnownRes, sitemapRes] =
    await Promise.all([
      fetchWithTimeout(url),
      fetchWithTimeout(`${baseUrl}/robots.txt`),
      fetchWithTimeout(`${baseUrl}/llms.txt`),
      fetchWithTimeout(`${baseUrl}/llms-full.txt`),
      fetchWithTimeout(`${baseUrl}/api/context`),
      fetchWithTimeout(`${baseUrl}/.well-known/ai.txt`),
      fetchWithTimeout(`${baseUrl}/sitemap.xml`),
    ]);

  const responseTime = Date.now() - startTime;

  let contextApi = null;
  if (contextRes?.ok) {
    try {
      contextApi = await contextRes.json();
    } catch {
      contextApi = null;
    }
  }

  return {
    html: htmlRes?.ok ? await htmlRes.text() : "",
    robotsTxt: robotsRes?.ok ? await robotsRes.text() : null,
    llmsTxt: llmsRes?.ok ? await llmsRes.text() : null,
    llmsFullTxt: llmsFullRes?.ok ? await llmsFullRes.text() : null,
    contextApi,
    wellKnownAi: wellKnownRes?.ok ? await wellKnownRes.text() : null,
    sitemapXml: sitemapRes?.ok ? await sitemapRes.text() : null,
    responseTime,
  };
}

function extractJsonLd(html: string): Record<string, unknown>[] {
  const schemas: Record<string, unknown>[] = [];
  const regex = /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let match;

  while ((match = regex.exec(html)) !== null) {
    try {
      const parsed = JSON.parse(match[1]);
      if (Array.isArray(parsed)) {
        schemas.push(...parsed);
      } else {
        schemas.push(parsed);
      }
    } catch {
      // Invalid JSON-LD
    }
  }

  return schemas;
}

function hasSchemaType(schemas: Record<string, unknown>[], type: string | string[]): boolean {
  const types = Array.isArray(type) ? type : [type];
  return schemas.some(schema => {
    const schemaType = schema["@type"];
    if (Array.isArray(schemaType)) {
      return schemaType.some(t => types.includes(t as string));
    }
    return types.includes(schemaType as string);
  });
}

function checkRobotsForAgent(robotsTxt: string | null, agent: string): CheckStatus {
  if (!robotsTxt) return "not_found";

  const lines = robotsTxt.toLowerCase().split("\n");
  let currentAgent = "";
  let isAllowed = false;
  let isDisallowed = false;

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith("user-agent:")) {
      currentAgent = trimmed.replace("user-agent:", "").trim();
    } else if (currentAgent === agent.toLowerCase() || currentAgent === "*") {
      if (trimmed.startsWith("allow:") && trimmed.includes("/")) {
        isAllowed = true;
      }
      if (trimmed.startsWith("disallow:") && trimmed.includes("/")) {
        isDisallowed = true;
      }
    }
  }

  // Check for explicit agent rule
  const hasExplicitRule = robotsTxt.toLowerCase().includes(`user-agent: ${agent.toLowerCase()}`);

  if (hasExplicitRule && isAllowed && !isDisallowed) return "pass";
  if (hasExplicitRule && isDisallowed) return "fail";
  if (!hasExplicitRule && !isDisallowed) return "warning"; // Allowed by default but not explicit
  return "fail";
}

function analyzeAiDiscovery(content: FetchedContent): CheckResult[] {
  const category = "ai_discovery";
  const checks = GEO_CHECKS.ai_discovery.checks;
  const results: CheckResult[] = [];

  // llms.txt
  results.push({
    id: "llms_txt",
    category,
    name: checks[0].name,
    description: checks[0].description,
    status: content.llmsTxt ? "pass" : "fail",
    details: content.llmsTxt
      ? `Found (${content.llmsTxt.length} characters)`
      : "Not found at /llms.txt",
    value: content.llmsTxt ? content.llmsTxt.substring(0, 500) : undefined,
    recommendation: content.llmsTxt ? undefined : checks[0].recommendation,
    priority: checks[0].priority,
  });

  // llms-full.txt
  results.push({
    id: "llms_full_txt",
    category,
    name: checks[1].name,
    description: checks[1].description,
    status: content.llmsFullTxt ? "pass" : "warning",
    details: content.llmsFullTxt
      ? `Found (${content.llmsFullTxt.length} characters)`
      : "Not found at /llms-full.txt",
    recommendation: content.llmsFullTxt ? undefined : checks[1].recommendation,
    priority: checks[1].priority,
  });

  // Context API
  results.push({
    id: "context_api",
    category,
    name: checks[2].name,
    description: checks[2].description,
    status: content.contextApi ? "pass" : "warning",
    details: content.contextApi
      ? `Found JSON endpoint with ${Object.keys(content.contextApi).length} keys`
      : "No /api/context endpoint found",
    value: content.contextApi ? { keys: Object.keys(content.contextApi) } : undefined,
    recommendation: content.contextApi ? undefined : checks[2].recommendation,
    priority: checks[2].priority,
  });

  // .well-known/ai.txt
  results.push({
    id: "well_known_ai",
    category,
    name: checks[3].name,
    description: checks[3].description,
    status: content.wellKnownAi ? "pass" : "not_found",
    details: content.wellKnownAi
      ? "Found"
      : "Not found (optional)",
    recommendation: content.wellKnownAi ? undefined : checks[3].recommendation,
    priority: checks[3].priority,
  });

  return results;
}

function analyzeRobotsAiCrawlers(content: FetchedContent): CheckResult[] {
  const category = "robots_ai_crawlers";
  const checks = GEO_CHECKS.robots_ai_crawlers.checks;
  const results: CheckResult[] = [];

  // robots.txt exists
  results.push({
    id: "robots_txt_exists",
    category,
    name: checks[0].name,
    description: checks[0].description,
    status: content.robotsTxt ? "pass" : "fail",
    details: content.robotsTxt ? "Found" : "Not found at /robots.txt",
    recommendation: content.robotsTxt ? undefined : checks[0].recommendation,
    priority: checks[0].priority,
  });

  const crawlerChecks = [
    { id: "gptbot_allowed", agent: "GPTBot", idx: 1 },
    { id: "chatgpt_user_allowed", agent: "ChatGPT-User", idx: 2 },
    { id: "claudebot_allowed", agent: "ClaudeBot", idx: 3 },
    { id: "claude_web_allowed", agent: "Claude-Web", idx: 4 },
    { id: "perplexitybot_allowed", agent: "PerplexityBot", idx: 5 },
    { id: "google_extended_allowed", agent: "Google-Extended", idx: 6 },
    { id: "cohere_allowed", agent: "Cohere-AI", idx: 7 },
    { id: "anthropic_ai_allowed", agent: "Anthropic-AI", idx: 8 },
    { id: "meta_ai_allowed", agent: "Meta-ExternalAgent", idx: 9 },
  ];

  for (const { id, agent, idx } of crawlerChecks) {
    const status = checkRobotsForAgent(content.robotsTxt, agent);
    const check = checks[idx];

    let details = "";
    if (status === "pass") details = `Explicitly allowed in robots.txt`;
    else if (status === "warning") details = `Not explicitly mentioned (allowed by default)`;
    else if (status === "fail") details = `Blocked in robots.txt`;
    else details = `Cannot check (no robots.txt)`;

    results.push({
      id,
      category,
      name: check.name,
      description: check.description,
      status,
      details,
      recommendation: status !== "pass" ? check.recommendation : undefined,
      priority: check.priority,
    });
  }

  // llms.txt in robots
  const llmsTxtInRobots = content.robotsTxt?.toLowerCase().includes("llms.txt") ?? false;
  results.push({
    id: "llms_txt_in_robots",
    category,
    name: checks[10].name,
    description: checks[10].description,
    status: llmsTxtInRobots ? "pass" : "warning",
    details: llmsTxtInRobots
      ? "llms.txt explicitly referenced in robots.txt"
      : "llms.txt not explicitly mentioned in robots.txt",
    recommendation: llmsTxtInRobots ? undefined : checks[10].recommendation,
    priority: checks[10].priority,
  });

  return results;
}

function analyzeStructuredData(content: FetchedContent): CheckResult[] {
  const category = "structured_data";
  const checks = GEO_CHECKS.structured_data.checks;
  const results: CheckResult[] = [];
  const schemas = extractJsonLd(content.html);

  // Has JSON-LD
  results.push({
    id: "has_jsonld",
    category,
    name: checks[0].name,
    description: checks[0].description,
    status: schemas.length > 0 ? "pass" : "fail",
    details: schemas.length > 0
      ? `Found ${schemas.length} JSON-LD block(s)`
      : "No JSON-LD structured data found",
    value: schemas.length > 0 ? { types: schemas.map(s => s["@type"]) } : undefined,
    recommendation: schemas.length > 0 ? undefined : checks[0].recommendation,
    priority: checks[0].priority,
  });

  const schemaChecks = [
    { id: "organization_schema", types: ["Organization", "Corporation", "LocalBusiness"], idx: 1 },
    { id: "website_schema", types: ["WebSite"], idx: 2 },
    { id: "faq_schema", types: ["FAQPage"], idx: 3 },
    { id: "product_schema", types: ["Product", "Service", "SoftwareApplication"], idx: 4 },
    { id: "localbusiness_schema", types: ["LocalBusiness", "Store", "Restaurant"], idx: 5 },
    { id: "breadcrumb_schema", types: ["BreadcrumbList"], idx: 6 },
    { id: "howto_schema", types: ["HowTo"], idx: 7 },
    { id: "article_schema", types: ["Article", "BlogPosting", "NewsArticle"], idx: 8 },
    { id: "review_schema", types: ["Review", "AggregateRating"], idx: 9 },
    { id: "speakable_schema", types: ["Speakable"], idx: 10 },
  ];

  for (const { id, types, idx } of schemaChecks) {
    const found = hasSchemaType(schemas, types);
    const check = checks[idx];

    results.push({
      id,
      category,
      name: check.name,
      description: check.description,
      status: found ? "pass" : (check.priority === "critical" || check.priority === "high" ? "warning" : "not_found"),
      details: found
        ? `Found ${types.join(" or ")} schema`
        : `No ${types.join("/")} schema found`,
      recommendation: found ? undefined : check.recommendation,
      priority: check.priority,
    });
  }

  return results;
}

function analyzeMetaContent(content: FetchedContent): CheckResult[] {
  const category = "meta_content";
  const checks = GEO_CHECKS.meta_content.checks;
  const results: CheckResult[] = [];
  const html = content.html.toLowerCase();

  // Title tag
  const titleMatch = content.html.match(/<title[^>]*>([^<]+)<\/title>/i);
  const title = titleMatch ? titleMatch[1].trim() : null;
  results.push({
    id: "title_tag",
    category,
    name: checks[0].name,
    description: checks[0].description,
    status: title ? (title.length <= 60 ? "pass" : "warning") : "fail",
    details: title
      ? `"${title}" (${title.length} chars)`
      : "No title tag found",
    value: title || undefined,
    recommendation: !title ? checks[0].recommendation : undefined,
    priority: checks[0].priority,
  });

  // Meta description
  const descMatch = content.html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i);
  const description = descMatch ? descMatch[1] : null;
  results.push({
    id: "meta_description",
    category,
    name: checks[1].name,
    description: checks[1].description,
    status: description ? (description.length <= 160 ? "pass" : "warning") : "fail",
    details: description
      ? `Found (${description.length} chars)`
      : "No meta description found",
    value: description || undefined,
    recommendation: !description ? checks[1].recommendation : undefined,
    priority: checks[1].priority,
  });

  // Canonical URL
  const hasCanonical = html.includes('rel="canonical"') || html.includes("rel='canonical'");
  results.push({
    id: "canonical_url",
    category,
    name: checks[2].name,
    description: checks[2].description,
    status: hasCanonical ? "pass" : "warning",
    details: hasCanonical ? "Canonical URL specified" : "No canonical URL found",
    recommendation: hasCanonical ? undefined : checks[2].recommendation,
    priority: checks[2].priority,
  });

  // Lang attribute
  const langMatch = content.html.match(/<html[^>]*lang=["']([^"']+)["']/i);
  results.push({
    id: "lang_attribute",
    category,
    name: checks[3].name,
    description: checks[3].description,
    status: langMatch ? "pass" : "fail",
    details: langMatch ? `Language: ${langMatch[1]}` : "No lang attribute on <html>",
    value: langMatch ? langMatch[1] : undefined,
    recommendation: langMatch ? undefined : checks[3].recommendation,
    priority: checks[3].priority,
  });

  // H1 tag
  const h1Matches = content.html.match(/<h1[^>]*>/gi);
  const h1Count = h1Matches ? h1Matches.length : 0;
  results.push({
    id: "h1_tag",
    category,
    name: checks[4].name,
    description: checks[4].description,
    status: h1Count === 1 ? "pass" : (h1Count === 0 ? "fail" : "warning"),
    details: h1Count === 1
      ? "Exactly one H1 tag found"
      : (h1Count === 0 ? "No H1 tag found" : `${h1Count} H1 tags found (should be 1)`),
    recommendation: h1Count !== 1 ? checks[4].recommendation : undefined,
    priority: checks[4].priority,
  });

  // Heading hierarchy
  const h2Present = html.includes("<h2");
  const h3Present = html.includes("<h3");
  results.push({
    id: "heading_hierarchy",
    category,
    name: checks[5].name,
    description: checks[5].description,
    status: h2Present ? "pass" : "warning",
    details: `H2: ${h2Present ? "Yes" : "No"}, H3: ${h3Present ? "Yes" : "No"}`,
    recommendation: !h2Present ? checks[5].recommendation : undefined,
    priority: checks[5].priority,
  });

  // Open Graph tags
  const hasOg = html.includes('property="og:') || html.includes("property='og:");
  results.push({
    id: "og_tags",
    category,
    name: checks[6].name,
    description: checks[6].description,
    status: hasOg ? "pass" : "warning",
    details: hasOg ? "Open Graph tags present" : "No Open Graph tags found",
    recommendation: hasOg ? undefined : checks[6].recommendation,
    priority: checks[6].priority,
  });

  // Twitter cards
  const hasTwitter = html.includes('name="twitter:') || html.includes("name='twitter:");
  results.push({
    id: "twitter_cards",
    category,
    name: checks[7].name,
    description: checks[7].description,
    status: hasTwitter ? "pass" : "not_found",
    details: hasTwitter ? "Twitter card tags present" : "No Twitter card tags",
    recommendation: hasTwitter ? undefined : checks[7].recommendation,
    priority: checks[7].priority,
  });

  // Content freshness
  const schemas = extractJsonLd(content.html);
  const hasFreshness = schemas.some(s => s.dateModified || s.datePublished);
  results.push({
    id: "content_freshness",
    category,
    name: checks[8].name,
    description: checks[8].description,
    status: hasFreshness ? "pass" : "warning",
    details: hasFreshness
      ? "Date metadata found in structured data"
      : "No dateModified/datePublished found",
    recommendation: hasFreshness ? undefined : checks[8].recommendation,
    priority: checks[8].priority,
  });

  return results;
}

function analyzeTechnicalSeo(content: FetchedContent, url: string): CheckResult[] {
  const category = "technical_seo";
  const checks = GEO_CHECKS.technical_seo.checks;
  const results: CheckResult[] = [];

  // HTTPS
  const isHttps = url.startsWith("https://");
  results.push({
    id: "https",
    category,
    name: checks[0].name,
    description: checks[0].description,
    status: isHttps ? "pass" : "fail",
    details: isHttps ? "Site uses HTTPS" : "Site does not use HTTPS",
    recommendation: isHttps ? undefined : checks[0].recommendation,
    priority: checks[0].priority,
  });

  // Sitemap
  results.push({
    id: "sitemap_exists",
    category,
    name: checks[1].name,
    description: checks[1].description,
    status: content.sitemapXml ? "pass" : "warning",
    details: content.sitemapXml ? "Sitemap found at /sitemap.xml" : "No sitemap.xml found",
    recommendation: content.sitemapXml ? undefined : checks[1].recommendation,
    priority: checks[1].priority,
  });

  // Sitemap in robots
  const sitemapInRobots = content.robotsTxt?.toLowerCase().includes("sitemap:") ?? false;
  results.push({
    id: "sitemap_in_robots",
    category,
    name: checks[2].name,
    description: checks[2].description,
    status: sitemapInRobots ? "pass" : "warning",
    details: sitemapInRobots
      ? "Sitemap referenced in robots.txt"
      : "Sitemap not referenced in robots.txt",
    recommendation: sitemapInRobots ? undefined : checks[2].recommendation,
    priority: checks[2].priority,
  });

  // Mobile viewport
  const hasViewport = content.html.toLowerCase().includes('name="viewport"') ||
                      content.html.toLowerCase().includes("name='viewport'");
  results.push({
    id: "mobile_friendly",
    category,
    name: checks[3].name,
    description: checks[3].description,
    status: hasViewport ? "pass" : "fail",
    details: hasViewport ? "Viewport meta tag present" : "No viewport meta tag",
    recommendation: hasViewport ? undefined : checks[3].recommendation,
    priority: checks[3].priority,
  });

  // Clean URLs
  const parsedUrl = new URL(url);
  const hasCleanUrl = !parsedUrl.search && !url.includes("?") && !url.match(/\d{5,}/);
  results.push({
    id: "clean_urls",
    category,
    name: checks[4].name,
    description: checks[4].description,
    status: hasCleanUrl ? "pass" : "warning",
    details: hasCleanUrl ? "URL is clean and readable" : "URL contains parameters or IDs",
    recommendation: hasCleanUrl ? undefined : checks[4].recommendation,
    priority: checks[4].priority,
  });

  // Page speed
  const isfast = content.responseTime < 3000;
  results.push({
    id: "page_speed",
    category,
    name: checks[5].name,
    description: checks[5].description,
    status: isfast ? "pass" : "warning",
    details: `Page loaded in ${content.responseTime}ms`,
    value: content.responseTime.toString(),
    recommendation: isfast ? undefined : checks[5].recommendation,
    priority: checks[5].priority,
  });

  return results;
}

function analyzeContentQuality(content: FetchedContent): CheckResult[] {
  const category = "content_quality";
  const checks = GEO_CHECKS.content_quality.checks;
  const results: CheckResult[] = [];
  const html = content.html;
  const textContent = html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ");

  // Factual content (check for numbers)
  const hasNumbers = /\d+%|\$\d+|€\d+|£\d+|\d+\s*(hours|days|weeks|users|customers)/i.test(textContent);
  results.push({
    id: "factual_content",
    category,
    name: checks[0].name,
    description: checks[0].description,
    status: hasNumbers ? "pass" : "warning",
    details: hasNumbers
      ? "Found specific numbers and statistics"
      : "Limited factual/numerical content detected",
    recommendation: hasNumbers ? undefined : checks[0].recommendation,
    priority: checks[0].priority,
  });

  // Clear definitions
  const hasDefinition = /is a |is an |are a |provides |offers |helps |allows /i.test(textContent.substring(0, 2000));
  results.push({
    id: "clear_definitions",
    category,
    name: checks[1].name,
    description: checks[1].description,
    status: hasDefinition ? "pass" : "warning",
    details: hasDefinition
      ? "Clear product/service definition found"
      : "Could not detect clear definition in first section",
    recommendation: hasDefinition ? undefined : checks[1].recommendation,
    priority: checks[1].priority,
  });

  // Contact info
  const hasEmail = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/.test(html);
  const hasPhone = /(\+\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/.test(html);
  const hasContact = hasEmail || hasPhone || html.toLowerCase().includes("contact");
  results.push({
    id: "contact_info",
    category,
    name: checks[2].name,
    description: checks[2].description,
    status: hasContact ? "pass" : "warning",
    details: hasContact
      ? `Contact info found (email: ${hasEmail}, phone: ${hasPhone})`
      : "No obvious contact information found",
    recommendation: hasContact ? undefined : checks[2].recommendation,
    priority: checks[2].priority,
  });

  // About info
  const hasAbout = html.toLowerCase().includes("/about") ||
                   html.toLowerCase().includes("about us") ||
                   html.toLowerCase().includes("who we are");
  results.push({
    id: "about_info",
    category,
    name: checks[3].name,
    description: checks[3].description,
    status: hasAbout ? "pass" : "warning",
    details: hasAbout ? "About/company information found" : "No about section detected",
    recommendation: hasAbout ? undefined : checks[3].recommendation,
    priority: checks[3].priority,
  });

  // Citations
  const externalLinks = (html.match(/href=["']https?:\/\/(?!.*?(facebook|twitter|linkedin|instagram))[^"']+["']/gi) || []).length;
  results.push({
    id: "citations_sources",
    category,
    name: checks[4].name,
    description: checks[4].description,
    status: externalLinks > 0 ? "pass" : "not_found",
    details: externalLinks > 0
      ? `${externalLinks} external links found`
      : "No external citations detected",
    recommendation: externalLinks > 0 ? undefined : checks[4].recommendation,
    priority: checks[4].priority,
  });

  // No AI blocking
  const hasNoAi = html.toLowerCase().includes('name="robots"') &&
                  (html.toLowerCase().includes("noai") || html.toLowerCase().includes("noimageai"));
  results.push({
    id: "no_ai_blocking",
    category,
    name: checks[5].name,
    description: checks[5].description,
    status: hasNoAi ? "fail" : "pass",
    details: hasNoAi
      ? "Found noai or noimageai meta tag blocking AI indexing"
      : "No AI-blocking meta tags found",
    recommendation: hasNoAi ? checks[5].recommendation : undefined,
    priority: checks[5].priority,
  });

  return results;
}

function calculateScore(checks: CheckResult[]): { score: number; maxScore: number } {
  const priorityScores = {
    critical: 10,
    high: 5,
    medium: 3,
    low: 1,
  };

  let score = 0;
  let maxScore = 0;

  for (const check of checks) {
    const max = priorityScores[check.priority];
    maxScore += max;

    if (check.status === "pass") {
      score += max;
    } else if (check.status === "warning") {
      score += max * 0.5;
    }
    // fail and not_found get 0
  }

  return { score, maxScore };
}

export async function analyzeUrl(url: string): Promise<AnalysisResult> {
  // Normalize URL
  if (!url.startsWith("http")) {
    url = `https://${url}`;
  }

  const content = await fetchContent(url);

  const categoryResults: CategoryResult[] = [];

  // AI Discovery
  const aiDiscoveryChecks = analyzeAiDiscovery(content);
  const aiDiscoveryScore = calculateScore(aiDiscoveryChecks);
  categoryResults.push({
    category: GEO_CHECKS.ai_discovery.name,
    description: GEO_CHECKS.ai_discovery.description,
    checks: aiDiscoveryChecks,
    ...aiDiscoveryScore,
  });

  // Robots AI Crawlers
  const robotsChecks = analyzeRobotsAiCrawlers(content);
  const robotsScore = calculateScore(robotsChecks);
  categoryResults.push({
    category: GEO_CHECKS.robots_ai_crawlers.name,
    description: GEO_CHECKS.robots_ai_crawlers.description,
    checks: robotsChecks,
    ...robotsScore,
  });

  // Structured Data
  const structuredDataChecks = analyzeStructuredData(content);
  const structuredDataScore = calculateScore(structuredDataChecks);
  categoryResults.push({
    category: GEO_CHECKS.structured_data.name,
    description: GEO_CHECKS.structured_data.description,
    checks: structuredDataChecks,
    ...structuredDataScore,
  });

  // Meta Content
  const metaContentChecks = analyzeMetaContent(content);
  const metaContentScore = calculateScore(metaContentChecks);
  categoryResults.push({
    category: GEO_CHECKS.meta_content.name,
    description: GEO_CHECKS.meta_content.description,
    checks: metaContentChecks,
    ...metaContentScore,
  });

  // Technical SEO
  const technicalChecks = analyzeTechnicalSeo(content, url);
  const technicalScore = calculateScore(technicalChecks);
  categoryResults.push({
    category: GEO_CHECKS.technical_seo.name,
    description: GEO_CHECKS.technical_seo.description,
    checks: technicalChecks,
    ...technicalScore,
  });

  // Content Quality
  const contentQualityChecks = analyzeContentQuality(content);
  const contentQualityScore = calculateScore(contentQualityChecks);
  categoryResults.push({
    category: GEO_CHECKS.content_quality.name,
    description: GEO_CHECKS.content_quality.description,
    checks: contentQualityChecks,
    ...contentQualityScore,
  });

  // Calculate totals
  const allChecks = categoryResults.flatMap(c => c.checks);
  const overallScore = categoryResults.reduce((sum, c) => sum + c.score, 0);
  const maxScore = categoryResults.reduce((sum, c) => sum + c.maxScore, 0);

  const summary = {
    passed: allChecks.filter(c => c.status === "pass").length,
    failed: allChecks.filter(c => c.status === "fail").length,
    warnings: allChecks.filter(c => c.status === "warning").length,
    notFound: allChecks.filter(c => c.status === "not_found").length,
  };

  return {
    url,
    analyzedAt: new Date().toISOString(),
    overallScore: Math.round(overallScore),
    maxScore,
    categories: categoryResults,
    summary,
  };
}
