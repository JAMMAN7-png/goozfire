# Spike 002: Complete Search APIs & MCPs — Pros/Cons Comparison

**Date:** 2026-05-15
**Method:** Multi-engine research across 20+ comparison articles, MCP registries, pricing pages
**Question:** What are all the search APIs and MCP scraping tools available, and what are their strengths/weaknesses?

---

## Category 1: FULL-STACK SCRAPING APIs (Cloud-Managed)

### Firecrawl
**Type:** API-first scraping platform | **MCP:** ✅ Official | **Self-host:** ✅ AGPL-3.0

| PROS | CONS |
|------|------|
| Best markdown output quality in market — built for LLMs/RAG | Expensive at scale ($333/mo for 500K pages) |
| Full crawl/map/extract/search in one API | No built-in semantic search over scraped content |
| Screenshots, PDF parsing, DOCX parsing | No webhooks for change detection |
| Mature SDKs: Python, JS/TS, Go, Rust | Credit model unpredictable — variable per page |
| 120K GitHub stars, active community | Blocked social media scraping entirely |
| n8n/Zapier/LangChain integrations | Failed 5/6 protected sites in independent test |
| Open-source Docker self-host available | Self-host needs Redis + Playwright (~1GB RAM) |

**Pricing:** Free (500 cr/mo) → $16/mo (3K cr) → $83/mo (100K) → $333/mo (500K) → $599/mo (1M)
**Best for:** AI apps, RAG pipelines, LLM workflows, teams wanting one API for everything

---

### Bright Data
**Type:** Enterprise proxy + scraping infrastructure | **MCP:** ✅ | **Self-host:** ❌

| PROS | CONS |
|------|------|
| Largest proxy network: 150M+ IPs, 195 countries | Extremely expensive — $500+/mo entry for serious use |
| Web Unlocker handles toughest anti-bot (Cloudflare, DataDome) | Steep learning curve, complex dashboard |
| 97%+ success rate on protected targets (LinkedIn, Nike) | Users report billing for unsuccessful requests |
| Pre-built scrapers for 660+ sites | No native markdown output (HTML only) |
| Residential, ISP, mobile, datacenter — all proxy types | KYC required for non-business users |
| AI Scraper Studio for visual pipeline building | Enterprise-focused, hostile to small teams |
| Scraping Browser (CDP-compatible) | No self-host option |

**Pricing:** PAYG from $1.50/1K requests (Web Unlocker), proxies from $4/GB, free trial available
**Best for:** Enterprise scale, heavily protected targets, Fortune 500 compliance needs

---

### Apify
**Type:** Actor-based scraping platform | **MCP:** ✅ Community | **Self-host:** Partial (open-source Crawlee)

| PROS | CONS |
|------|------|
| 21,000+ pre-built Actors (scrapers) — no code needed | No native markdown output |
| Full scheduling, storage, monitoring built in | Actors vary wildly in quality |
| Generous free tier: $5/mo compute credits | Per-compute-unit pricing is hard to predict |
| Crawlee (open-source) for custom scrapers | Not optimized for LLM consumption |
| Handles JS rendering, proxy rotation | Platform lock-in for business plans |
| REST API, Python/JS clients | Can get expensive on complex Actors |

**Pricing:** Free ($5 credits) → $49/mo (25K CUs) → $149/mo (100K) → $499/mo (400K)
**Best for:** Teams wanting pre-built scrapers, no-code workflows, scheduled crawling

---

### ScrapingBee
**Type:** Rendering-focused scraping API | **MCP:** ❌ | **Self-host:** ❌

| PROS | CONS |
|------|------|
| Best JS rendering quality on SPAs | No markdown output — HTML only |
| Simple API — one call, get HTML | No crawl/map endpoints |
| Residential proxy rotation included | JS rendering costs 5x credits |
| `extract_rules` for structured extraction | No AI/LLM extraction |
| Great free tier: 1,000 API calls | Premium proxies cost 10-25x credits |
| 4.9/5 on Capterra (118 reviews) | No search integration |

