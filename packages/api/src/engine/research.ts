/**
 * Deep Research Engine
 * Autonomous multi-step research that searches, reads, and synthesizes.
 * Uses Firecrawl for search + scrape + extract — no external LLM needed.
 */
import { search as firecrawlSearch, scrape as firecrawlScrape, extractData } from "../firecrawl/client";
import type { ResearchSource, ResearchFinding, ResearchResponse } from "@goozfire/shared";

interface ResearchOptions {
  max_sources?: number;
  depth?: "basic" | "deep" | "comprehensive";
}

/**
 * Generate search queries from a research question.
 * Extracts key terms and creates 3-5 query variations.
 */
function generateQueries(question: string): string[] {
  const cleaned = question
    .replace(/[^\w\s?]/g, "")
    .trim();

  // Extract key noun phrases (words longer than 3 chars, excluding common words)
  const stopWords = new Set(["what", "when", "where", "why", "how", "does", "is", "are", "the", "and", "for", "that", "this", "with", "from", "have", "has", "was", "were", "about", "their", "into", "could", "would", "should", "will", "been", "being", "more", "some", "such", "than", "then", "also", "only", "other", "over", "very", "just", "can", "each", "which", "who", "after", "before", "between", "through", "during", "without", "within"]);
  const words = cleaned.split(/\s+/).filter(w => w.length > 3 && !stopWords.has(w.toLowerCase()));
  const keyTerms = [...new Set(words.map(w => w.toLowerCase()))];

  const queries: string[] = [];

  // Query 1: The full question (if it's a question)
  if (cleaned.includes("?")) {
    queries.push(cleaned);
  } else {
    queries.push(cleaned);
  }

  // Query 2: Key terms combined
  if (keyTerms.length >= 2) {
    queries.push(keyTerms.slice(0, 4).join(" "));
  }

  // Query 3: Alternate phrasing with "what is" or "how to"
  if (!cleaned.toLowerCase().startsWith("what") && keyTerms.length >= 2) {
    queries.push(`what is ${keyTerms.slice(0, 3).join(" ")}`);
  }

  // Query 4: Latest/recent angle
  if (keyTerms.length >= 2) {
    queries.push(`${keyTerms.slice(0, 3).join(" ")} 2025 2026`);
  }

  // Query 5: Comparison/analysis angle
  if (keyTerms.length >= 3) {
    queries.push(`${keyTerms.slice(0, 2).join(" ")} vs ${keyTerms[2]}`);
  }

  return [...new Set(queries)].filter(q => q.length > 5).slice(0, 5);
}

/**
 * Score the relevance of a result to the research question.
 * Simple keyword overlap scoring.
 */
function scoreRelevance(title: string, content: string, question: string): number {
  const qWords = new Set(
    question.toLowerCase().split(/\s+/).filter(w => w.length > 3)
  );
  if (qWords.size === 0) return 0.5;

  const text = `${title} ${content}`.toLowerCase();
  let matches = 0;
  for (const word of qWords) {
    if (text.includes(word)) matches++;
  }
  return matches / qWords.size;
}

/**
 * Run a complete deep research task.
 */
export async function runResearch(
  question: string,
  options?: ResearchOptions
): Promise<ResearchResponse> {
  const maxSources = options?.max_sources || 10;
  const depth = options?.depth || "basic";
  const maxResultsPerQuery = depth === "comprehensive" ? 10 : depth === "deep" ? 7 : 5;

  // 1. Generate search queries
  const queries = generateQueries(question);
  // console.error(`Research: generated ${queries.length} queries`);

  // 2. Execute searches
  const foundUrls = new Map<string, { title: string; content: string; description: string }>();

  for (const query of queries) {
    try {
      const searchResult = await firecrawlSearch(query, {
        limit: maxResultsPerQuery,
        searchDepth: depth === "basic" ? "basic" : "advanced",
      });

      const results = searchResult?.data || [];
      for (const r of Array.isArray(results) ? results : []) {
        const url = r.url || r.link;
        if (!url || foundUrls.has(url)) continue;
        foundUrls.set(url, {
          title: r.title || "Untitled",
          content: r.content || r.markdown || r.description || "",
          description: r.description || "",
        });
      }
    } catch (err: any) {
      // console.error(`Research: search query failed "${query}": ${err.message}`);
    }
  }

  // 3. Collect unique URLs, sorted by relevance
  const scoredUrls = [...foundUrls.entries()]
    .map(([url, info]) => ({
      url,
      title: info.title,
      description: info.description,
      content: info.content,
      score: scoreRelevance(info.title, info.content, question),
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, maxSources);

  // 4. Scrape top sources for full content
  const sources: ResearchSource[] = [];
  const scrapeLimit = depth === "comprehensive" ? 15 : depth === "deep" ? 10 : 5;

  for (const item of scoredUrls.slice(0, scrapeLimit)) {
    try {
      const scrapeResult = await firecrawlScrape(item.url, {
        formats: ["markdown"],
        onlyMainContent: true,
      });
      const content = scrapeResult?.data?.markdown || item.content || "";
      sources.push({
        url: item.url,
        title: item.title || scrapeResult?.data?.metadata?.title || "Untitled",
        content: content.substring(0, 8000), // Truncate very long content
        relevance_score: item.score,
      });
    } catch {
      // Use search snippet if scrape fails
      sources.push({
        url: item.url,
        title: item.title,
        content: item.content.substring(0, 2000),
        relevance_score: item.score,
      });
    }
  }

  if (sources.length === 0) {
    return {
      success: false,
      job_id: "",
      status: "failed",
      error: "No sources found for the research question",
    };
  }

  // 5. Synthesize findings using extract
  let synthesisReport = "";
  let keyFindings: ResearchFinding[] = [];
  let creditsUsed = sources.length + queries.length;

  try {
    const extractResult = await extractData(
      sources.map((s) => s.url),
      {
        prompt: `Research question: "${question}"

From these sources, extract a comprehensive research report with:
1. A 2-3 paragraph executive summary
2. 5-10 key findings, each with specific evidence
3. For each finding, cite which sources support it

Format the response as a structured report.`,
      }
    );

    synthesisReport =
      typeof extractResult?.data?.data === "string"
        ? extractResult.data.data
        : JSON.stringify(extractResult?.data?.data || "");
    creditsUsed += extractResult?.data?.creditsUsed || sources.length;

    // Try to extract structured findings from the synthesis
    if (synthesisReport && synthesisReport.length > 50) {
      keyFindings = [
        {
          finding: "Research Synthesis",
          evidence: synthesisReport.substring(0, 3000),
          sources: sources.slice(0, 3).map((s) => s.url),
        },
      ];
    }
  } catch {
    // Generate a simple synthesis from scraped content
    const allContent = sources
      .map((s) => `## ${s.title}\n${s.content.substring(0, 1000)}`)
      .join("\n\n---\n\n");
    synthesisReport = allContent.substring(0, 15000);
    keyFindings = sources.slice(0, 5).map((s) => ({
      finding: `Information from ${s.title}`,
      evidence: s.content.substring(0, 500),
      sources: [s.url],
    }));
  }

  return {
    success: true,
    job_id: `research-${Date.now()}`,
    status: "completed",
    report: {
      summary: synthesisReport.substring(0, 2000),
      key_findings: keyFindings,
      sources,
      raw_synthesis: synthesisReport,
      credits_used: creditsUsed,
    },
  };
}
