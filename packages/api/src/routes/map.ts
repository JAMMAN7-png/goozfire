import { Hono } from "hono";
import { apiKeyAuth } from "../auth/middleware";
import { mapUrl } from "../firecrawl/client";
import { trackUsage } from "./middleware";

export const mapRoutes = new Hono();

// POST /map
mapRoutes.post("/map", apiKeyAuth, async (c) => {
  const user = c.get("user");
  const apiKeyId = c.get("api_key_id") || null;
  const startTime = Date.now();

  try {
    const body = await c.req.json();
    const { url, search, includeSubdomains, limit, ignoreSitemap, sitemapOnly } = body;

    if (!url) {
      return c.json({ error: "URL is required" }, 400);
    }

    const result = await mapUrl(url, {
      search,
      includeSubdomains,
      limit,
      ignoreSitemap,
      sitemapOnly,
    });

    await trackUsage(
      user.userId,
      apiKeyId,
      "/map",
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
      "/map",
      "POST",
      500,
      1,
      Date.now() - startTime
    );
    return c.json({ success: false, error: error.message }, 500);
  }
});