**Pricing:** Free (1K calls) → $49/mo (250K credits) → $99/mo (1M) → $249/mo (3M) → $599/mo (8M)
**Best for:** Developers who parse HTML themselves, JS-heavy SPAs

---

### ScraperAPI
**Type:** Proxy rotation + CAPTCHA solving API | **MCP:** ❌ | **Self-host:** ❌

| PROS | CONS |
|------|------|
| Easiest setup — prepend URL, start scraping | No markdown output |
| 5,000 free credits to start | No crawl/map endpoints |
| Auto proxy rotation, CAPTCHA solving, retries | JS rendering occasionally misses dynamic content |
| Geographic targeting included | Success rate drops on heavily protected targets |
| Simple pricing vs competitors | No AI extraction |
| Good for beginners | Limited to HTML output |

**Pricing:** Free (5K credits) → $49/mo → $149/mo
**Best for:** Beginners, general-purpose scraping, simple sites

---

### Scrape.do
**Type:** Budget high-volume scraping API | **MCP:** ❌ | **Self-host:** ❌

| PROS | CONS |
|------|------|
| 99.98% claimed success rate | No markdown output |
| Dirt cheap: $0.07/1K pages at volume | No crawl/map endpoints |
| 110M+ residential proxies | No AI extraction |
| Transparent pricing, no credit games | No search integration |
| 4.7s avg response time | Basic feature set |
| Good for commodity scraping | No webhooks |

**Pricing:** From $29/mo, extremely cheap at scale
**Best for:** High-volume commodity scraping where cost matters most

---

### KnowledgeSDK
**Type:** AI-native knowledge layer with scraping | **MCP:** ✅ | **Self-host:** ❌

| PROS | CONS |
|------|------|
| Built-in semantic + keyword search over scraped content | Smaller/younger company |
| Webhook change detection built in | Not open-source |
| Clean markdown output | Less SDK language coverage |
| Competitive pricing: $29/mo for 25K requests | Smaller community |
| MCP server for agent integration | Limited to AI use cases |
| Hybrid search eliminates need for Pinecone/Weaviate | No screenshots/PDFs |

**Pricing:** Free (1K req/mo) → $29/mo (25K) → $99/mo (100K+) → Custom
**Best for:** Production AI agents, RAG pipelines needing search + webhooks

---

### Zyte (formerly Scrapinghub)
**Type:** Enterprise e-commerce scraping | **MCP:** ❌ | **Self-host:** Partial (Scrapy, open-source)

| PROS | CONS |
|------|------|
| 15 years of scraping expertise | Enterprise pricing — opaque |
| ML-powered product extraction | Slow for non-e-commerce use |
| Automatic data delivery service | No LLM-friendly markdown |
| Behind Scrapy (most popular Python framework) | Complex for simple tasks |
| Managed service — no infra to run | Not AI-agent-first |
| E-commerce-specific: prices, variants, reviews | No MCP server |

**Pricing:** Custom enterprise, pay-per-success
**Best for:** Enterprise e-commerce data extraction, teams using Scrapy

---

### Diffbot
**Type:** Knowledge Graph + entity extraction | **MCP:** ❌ | **Self-host:** ❌

| PROS | CONS |
|------|------|
| Unique: extracts structured entities (people, products, orgs) | Enterprise-only pricing |
| Knowledge Graph with 10B+ entities | Not a general scraping API |
| Best for entity-level extraction | No markdown output |
| Combines with NLP for understanding | Very expensive |
| Used by major search engines | Limited to structured extraction |

**Pricing:** Enterprise custom
**Best for:** Entity extraction, knowledge graph construction, analyzing companies/people

---

## Category 2: SEARCH APIs (Web Search for AI)

### Exa
**Type:** Neural search with own index | **MCP:** ✅ Official | **Self-host:** ❌

| PROS | CONS |
|------|------|
| Own search index — independent from Google | Smaller index than Google/Bing |
| Neural/embeddings-based — finds semantically similar content | Not real-time for breaking news |
| Content extraction built into search results | Fewer results than traditional search |
| Clean markdown from search results | US-centric coverage |
| MCP server for agent integration | Relatively expensive per query |
| Good for research, long-form content discovery | Limited to web content |
| `category:people` / `category:company` filters | Pagination quirks |

