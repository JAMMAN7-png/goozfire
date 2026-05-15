import { scrape as firecrawlScrape, extractData } from "../firecrawl/client";
import type { BatchRequest, BatchItemResult, BatchResponse } from "@goozfire/shared";

interface BatchOptions {
  concurrency?: number;
}

export async function processBatch(
  request: BatchRequest,
  options?: BatchOptions
): Promise<BatchResponse> {
  const { items, prompt, schema, input_field } = request;
  const concurrency = options?.concurrency || 3;

  if (!items || items.length === 0) {
    return { success: false, job_id: "", status: "failed", error: "No items provided" };
  }
  if (!prompt) {
    return { success: false, job_id: "", status: "failed", error: "Extraction prompt is required" };
  }

  const results: BatchItemResult[] = [];
  const queue = items.map((item: any, index: number) => ({ item, index }));

  async function worker() {
    while (queue.length > 0) {
      const { item, index } = queue.shift()!;
      const result: BatchItemResult = { index, input: item, output: null };

      try {
        let url: string;
        if (typeof item === "string") {
          url = (item as string).startsWith("http") ? (item as string) : `https://${item}`;
        } else if (input_field && item[input_field]) {
          url = String(item[input_field]);
          if (!url.startsWith("http")) url = `https://${url}`;
        } else if (item.url) {
          url = String(item.url);
        } else if (item.link) {
          url = String(item.link);
        } else {
          throw new Error("Item has no URL or recognized input field");
        }

        try {
          const extractResult = await extractData([url], { prompt, schema });
          result.output = (extractResult?.data?.data as Record<string, unknown>) || null;
        } catch {
          const scrapeResult = await firecrawlScrape(url, {
            formats: ["markdown"],
            onlyMainContent: true,
          });
          const markdown = scrapeResult?.data?.markdown || "";
          result.output = {
            url,
            title: scrapeResult?.data?.metadata?.title || "",
            content: markdown.substring(0, 5000),
          };
        }
      } catch (err: any) {
        result.error = err.message;
      }
      results.push(result);
    }
  }

  const workers = Array.from({ length: Math.min(concurrency, items.length) }, () => worker());
  await Promise.all(workers);
  results.sort((a, b) => a.index - b.index);

  return { success: true, job_id: `batch-${Date.now()}`, status: "completed", results };
}
