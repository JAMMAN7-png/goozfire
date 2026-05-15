import { useState, useEffect, useRef } from "react";
import {
  Title,
  Text,
  Paper,
  Stack,
  Group,
  Textarea,
  ThemeIcon,
  Button,
  MultiSelect,
  Badge,
  ScrollArea,
  SimpleGrid,
  Loader,
  ActionIcon,
  Tooltip,
  Divider,
  Kbd,
} from "@mantine/core";
import { IconSend, IconTrash, IconFlame } from "@tabler/icons-react";

interface ModelOption {
  value: string;
  label: string;
}

const DEFAULT_FUSION_MODELS = [
  "openai/gpt-4o-mini",
  "anthropic/claude-3.5-haiku",
  "google/gemini-2.5-flash-preview",
  "meta-llama/llama-3.2-3b-instruct",
  "mistral/mistral-small-24b",
  "deepseek/deepseek-chat",
];

export default function Fusion() {
  const [modelOptions, setModelOptions] = useState<ModelOption[]>([]);
  const [selectedModels, setSelectedModels] = useState<string[]>(DEFAULT_FUSION_MODELS);
  const [prompt, setPrompt] = useState("");
  const [systemPrompt, setSystemPrompt] = useState("You are a helpful AI assistant. Provide clear, concise responses.");
  const [responses, setResponses] = useState<Record<string, { content: string; time: number; tokens: number }>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  // Load available models
  useEffect(() => {
    const token = localStorage.getItem("goozfire_token");
    fetch("/api/v1/chat/models", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((data) => {
        const models = (data?.data || []).slice(0, 50).map((m: any) => ({
          value: m.id,
          label: m.name || m.id,
        }));
        setModelOptions(models);
      })
      .catch(() => {});
  }, []);

  const runFusion = async () => {
    if (!prompt.trim() || selectedModels.length === 0) return;
    setLoading(true);
    setError(null);
    setResponses({});

    try {
      const token = localStorage.getItem("goozfire_token");
      const res = await fetch("/api/v1/chat/fusion", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          models: selectedModels,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: prompt.trim() },
          ],
          max_tokens: 1024,
        }),
      });

      let data: any;
      try {
        data = await res.json();
      } catch {
        const text = await res.text().catch(() => "");
        setError(`API returned ${res.status}: ${text.substring(0, 300)}`);
        return;
      }

      if (data.error) {
        setError(data.error);
      } else if (data.results) {
        const newResponses: Record<string, { content: string; time: number; tokens: number }> = {};
        for (const r of data.results) {
          if (r.error) {
            newResponses[r.model] = { content: `Error: ${r.error}`, time: 0, tokens: 0 };
          } else {
            const choice = r.data?.choices?.[0];
            newResponses[r.model] = {
              content: choice?.message?.content || r.data?.error || "No response",
              time: r.data?.usage?.total_time || 0,
              tokens: r.data?.usage?.total_tokens || 0,
            };
          }
        }
        setResponses(newResponses);
      } else {
        setError("No results returned from Fusion API. The response format may have changed.");
      }
    } catch (err: any) {
      setError(err?.message || "Network error. Check console for details.");
    } finally {
      setLoading(false);
    }
  };

  const getGridCols = () => {
    const n = selectedModels.length;
    if (n <= 2) return { base: 1, sm: 2 };
    if (n <= 4) return { base: 1, sm: 2, lg: 2 };
    return { base: 1, sm: 2, lg: Math.min(n, 4) };
  };

  return (
    <Stack gap="lg">
      <style>{`
        .fusion-result-card {
          transition: transform 0.2s;
          display: flex;
          flex-direction: column;
        }
        .fusion-result-card:hover {
          transform: translateY(-2px);
        }
        @media (prefers-reduced-motion: reduce) {
          .fusion-result-card {
            transition: none;
          }
          .fusion-result-card:hover {
            transform: none;
          }
        }
      `}</style>
      <Group justify="space-between">
        <Group>
          <ThemeIcon variant="gradient" gradient={{from:"orange",to:"red"}} size="xl" radius="md">
            <IconFlame size={24} />
          </ThemeIcon>
          <div>
            <Title order={2}>Fusion</Title>
            <Text c="dimmed" size="sm">
              Send the same prompt to up to 8 models at once — compare responses side by side
            </Text>
          </div>
        </Group>
        <Badge size="lg" variant="light" color="orange">
          <Group gap={4}>
            <IconFlame size={14} />
            <span>{selectedModels.length}/8 models</span>
          </Group>
        </Badge>
      </Group>

      <Paper p="md" radius="md" style={{ background: 'linear-gradient(135deg, var(--mantine-color-orange-8) 0%, var(--mantine-color-red-9) 100%)' }}>
        <form onSubmit={(e) => { e.preventDefault(); runFusion(); }} style={{ display: "contents" }}>
          <MultiSelect
            label="Models"
            data={modelOptions.slice(0, 40)}
            value={selectedModels}
            onChange={setSelectedModels}
            placeholder="Select 1-8 models"
            maxValues={8}
            searchable
            clearable
          />

          <Textarea
            label="System Prompt (optional)"
            value={systemPrompt}
            onChange={(e) => setSystemPrompt(e.target.value)}
            placeholder="You are a helpful AI assistant..."
            minRows={1}
            maxRows={3}
            autosize
            autoComplete="off"
          />

          <Textarea
            label="Prompt"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Enter your prompt here... Each model will respond to the same prompt."
            minRows={3}
            maxRows={6}
            autosize
            required
            autoComplete="off"
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                runFusion();
              }
            }}
          />

          <Group>
            <Button
              onClick={runFusion}
              loading={loading}
              loaderProps={{ type: "dots" }}
              leftSection={<IconSend size={16} />}
              disabled={!prompt.trim() || selectedModels.length === 0}
              size="lg"
              variant="gradient"
              gradient={{from:"orange",to:"red"}}
            >
              Run Fusion ({selectedModels.length} models)
            </Button>
            {Object.keys(responses).length > 0 && (
              <ActionIcon variant="light" color="red" onClick={() => setResponses({})} aria-label="Clear responses">
                <IconTrash size={16} />
              </ActionIcon>
            )}
          </Group>
        </form>
      </Paper>

      {error && (
        <Paper p="md" radius="md" bg="red" c="white">
          <Text size="sm">{error}</Text>
        </Paper>
      )}

      {loading && (
        <Paper p="xl" ta="center" radius="md">
          <Loader type="dots" size="lg" />
          <Text c="dimmed" mt="md">Running {selectedModels.length} models in parallel...</Text>
        </Paper>
      )}

      {Object.keys(responses).length > 0 && (
        <SimpleGrid cols={getGridCols()} spacing="md" ref={resultsRef}>
          {selectedModels.map((model) => {
            const resp = responses[model];
            if (!resp) return null;

            const modelName = model.split("/").pop() || model;
            const provider = model.split("/")[0] || "";

            return (
              <Paper key={model} p="md" radius="md" className="fusion-result-card">
                <Group justify="space-between" mb="sm">
                  <Group gap="xs" style={{ minWidth: 0 }}>
                    <Badge size="lg" variant="light" color="indigo"
                      style={{ maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {modelName}
                    </Badge>
                    <Text size="xs" c="dimmed">{provider}</Text>
                  </Group>
                  {resp.time > 0 && (
                    <Badge size="sm" variant="light" color="gray" style={{ flexShrink: 0 }}>
                      {resp.time}ms · {resp.tokens}tok
                    </Badge>
                  )}
                </Group>
                <Divider mb="sm" />
                <ScrollArea h={400} style={{ flex: 1 }}>
                  <Text size="sm" style={{ whiteSpace: "pre-wrap" }}>
                    {resp.content}
                  </Text>
                </ScrollArea>
              </Paper>
            );
          })}
        </SimpleGrid>
      )}

      {!loading && Object.keys(responses).length === 0 && (
        <Paper p="xl" ta="center" radius="md">
          <IconFlame size={48} stroke={1} style={{ opacity: 0.3 }} />
          <Text c="dimmed" mt="md">Select models, enter a prompt, and run Fusion to see responses side by side.</Text>
        </Paper>
      )}
    </Stack>
  );
}
