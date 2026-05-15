import { useEffect, useState } from "react";
import {
  Title,
  Text,
  Paper,
  Group,
  Badge,
  Button,
  Stack,
  TextInput,
  Switch,
  Modal,
  Alert,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { notifications } from "@mantine/notifications";
import { IconPlus, IconTrash, IconLink } from "@tabler/icons-react";

interface WebhookItem {
  id: number;
  url: string;
  events: string[];
  is_active: boolean;
  created_at: string;
  last_triggered_at: string | null;
  last_triggered_status: number | null;
}

export default function Webhooks() {
  const [hooks, setHooks] = useState<WebhookItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [opened, { open, close }] = useDisclosure(false);
  const [newUrl, setNewUrl] = useState("");
  const [newEvents, setNewEvents] = useState("job.completed");
  const [secretInfo, setSecretInfo] = useState<string | null>(null);

  const token = () => localStorage.getItem("goozfire_token");

  const loadHooks = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/v1/webhooks", {
        headers: { Authorization: `Bearer ${token()}` },
      });
      const data = await res.json();
      setHooks(data.webhooks || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHooks();
  }, []);

  const handleCreate = async () => {
    if (!newUrl.trim()) return;
    const events = newEvents.split(",").map((e) => e.trim()).filter(Boolean);
    try {
      const res = await fetch("/api/v1/webhooks", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token()}` },
        body: JSON.stringify({ url: newUrl.trim(), events }),
      });
      const data = await res.json();
      if (data.success) {
        setSecretInfo(`Webhook created! Secret: ${data.webhook.secret}`);
        setNewUrl("");
        close();
        notifications.show({ title: "Webhook Created", message: "Events will be sent to your URL", color: "green" });
        loadHooks();
      } else {
        notifications.show({ title: "Error", message: data.error, color: "red" });
      }
    } catch (err: any) {
      notifications.show({ title: "Error", message: err.message, color: "red" });
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await fetch(`/api/v1/webhooks/${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${token()}` } });
      notifications.show({ title: "Deleted", message: "Webhook removed", color: "orange" });
      loadHooks();
    } catch (err: any) {
      notifications.show({ title: "Error", message: err.message, color: "red" });
    }
  };

  const handleToggle = async (hook: WebhookItem) => {
    try {
      await fetch(`/api/v1/webhooks/${hook.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token()}` },
        body: JSON.stringify({ is_active: !hook.is_active }),
      });
      loadHooks();
    } catch (err: any) {
      notifications.show({ title: "Error", message: err.message, color: "red" });
    }
  };

  return (
    <Stack gap="lg">
      <Group justify="space-between">
        <div>
          <Title order={2}>Webhooks</Title>
          <Text c="dimmed" size="sm">Receive event notifications via HTTP callbacks</Text>
        </div>
        <Button leftSection={<IconPlus size={16} />} onClick={open}>
          Add Webhook
        </Button>
      </Group>

      {secretInfo && (
        <Alert title="Webhook Created" color="yellow" withCloseButton onClose={() => setSecretInfo(null)}>
          <Text size="sm">{secretInfo}</Text>
        </Alert>
      )}

      <Modal opened={opened} onClose={close} title="Add Webhook" centered>
        <Stack gap="md">
          <TextInput label="Webhook URL" value={newUrl} onChange={(e) => setNewUrl(e.target.value)} placeholder="https://example.com/webhook" required />
          <TextInput label="Events (comma-separated)" value={newEvents} onChange={(e) => setNewEvents(e.target.value)} placeholder="job.completed, job.failed" />
          <Text size="xs" c="dimmed">Options: job.completed, job.failed, job.progress, crawl.completed</Text>
          <Group justify="flex-end">
            <Button variant="default" onClick={close}>Cancel</Button>
            <Button onClick={handleCreate}>Create</Button>
          </Group>
        </Stack>
      </Modal>

      {loading ? (
        <Text c="dimmed">Loading...</Text>
      ) : hooks.length === 0 ? (
        <Paper p="xl" ta="center" radius="md">
          <IconLink size={40} stroke={1} style={{ opacity: 0.3 }} />
          <Text c="dimmed" mt="sm">No webhooks configured.</Text>
        </Paper>
      ) : (
        <Stack gap="sm">
          {hooks.map((hook) => (
            <Paper key={hook.id} p="md" radius="md">
              <Group justify="space-between" wrap="nowrap">
                <div style={{ flex: 1, minWidth: 0 }}>
                  <Text fw={500} size="sm" truncate>{hook.url}</Text>
                  <Group gap="xs" mt={4}>
                    {hook.events.map((e) => (
                      <Badge key={e} variant="light" size="sm" color="indigo">
                        {e}
                      </Badge>
                    ))}
                    <Text size="xs" c="dimmed">· Created {new Date(hook.created_at).toLocaleDateString()}</Text>
                    {hook.last_triggered_at && (
                      <Text size="xs" c="dimmed">
                        · Last: {new Date(hook.last_triggered_at).toLocaleString()} ({hook.last_triggered_status})
                      </Text>
                    )}
                  </Group>
                </div>
                <Group gap="xs" wrap="nowrap">
                  <Switch
                    checked={hook.is_active}
                    onChange={() => handleToggle(hook)}
                    label={hook.is_active ? "Active" : "Paused"}
                    size="sm"
                  />
                  <Button
                    variant="light"
                    color="red"
                    size="compact-sm"
                    onClick={() => handleDelete(hook.id)}
                  >
                    <IconTrash size={14} />
                  </Button>
                </Group>
              </Group>
            </Paper>
          ))}
        </Stack>
      )}
    </Stack>
  );
}
