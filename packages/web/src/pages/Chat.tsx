import { useEffect, useState, useRef } from "react";
import {
  Title, Text, Paper, Stack, Group, Textarea, Button, MultiSelect, Badge,
  ScrollArea, Loader, ActionIcon, ThemeIcon, Avatar, Card,
} from "@mantine/core";
import { IconSend, IconTrash, IconMessage, IconRobot, IconUser } from "@tabler/icons-react";

interface Message { role: "user" | "assistant" | "system"; content: string; model?: string; }
interface ModelOption { value: string; label: string; }

const DEFAULT_MODELS = ["openai/gpt-4o-mini", "anthropic/claude-3.5-haiku", "google/gemini-2.5-flash-preview", "meta-llama/llama-3.2-3b-instruct"];

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
  const viewport = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const token = localStorage.getItem("goozfire_token");
    fetch("/api/v1/chat/models", { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json()).then(data => {
        setModelOptions((data?.data || []).slice(0, 50).map((m: any) => ({ value: m.id, label: m.name || m.id })));
      }).catch(() => {});
  }, []);

  useEffect(() => {
    if (viewport.current) {
      const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
      viewport.current.scrollTo({ top: viewport.current.scrollHeight, behavior: mq.matches ? "auto" : "smooth" });
    }
  }, [messages, responses]);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;
    const text = input.trim();
    const userMsg: Message = { role: "user", content: text };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    // Build chat history from current messages + new message
    const history = [...messages, userMsg].map(m => ({ role: m.role, content: m.content }));

    try {
      const token = localStorage.getItem("goozfire_token");
      for (const model of models) {
        setStreaming(prev => ({ ...prev, [model]: true }));
        setResponses(prev => ({ ...prev, [model]: "" }));
        try {
          const res = await fetch("/api/v1/chat/completions", {
            method: "POST",
            headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
            body: JSON.stringify({ model, messages: history, stream: false, max_tokens: 1024 }),
          });
          let content = "No response";
          try {
            const data = await res.json();
            content = data?.choices?.[0]?.message?.content || data?.error || JSON.stringify(data);
          } catch {
            const text = await res.text().catch(() => "");
            content = `API error (${res.status}): ${text.substring(0, 300)}`;
          }
          setResponses(prev => ({ ...prev, [model]: content }));
        } catch (err: any) {
          setResponses(prev => ({ ...prev, [model]: `Network error: ${err?.message || "Unknown error"}` }));
        } finally {
          setStreaming(prev => ({ ...prev, [model]: false }));
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const clearChat = () => {
    setMessages([{ role: "system", content: "You are a helpful AI assistant integrated with Goozfire's search and scraping capabilities." }]);
    setResponses({});
  };

  const userMessages = messages.filter(m => m.role !== "system");
  const hasResponses = Object.keys(responses).length > 0 || loading;

  return (
    <Stack gap="lg" h="calc(100vh - 120px)">
      <Group justify="space-between">
        <div>
          <Title order={2} style={{ background: "linear-gradient(135deg, #667eea, #764ba2)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            Chat
          </Title>
          <Text c="dimmed" size="sm">Chat with multiple LLM models simultaneously</Text>
        </div>
        <Group>
          <MultiSelect data={modelOptions.slice(0, 30)} value={models} onChange={setModels}
            placeholder="Select models" w={300} maxValues={8} searchable clearable />
          <ActionIcon variant="light" color="red" onClick={clearChat} aria-label="Clear chat"><IconTrash size={16} /></ActionIcon>
        </Group>
      </Group>

      <Card padding={0} radius="lg" withBorder style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <ScrollArea p="md" style={{ flex: 1 }} viewportRef={viewport}>
          <Stack gap="md" p="md" aria-live="polite">
            {userMessages.length === 0 && !hasResponses && (
              <Stack gap="sm" align="center" py="xl">
                <IconMessage size={48} stroke={1} style={{ opacity: 0.3 }} />
                <Text c="dimmed" ta="center">No messages yet. Type a message below to start a conversation.</Text>
              </Stack>
            )}
            {userMessages.map((msg, i) => (
              <Group key={i} gap="sm" justify={msg.role === "user" ? "flex-end" : "flex-start"} align="flex-end">
                {msg.role === "assistant" && <Avatar size="sm" radius="xl" color="grape"><IconRobot size={16} /></Avatar>}
                <Paper p="sm" radius="lg" style={{
                  maxWidth: "75%",
                  background: msg.role === "user"
                    ? "linear-gradient(135deg, #667eea, #764ba2)"
                    : "var(--mantine-color-dark-5)",
                  color: msg.role === "user" ? "#fff" : undefined,
                }}>
                  <Badge size="xs" variant="light" color={msg.role === "user" ? "white" : "gray"} mb={4}
                    style={{ opacity: 0.8, color: msg.role === "user" ? "rgba(255,255,255,0.9)" : undefined }}>
                    {msg.role === "user" ? "You" : "Assistant"}
                  </Badge>
                  <Text size="sm" style={{ whiteSpace: "pre-wrap" }}>{msg.content || ''}</Text>
                </Paper>
                {msg.role === "user" && <Avatar size="sm" radius="xl" color="indigo"><IconUser size={16} /></Avatar>}
              </Group>
            ))}
            {models.map(model => {
              const resp = responses[model]; const isStreaming = streaming[model];
              if (!resp && !isStreaming) return null;
              return (
                <Group key={model} gap="sm" align="flex-end">
                  <Avatar size="sm" radius="xl" color="teal"><IconRobot size={16} /></Avatar>
                  <Paper p="sm" radius="lg" style={{ maxWidth: "80%", background: "var(--mantine-color-dark-6)" }}>
                    <Group gap="xs" mb={4} style={{ minWidth: 0 }}>
                      <Badge size="sm" variant="gradient" gradient={{ from: "teal", to: "cyan" }}
                        style={{ maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {model?.split?.("/")?.pop() || ''}
                      </Badge>
                      {isStreaming && <Loader size="xs" />}
                    </Group>
                    <Text size="sm" style={{ whiteSpace: "pre-wrap" }}>{resp || "Thinking\u2026"}</Text>
                  </Paper>
                </Group>
              );
            })}
            {loading && models.length > 0 && Object.keys(responses).length === 0 && (
              <Group justify="center" py="xl"><Loader type="dots" /></Group>
            )}
          </Stack>
        </ScrollArea>

        <Paper p="sm" radius={0} withBorder style={{ borderLeft: 0, borderRight: 0, borderBottom: 0,
          background: "linear-gradient(0deg, var(--mantine-color-dark-7), var(--mantine-color-dark-6))" }}>
          <form onSubmit={e => { e.preventDefault(); sendMessage(); }}>
            <Group gap="sm" align="flex-end">
              <Textarea value={input} onChange={e => setInput(e.target.value)}
                placeholder="Type your message..." style={{ flex: 1 }} minRows={1} maxRows={4} autosize
                disabled={loading} autoComplete="off"
                onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }} />
              <Button type="submit" loading={loading} loaderProps={{ type: "dots" }}
                variant="gradient" gradient={{ from: "indigo", to: "cyan" }}>
                <IconSend size={16} />
              </Button>
            </Group>
          </form>
        </Paper>
      </Card>
    </Stack>
  );
}
