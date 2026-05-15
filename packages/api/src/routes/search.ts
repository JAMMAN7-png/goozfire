import { Hono } from "hono";
import { apiKeyAuth } from "../auth/middleware";
import { search as firecrawlSearch } from "../firecrawl/client";
import { getDb } from "../db";
import { trackUsage } from "./middleware";

export const searchRoutes = new Hono();

// POST /search
searchRoutes.post("/search", apiKeyAuth, async (c) => {
  const user = c.get("user");
  const apiKeyId = c.get("api_key_id") || null;
  const startTime = Date.now();

  try {
    const body = await c.req.json();
    const { query, limit, lang, searchDepth, includeDomains, excludeDomains } =
      body;

    if (!query) {
      return c.json({ error: "Query is required" }, 400);
    }

    const result = await firecrawlSearch(query, {
      limit: limit || 5,
      lang,
      searchDepth: searchDepth || "basic",
      includeDomains,
      excludeDomains,
    });

    await trackUsage(
      user.userId,
      apiKeyId,
      "/search",
      "POST",
      200,
      1,
      Date.now() - startTime
    );

    return c.json(result);
  } catch (error: any) {
    await trackUsage(
      user.userId,
      apiKeyId,
      "/search",
      "POST",
      500,
      1,
      Date.now() - startTime
    );
    return c.json({ success: false, error: error.message }, 500);
  }
});

// GET /search results (status check for async, keep simple)
searchRoutes.get("/search", apiKeyAuth, async (c) => {
  return c.json({ success: true, message: "Use POST /search with a query body" });
});
