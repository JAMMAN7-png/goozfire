import React, { useState } from "react";
import { tools } from "../api/client";

type ToolName = "search" | "scrape" | "crawl" | "extract" | "map";

const toolNames: ToolName[] = ["search", "scrape", "crawl", "extract", "map"];

interface TabDef {
  name: ToolName;
  label: string;
  icon: string;
}

const tabs: TabDef[] = [
  { name: "search", label: "Search", icon: "🔍" },
  { name: "scrape", label: "Scrape", icon: "📄" },
  { name: "crawl", label: "Crawl", icon: "🕸️" },
  { name: "extract", label: "Extract", icon: "🧩" },
  { name: "map", label: "Map", icon: "🗺️" },
];

export default function Playground() {
  const [activeTab, setActiveTab] = useState<ToolName>("search");
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Form state per tool
  const [searchQuery, setSearchQuery] = useState("");
  const [searchLimit, setSearchLimit] = useState(5);
  const [scrapeUrl, setScrapeUrl] = useState("");
  const [crawlUrl, setCrawlUrl] = useState("");
  const [crawlPages, setCrawlPages] = useState(10);
  const [extractUrls, setExtractUrls] = useState("");
  const [extractPrompt, setExtractPrompt] = useState("");
  const [mapUrl, setMapUrl] = useState("");

  const execute = async () => {
    setLoading(true);
    setResponse(null);
    setError(null);

    try {
      let result: any;

      switch (activeTab) {
        case "search":
          if (!searchQuery.trim()) throw new Error("Query is required");
          result = await tools.search(searchQuery, searchLimit);
          break;
        case "scrape":
          if (!scrapeUrl.trim()) throw new Error("URL is required");
          result = await tools.scrape(scrapeUrl);
          break;
        case "crawl":
          if (!crawlUrl.trim()) throw new Error("URL is required");
          result = await tools.crawl(crawlUrl, crawlPages);
          break;
        case "extract":
          if (!extractUrls.trim()) throw new Error("At least one URL is required");
          const urls = extractUrls.split("\n").map((s) => s.trim()).filter(Boolean);
          result = await tools.extract(urls, extractPrompt);
          break;
        case "map":
          if (!mapUrl.trim()) throw new Error("URL is required");
          result = await tools.map(mapUrl);
          break;
      }

      setResponse(JSON.stringify(result, null, 2));
    } catch (err: any) {
      setError(err.message || "Request failed");
    } finally {
      setLoading(false);
    }
  };

  const renderForm = () => {
    switch (activeTab) {
      case "search":
        return (
          <>
            <div style={{ marginBottom: "12px" }}>
              <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#374151", marginBottom: "4px" }}>Query</label>
              <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Natural language search query..." style={inputStyle} />
            </div>
            <div style={{ marginBottom: "12px" }}>
              <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#374151", marginBottom: "4px" }}>Limit</label>
              <input type="number" value={searchLimit} onChange={(e) => setSearchLimit(Number(e.target.value))} min={1} max={20} style={{ ...inputStyle, width: "100px" }} />
            </div>
          </>
        );
      case "scrape":
        return (
          <div style={{ marginBottom: "12px" }}>
            <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#374151", marginBottom: "4px" }}>URL</label>
            <input type="url" value={scrapeUrl} onChange={(e) => setScrapeUrl(e.target.value)} placeholder="https://example.com" style={inputStyle} />
          </div>
        );
      case "crawl":
        return (
          <>
            <div style={{ marginBottom: "12px" }}>
              <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#374151", marginBottom: "4px" }}>Starting URL</label>
              <input type="url" value={crawlUrl} onChange={(e) => setCrawlUrl(e.target.value)} placeholder="https://example.com" style={inputStyle} />
            </div>
            <div style={{ marginBottom: "12px" }}>
              <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#374151", marginBottom: "4px" }}>Max Pages</label>
              <input type="number" value={crawlPages} onChange={(e) => setCrawlPages(Number(e.target.value))} min={1} max={100} style={{ ...inputStyle, width: "100px" }} />
            </div>
          </>
        );
      case "extract":
        return (
          <>
            <div style={{ marginBottom: "12px" }}>
              <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#374151", marginBottom: "4px" }}>URLs (one per line)</label>
              <textarea value={extractUrls} onChange={(e) => setExtractUrls(e.target.value)} placeholder="https://example.com/page1&#10;https://example.com/page2" rows={3} style={{ ...inputStyle, resize: "vertical", fontFamily: "monospace" }} />
            </div>
            <div style={{ marginBottom: "12px" }}>
              <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#374151", marginBottom: "4px" }}>Extraction Prompt</label>
              <textarea value={extractPrompt} onChange={(e) => setExtractPrompt(e.target.value)} placeholder="Describe what data to extract..." rows={2} style={{ ...inputStyle, resize: "vertical" }} />
            </div>
          </>
        );
      case "map":
        return (
          <div style={{ marginBottom: "12px" }}>
            <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#374151", marginBottom: "4px" }}>URL</label>
            <input type="url" value={mapUrl} onChange={(e) => setMapUrl(e.target.value)} placeholder="https://example.com" style={inputStyle} />
          </div>
        );
    }
  };

  return (
    <div style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
      <h1 style={{ fontSize: "22px", fontWeight: 700, margin: "0 0 4px", color: "#111" }}>Playground</h1>
      <p style={{ fontSize: "14px", color: "#888", margin: "0 0 20px" }}>
        Test the API endpoints interactively
      </p>

      {/* Tabs */}
      <div style={{ display: "flex", gap: "4px", marginBottom: "20px" }}>
        {tabs.map((tab) => (
          <button
            key={tab.name}
            onClick={() => {
              setActiveTab(tab.name);
              setResponse(null);
              setError(null);
            }}
            style={{
              padding: "8px 18px",
              background: activeTab === tab.name ? "#4f46e5" : "#fff",
              color: activeTab === tab.name ? "#fff" : "#374151",
              border: activeTab === tab.name ? "none" : "1px solid #d1d5db",
              borderRadius: "8px",
              fontSize: "13px",
              fontWeight: 600,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "6px",
              transition: "all 0.15s",
            }}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      <div
        style={{
          background: "#fff",
          borderRadius: "12px",
          padding: "20px 24px",
          boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
          marginBottom: "16px",
        }}
      >
        {renderForm()}

        <button
          onClick={execute}
          disabled={loading}
          style={{
            padding: "10px 24px",
            background: loading ? "#9ca3af" : "#059669",
            color: "#fff",
            border: "none",
            borderRadius: "8px",
            fontSize: "13px",
            fontWeight: 600,
            cursor: loading ? "not-allowed" : "pointer",
            marginTop: "8px",
          }}
        >
          {loading ? "Executing..." : "▶ Execute"}
        </button>
      </div>

      {/* Response */}
      {error && (
        <div
          style={{
            background: "#fef2f2",
            border: "1px solid #fecaca",
            borderRadius: "12px",
            padding: "16px 20px",
            color: "#dc2626",
            fontSize: "13px",
            fontFamily: "monospace",
            whiteSpace: "pre-wrap",
          }}
        >
          ❌ {error}
        </div>
      )}

      {response && (
        <div
          style={{
            background: "#1a1a2e",
            borderRadius: "12px",
            padding: "20px 24px",
            overflow: "auto",
            maxHeight: "500px",
          }}
        >
          <div
            style={{
              fontSize: "12px",
              color: "#6b7280",
              marginBottom: "8px",
              fontFamily: "monospace",
            }}
          >
            Response (JSON):
          </div>
          <pre
            style={{
              margin: 0,
              fontSize: "12px",
              color: "#e0e0e0",
              fontFamily: "monospace",
              whiteSpace: "pre-wrap",
              lineHeight: 1.5,
            }}
          >
            {response}
          </pre>
        </div>
      )}
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "10px 14px",
  border: "1px solid #d1d5db",
  borderRadius: "8px",
  fontSize: "14px",
  outline: "none",
  boxSizing: "border-box",
};
