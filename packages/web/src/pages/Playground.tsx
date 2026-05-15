import { useState } from "react";
import { Title, Text, Paper, Stack, TextInput, Textarea, NumberInput, Button, Tabs, Code, Group, Badge, ThemeIcon, Alert, Card } from "@mantine/core";
import { IconSearch, IconFileText, IconWorld, IconPuzzle, IconMap, IconPlayerPlay, IconAlertCircle, IconCheck } from "@tabler/icons-react";
import { tools } from "../api/client";

const GRADIENT = { from: "indigo", to: "cyan", deg: 45 };

const tabGradients: Record<string, { from: string; to: string; deg: number }> = {
  search: { from: "indigo", to: "cyan", deg: 45 },
  scrape: { from: "teal", to: "green", deg: 45 },
  crawl: { from: "grape", to: "pink", deg: 45 },
  extract: { from: "indigo", to: "cyan", deg: 45 },
  map: { from: "teal", to: "green", deg: 45 },
};

type ToolName = "search" | "scrape" | "crawl" | "extract" | "map";
interface TabConfig { name: ToolName; label: string; icon: React.ElementType; }
const tabs: TabConfig[] = [
  { name: "search", label: "Search", icon: IconSearch },
  { name: "scrape", label: "Scrape", icon: IconFileText },
  { name: "crawl", label: "Crawl", icon: IconWorld },
  { name: "extract", label: "Extract", icon: IconPuzzle },
  { name: "map", label: "Map", icon: IconMap },
];

export default function Playground() {
  const [activeTab, setActiveTab] = useState<string>("search");
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchLimit, setSearchLimit] = useState(5);
  const [scrapeUrl, setScrapeUrl] = useState("");
  const [crawlUrl, setCrawlUrl] = useState("");
  const [crawlPages, setCrawlPages] = useState(10);
  const [extractUrls, setExtractUrls] = useState("");
  const [extractPrompt, setExtractPrompt] = useState("");
  const [mapUrl, setMapUrl] = useState("");

  const execute = async () => {
    setLoading(true); setResponse(null); setError(null);
    try {
      let result: any; const tab = activeTab as ToolName;
      switch (tab) {
        case "search":
          if (!searchQuery.trim()) throw new Error("Query is required");
          result = await tools.search(searchQuery, searchLimit); break;
        case "scrape":
          if (!scrapeUrl.trim()) throw new Error("URL is required");
          result = await tools.scrape(scrapeUrl); break;
        case "crawl":
          if (!crawlUrl.trim()) throw new Error("URL is required");
          result = await tools.crawl(crawlUrl, crawlPages); break;
        case "extract":
          if (!extractUrls.trim()) throw new Error("At least one URL is required");
          const urls = extractUrls.split("\n").map(s => s.trim()).filter(Boolean);
          result = await tools.extract(urls, extractPrompt); break;
        case "map":
          if (!mapUrl.trim()) throw new Error("URL is required");
          result = await tools.map(mapUrl); break;
      }
      setResponse(JSON.stringify(result, null, 2));
    } catch (err: any) { setError(err.message || "Request failed"); }
    finally { setLoading(false); }
  };

  const renderForm = () => {
    switch (activeTab) {
      case "search":
        return <><TextInput autoComplete="off" label="Query" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Natural language search query..." required /><NumberInput autoComplete="off" label="Limit" value={searchLimit} onChange={v => setSearchLimit(Number(v)||5)} min={1} max={20} w={120} /></>;
      case "scrape":
        return <TextInput autoComplete="off" label="URL" value={scrapeUrl} onChange={e => setScrapeUrl(e.target.value)} placeholder="https://example.com" required />;
      case "crawl":
        return <><TextInput autoComplete="off" label="Starting URL" value={crawlUrl} onChange={e => setCrawlUrl(e.target.value)} placeholder="https://example.com" required /><NumberInput autoComplete="off" label="Max Pages" value={crawlPages} onChange={v => setCrawlPages(Number(v)||10)} min={1} max={100} w={120} /></>;
      case "extract":
        return <><Textarea autoComplete="off" label="URLs (one per line)" value={extractUrls} onChange={e => setExtractUrls(e.target.value)} placeholder="https://example.com/page1" rows={3} required /><Textarea autoComplete="off" label="Extraction Prompt" value={extractPrompt} onChange={e => setExtractPrompt(e.target.value)} placeholder="Describe what data to extract..." rows={2} /></>;
      case "map":
        return <TextInput autoComplete="off" label="URL" value={mapUrl} onChange={e => setMapUrl(e.target.value)} placeholder="https://example.com" required />;
    }
  };

  const currentGradient = tabGradients[activeTab] ?? GRADIENT;
  const ActiveIcon = tabs.find(t => t.name === activeTab)?.icon ?? IconPlayerPlay;

  return (
    <Stack gap="lg">
      <div>
        <Title order={2} style={{ background: "linear-gradient(135deg, #667eea, #764ba2)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Playground</Title>
        <Text c="dimmed" size="sm">Test the API endpoints interactively</Text>
      </div>
      <Tabs value={activeTab} onChange={v => setActiveTab(v || "search")} variant="pills">
        <Tabs.List mb="md">{tabs.map(tab => (
          <Tabs.Tab
            key={tab.name}
            value={tab.name}
            leftSection={<tab.icon size={16} />}
            style={(theme) => ({
              background: activeTab === tab.name
                ? `linear-gradient(${tabGradients[tab.name]?.deg ?? 45}deg, ${theme.colors[tabGradients[tab.name]?.from ?? 'indigo'][6]}, ${theme.colors[tabGradients[tab.name]?.to ?? 'cyan'][6]})`
                : undefined,
              color: activeTab === tab.name ? '#fff' : undefined,
            })}
          >
            {tab.label}
          </Tabs.Tab>
        ))}</Tabs.List>
        {tabs.map(tab => (
          <Tabs.Panel key={tab.name} value={tab.name}>
            <form onSubmit={e => { e.preventDefault(); execute(); }}>
              <Card padding="lg" radius="lg" withBorder mb="md">
                <Stack gap="md">
                  <Group gap="sm">
                    <ThemeIcon variant="gradient" gradient={tabGradients[tab.name] ?? GRADIENT} size="lg" radius="md">
                      <tab.icon size={20} />
                    </ThemeIcon>
                    <Text fw={600} size="lg">{tab.label}</Text>
                  </Group>
                  {tab.name === activeTab && renderForm()}
                  <Button
                    type="submit"
                    loading={loading}
                    loaderProps={{ type: "dots" }}
                    leftSection={<tab.icon size={16} />}
                    variant="gradient"
                    gradient={tabGradients[tab.name] ?? GRADIENT}
                  >
                    Execute
                  </Button>
                </Stack>
              </Card>
            </form>
          </Tabs.Panel>
        ))}
      </Tabs>
      {error && (
        <Alert icon={<IconAlertCircle size={18} />} color="red" variant="light" radius="lg" aria-live="polite">
          {error}
        </Alert>
      )}
      {response && (
        <Card padding="lg" radius="lg" withBorder aria-live="polite">
          <Group gap="xs" mb="sm">
            <ThemeIcon variant="gradient" gradient={{ from: "green", to: "teal", deg: 45 }} size="sm" radius="sm">
              <IconCheck size={14} />
            </ThemeIcon>
            <Badge color="green" variant="filled" size="sm">Response</Badge>
            <Text size="xs" c="dimmed">JSON</Text>
          </Group>
          <Code block style={{ background: "transparent", color: "#e0e0e0" }}>{response}</Code>
        </Card>
      )}
    </Stack>
  );
}
