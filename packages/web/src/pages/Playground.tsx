import { useState } from "react";
import {
  Title,
  Text,
  Paper,
  Stack,
  TextInput,
  Textarea,
  NumberInput,
  Button,
  Tabs,
  Code,
  Group,
  Badge,
} from "@mantine/core";
import { IconSearch, IconFileText, IconWorld, IconPuzzle, IconMap } from "@tabler/icons-react";
import { tools } from "../api/client";

type ToolName = "search" | "scrape" | "crawl" | "extract" | "map";

interface TabConfig {
  name: ToolName;
  label: string;
  icon: React.ElementType;
}

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

  // Form state
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
      const tab = activeTab as ToolName;

      switch (tab) {
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
            <TextInput label="Query" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Natural language search query..." required />
            <NumberInput label="Limit" value={searchLimit} onChange={(v) => setSearchLimit(Number(v) || 5)} min={1} max={20} w={120} />
          </>
        );
      case "scrape":
        return <TextInput label="URL" value={scrapeUrl} onChange={(e) => setScrapeUrl(e.target.value)} placeholder="https://example.com" required />;
      case "crawl":
        return (
          <>
            <TextInput label="Starting URL" value={crawlUrl} onChange={(e) => setCrawlUrl(e.target.value)} placeholder="https://example.com" required />
            <NumberInput label="Max Pages" value={crawlPages} onChange={(v) => setCrawlPages(Number(v) || 10)} min={1} max={100} w={120} />
          </>
        );
      case "extract":
        return (
          <>
            <Textarea label="URLs (one per line)" value={extractUrls} onChange={(e) => setExtractUrls(e.target.value)} placeholder="https://example.com/page1" rows={3} required />
            <Textarea label="Extraction Prompt" value={extractPrompt} onChange={(e) => setExtractPrompt(e.target.value)} placeholder="Describe what data to extract..." rows={2} />
          </>
        );
      case "map":
        return <TextInput label="URL" value={mapUrl} onChange={(e) => setMapUrl(e.target.value)} placeholder="https://example.com" required />;
    }
  };

  return (
    <Stack gap="lg">
      <div>
        <Title order={2}>Playground</Title>
        <Text c="dimmed" size="sm">Test the API endpoints interactively</Text>
      </div>

      <Tabs value={activeTab} onChange={(v) => setActiveTab(v || "search")}>
        <Tabs.List mb="md">
          {tabs.map((tab) => (
            <Tabs.Tab key={tab.name} value={tab.name} leftSection={<tab.icon size={16} />}>
              {tab.label}
            </Tabs.Tab>
          ))}
        </Tabs.List>

        {tabs.map((tab) => (
          <Tabs.Panel key={tab.name} value={tab.name}>
            <Paper p="md" radius="md" mb="md">
              <Stack gap="md">
                {tab.name === activeTab && renderForm()}
                <Button onClick={execute} loading={loading} loaderProps={{ type: "dots" }} leftSection={<tab.icon size={16} />}>
                  Execute
                </Button>
              </Stack>
            </Paper>
          </Tabs.Panel>
        ))}
      </Tabs>

      {error && (
        <Paper p="md" radius="md" bg="red" c="white">
          <Group gap="xs">
            <Badge color="red" variant="filled" size="sm">Error</Badge>
            <Text size="sm">{error}</Text>
          </Group>
        </Paper>
      )}

      {response && (
        <Paper p="md" radius="md" bg="dark">
          <Group gap="xs" mb="sm">
            <Badge color="green" variant="filled" size="sm">Response</Badge>
            <Text size="xs" c="dimmed">JSON</Text>
          </Group>
          <Code block style={{ background: "transparent", color: "#e0e0e0" }}>
            {response}
          </Code>
        </Paper>
      )}
    </Stack>
  );
}