**Pricing:** Usage-based, MCP server free with API key
**Best for:** Semantic research, content discovery, finding similar pages

---

### Tavily
**Type:** AI-optimized search API | **MCP:** ✅ | **Self-host:** ❌

| PROS | CONS |
|------|------|
| Built specifically for LLM agents | Can be slow (14s avg in benchmarks) |
| Structured answers, not just links | Smaller index than Exa/Brave |
| Good for news, recent events | Less depth for technical research |
| 1,000 free searches/month | Results sometimes too summarized |
| Popular in LangChain/LlamaIndex ecosystem | Costs add up at scale |
| npm + Python SDKs, MCP server | Occasional query misunderstanding |

**Pricing:** Free (1K searches/mo) → paid plans
**Best for:** LLM search grounding, news queries, quick factual lookups

---

### Brave Search API
**Type:** Own-index independent search | **MCP:** ✅ | **Self-host:** ❌

| PROS | CONS |
|------|------|
| Own index — independent from Google | Smaller than Google's index |
| Privacy-first, no tracking | Less rich snippets than Google SERP |
| Good web + news + image search | Regional coverage gaps |
| Free tier available | No content extraction built in |
| MCP server available | Slower than Google for some queries |
| Growing fast as Google alternative | API docs could be better |

**Pricing:** Free tier → paid plans
**Best for:** Privacy-conscious search, AI agents needing independent search

---

### Perplexity API (Sonar)
**Type:** AI-answer engine API | **MCP:** ❌ | **Self-host:** ❌

| PROS | CONS |
|------|------|
| Won LangSmith benchmark vs Exa/Tavily/Gemini | Opaque — don't control the search |
| Best for factual/current event queries | No content extraction for downstream use |
| Real-time web grounding | Expensive per query |
| Clean, cited answers | Model decides what to search |
| Multiple model options (Sonar, Pro) | Can't customize search behavior |
| Good for end-user-facing answers | Not a scraping tool |

**Pricing:** Usage-based, Perplexity Pro subscription available
**Best for:** End-user Q&A, factual answering with citations

---

### Google Gemini Search Grounding
**Type:** Model-integrated search | **MCP:** Via Gemini API | **Self-host:** ❌

| PROS | CONS |
|------|------|
| Google's index — largest and freshest | Opaque — model controls search |
| Built into Gemini API — no separate service | Can't extract raw search results |
| Good for Google-ecosystem apps | Gemini model quality varies |
| Zero setup if already using Gemini | Rate limited, expensive |
| | No standalone search API |

**Pricing:** Bundled with Gemini API usage
**Best for:** Apps already using Gemini, Google ecosystem integration

---

### Parallel.ai Deep Research
**Type:** Multi-turn deep research | **MCP:** ✅ | **Self-host:** ❌

| PROS | CONS |
|------|------|
| Analyst-grade multi-turn research | Slow — minutes per task |
| Own search index | Not for quick/real-time queries |
| Comprehensive citations | Overkill for simple searches |
| Follow-up questions maintain context | Premium pricing |
| Pro/Ultra processor tiers | Results need polling |
| Good for complex research tasks | Only for deep research use case |

**Pricing:** Per-task, processor-dependent (pro/ultra tiers)
**Best for:** Deep research reports, competitive analysis, multi-source synthesis

---

## Category 3: OPEN-SOURCE / SELF-HOSTED SCRAPERS

### Crawl4AI
**Type:** Python library, self-hosted | **MCP:** Community | **Self-host:** ✅ (only option)

| PROS | CONS |
|------|------|
| Completely free — Apache 2.0 license | Python-only ecosystem |
| 65K GitHub stars, #1 trending web scraper | Heavier deployment: 2GB Docker, 300MB+ RAM |
| LLM extraction via any provider (incl. Ollama) | REST server mode less polished |
| Smart markdown, heuristic noise removal | Basic anti-bot (needs own proxies) |
| Playwright-based JS rendering | No cloud managed option |
| Deep crawl, hooks, caching, Docker | Community support only |
| Adaptive crawling, virtual scroll | Smaller community than Firecrawl |
| Local LLM support (Ollama, etc.) | Setup more complex than one-line APIs |

