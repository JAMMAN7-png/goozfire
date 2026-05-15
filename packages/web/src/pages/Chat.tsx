import { useEffect, useState, useRef } from "react";
import {
  Title,
  Text,
  Paper,
  Stack,
  Group,
  Textarea,
  Button,
  Select,
  MultiSelect,
  Badge,
  ScrollArea,
  Card,
  ActionIcon,
  Menu,
  Kbd,
  Loader,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { IconSend, IconTrash, IconMessage, IconSettings } from "@tabler/icons-react";

interface Message {
  role: "user" | "assistant" | "system";
  content: string;
  model?: string;
}

interface ModelOption {
  value: string;
  label: string;
}

const DEFAULT_MODELS = [
  "openai/gpt-4o-mini",
  "anthropic/claude-3.5-haiku",
  "google/gemini-2.5-flash-preview",
  "meta-llama/llama-3.2-3b-instruct",
];

export default function Chat() {
  const [messages, setMessages] = useState<Message[]>([
    { role: "system", content: "You are a helpful AI assistant integrated with Goozfire's search and scraping capabilities." },
  ]);
  const [input, setInput] = useState("");
  const [models, setModels] = useState<string[]>(DEFAULT_MODELS);
  const [modelOptions, setModelOptions] = useState<ModelOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [streaming, setStreaming] = useState<Record<string, boolean>>({});
  const [responses, setResponses] = useState<Record<string, string>>({});
  const [activeModel, setActiveModel] = useState<string>(DEFAULT_MODELS[0]);
  const viewport = useRef<HTMLDivElement>(null);

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

  // Auto-scroll
  useEffect(() => {
    if (viewport.current) {
      viewport.current.scrollTo({ top: viewport.current.scrollHeight, behavior: "smooth" });
    }
  }, [messages, responses]);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;

    const userMsg: Message = { role: "user", content: input.trim() };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    const chatHistory = [...messages, userMsg].map((m) => ({
      role: m.role,
      content: m.content,
    }));

    // Send to each selected model
    for (const model of models) {
      setStreaming((prev) => ({ ...prev, [model]: true }));
      setResponses((prev) => ({ ...prev, [model]: "" }));

      try {
        const token = localStorage.getItem("goozfire_token");
        const res = await fetch("/api/v1/chat/completions", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({
            model,
            messages: chatHistory,
            stream: false,
          }),
        });
        const data = await res.json();
        const content = data?.choices?.[0]?.message?.content || data?.error || "No response";
        setResponses((prev) => ({ ...prev, [model]: content }));
      } catch (err: any) {
        setResponses((prev) => ({ ...prev, [model]: `Error: ${err.message}` }));
      } finally {
        setStreaming((prev) => ({ ...prev, [model]: false }));
      }
    }

    setLoading(false);
  };

  const clearChat = () => {
    setMessages([
      { role: "system", content: "You are a helpful AI assistant integrated with Goozfire's search and scraping capabilities." },
    ]);
    setResponses({});
  };

  return (
    <Stack gap="lg" h="calc(100vh - 120px)">
      <Group justify="space-between">
        <div>
          <Title order={2}>Chat</Title>
          <Text c="dimmed" size="sm">Chat with multiple LLM models simultaneously</Text>
        </div>
        <Group>
          <MultiSelect
            data={modelOptions.slice(0, 30)}
            value={models}
            onChange={setModels}
            placeholder="Select models"
            w={300}
            maxValues={8}
            searchable
            clearable
          />
          <ActionIcon variant="light" color="red" onClick={clearChat}>
            <IconTrash size={16} />
          </ActionIcon>
        </Group>
      </Group>

      <Paper radius="md" style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }} withBorder>
        <ScrollArea p="md" style={{ flex: 1 }} viewportRef={viewport}>
          <Stack gap="md">
            {messages
              .filter((m) => m.role !== "system")
              .map((msg, i) => (
                <Paper key={i} p="sm" radius="md" bg={msg.role === "user" ? "indigo" : "dark.5"} style={{ maxWidth: "80%", alignSelf: msg.role === "user" ? "flex-end" : "flex-start" }}>
                  <Group gap="xs" mb={4}>
                    <Badge size="sm" variant="light" color={msg.role === "user" ? "blue" : "gray"}>
                      {msg.role === "user" ? "You" : "Assistant"}
                    </Badge>
                  </Group>
                  <Text size="sm" style={{ whiteSpace: "pre-wrap" }}>{msg.content}</Text>
                </Paper>
              ))}

            {/* Model responses */}
            {models.map((model) => {
              const resp = responses[model];
              const isStreaming = streaming[model];
              if (!resp && !isStreaming) return null;
              return (
                <Paper key={model} p="sm" radius="md" bg="dark.5" style={{ maxWidth: "85%" }}>
                  <Group gap="xs" mb={4}>
                    <Badge size="sm" variant="light" color="teal">
                      {model.split("/").pop()}
                    </Badge>
                    {isStreaming && <Loader size="xs" />}
                  </Group>
                  <Text size="sm" style={{ whiteSpace: "pre-wrap" }}>
                    {resp || "Thinking..."}
                  </Text>
                </Paper>
              );
            })}

            {loading && models.length > 0 && Object.keys(responses).length === 0 && (
              <Group justify="center" py="xl">
                <Loader type="dots" />
              </Group>
            )}
          </Stack>
        </ScrollArea>

        <Paper p="sm" radius={0} withBorder style={{ borderLeft: 0, borderRight: 0, borderBottom: 0 }}>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              sendMessage();
            }}
          >
            <Group gap="sm" align="flex-end">
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Type your message..."
                style={{ flex: 1 }}
                minRows={1}
                maxRows={4}
                autosize
                disabled={loading}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage();
                  }
                }}
              />
              <Button type="submit" loading={loading} loaderProps={{ type: "dots" }} disabled={!input.trim()}>
                <IconSend size={16} />
              </Button>
            </Group>
          </form>
        </Paper>
      </Paper>
    </Stack>
  );
}
