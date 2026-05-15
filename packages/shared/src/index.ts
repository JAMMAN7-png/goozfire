// ============================================
// Goozfire Shared Types & Schemas
// ============================================

// --- User & Auth ---

export interface User {
  id: number;
  email: string;
  name: string;
  password_hash: string;
  created_at: string;
  updated_at: string;
  is_admin: number;
}

export interface ApiKey {
  id: number;
  user_id: number;
  name: string;
  key_prefix: string;
  key_hash: string;
  key_last_chars: string;
  created_at: string;
  last_used_at: string | null;
  is_active: number;
}

export interface CreateUserInput {
  email: string;
  name: string;
  password: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface AuthTokens {
  access_token: string;
  token_type: "Bearer";
  expires_in: number;
  user: UserPublic;
}

export interface UserPublic {
  id: number;
  email: string;
  name: string;
  is_admin: boolean;
  created_at: string;
}

export interface CreateApiKeyInput {
  name: string;
}

export interface ApiKeyResponse {
  id: number;
  name: string;
  key: string;
  key_prefix: string;
  created_at: string;
}

// --- API Requests & Responses ---

export interface ScrapeRequest {
  url: string;
  formats?: Array<"markdown" | "html" | "rawHtml" | "screenshot" | "links" | "json">;
  onlyMainContent?: boolean;
  includeTags?: string[];
  excludeTags?: string[];
  waitFor?: number;
  mobile?: boolean;
  parsePDF?: boolean;
  actions?: Array<{
    type: "wait" | "click" | "screenshot" | "write" | "press" | "scroll" | "scrape";
    selector?: string;
    milliseconds?: number;
    text?: string;
    key?: string;
    direction?: "up" | "down";
  }>;
  extract?: {
    mode: "llm-extraction" | "llm-extraction-from-raw-html";
    schema?: Record<string, unknown>;
    prompt?: string;
    systemPrompt?: string;
  };
}

export interface ScrapeResponse {
  success: boolean;
  data: {
    markdown?: string;
    html?: string;
    rawHtml?: string;
    screenshot?: string;
    links?: string[];
    json?: unknown;
    metadata: {
      url: string;
      title: string;
      description?: string;
      language?: string;
      sourceURL?: string;
      statusCode?: number;
      creditsUsed: number;
    };
  };
}

export interface CrawlRequest {
  url: string;
  maxPages?: number;
  maxDepth?: number;
  includePaths?: string[];
  excludePaths?: string[];
  maxDiscoveryDepth?: number;
  ignoreSitemap?: boolean;
  allowExternalLinks?: boolean;
  allowSubdomains?: boolean;
  scrapeOptions?: Omit<ScrapeRequest, "url">;
}

export interface CrawlResponse {
  success: boolean;
  jobId: string;
  status: "queued" | "active" | "completed" | "failed" | "cancelled";
  data?: Array<{
    url: string;
    markdown?: string;
    html?: string;
    metadata: Record<string, unknown>;
  }>;
  error?: string;
}

export interface SearchRequest {
  query: string;
  limit?: number;
  lang?: string;
  country?: string;
  searchDepth?: "basic" | "advanced";
  includeDomains?: string[];
  excludeDomains?: string[];
}

export interface SearchResponse {
  success: boolean;
  data: {
    results: Array<{
      title: string;
      url: string;
      description: string;
      content?: string;
      image?: string;
    }>;
    query: string;
    totalResults: number;
    creditsUsed: number;
  };
}

export interface MapRequest {
  url: string;
  search?: string;
  includeSubdomains?: boolean;
  limit?: number;
  ignoreSitemap?: boolean;
  sitemapOnly?: boolean;
}

export interface MapResponse {
  success: boolean;
  data: {
    links: string[];
    url: string;
    creditsUsed: number;
  };
}

export interface ExtractRequest {
  urls: string[];
  prompt?: string;
  schema?: Record<string, unknown>;
  enableWebSearch?: boolean;
}

export interface ExtractResponse {
  success: boolean;
  data: {
    data: unknown;
    creditsUsed: number;
  };
}

// --- Usage Tracking ---

export interface UsageRecord {
  id: number;
  user_id: number;
  api_key_id: number | null;
  endpoint: string;
  method: string;
  status_code: number;
  credits_used: number;
  response_time_ms: number;
  created_at: string;
}

export interface UsageStats {
  total_requests: number;
  total_credits: number;
  avg_response_time_ms: number;
  by_endpoint: Array<{
    endpoint: string;
    count: number;
    credits: number;
  }>;
  by_day: Array<{
    date: string;
    count: number;
    credits: number;
  }>;
}

// --- Rate Limiting ---

export interface RateLimitConfig {
  window_ms: number;
  max_requests: number;
}

// ============================================
// Deep Research
// ============================================

export interface ResearchRequest {
  question: string;
  max_sources?: number;
  depth?: "basic" | "deep" | "comprehensive";
}

export interface ResearchSource {
  url: string;
  title: string;
  content: string;
  relevance_score?: number;
}

export interface ResearchFinding {
  finding: string;
  evidence: string;
  sources: string[];
}

export interface ResearchResponse {
  success: boolean;
  job_id: string;
  status: "processing" | "completed" | "failed";
  report?: {
    summary: string;
    key_findings: ResearchFinding[];
    sources: ResearchSource[];
    raw_synthesis?: string;
    credits_used: number;
  };
  error?: string;
}

// ============================================
// Batch Processing
// ============================================

export interface BatchRequest {
  items: Array<Record<string, unknown>>;
  prompt: string;
  schema?: Record<string, unknown>;
  input_field?: string;
  output_fields?: string[];
}

export interface BatchItemResult {
  index: number;
  input: Record<string, unknown>;
  output: Record<string, unknown> | null;
  error?: string;
}

export interface BatchResponse {
  success: boolean;
  job_id: string;
  status: "processing" | "completed" | "failed";
  results?: BatchItemResult[];
  error?: string;
}

// ============================================
// Async Jobs
// ============================================

export type JobType = "research" | "batch" | "crawl" | "extract";
export type JobStatus = "queued" | "processing" | "completed" | "failed";

export interface Job {
  id: number;
  user_id: number;
  type: JobType;
  status: JobStatus;
  input: string;
  output: string | null;
  error: string | null;
  progress: number;
  credits_used: number;
  created_at: string;
  started_at: string | null;
  completed_at: string | null;
}

export interface JobListResponse {
  jobs: Job[];
  total: number;
}

export interface JobCreateRequest {
  type: JobType;
  input: Record<string, unknown>;
}

// ============================================
// Webhooks
// ============================================

export interface Webhook {
  id: number;
  user_id: number;
  url: string;
  secret: string;
  events: string;
  is_active: number;
  created_at: string;
  last_triggered_at: string | null;
  last_triggered_status: number | null;
}

export interface WebhookCreateRequest {
  url: string;
  events: string[];
  secret?: string;
}

export interface WebhookUpdateRequest {
  url?: string;
  events?: string[];
  is_active?: boolean;
}

export interface WebhookDelivery {
  id: number;
  webhook_id: number;
  event: string;
  payload: string;
  status_code: number | null;
  response: string | null;
  success: number;
  created_at: string;
}