**Pricing:** Free (OSS) — only infra costs ($5-50/mo VPS + optional proxies)
**Best for:** Python developers wanting full control, privacy-first, budget-constrained

---

### CRW / fastCRW
**Type:** Rust-based self-hosted scraper | **MCP:** ✅ Built-in | **Self-host:** ✅ AGPL-3.0

| PROS | CONS |
|------|------|
| Fastest in benchmarks: 833ms avg vs Firecrawl's 4,600ms | Smaller/younger project |
| Tiny Docker image: 8MB, 6.6MB idle RAM | Less battle-tested |
| Firecrawl-compatible API (drop-in replacement) | Fewer features (no screenshots/PDFs) |
| Built-in MCP server | Community smaller |
| Zero per-request fees when self-hosted | Limited SDKs |
| Rust — memory safe, fast | No cloud managed option (fastCRW cloud available) |
| $5/mo VPS can run it | Newer docs, less tutorial content |

**Pricing:** Free self-host (AGPL-3.0) → fastCRW cloud: 500 free credits, then usage-based
**Best for:** AI agents needing low-latency scraping, budget teams wanting zero per-page fees

---

### Jina Reader (r.jina.ai)
**Type:** Free URL-to-markdown converter | **MCP:** ❌ | **Self-host:** Open-source

| PROS | CONS |
|------|------|
| Dead simple: prefix `r.jina.ai/` to any URL | Single-page only — no crawling |
| Completely free, rate-limited | Inconsistent JS rendering |
| Clean markdown output | No pagination handling |
| Perfect for quick prototyping | Rate limits prevent production use |
| No API key needed for basic use | No search built in |
| Open-source for self-hosting | No structured extraction |
| | No webhooks or monitoring |

**Pricing:** Free (rate-limited), paid for higher volume
**Best for:** Quick prototyping, one-off page conversions, testing

---

### WebPeel
**Type:** Full-spectrum MCP web intelligence | **MCP:** ✅ (primary interface) | **Self-host:** Local free

| PROS | CONS |
|------|------|
| 18 tools in one MCP server | New project |
| Auto-escalates: static fetch → headless browser → stealth | Smaller community |
| Built-in search (no separate search API needed) | Unknown reliability yet |
| YouTube transcript extraction | Hosted API has rate limits |
| Free for local use | May not handle hardest anti-bot |
| Token-efficient markdown output | |
| Smart handling of JS-heavy pages | |

**Pricing:** Free (local), paid (hosted API)
**Best for:** MCP-native workflows, agents needing multiple web tools in one server

---

### Spider.cloud
**Type:** Speed-optimized scraping API | **MCP:** ❌ | **Self-host:** ❌

| PROS | CONS |
|------|------|
| Very fast bulk scraping | No search built in |
| 2,000 free credits/month | No webhooks |
| Very good markdown quality | No structured extraction AI |
| Cost-effective at scale ($20/mo for 100K pages) | Smaller feature set than Firecrawl |
| Good for speed-focused pipelines | No screenshots/PDFs |
| | Less mature SDKs |

**Pricing:** Free (2K credits) → ~$2/mo (10K) → ~$20/mo (100K) → ~$200/mo (1M)
**Best for:** Bulk scraping where speed and cost matter, simpler sites

---

### Browserbase
**Type:** Managed headless browser infrastructure | **MCP:** ❌ | **Self-host:** ❌

| PROS | CONS |
|------|------|
| Full CDP access — complete browser control | You build everything on top |
| Stealth mode for anti-bot bypass | Per-hour pricing hard to predict |
| 150 free sessions/month | No scraping logic — just browser |
| Session recording/debugging | Inefficient for simple read-only extraction |
| Good for interactive automation | No markdown or structured output |
| Playwright/Puppeteer compatible | Not a scraping API — infrastructure |

**Pricing:** Free (150 sessions/mo) → paid per browser-hour (~$0.50/hr)
**Best for:** Complex browser automation, interactive workflows, testing

