/**
 * LLM Gateway Proxy
 * Proxies LLM requests to Goozway backend running internally on port 3000.
 * Provides /v1/chat/completions, /v1/models, /v1/search endpoints.
 */
import { Hono } from "hono";
import { apiKeyAuth } from "../auth/middleware";
import { trackUsage } from "./middleware";

export const gatewayRoutes = new Hono();

const GATEWAY_URL = process.env.GATEWAY_URL || "http://localhost:3000";

async function gatewayFetch(path: string, req: Request): Promise<Response> {
  const url = new URL(path, GATEWAY_URL);
  const headers = new Headers(req.headers);
  // Remove our auth header, gateway has its own
  headers.delete("authorization");
  headers.delete("x-api-key");
  headers.set("Host", new URL(GATEWAY_URL).host);

  const body = req.method === "POST" ? await req.text() : null;
  
  const gwRes = await fetch(url.toString(), {
    method: req.method,
    headers,
    body,
  });

  return gwRes;
}

// GET /v1/models - List all available models
gatewayRoutes.get("/v1/models", apiKeyAuth, async (c) => {
  const user = c.get("user");
  const startTime = Date.now();

  try {
    const gwRes = await gatewayFetch("/v1/models", c.req.raw);
    const data = await gwRes.json();
    
    await trackUsage(user.userId, null, "/v1/models", "GET", gwRes.status, 0, Date.now() - startTime);
    return c.json(data);
  } catch (error: any) {
    return c.json({ error: `Gateway unavailable: ${error.message}` }, 502 as 502);
  }
});

// POST /v1/chat/completions - OpenAI-compatible chat
gatewayRoutes.post("/v1/chat/completions", apiKeyAuth, async (c) => {
  const user = c.get("user");
  const startTime = Date.now();

  try {
    const body = await c.req.json();
    const { stream } = body;

    if (stream) {
      // Streaming response
      const gwRes = await fetch(`${GATEWAY_URL}/v1/chat/completions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!gwRes.ok) {
        const err = await gwRes.text();
        return c.json({ error: `Gateway error: ${err}` }, gwRes.status as 400 | 401 | 402 | 403 | 404 | 409 | 429 | 500 | 502 | 503);
      }

      // Forward the SSE stream
      return new Response(gwRes.body, {
        headers: {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          Connection: "keep-alive",
        },
      });
    }

    // Non-streaming
    const gwRes = await fetch(`${GATEWAY_URL}/v1/chat/completions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const data = await gwRes.json();
    await trackUsage(user.userId, null, "/v1/chat/completions", "POST", gwRes.status, 1, Date.now() - startTime);
    return c.json(data);
  } catch (error: any) {
    return c.json({ error: `Gateway error: ${error.message}` }, 502);
  }
});

// POST /v1/search - Multi-engine web search
gatewayRoutes.post("/v1/search", apiKeyAuth, async (c) => {
  const user = c.get("user");
  const startTime = Date.now();

  try {
    const body = await c.req.json();
    const gwRes = await fetch(`${GATEWAY_URL}/v1/search`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const data = await gwRes.json();
    await trackUsage(user.userId, null, "/v1/search", "POST", gwRes.status, 1, Date.now() - startTime);
    return c.json(data);
  } catch (error: any) {
    return c.json({ error: `Search unavailable: ${error.message}` }, 502);
  }
});

// GET /v1/stats - Gateway statistics
gatewayRoutes.get("/v1/stats", apiKeyAuth, async (c) => {
  try {
    const gwRes = await gatewayFetch("/v1/stats", c.req.raw);
    const data = await gwRes.json();
    return c.json(data);
  } catch (error: any) {
    return c.json({ error: error.message }, 502);
  }
});

// GET /health - Gateway health
gatewayRoutes.get("/health", async (c) => {
  try {
    const gwRes = await fetch(`${GATEWAY_URL}/health`);
    const gwHealth = await gwRes.json();
    return c.json({
      status: "ok",
      gateway: gwHealth,
      version: "0.1.0",
    });
  } catch {
    return c.json({ status: "ok", gateway: "unavailable", version: "0.1.0" });
  }
});
