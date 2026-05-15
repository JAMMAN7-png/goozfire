import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Title,
  Text,
  SimpleGrid,
  Paper,
  Group,
  Stack,
  RingProgress,
  Center,
  Table,
  Button,
  Badge,
  Skeleton,
} from "@mantine/core";
import {
  IconArrowUpRight,
  IconFlame,
  IconClock,
  IconPlayerPlay,
  IconKey,
} from "@tabler/icons-react";
import { auth, usage, logout } from "../api/client";

interface Stats {
  total_requests: number;
  total_credits: number;
  avg_response_time_ms: number;
  by_endpoint: Array<{ endpoint: string; count: number; credits: number }>;
  by_day: Array<{ date: string; count: number; credits: number }>;
}

export default function Dashboard() {
  const [user, setUser] = useState<{ name: string; email: string } | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    Promise.all([
      auth.me(),
      usage.getStats(7).catch(() => null),
    ])
      .then(([u, s]) => {
        setUser(u);
        setStats(s);
      })
      .catch(() => logout())
      .finally(() => setLoading(false));
  }, []);

  const StatCard = ({
    title,
    value,
    sub,
    icon: Icon,
    color,
  }: {
    title: string;
    value: string;
    sub?: string;
    icon: React.ElementType;
    color: string;
  }) => (
    <Paper p="md" radius="md">
      <Group justify="space-between" mb="xs">
        <Text size="xs" c="dimmed" tt="uppercase" fw={700}>
          {title}
        </Text>
        <Icon size={20} stroke={1.5} color={`var(--mantine-color-${color}-5)`} />
      </Group>
      <Text size="xl" fw={700}>
        {value}
      </Text>
      {sub && (
        <Text size="xs" c="dimmed" mt={2}>
          {sub}
        </Text>
      )}
    </Paper>
  );

  return (
    <Stack gap="lg">
      <div>
        <Title order={2}>
          Welcome{user ? `, ${user.name}` : ""}
        </Title>
        <Text c="dimmed" size="sm">
          Goozfire Search API & MCP Gateway
        </Text>
      </div>

      {loading ? (
        <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }}>
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} height={100} radius="md" />
          ))}
        </SimpleGrid>
      ) : (
        <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }}>
          <StatCard
            title="Total Requests"
            value={(stats?.total_requests ?? 0).toLocaleString()}
            icon={IconArrowUpRight}
            color="indigo"
          />
          <StatCard
            title="Credits Used"
            value={(stats?.total_credits ?? 0).toLocaleString()}
            icon={IconFlame}
            color="orange"
          />
          <StatCard
            title="Avg Response"
            value={`${stats?.avg_response_time_ms ?? 0}ms`}
            icon={IconClock}
            color="teal"
          />
        </SimpleGrid>
      )}

      {!loading && (
        <SimpleGrid cols={{ base: 1, lg: 2 }}>
          <Paper p="md" radius="md">
            <Text fw={600} size="sm" mb="md">
              Usage by Endpoint
            </Text>
            {stats && stats.by_endpoint.length > 0 ? (
              <Table>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>Endpoint</Table.Th>
                    <Table.Th ta="right">Requests</Table.Th>
                    <Table.Th ta="right">Credits</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {stats.by_endpoint.map((e) => (
                    <Table.Tr key={e.endpoint}>
                      <Table.Td>
                        <Badge variant="light" size="sm">
                          {e.endpoint}
                        </Badge>
                      </Table.Td>
                      <Table.Td ta="right">{e.count}</Table.Td>
                      <Table.Td ta="right">{e.credits}</Table.Td>
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>
            ) : (
              <Text c="dimmed" size="sm">
                No usage data yet.
              </Text>
            )}
          </Paper>

          <Paper p="md" radius="md">
            <Text fw={600} size="sm" mb="md">
              Usage (Last 7 Days)
            </Text>
            {stats && stats.by_day.length > 0 ? (
              <Group gap="xs" align="flex-end" h={140}>
                {stats.by_day.map((d) => {
                  const maxCount = Math.max(...stats.by_day.map((x) => x.count));
                  const pct = maxCount > 0 ? (d.count / maxCount) * 100 : 0;
                  return (
                    <Stack key={d.date} align="center" gap={4} style={{ flex: 1 }}>
                      <div
                        style={{
                          width: "100%",
                          height: `${Math.max(pct, 4)}%`,
                          minHeight: 4,
                          borderRadius: 4,
                          background: `linear-gradient(to top, var(--mantine-color-indigo-6), var(--mantine-color-indigo-4))`,
                          transition: "height 0.3s ease",
                        }}
                      />
                      <Text size="xs" c="dimmed">
                        {d.date.slice(5)}
                      </Text>
                    </Stack>
                  );
                })}
              </Group>
            ) : (
              <Text c="dimmed" size="sm">
                No daily data yet.
              </Text>
            )}
          </Paper>
        </SimpleGrid>
      )}

      <Paper p="md" radius="md">
        <Text fw={600} size="sm" mb="md">
          Quick Actions
        </Text>
        <Group>
          <Button
            leftSection={<IconKey size={16} />}
            variant="light"
            onClick={() => navigate("/api-keys")}
          >
            Create API Key
          </Button>
          <Button
            leftSection={<IconPlayerPlay size={16} />}
            variant="light"
            color="teal"
            onClick={() => navigate("/playground")}
          >
            Try Playground
          </Button>
          <Button
            leftSection={<IconArrowUpRight size={16} />}
            variant="light"
            color="cyan"
            onClick={() => navigate("/chat")}
          >
            Chat with AI
          </Button>
        </Group>
      </Paper>
    </Stack>
  );
}
