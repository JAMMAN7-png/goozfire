import { useEffect, useState } from "react";
import {
  Title, Text, Paper, Group, Badge, Button, Stack, TextInput, Switch,
  Modal, Alert, ThemeIcon, Card, ActionIcon, CopyButton, Code, Tooltip,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { notifications } from "@mantine/notifications";
import { IconPlus, IconTrash, IconLink, IconCopy, IconCheck, IconEye } from "@tabler/icons-react";

interface WebhookItem {
  id: number; url: string; events: string[]; is_active: boolean;
  created_at: string; last_triggered_at: string | null; last_triggered_status: number | null;
}

const dateFormatter = new Intl.DateTimeFormat(undefined, {
  year: "numeric", month: "short", day: "numeric",
  hour: "2-digit", minute: "2-digit",
});

const dateOnlyFormatter = new Intl.DateTimeFormat(undefined, {
  year: "numeric", month: "short", day: "numeric",
});

function formatDate(dateStr: string): string {
  return dateOnlyFormatter.format(new Date(dateStr));
}

function formatDateTime(dateStr: string): string {
  return dateFormatter.format(new Date(dateStr));
}

export default function Webhooks() {
  const [hooks, setHooks] = useState<WebhookItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [opened, { open, close }] = useDisclosure(false);
  const [newUrl, setNewUrl] = useState("");
  const [newEvents, setNewEvents] = useState("job.completed");
  const [secretInfo, setSecretInfo] = useState<string | null>(null);
  const [orWebhook, setOrWebhook] = useState("");

  const token = () => localStorage.getItem("goozfire_token");

  const loadHooks = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/v1/webhooks", { headers: { Authorization: `Bearer ${token()}` } });
      const data = await res.json();
      setHooks(data.webhooks || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { loadHooks(); }, []);

  // Load OpenRouter webhook from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("goozfire_or_webhook");
    if (saved) setOrWebhook(saved);
  }, []);

  const saveOrWebhook = () => {
    localStorage.setItem("goozfire_or_webhook", orWebhook);
    notifications.show({ title: "Webhook Saved", message: "OpenRouter observability webhook destination updated", color: "green" });
  };

  const handleCreate = async () => {
    if (!newUrl.trim()) return;
    const events = newEvents.split(",").map(e => e.trim()).filter(Boolean);
    try {
      const res = await fetch("/api/v1/webhooks", {
        method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token()}` },
        body: JSON.stringify({ url: newUrl.trim(), events }),
      });
      const data = await res.json();
      if (data.success) {
        setSecretInfo(`Webhook created! Secret: ${data.webhook.secret}`);
        setNewUrl(""); close();
        notifications.show({ title: "Webhook Created", message: "Events will be sent to your URL", color: "green" });
        loadHooks();
      } else { notifications.show({ title: "Error", message: data.error, color: "red" }); }
    } catch (err: any) { notifications.show({ title: "Error", message: err.message, color: "red" }); }
  };

  const handleDelete = async (id: number) => {
    try {
      await fetch(`/api/v1/webhooks/${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${token()}` } });
      notifications.show({ title: "Deleted", message: "Webhook removed", color: "orange" });
      loadHooks();
    } catch (err: any) { notifications.show({ title: "Error", message: err.message, color: "red" }); }
  };

  const handleToggle = async (hook: WebhookItem) => {
    try {
      await fetch(`/api/v1/webhooks/${hook.id}`, {
        method: "PUT", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token()}` },
        body: JSON.stringify({ is_active: !hook.is_active }),
      });
      loadHooks();
    } catch (err: any) { notifications.show({ title: "Error", message: err.message, color: "red" }); }
  };

  return (
    <Stack gap="lg">
      <style>{`
        .webhook-card {
          transition: transform 0.2s, box-shadow 0.2s;
        }
        .webhook-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
        }
        @media (prefers-reduced-motion: reduce) {
          .webhook-card { transition: none; }
          .webhook-card:hover { transform: none; box-shadow: none; }
        }
      `}</style>
      <Title order={2} style={{ background: "linear-gradient(135deg, #667eea, #764ba2)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
        Webhooks
      </Title>
      <Text c="dimmed" size="sm">Receive event notifications via HTTP callbacks</Text>

      {/* OpenRouter Observability Webhook */}
      <Card padding="lg" radius="lg" withBorder>
        <Group gap="sm" mb="sm">
          <ThemeIcon variant="gradient" gradient={{ from: "orange", to: "red" }} size="lg" radius="lg">
            <IconEye size={18} />
          </ThemeIcon>
          <div>
            <Text fw={600} size="sm">OpenRouter Observability Webhook</Text>
            <Text size="xs" c="dimmed">Send real-time LLM logs to your endpoint via OpenRouter webhooks</Text>
          </div>
        </Group>
        <Group gap="sm">
          <TextInput
            autoComplete="off"
            placeholder="https://your-server.com/webhook/openrouter"
            value={orWebhook}
            onChange={e => setOrWebhook(e.target.value)}
            style={{ flex: 1 }}
          />
          <Button variant="gradient" gradient={{ from: "orange", to: "red" }} onClick={saveOrWebhook}>
            Save
          </Button>
        </Group>
        <Text size="xs" c="dimmed" mt="xs">
          Set this URL in your OpenRouter dashboard → Webhooks to receive observability events.
          Goozfire will forward them to your registered webhooks.
        </Text>
      </Card>

      <Group justify="space-between">
        <Text fw={600} size="sm">Your Webhooks</Text>
        <Button leftSection={<IconPlus size={16} />} variant="gradient" gradient={{ from: "indigo", to: "cyan" }} onClick={open}>
          Add Webhook
        </Button>
      </Group>

      {secretInfo && (
        <Alert title="Webhook Created" color="yellow" withCloseButton onClose={() => setSecretInfo(null)} aria-live="polite">
          <Text size="sm">{secretInfo}</Text>
        </Alert>
      )}

      <Modal opened={opened} onClose={close} title="Add Webhook" centered>
        <Stack gap="md">
          <TextInput label="Webhook URL" value={newUrl} onChange={e => setNewUrl(e.target.value)} placeholder="https://example.com/webhook" required autoComplete="off"
            onKeyDown={e => e.key === "Enter" && handleCreate()} />
          <TextInput label="Events (comma-separated)" value={newEvents} onChange={e => setNewEvents(e.target.value)} placeholder="job.completed, job.failed" autoComplete="off" />
          <Text size="xs" c="dimmed">Options: job.completed, job.failed, job.progress, crawl.completed</Text>
          <Group justify="flex-end">
            <Button variant="default" onClick={close}>Cancel</Button>
            <Button onClick={handleCreate}>Create</Button>
          </Group>
        </Stack>
      </Modal>

      {loading ? (
        <Text c="dimmed" aria-live="polite">Loading jobs\u2026</Text>
      ) : hooks.length === 0 ? (
        <Paper p="xl" ta="center" radius="md">
          <IconLink size={40} stroke={1} style={{ opacity: 0.3 }} />
          <Text c="dimmed" mt="sm">No webhooks configured.</Text>
        </Paper>
      ) : (
        <Stack gap="sm">
          {hooks.map(hook => (
            <Card key={hook.id} padding="lg" radius="lg" withBorder className="webhook-card">
              <Group justify="space-between" wrap="nowrap">
                <div style={{ flex: 1, minWidth: 0 }}>
                  <Group gap="xs" mb={4}>
                    <ThemeIcon variant="gradient" gradient={{ from: "indigo", to: "cyan" }} size="sm" radius="xl">
                      <IconLink size={12} />
                    </ThemeIcon>
                    <Text fw={500} size="sm" truncate>{hook.url}</Text>
                  </Group>
                  <Group gap="xs">
                    {hook.events.map(e => <Badge key={e} variant="light" size="sm" color="indigo">{e}</Badge>)}
                    <Text size="xs" c="dimmed">· {formatDate(hook.created_at)}</Text>
                    {hook.last_triggered_at && (
                      <Text size="xs" c="dimmed" style={{ fontVariantNumeric: "tabular-nums" }}>
                        · Last: {formatDateTime(hook.last_triggered_at)} ({hook.last_triggered_status})
                      </Text>
                    )}
                  </Group>
                </div>
                <Group gap="xs" wrap="nowrap">
                  <Switch checked={hook.is_active} onChange={() => handleToggle(hook)}
                    label={hook.is_active ? "Active" : "Paused"} size="sm" />
                  <ActionIcon variant="light" color="red" onClick={() => handleDelete(hook.id)} aria-label="Delete webhook">
                    <IconTrash size={14} />
                  </ActionIcon>
                </Group>
              </Group>
            </Card>
          ))}
        </Stack>
      )}
    </Stack>
  );
}
