import { useEffect, useState } from "react";
import {
  Title, Button, Card, Paper, Text, Group, Stack, Modal, TextInput,
  Code, Badge, ActionIcon, Tooltip, CopyButton, Alert, ThemeIcon, SimpleGrid,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { notifications } from "@mantine/notifications";
import { IconPlus, IconTrash, IconCopy, IconCheck, IconKey } from "@tabler/icons-react";
import { apiKeys as apiKeysClient } from "../api/client";

interface ApiKeyItem {
  id: number; name: string; key_prefix: string; key_last_chars: string;
  created_at: string; last_used_at: string | null; is_active: number;
}

export default function ApiKeys() {
  const [keys, setKeys] = useState<ApiKeyItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [opened, { open, close }] = useDisclosure(false);
  const [newKeyName, setNewKeyName] = useState("");
  const [createdKey, setCreatedKey] = useState<string | null>(null);

  const loadKeys = () => {
    setLoading(true);
    apiKeysClient.list().then(res => setKeys(res.keys || [])).catch(console.error).finally(() => setLoading(false));
  };
  useEffect(() => { loadKeys(); }, []);

  const handleCreate = async () => {
    if (!newKeyName.trim()) return;
    try {
      const res = await apiKeysClient.create(newKeyName.trim());
      setCreatedKey(res.key); setNewKeyName(""); close();
      notifications.show({ title: "API Key Created", message: "Copy it now — you won't see it again!", color: "green" });
      loadKeys();
    } catch (err: any) {
      notifications.show({ title: "Error", message: err.message || "Failed", color: "red" });
    }
  };
  const handleDelete = async (id: number) => {
    try {
      await apiKeysClient.delete(id);
      notifications.show({ title: "Key Revoked", message: "API key revoked", color: "orange" });
      loadKeys();
    } catch (err: any) {
      notifications.show({ title: "Error", message: err.message || "Failed", color: "red" });
    }
  };

  return (
    <Stack gap="lg">
      <Group justify="space-between">
        <div>
          <Title order={2} style={{ background: "linear-gradient(135deg, #667eea, #764ba2)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>API Keys</Title>
          <Text c="dimmed" size="sm">Manage your API keys for programmatic access</Text>
        </div>
        <Button leftSection={<IconPlus size={16} />} variant="gradient" gradient={{ from: "indigo", to: "cyan" }} onClick={open}>New Key</Button>
      </Group>

      {createdKey && (
        <Alert icon={<IconKey size={16} />} color="yellow" title="API Key Created — Copy it now!" withCloseButton onClose={() => setCreatedKey(null)}>
          <Text size="sm" mb="xs">You won't see this key again. Store it securely.</Text>
          <Group>
            <Code block style={{ flex: 1 }}>{createdKey}</Code>
            <CopyButton value={createdKey}>
              {({ copied, copy }) => (
                <Button size="compact-sm" color={copied ? "teal" : "indigo"} onClick={copy}
                  leftSection={copied ? <IconCheck size={14} /> : <IconCopy size={14} />}>{copied ? "Copied" : "Copy"}</Button>
              )}
            </CopyButton>
          </Group>
        </Alert>
      )}

      <Modal opened={opened} onClose={close} title="Create API Key" centered>
        <Stack gap="md">
          <TextInput label="Key Name" placeholder="e.g., Production API" value={newKeyName}
            onChange={e => setNewKeyName(e.target.value)} data-autofocus
            onKeyDown={e => e.key === "Enter" && handleCreate()} />
          <Group justify="flex-end">
            <Button variant="default" onClick={close}>Cancel</Button>
            <Button onClick={handleCreate}>Create Key</Button>
          </Group>
        </Stack>
      </Modal>

      {loading ? <Text c="dimmed">Loading...</Text> : keys.length === 0 ? (
        <Paper p="xl" ta="center" radius="md"><IconKey size={40} stroke={1} style={{ opacity: 0.3 }} /><Text c="dimmed" mt="sm">No API keys yet.</Text></Paper>
      ) : (
        <SimpleGrid cols={{ base: 1, sm: 2 }}>
          {keys.map(key => (
            <Card key={key.id} padding="lg" radius="lg"
              style={{ transition: "transform 0.2s, box-shadow 0.2s" }}
              onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 8px 24px rgba(0,0,0,0.3)"; }}
              onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "none"; }}>
              <Group justify="space-between" mb="sm">
                <Group gap="sm">
                  <ThemeIcon variant="gradient" gradient={{ from: "indigo", to: "cyan" }} size="lg" radius="xl">
                    <IconKey size={16} />
                  </ThemeIcon>
                  <div>
                    <Text fw={600} size="sm">{key.name}</Text>
                    <Code>{key.key_prefix}••••{key.key_last_chars}</Code>
                  </div>
                </Group>
                <Badge color={key.is_active ? "green" : "gray"} variant="light">
                  {key.is_active ? "Active" : "Revoked"}
                </Badge>
              </Group>
              <Group gap="xs">
                <Text size="xs" c="dimmed">Created: {new Date(key.created_at).toLocaleDateString()}</Text>
                {key.last_used_at && <Text size="xs" c="dimmed">· Used: {new Date(key.last_used_at).toLocaleDateString()}</Text>}
              </Group>
              {key.is_active && (
                <Group justify="flex-end" mt="sm">
                  <ActionIcon color="red" variant="light" onClick={() => handleDelete(key.id)}><IconTrash size={14} /></ActionIcon>
                </Group>
              )}
            </Card>
          ))}
        </SimpleGrid>
      )}
    </Stack>
  );
}
