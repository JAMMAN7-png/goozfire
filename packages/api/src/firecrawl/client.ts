import type {
  ScrapeRequest,
  CrawlRequest,
  SearchRequest,
  MapRequest,
  ExtractRequest,
} from "@goozfire/shared";

const FIRECRAWL_API_URL =
  process.env.FIRECRAWL_API_URL || "https://fire.v244.net";
const FIRECRAWL_API_KEY = process.env.FIRECRAWL_API_KEY || "";

interface FirecrawlOptions {
  timeout?: number;
}

async function firecrawlFetch(
  path: string,
  body: unknown,
  options?: FirecrawlOptions
): Promise<any> {
  if (!FIRECRAWL_API_KEY) {
    throw new Error("FIRECRAWL_API_KEY is not configured.");
  }

  const controller = new AbortController();
  const timeout = setTimeout(
    () => controller.abort(),
    options?.timeout || 60000
  );

  try {
    const res = await fetch(`${FIRECRAWL_API_URL}${path}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${FIRECRAWL_API_KEY}`,
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    if (!res.ok) {
      const errBody = await res.text();
      throw new Error(
        `Firecrawl ${path} failed: ${res.status} ${errBody}`
      );
    }

    return await res.json();
  } finally {
    clearTimeout(timeout);
  }
}

type ScrapeOptions = Partial<Omit<ScrapeRequest, "url">>;

/**
 * Scrape a single URL and extract its content.
 */
export async function scrape(url: string, options?: ScrapeOptions) {
  return firecrawlFetch("/v0/scrape", { url, ...options }, { timeout: 60000 });
}

type CrawlOptions = Partial<CrawlRequest>;

/**
 * Start a crawl job on a website.
 */
export async function crawl(url: string, options?: CrawlOptions) {
  return firecrawlFetch("/v0/crawl", { url, ...options }, { timeout: 300000 });
}

/**
 * Check the status of a crawl job.
 */
export async function checkCrawlJob(jobId: string) {
  if (!FIRECRAWL_API_KEY) {
    throw new Error("FIRECRAWL_API_KEY is not configured.");
  }
  const res = await fetch(
    `${FIRECRAWL_API_URL}/v0/crawl/${encodeURIComponent(jobId)}`,
    { headers: { Authorization: `Bearer ${FIRECRAWL_API_KEY}` } }
  );
  if (!res.ok) {
    const errBody = await res.text();
    throw new Error(`Firecrawl crawl status failed: ${res.status} ${errBody}`);
  }
  return res.json();
}

type SearchOptions = Partial<SearchRequest>;

/**
 * Search the web and return results with content.
 */
export async function search(query: string, options?: SearchOptions) {
  return firecrawlFetch("/v0/search", { query, ...options }, { timeout: 60000 });
}

type MapOptions = Partial<MapRequest>;

/**
 * Map all discoverable URLs on a website.
 * Uses /v0/map on Firecrawl cloud, falls back to scrape + link extraction for self-hosted.
 */
export async function mapUrl(url: string, options?: MapOptions) {
  try {
    return await firecrawlFetch("/v0/map", { url, ...options }, { timeout: 60000 });
  } catch (err: any) {
    // Fallback: extract links from scraped page
    if (err.message?.includes("404") || err.message?.includes("Cannot POST")) {
      const result = await firecrawlFetch(
        "/v0/scrape",
        { url, formats: ["markdown", "links"], onlyMainContent: false },
        { timeout: 60000 }
      );
      const links = result?.data?.linksOnPage || result?.data?.links || [];
      return {
        success: true,
        data: {
          links: options?.search
            ? links.filter((l: string) =>
                l.toLowerCase().includes(options.search!.toLowerCase())
              )
            : links,
          url,
          creditsUsed: result?.data?.metadata?.creditsUsed || 1,
        },
      };
    }
    throw err;
  }
}

type ExtractOptions = Partial<ExtractRequest>;

/**
 * Extract structured data from URLs using LLM extraction.
 * Uses /v0/extract on Firecrawl cloud, falls back to scrape + extract for self-hosted.
 */
export async function extractData(
  urls: string[],
  options?: ExtractOptions
) {
  try {
    return await firecrawlFetch(
      "/v0/extract",
      { urls, ...options },
      { timeout: 300000 }
    );
  } catch (err: any) {
    // Fallback: scrape each URL with extraction prompt
    if (err.message?.includes("404") || err.message?.includes("Cannot POST")) {
      const results = [];
      for (const url of urls.slice(0, 3)) {
        try {
          const scrapeResult = await firecrawlFetch(
            "/v0/scrape",
            {
              url,
              formats: ["markdown", "json"],
              jsonOptions: options?.prompt
                ? { prompt: options.prompt }
                : undefined,
              extract:
                options?.prompt
                  ? {
                      mode: "llm-extraction",
                      prompt: options.prompt,
                    }
                  : undefined,
            },
            { timeout: 60000 }
          );
          results.push(scrapeResult?.data || scrapeResult);
        } catch {
          results.push({ url, error: "Failed to scrape" });
        }
      }
      return {
        success: true,
        data: {
          data: results.length === 1 ? results[0] : results,
          creditsUsed: results.length,
        },
      };
    }
    throw err;
  }
}
