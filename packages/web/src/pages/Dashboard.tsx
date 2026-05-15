import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Title, Text, SimpleGrid, Paper, Group, Stack,
  Table, Button, Badge, Skeleton, ThemeIcon, Card,
} from "@mantine/core";
import {
  IconArrowUpRight, IconFlame, IconClock, IconPlayerPlay, IconKey, IconMessage,
} from "@tabler/icons-react";
import { auth, usage, logout } from "../api/client";

interface Stats {
  total_requests: number;
  total_credits: number;
  avg_response_time_ms: number;
  by_endpoint: Array<{ endpoint: string; count: number; credits: number }>;
  by_day: Array<{ date: string; count: number; credits: number }>;
}

const gradients = [
  "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
  "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
  "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
];

const nf = new Intl.NumberFormat();

export default function Dashboard() {
  const [user, setUser] = useState<{ name: string; email: string } | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    Promise.all([
      auth.me(),
      usage.getStats(7).catch(() => null),
    ]).then(([u, s]) => { setUser(u); setStats(s); })
      .catch(() => logout())
      .finally(() => setLoading(false));
  }, []);

  const maxDay = stats?.by_day?.length ? Math.max(...stats.by_day.map(d => d.count)) : 1;

  return (
    <>
      <style>{`
.statCard {
  transition: transform 0.2s, box-shadow 0.2s;
  cursor: default;
}
.statCard:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0,0,0,0.3);
}
.tabularNums {
  font-variant-numeric: tabular-nums;
}
.headingBalance {
  text-wrap: balance;
}
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation: none !important;
    transition: none !important;
  }
}
      `}</style>
      <Stack gap="lg">
        <div>
          <Title order={2} className="headingBalance" style={{ background: "linear-gradient(135deg, #667eea, #764ba2)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            Welcome{user ? `, ${user.name}` : ""} 🔥
          </Title>
          <Text c="dimmed" size="sm" className="headingBalance">Search API & MCP Gateway</Text>
        </div>

        <SimpleGrid cols={{ base: 1, sm: 3 }}>
          {loading ? [1,2,3].map(i => <Skeleton key={i} height={140} radius="lg" />) :
            [
              { title: "Total Requests", value: nf.format(stats?.total_requests ?? 0), icon: IconArrowUpRight, idx: 0 },
              { title: "Credits Used", value: nf.format(stats?.total_credits ?? 0), icon: IconFlame, idx: 1 },
              { title: "Avg Response", value: `${nf.format(stats?.avg_response_time_ms ?? 0)}ms`, icon: IconClock, idx: 2 },
            ].map(({ title, value, icon: Icon, idx }) => (
              <Paper key={title} p="lg" radius="lg" className="statCard"
                style={{
                  background: gradients[idx], color: "white", position: "relative", overflow: "hidden",
                }}>
                <Group justify="space-between" mb="xs">
                  <Text size="xs" tt="uppercase" fw={700} style={{ opacity: 0.9 }}>{title}</Text>
                  <ThemeIcon variant="white" size="lg" radius="xl" style={{ opacity: 0.2, background: "rgba(255,255,255,0.2)" }}>
                    <Icon size={20} />
                  </ThemeIcon>
                </Group>
                <Text size="xl" fw={700} className="tabularNums">{value}</Text>
              </Paper>
            ))
          }
        </SimpleGrid>

        {!loading && (
          <SimpleGrid cols={{ base: 1, lg: 2 }}>
            <Card radius="lg" padding="lg">
              <Text fw={600} size="sm" mb="md">Usage by Endpoint</Text>
              {stats && stats.by_endpoint.length > 0 ? (
                <Table>
                  <Table.Thead><Table.Tr>
                    <Table.Th>Endpoint</Table.Th><Table.Th ta="right" className="tabularNums">Requests</Table.Th><Table.Th ta="right" className="tabularNums">Credits</Table.Th>
                  </Table.Tr></Table.Thead>
                  <Table.Tbody>
                    {stats.by_endpoint.map(e => (
                      <Table.Tr key={e.endpoint}>
                        <Table.Td><Badge variant="light" size="sm">{e.endpoint}</Badge></Table.Td>
                        <Table.Td ta="right" className="tabularNums">{nf.format(e.count)}</Table.Td>
                        <Table.Td ta="right" className="tabularNums">{nf.format(e.credits)}</Table.Td>
                      </Table.Tr>
                    ))}
                  </Table.Tbody>
                </Table>
              ) : <Text c="dimmed" size="sm">No usage data yet.</Text>}
            </Card>

            <Card radius="lg" padding="lg">
              <Text fw={600} size="sm" mb="md">Usage (Last 7 Days)</Text>
              {stats && stats.by_day.length > 0 ? (
                <Group gap="xs" align="flex-end" h={140}>
                  {stats.by_day.map(d => {
                    const pct = maxDay > 0 ? (d.count / maxDay) * 100 : 0;
                    return (
                      <Stack key={d.date} align="center" gap={4} style={{ flex: 1 }}>
                        <div style={{
                          width: "100%", height: `${Math.max(pct, 4)}%`, minHeight: 4, borderRadius: 4,
                          background: "linear-gradient(to top, var(--mantine-color-indigo-6), var(--mantine-color-cyan-4))",
                          transition: "height 0.3s ease",
                        }} />
                        <Text size="xs" c="dimmed" className="tabularNums">{d.date.slice(5)}</Text>
                      </Stack>
                    );
                  })}
                </Group>
              ) : <Text c="dimmed" size="sm">No daily data yet.</Text>}
            </Card>
          </SimpleGrid>
        )}

        <Card radius="lg" padding="lg">
          <Text fw={600} size="sm" mb="md">Quick Actions</Text>
          <Group>
            <Button leftSection={<IconKey size={16} />} variant="gradient" gradient={{ from: "indigo", to: "cyan" }} onClick={() => navigate("/api-keys")}>
              Create API Key
            </Button>
            <Button leftSection={<IconPlayerPlay size={16} />} variant="gradient" gradient={{ from: "teal", to: "green" }} onClick={() => navigate("/playground")}>
              Try Playground
            </Button>
            <Button leftSection={<IconMessage size={16} />} variant="gradient" gradient={{ from: "grape", to: "pink" }} onClick={() => navigate("/chat")}>
              Chat with AI
            </Button>
          </Group>
        </Card>
      </Stack>
    </>
  );
}
