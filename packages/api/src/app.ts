import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { secureHeaders } from "hono/secure-headers";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { authRoutes } from "./auth/routes";
import { searchRoutes } from "./routes/search";
import { scrapeRoutes } from "./routes/scrape";
import { crawlRoutes } from "./routes/crawl";
import { extractRoutes } from "./routes/extract";
import { mapRoutes } from "./routes/map";
import { usageRoutes } from "./routes/usage";

const app = new Hono();

// Determine dashboard static directory
const WEB_DIST = (() => {
  const paths = [
    join(import.meta.dir, "../../web/dist"),
    join(import.meta.dir, "../web/dist"),
    "/app/packages/web/dist",
  ];
  for (const p of paths) {
    if (existsSync(join(p, "index.html"))) return p;
  }
  return null;
})();

const MIME: Record<string, string> = {
  html: "text/html",
  js: "application/javascript",
  css: "text/css",
  svg: "image/svg+xml",
  png: "image/png",
  ico: "image/x-icon",
  json: "application/json",
};

// Global middleware
app.use(
  "*",
  cors({
    origin: "*",
    allowHeaders: ["Content-Type", "Authorization", "X-API-Key"],
    exposeHeaders: ["Content-Type"],
  })
);
app.use("*", logger());
app.use("*", secureHeaders());

// Health check
app.get("/api/v1/health", (c) =>
  c.json({
    status: "ok",
    version: "0.1.0",
    timestamp: new Date().toISOString(),
  })
);

// Mount routes
app.route("/api/v1/auth", authRoutes);
app.route("/api/v1", searchRoutes);
app.route("/api/v1", scrapeRoutes);
app.route("/api/v1", crawlRoutes);
app.route("/api/v1", extractRoutes);
app.route("/api/v1", mapRoutes);
app.route("/api/v1", usageRoutes);

// Serve static dashboard files (SPA catch-all)
if (WEB_DIST) {
  app.get("*", async (c) => {
    const reqPath = new URL(c.req.url).pathname;

    // API routes get 404, not SPA
    if (reqPath.startsWith("/api/")) {
      return c.json({ error: "Not found" }, 404);
    }

    // Try exact file match
    const filePath = join(WEB_DIST, reqPath === "/" ? "index.html" : reqPath);
    if (existsSync(filePath)) {
      const ext = filePath.split(".").pop() || "";
      return new Response(Bun.file(filePath), {
        headers: { "Content-Type": MIME[ext] || "application/octet-stream" },
      });
    }

    // SPA fallback: serve index.html for client-side routing
    const indexHtml = join(WEB_DIST, "index.html");
    if (existsSync(indexHtml)) {
      return new Response(Bun.file(indexHtml), {
        headers: { "Content-Type": "text/html" },
      });
    }

    return c.json({ error: "Not found" }, 404);
  });
}

export { app };
