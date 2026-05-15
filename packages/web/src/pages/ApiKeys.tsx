import { useEffect, useState } from "react";
import {
  Title,
  Button,
  Table,
  Paper,
  Text,
  Group,
  Stack,
  Modal,
  TextInput,
  Code,
  Badge,
  ActionIcon,
  Tooltip,
  CopyButton,
  Alert,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { notifications } from "@mantine/notifications";
import {
  IconPlus,
  IconTrash,
  IconCopy,
  IconCheck,
  IconKey,
} from "@tabler/icons-react";
import { apiKeys as apiKeysClient } from "../api/client";

interface ApiKeyItem {
  id: number;
  name: string;
  key_prefix: string;
  key_last_chars: string;
  created_at: string;
  last_used_at: string | null;
  is_active: number;
}

export default function ApiKeys() {
  const [keys, setKeys] = useState<ApiKeyItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [opened, { open, close }] = useDisclosure(false);
  const [newKeyName, setNewKeyName] = useState("");
  const [createdKey, setCreatedKey] = useState<string | null>(null);

  const loadKeys = () => {
    setLoading(true);
    apiKeysClient
      .list()
      .then((res) => setKeys(res.keys || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadKeys();
  }, []);

  const handleCreate = async () => {
    if (!newKeyName.trim()) return;
    try {
      const res = await apiKeysClient.create(newKeyName.trim());
      setCreatedKey(res.key);
      setNewKeyName("");
      close();
      notifications.show({
        title: "API Key Created",
        message: "Copy the key now — you won't see it again!",
        color: "green",
      });
      loadKeys();
    } catch (err: any) {
      notifications.show({
        title: "Error",
        message: err.message || "Failed to create key",
        color: "red",
      });
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await apiKeysClient.delete(id);
      notifications.show({
        title: "Key Revoked",
        message: "API key has been revoked",
        color: "orange",
      });
      loadKeys();
    } catch (err: any) {
      notifications.show({
        title: "Error",
        message: err.message || "Failed to delete key",
        color: "red",
      });
    }
  };

  return (
    <Stack gap="lg">
      <Group justify="space-between">
        <div>
          <Title order={2}>API Keys</Title>
          <Text c="dimmed" size="sm">
            Manage your API keys for programmatic access
          </Text>
        </div>
        <Button leftSection={<IconPlus size={16} />} onClick={open}>
          New Key
        </Button>
      </Group>

      {createdKey && (
        <Alert
          icon={<IconKey size={16} />}
          color="yellow"
          title="API Key Created — Copy it now!"
          withCloseButton
          onClose={() => setCreatedKey(null)}
        >
          <Text size="sm" mb="xs">
            You won't be able to see this key again. Store it securely.
          </Text>
          <Group>
            <Code block style={{ flex: 1 }}>
              {createdKey}
            </Code>
            <CopyButton value={createdKey}>
              {({ copied, copy }) => (
                <Button
                  size="compact-sm"
                  color={copied ? "teal" : "indigo"}
                  onClick={copy}
                  leftSection={copied ? <IconCheck size={14} /> : <IconCopy size={14} />}
                >
                  {copied ? "Copied" : "Copy"}
                </Button>
              )}
            </CopyButton>
          </Group>
        </Alert>
      )}

      <Modal opened={opened} onClose={close} title="Create API Key" centered>
        <Stack gap="md">
          <TextInput
            label="Key Name"
            placeholder="e.g., Production API"
            value={newKeyName}
            onChange={(e) => setNewKeyName(e.target.value)}
            data-autofocus
          />
          <Group justify="flex-end">
            <Button variant="default" onClick={close}>
              Cancel
            </Button>
            <Button onClick={handleCreate}>Create Key</Button>
          </Group>
        </Stack>
      </Modal>

      {loading ? (
        <Text c="dimmed">Loading...</Text>
      ) : keys.length === 0 ? (
        <Paper p="xl" ta="center" radius="md">
          <IconKey size={40} stroke={1} style={{ opacity: 0.3 }} />
          <Text c="dimmed" mt="sm">
            No API keys yet. Create one to get started.
          </Text>
        </Paper>
      ) : (
        <Paper radius="md" withBorder>
          <Table>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Name</Table.Th>
                <Table.Th>Key</Table.Th>
                <Table.Th>Created</Table.Th>
                <Table.Th>Last Used</Table.Th>
                <Table.Th>Status</Table.Th>
                <Table.Th ta="right">Actions</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {keys.map((key) => (
                <Table.Tr key={key.id}>
                  <Table.Td fw={500}>{key.name}</Table.Td>
                  <Table.Td>
                    <Code>{key.key_prefix}••••{key.key_last_chars}</Code>
                  </Table.Td>
                  <Table.Td>{new Date(key.created_at).toLocaleDateString()}</Table.Td>
                  <Table.Td>
                    {key.last_used_at
                      ? new Date(key.last_used_at).toLocaleDateString()
                      : <Text c="dimmed" size="sm">Never</Text>}
                  </Table.Td>
                  <Table.Td>
                    <Badge
                      color={key.is_active ? "green" : "gray"}
                      variant="light"
                      size="sm"
                    >
                      {key.is_active ? "Active" : "Revoked"}
                    </Badge>
                  </Table.Td>
                  <Table.Td ta="right">
                    {key.is_active ? (
                      <Tooltip label="Revoke key">
                        <ActionIcon
                          color="red"
                          variant="light"
                          onClick={() => handleDelete(key.id)}
                        >
                          <IconTrash size={14} />
                        </ActionIcon>
                      </Tooltip>
                    ) : (
                      <Text c="dimmed" size="xs">
                        Revoked
                      </Text>
                    )}
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </Paper>
      )}
    </Stack>
  );
}
