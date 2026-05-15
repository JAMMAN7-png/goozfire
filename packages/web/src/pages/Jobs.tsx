import { useEffect, useState } from "react";
import {
  Title,
  Text,
  Paper,
  Group,
  Badge,
  Table,
  Stack,
  Select,
  Skeleton,
} from "@mantine/core";
import { IconListDetails } from "@tabler/icons-react";

interface Job {
  id: number;
  type: string;
  status: string;
  progress: number;
  credits_used: number;
  created_at: string;
  started_at: string | null;
  completed_at: string | null;
  error: string | null;
}

const statusColor: Record<string, string> = {
  completed: "green",
  processing: "yellow",
  failed: "red",
  queued: "gray",
};

const typeIcon: Record<string, string> = {
  research: "🔬",
  batch: "📦",
  crawl: "🕸️",
  extract: "🧩",
};

export default function Jobs() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string | null>("");

  const loadJobs = async (statusFilter = "") => {
    setLoading(true);
    try {
      const token = localStorage.getItem("goozfire_token");
      const params = statusFilter ? `?status=${statusFilter}` : "";
      const res = await fetch(`/api/v1/jobs${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setJobs(data.jobs || []);
    } catch (err) {
      console.error("Failed to load jobs", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadJobs(filter || "");
    const interval = setInterval(() => loadJobs(filter || ""), 5000);
    return () => clearInterval(interval);
  }, [filter]);

  return (
    <Stack gap="lg">
      <Group justify="space-between">
        <div>
          <Title order={2}>Jobs</Title>
          <Text c="dimmed" size="sm">Track and manage async jobs</Text>
        </div>
        <Select
          placeholder="Filter by status"
          data={[
            { value: "", label: "All Status" },
            { value: "queued", label: "Queued" },
            { value: "processing", label: "Processing" },
            { value: "completed", label: "Completed" },
            { value: "failed", label: "Failed" },
          ]}
          value={filter}
          onChange={setFilter}
          w={180}
          clearable
        />
      </Group>

      {loading && jobs.length === 0 ? (
        <Stack gap="xs">
          {[1, 2, 3].map((i) => <Skeleton key={i} height={50} radius="md" />)}
        </Stack>
      ) : jobs.length === 0 ? (
        <Paper p="xl" ta="center" radius="md">
          <IconListDetails size={40} stroke={1} style={{ opacity: 0.3 }} />
          <Text c="dimmed" mt="sm">No jobs yet.</Text>
        </Paper>
      ) : (
        <Paper radius="md" withBorder>
          <Table>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Type</Table.Th>
                <Table.Th>ID</Table.Th>
                <Table.Th>Status</Table.Th>
                <Table.Th>Progress</Table.Th>
                <Table.Th>Credits</Table.Th>
                <Table.Th>Created</Table.Th>
                <Table.Th>Error</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {jobs.map((job) => (
                <Table.Tr key={job.id}>
                  <Table.Td>
                    <Group gap="xs">
                      <Text>{typeIcon[job.type] || "📋"}</Text>
                      <Badge variant="light" size="sm">{job.type}</Badge>
                    </Group>
                  </Table.Td>
                  <Table.Td fw={500}>#{job.id}</Table.Td>
                  <Table.Td>
                    <Badge color={statusColor[job.status] || "gray"} variant="light" size="sm">
                      {job.status}
                    </Badge>
                  </Table.Td>
                  <Table.Td>{job.progress}%</Table.Td>
                  <Table.Td>{job.credits_used}</Table.Td>
                  <Table.Td>
                    <Text size="sm">{new Date(job.created_at).toLocaleString()}</Text>
                    {job.completed_at && (
                      <Text size="xs" c="dimmed">
                        Done: {new Date(job.completed_at).toLocaleString()}
                      </Text>
                    )}
                  </Table.Td>
                  <Table.Td>
                    {job.error ? (
                      <Text size="xs" c="red" maw={150} truncate>
                        {job.error}
                      </Text>
                    ) : (
                      <Text c="dimmed" size="xs">—</Text>
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
