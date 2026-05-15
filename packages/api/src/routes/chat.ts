import { Hono } from "hono";
import { apiKeyAuth } from "../auth/middleware";
import { trackUsage } from "./middleware";

export const chatRoutes = new Hono();

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || "";
const OPENROUTER_BASE = "https://openrouter.ai/api/v1";

// List available models
chatRoutes.get("/chat/models", apiKeyAuth, async (c) => {
  try {
    const res = await fetch(`${OPENROUTER_BASE}/models`, {
      headers: {
        Authorization: `Bearer ${OPENROUTER_API_KEY}`,
      },
    });
    const data = await res.json();
    return c.json(data);
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});

// Chat completion proxy
chatRoutes.post("/chat/completions", apiKeyAuth, async (c) => {
  const user = c.get("user");
  const apiKeyId = c.get("api_key_id") || null;

  try {
    const body = await c.req.json();
    const { model, messages, stream, ...rest } = body;

    if (!model || !messages) {
      return c.json({ error: "model and messages are required" }, 400);
    }

    // If streaming requested, return a streaming response
    if (stream) {
      const orRes = await fetch(`${OPENROUTER_BASE}/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${OPENROUTER_API_KEY}`,
          "HTTP-Referer": "https://goozfire.v244.net",
          "X-Title": "Goozfire",
        },
        body: JSON.stringify({ model, messages, stream: true, ...rest }),
      });

      if (!orRes.ok) {
        const err = await orRes.text();
        return c.json({ error: `OpenRouter error: ${orRes.status} ${err}` }, orRes.status as 400 | 401 | 402 | 403 | 404 | 409 | 429 | 500 | 502 | 503);
      }

      // For the non-streaming API, return the full response
      // Actually, since this route is called by the frontend, we handle stream there
      // Return the raw response for the frontend to process
      const reader = orRes.body?.getReader();
      if (!reader) {
        return c.json({ error: "No response body" }, 500);
      }

      const encoder = new TextEncoder();
      const stream = new ReadableStream({
        async start(controller) {
          try {
            while (true) {
              const { done, value } = await reader.read();
              if (done) break;
              controller.enqueue(value);
            }
          } finally {
            controller.close();
          }
        },
      });

      return new Response(stream, {
        headers: {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          Connection: "keep-alive",
        },
      });
    }

    // Non-streaming
    const orRes = await fetch(`${OPENROUTER_BASE}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENROUTER_API_KEY}`,
        "HTTP-Referer": "https://goozfire.v244.net",
        "X-Title": "Goozfire",
      },
      body: JSON.stringify({ model, messages, ...rest }),
    });

    const data = await orRes.json();

    await trackUsage(user.userId, apiKeyId, "/chat/completions", "POST", orRes.status, 1, 0);

    return c.json(data);
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});

// Multi-model chat: same messages across multiple models
chatRoutes.post("/chat/fusion", apiKeyAuth, async (c) => {
  const user = c.get("user");
  const apiKeyId = c.get("api_key_id") || null;

  try {
    const body = await c.req.json();
    const { models, messages, ...rest } = body;

    if (!models || !Array.isArray(models) || models.length === 0 || models.length > 8) {
      return c.json({ error: "models array required (1-8 models)" }, 400);
    }
    if (!messages) {
      return c.json({ error: "messages is required" }, 400);
    }

    // Fire all model requests in parallel
    const results = await Promise.allSettled(
      models.map(async (model: string) => {
        const orRes = await fetch(`${OPENROUTER_BASE}/chat/completions`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${OPENROUTER_API_KEY}`,
            "HTTP-Referer": "https://goozfire.v244.net",
            "X-Title": "Goozfire",
          },
          body: JSON.stringify({
            model,
            messages,
            ...rest,
          }),
        });

        const data = await orRes.json();
        return { model, data, status: orRes.status };
      })
    );

    await trackUsage(user.userId, apiKeyId, "/chat/fusion", "POST", 200, models.length, 0);

    const fusionResults = results.map((r, i) => {
      if (r.status === "fulfilled") return r.value;
      return { model: models[i], data: null, error: r.reason?.message || "Request failed" };
    });

    return c.json({ results: fusionResults });
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});
