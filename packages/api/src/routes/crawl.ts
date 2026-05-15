import { Hono } from "hono";
import { apiKeyAuth } from "../auth/middleware";
import { crawl as firecrawlCrawl, checkCrawlJob } from "../firecrawl/client";
import { trackUsage } from "./middleware";

export const crawlRoutes = new Hono();

// POST /crawl - Start a crawl job
crawlRoutes.post("/crawl", apiKeyAuth, async (c) => {
  const user = c.get("user");
  const apiKeyId = c.get("api_key_id") || null;
  const startTime = Date.now();

  try {
    const body = await c.req.json();
    const { url, maxPages, maxDepth, includePaths, excludePaths, maxDiscoveryDepth, ignoreSitemap, allowExternalLinks, allowSubdomains, scrapeOptions } = body;

    if (!url) {
      return c.json({ error: "URL is required" }, 400);
    }

    const result = await firecrawlCrawl(url, {
      maxPages: maxPages || 10,
      maxDepth: maxDepth || 2,
      includePaths,
      excludePaths,
      maxDiscoveryDepth,
      ignoreSitemap,
      allowExternalLinks,
      allowSubdomains,
      scrapeOptions,
    });

    await trackUsage(
      user.userId,
      apiKeyId,
      "/crawl",
      "POST",
      200,
      5,
      Date.now() - startTime
    );

    return c.json(result);
  } catch (error: any) {
    await trackUsage(
      user.userId,
      apiKeyId,
      "/crawl",
      "POST",
      500,
      5,
      Date.now() - startTime
    );
    return c.json({ success: false, error: error.message }, 500);
  }
});

// GET /crawl/:jobId - Check crawl job status
crawlRoutes.get("/crawl/:jobId", apiKeyAuth, async (c) => {
  const user = c.get("user");
  const apiKeyId = c.get("api_key_id") || null;
  const startTime = Date.now();
  const jobId = c.req.param("jobId") || "";

  try {
    if (!jobId) { return c.json({ error: "Job ID is required" }, 400); }
    const result = await checkCrawlJob(jobId);

    await trackUsage(
      user.userId,
      apiKeyId,
      "/crawl/status",
      "GET",
      200,
      1,
      Date.now() - startTime
    );

    return c.json(result);
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500);
  }
});
