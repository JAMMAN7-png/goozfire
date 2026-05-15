import { Hono } from "hono";
import { apiKeyAuth } from "../auth/middleware";
import { scrape as firecrawlScrape } from "../firecrawl/client";
import { trackUsage } from "./middleware";

export const scrapeRoutes = new Hono();

// POST /scrape
scrapeRoutes.post("/scrape", apiKeyAuth, async (c) => {
  const user = c.get("user");
  const apiKeyId = c.get("api_key_id") || null;
  const startTime = Date.now();

  try {
    const body = await c.req.json();
    const { url, formats, onlyMainContent, includeTags, excludeTags, waitFor, mobile, actions, extract } = body;

    if (!url) {
      return c.json({ error: "URL is required" }, 400);
    }

    const result = await firecrawlScrape(url, {
      formats: formats || ["markdown"],
      onlyMainContent,
      includeTags,
      excludeTags,
      waitFor,
      mobile,
      actions,
      extract,
    });

    await trackUsage(
      user.userId,
      apiKeyId,
      "/scrape",
      "POST",
      200,
      result.data?.metadata?.creditsUsed || 1,
      Date.now() - startTime
    );

    return c.json(result);
  } catch (error: any) {
    await trackUsage(
      user.userId,
      apiKeyId,
      "/scrape",
      "POST",
      500,
      1,
      Date.now() - startTime
    );
    return c.json({ success: false, error: error.message }, 500);
  }
});
