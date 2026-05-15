// Goozfire MCP Server - Bridges Firecrawl to MCP protocol
// Provides search, scrape, crawl, extract, and map tools for AI agents

const FIRECRAWL_API_URL =
  process.env.FIRECRAWL_API_URL || "https://fire.v244.net";
const FIRECRAWL_API_KEY = process.env.FIRECRAWL_API_KEY || "";
const MCP_AUTH_TOKEN =
  process.env.MCP_AUTH_TOKEN || process.env.JWT_SECRET || "mcp-secret";
const MCP_HTTP_PORT = process.env.MCP_HTTP_PORT || "3100";

async function firecrawlFetch(
  path: string,
  body: unknown
): Promise<any> {
  if (!FIRECRAWL_API_KEY) {
    throw new Error("FIRECRAWL_API_KEY not configured");
  }
  const res = await fetch(`${FIRECRAWL_API_URL}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${FIRECRAWL_API_KEY}`,
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Firecrawl error (${res.status}): ${text}`);
  }
  return res.json();
}

// Minimal MCP protocol server over HTTP + SSE
// Designed to work with the MCP Inspector and any MCP client
class McpServer {
  private tools = new Map<string, McpTool>();
  private messageId = 0;

  register(tool: McpTool) {
    this.tools.set(tool.name, tool);
  }

  handleListTools(): McpListToolsResponse {
    return {
      jsonrpc: "2.0",
      id: this.messageId++,
      result: {
        tools: Array.from(this.tools.values()).map((t) => ({
          name: t.name,
          description: t.description,
          inputSchema: t.inputSchema,
        })),
      },
    };
  }

  async handleCallTool(
    name: string,
    args: Record<string, unknown>
  ): Promise<McpCallToolResponse> {
    const tool = this.tools.get(name);
    if (!tool) {
      return {
        jsonrpc: "2.0",
        id: this.messageId++,
        error: { code: -32601, message: `Tool not found: ${name}` },
      };
    }

    try {
      const content = await tool.handler(args);
      return {
        jsonrpc: "2.0",
        id: this.messageId++,
        result: { content },
      };
    } catch (error: any) {
      return {
        jsonrpc: "2.0",
        id: this.messageId++,
        result: {
          content: [{ type: "text", text: `Error: ${error.message}` }],
          isError: true,
        },
      };
    }
  }

  async handleRequest(body: McpRequest): Promise<any> {
    if (body.method === "tools/list") {
      return this.handleListTools();
    }
    if (body.method === "tools/call") {
      return this.handleCallTool(
        body.params.name,
        body.params.arguments || {}
      );
    }
    return {
      jsonrpc: "2.0",
      id: this.messageId++,
      error: { code: -32601, message: `Method not found: ${body.method}` },
    };
  }

  getFetchHandler() {
    return async (req: Request): Promise<Response> => {
      const url = new URL(req.url);

      // Health check
      if (url.pathname === "/v1/health") {
        return new Response(
          JSON.stringify({ status: "ok", version: "0.1.0" }),
          { headers: { "Content-Type": "application/json" } }
        );
      }

      // Auth check
      const auth = req.headers.get("authorization") || req.headers.get("x-api-key");
      if (!auth || auth.replace("Bearer ", "") !== MCP_AUTH_TOKEN) {
        return new Response(
          JSON.stringify({ error: "Unauthorized" }),
          { status: 401, headers: { "Content-Type": "application/json" } }
        );
      }

      // SSE endpoint
      if (url.pathname === "/sse") {
        const stream = new ReadableStream({
          start(controller) {
            const encoder = new TextEncoder();
            controller.enqueue(
              encoder.encode(
                `event: endpoint\ndata: /messages\n\n`
              )
            );
            // Keep-alive
            const keepAlive = setInterval(() => {
              controller.enqueue(
                encoder.encode(`event: keepalive\ndata: {}\n\n`)
              );
            }, 15000);
            req.signal.addEventListener("abort", () => {
              clearInterval(keepAlive);
            });
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

      // Messages endpoint (for SSE client responses)
      if (url.pathname === "/messages" && req.method === "POST") {
        const body = await req.json() as McpRequest;
        const result = await this.handleRequest(body);
        return new Response(JSON.stringify(result), {
          headers: { "Content-Type": "application/json" },
        });
      }

      // Direct JSON-RPC endpoint (for non-SSE clients)
      if (req.method === "POST") {
        const body = await req.json() as McpRequest;
        const result = await this.handleRequest(body);
        return new Response(JSON.stringify(result), {
          headers: { "Content-Type": "application/json" },
        });
      }

      return new Response("Goozfire MCP Server", { status: 200 });
    };
  }
}

// Tool definitions
function defineTools(server: McpServer) {
  server.register({
    name: "goozfire_scrape",
    description:
      "Scrape a URL and extract content as clean markdown, HTML, or structured JSON. Best for fetching single-page content for RAG pipelines.",
    inputSchema: {
      type: "object",
      properties: {
        url: {
          type: "string",
          description: "The URL to scrape",
        },
        formats: {
          type: "array",
          items: { type: "string", enum: ["markdown", "html", "json"] },
          description: "Output formats (default: markdown)",
        },
        onlyMainContent: {
          type: "boolean",
          description: "Only return the main content, stripping nav/ads",
        },
        waitFor: {
          type: "number",
          description: "Milliseconds to wait for JavaScript rendering",
        },
        mobile: {
          type: "boolean",
          description: "Emulate mobile viewport",
        },
      },
      required: ["url"],
    },
    handler: async (args) => {
      const result = await firecrawlFetch("/v0/scrape", {
        url: args.url,
        formats: args.formats || ["markdown"],
        onlyMainContent: args.onlyMainContent ?? true,
        waitFor: args.waitFor,
        mobile: args.mobile,
      });
      const data = result.data || result;
      const texts: McpContent[] = [];
      if (data.markdown) {
        texts.push({ type: "text", text: data.markdown });
      }
      if (data.metadata) {
        texts.push({
          type: "text",
          text: `\n--- Metadata ---\n${JSON.stringify(data.metadata, null, 2)}`,
        });
      }
      return texts;
    },
  });

  server.register({
    name: "goozfire_search",
    description:
      "Search the web with a natural language query and return results with content. Best for finding information across the internet.",
    inputSchema: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "Search query (natural language)",
        },
        limit: {
          type: "number",
          description: "Max results (default: 5, max: 20)",
          default: 5,
        },
        lang: {
          type: "string",
          description: "Language code (e.g., en, fr, de)",
        },
        searchDepth: {
          type: "string",
          enum: ["basic", "advanced"],
          description: "Search depth",
        },
      },
      required: ["query"],
    },
    handler: async (args) => {
      const result = await firecrawlFetch("/v0/search", {
        query: args.query,
        limit: args.limit || 5,
        lang: args.lang,
        searchDepth: args.searchDepth || "basic",
      });
      const data = result.data || result;
      const results = data.results || [];
      const texts: McpContent[] = [
        {
          type: "text",
          text: `Search results for "${args.query}" (${results.length} results):`,
        },
      ];
      for (const r of results) {
        texts.push({
          type: "text",
          text: `\n## ${r.title || "Untitled"}\nURL: ${r.url}\n${r.description || ""}${r.content ? `\n\n${r.content.substring(0, 500)}` : ""}`,
        });
      }
      return texts;
    },
  });

  server.register({
    name: "goozfire_crawl",
    description:
      "Start a crawl job that discovers and scrapes multiple pages on a website. Returns a job ID to check status with goozfire_crawl_status.",
    inputSchema: {
      type: "object",
      properties: {
        url: {
          type: "string",
          description: "Starting URL for the crawl",
        },
        maxPages: {
          type: "number",
          description: "Maximum pages to crawl (default: 10)",
        },
        maxDepth: {
          type: "number",
          description: "Maximum link depth (default: 2)",
        },
        includePaths: {
          type: "array",
          items: { type: "string" },
          description: "Only crawl URLs matching these path patterns",
        },
        excludePaths: {
          type: "array",
          items: { type: "string" },
          description: "Skip URLs matching these path patterns",
        },
      },
      required: ["url"],
    },
    handler: async (args) => {
      const result = await firecrawlFetch("/v0/crawl", {
        url: args.url,
        maxPages: args.maxPages || 10,
        maxDepth: args.maxDepth || 2,
        includePaths: args.includePaths,
        excludePaths: args.excludePaths,
      });
      return [
        {
          type: "text",
          text: JSON.stringify(
            {
              jobId: result.jobId,
              status: result.status,
              url: args.url,
            },
            null,
            2
          ),
        },
      ];
    },
  });

  server.register({
    name: "goozfire_crawl_status",
    description: "Check the status and results of a crawl job started with goozfire_crawl.",
    inputSchema: {
      type: "object",
      properties: {
        jobId: {
          type: "string",
          description: "The crawl job ID from goozfire_crawl",
        },
      },
      required: ["jobId"],
    },
    handler: async (args) => {
      const res = await fetch(
        `${FIRECRAWL_API_URL}/v0/crawl/${encodeURIComponent(args.jobId as string)}`,
        {
          headers: {
            Authorization: `Bearer ${FIRECRAWL_API_KEY}`,
          },
        }
      );
      if (!res.ok) {
        throw new Error(`Status check failed: ${res.status}`);
      }
      const result = await res.json();
      return [
        {
          type: "text",
          text: JSON.stringify(result, null, 2),
        },
      ];
    },
  });

  server.register({
    name: "goozfire_extract",
    description:
      "Extract structured data from one or more URLs using LLM-powered extraction. Define what to extract with a prompt or JSON schema.",
    inputSchema: {
      type: "object",
      properties: {
        urls: {
          type: "array",
          items: { type: "string" },
          description: "URLs to extract data from",
        },
        prompt: {
          type: "string",
          description: "Natural language description of what to extract",
        },
        enableWebSearch: {
          type: "boolean",
          description: "Allow additional web search for context",
        },
      },
      required: ["urls"],
    },
    handler: async (args) => {
      const result = await firecrawlFetch("/v0/extract", {
        urls: args.urls,
        prompt: args.prompt,
        enableWebSearch: args.enableWebSearch,
      });
      return [
        {
          type: "text",
          text: JSON.stringify(result.data || result, null, 2),
        },
      ];
    },
  });

  server.register({
    name: "goozfire_map",
    description:
      "Discover all accessible URLs on a website. Useful for site mapping, documentation discovery, and finding all pages under a domain.",
    inputSchema: {
      type: "object",
      properties: {
        url: {
          type: "string",
          description: "The website URL to map",
        },
        search: {
          type: "string",
          description: "Optional search query to filter URLs by content",
        },
        limit: {
          type: "number",
          description: "Maximum URLs to return",
        },
        includeSubdomains: {
          type: "boolean",
          description: "Include subdomains in the map",
        },
      },
      required: ["url"],
    },
    handler: async (args) => {
      const result = await firecrawlFetch("/v0/map", {
        url: args.url,
        search: args.search,
        limit: args.limit,
        includeSubdomains: args.includeSubdomains,
      });
      const data = result.data || result;
      const links = data.links || [];
      return [
        {
          type: "text",
          text:
            links.length > 0
              ? links.join("\n")
              : "No URLs discovered.",
        },
      ];
    },
  });

  server.register({
    name: "goozfire_research",
    description: "Run deep multi-step research on a topic. Searches the web, reads sources, and synthesizes findings into a structured report with citations. Like Parallel.ai Deep Research.",
    inputSchema: {
      type: "object",
      properties: {
        question: { type: "string", description: "The research question" },
        max_sources: { type: "number", description: "Max sources to analyze (default: 10)" },
        depth: { type: "string", enum: ["basic", "deep", "comprehensive"], description: "Research depth" },
      },
      required: ["question"],
    },
    handler: async (args) => {
      const res = await fetch("http://localhost:3003/api/v1/research", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": "Bearer internal" },
        body: JSON.stringify({
          question: args.question,
          max_sources: args.max_sources || 10,
          depth: args.depth || "basic",
        }),
      });
      const result = await res.json();
      return [{ type: "text", text: JSON.stringify(result, null, 2) }];
    },
  });
  server.register({
    name: "goozfire_batch",
    description: "Extract structured data from a list of URLs or items with a single prompt. Like Parallel.ai Task Group.",
    inputSchema: {
      type: "object",
      properties: {
        items: { type: "array", items: {}, description: "List of items (URLs or objects)" },
        prompt: { type: "string", description: "Extraction prompt" },
        input_field: { type: "string", description: "Field containing URL" },
      },
      required: ["items", "prompt"],
    },
    handler: async (args) => {
      const res = await fetch("http://localhost:3003/api/v1/batch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: args.items, prompt: args.prompt, input_field: args.input_field }),
      });
      const result = await res.json();
      return [{ type: "text", text: JSON.stringify(result, null, 2) }];
    },
  });
  server.register({
    name: "goozfire_health",
    description: "Health check - verify the MCP server and Firecrawl connection are working.",
    inputSchema: {
      type: "object",
      properties: {},
    },
    handler: async () => {
      // Ping Firecrawl
      let firecrawlStatus = "unknown";
      try {
        const res = await fetch(`${FIRECRAWL_API_URL}/v0/scrape`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${FIRECRAWL_API_KEY}`,
          },
          body: JSON.stringify({
            url: "https://example.com",
            formats: ["markdown"],
          }),
        });
        firecrawlStatus = res.ok ? "connected" : `error: ${res.status}`;
      } catch (e: any) {
        firecrawlStatus = `unreachable: ${e.message}`;
      }

      return [
        {
          type: "text",
          text: JSON.stringify(
            {
              status: "ok",
              version: "0.1.0",
              firecrawl: firecrawlStatus,
              uptime: process.uptime(),
            },
            null,
            2
          ),
        },
      ];
    },
  });
}

// Start server
const server = new McpServer();
defineTools(server);

const port = parseInt(MCP_HTTP_PORT);

Bun.serve({
  port,
  fetch: server.getFetchHandler(),
});

console.error(`Goozfire MCP server running:`);
console.error(`  HTTP API: http://localhost:${port}`);
console.error(`  SSE:      http://localhost:${port}/sse`);
console.error(`  Health:   http://localhost:${port}/v1/health`);
console.error(`  Tools:    9 registered`);

// Types
interface McpTool {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
  handler: (args: Record<string, unknown>) => Promise<McpContent[]>;
}

interface McpContent {
  type: string;
  text: string;
}

interface McpRequest {
  jsonrpc: string;
  id: number;
  method: string;
  params: {
    name: string;
    arguments?: Record<string, unknown>;
    _meta?: Record<string, unknown>;
  };
}

interface McpListToolsResponse {
  jsonrpc: string;
  id: number;
  result: {
    tools: Array<{
      name: string;
      description: string;
      inputSchema: Record<string, unknown>;
    }>;
  };
}

interface McpCallToolResponse {
  jsonrpc: string;
  id: number;
  result?: {
    content: McpContent[];
    isError?: boolean;
  };
  error?: {
    code: number;
    message: string;
  };
}