---

## Category 4: MCP SERVERS (Agent-Native Tools)

### Firecrawl MCP

| PROS | CONS |
|------|------|
| All Firecrawl products under one MCP server | Requires Firecrawl API key (credit costs) |
| scrape, crawl, map, search, extract tools | No built-in proxies |
| Most mature MCP server | Separate package from main Firecrawl |
| 6.3K GitHub stars | Credit burning on deep crawls |
| Works with Claude, Cursor, all MCP clients | Search is Firecrawl search, not web search |

### Context7 MCP

| PROS | CONS |
|------|------|
| Library/framework documentation search | Only documentation — not general web |
| Up-to-date code examples | Library coverage gaps |
| Resolve + query pattern | Results can be narrow |
| Great for coding help | Not useful for non-dev queries |

### Exa MCP

| PROS | CONS |
|------|------|
| Neural web search for agents | Search-only, no scraping |
| Clean content extraction | Smaller index |
| Free with API key | |

### DeepWiki MCP

| PROS | CONS |
|------|------|
| GitHub repo documentation | GitHub-only |
| Structured wiki navigation | Small repos not covered |
| Ask questions about repos | |

### Grep MCP (Vercel)

| PROS | CONS |
|------|------|
| Search 1M+ GitHub repos for real code | Code-only, not docs |
| Regex support | Can return irrelevant matches |
| Language filtering | Not for web content |

### Parallel MCP

| PROS | CONS |
|------|------|
| Deep research + batch processing | Slow for simple queries |
| Multi-source synthesis | Pooling required |
| pro/ultra processor tiers | Premium pricing |

---

## QUICK DECISION MATRIX

| Your Need | Best Choice | Why |
|-----------|------------|-----|
| AI app with RAG pipeline | **Firecrawl** or **KnowledgeSDK** | Clean markdown, structured extraction, one API |
| Cheapest bulk scraping | **Scrape.do** ($0.07/1K) or **CRW self-host** ($5/mo VPS) | Zero/low per-page cost |
| Heavily protected sites | **Bright Data** | 97%+ success rate, Web Unlocker |
| Free, self-hosted with full control | **Crawl4AI** | Apache 2.0, Python hooks, LLM extraction |
| Pre-built scrapers for known sites | **Apify** | 21K+ Actors, no code needed |
| LLM search grounding | **Tavily** or **Exa** | Built for AI, structured results |
| Quick prototyping (single page) | **Jina Reader** | r.jina.ai/URL — zero setup |
| MCP-only workflow | **WebPeel** or **Firecrawl MCP** | 18 tools or battle-tested |
| Enterprise e-commerce | **Zyte** | 15yr expertise, ML extraction |
| Entity extraction / knowledge graph | **Diffbot** | Unique structured entity extraction |
| AI agents needing lowest latency | **CRW** | 833ms avg, built-in MCP |
| Privacy-first search | **Brave Search** | Own index, no tracking |

---

## Verdict: VALIDATED

### Key Takeaways

1. **The market has bifurcated**: AI-native tools (Firecrawl, Crawl4AI, KnowledgeSDK) output clean markdown and integrate with LLMs. Traditional tools (ScrapingBee, ScraperAPI) output raw HTML. Pick based on whether an LLM consumes the output.

2. **Cost varies 100x**: Scrape.do at $0.07/1K pages vs Firecrawl at $4.15/1K pages vs Bright Data at $500+/mo. The sweet spot for most teams is CRW self-hosted ($5/mo VPS) or Firecrawl's Standard tier ($83/mo).

3. **MCP support is fragmenting**: Firecrawl has the most mature MCP server. WebPeel offers the most tools (18). CRW has the fastest. The MCP ecosystem is 6 months old — expect consolidation.

4. **Anti-bot handling is the real differentiator**: At the high end, Bright Data's Web Unlocker handles what others can't. CRW and Crawl4AI need you to bring your own proxies for hard targets.

5. **Open-source is catching up fast**: Crawl4AI (65K stars) and CRW (Rust-based) can match or beat paid APIs for most use cases — you just need a VPS and patience.
