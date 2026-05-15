import { Hono } from "hono";
import { apiKeyAuth } from "../auth/middleware";
import { extractData } from "../firecrawl/client";
import { trackUsage } from "./middleware";

export const extractRoutes = new Hono();

// POST /extract
extractRoutes.post("/extract", apiKeyAuth, async (c) => {
  const user = c.get("user");
  const apiKeyId = c.get("api_key_id") || null;
  const startTime = Date.now();

  try {
    const body = await c.req.json();
    const { urls, prompt, schema, enableWebSearch } = body;

    if (!urls || !Array.isArray(urls) || urls.length === 0) {
      return c.json({ error: "URLs array is required" }, 400);
    }

    const result = await extractData(urls, { prompt, schema, enableWebSearch });

    await trackUsage(
      user.userId,
      apiKeyId,
      "/extract",
      "POST",
      200,
      10,
      Date.now() - startTime
    );

    return c.json(result);
  } catch (error: any) {
    await trackUsage(
      user.userId,
      apiKeyId,
      "/extract",
      "POST",
      500,
      10,
      Date.now() - startTime
    );
    return c.json({ success: false, error: error.message }, 500);
  }
});
