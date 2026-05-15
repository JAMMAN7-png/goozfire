import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  AppShell,
  Group,
  Text,
  UnstyledButton,
  Avatar,
  Box,
  Burger,
  useMantineTheme,
  rem,
  Stack,
  Badge,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import {
  IconDashboard,
  IconKey,
  IconPlayerPlay,
  IconListDetails,
  IconLink,
  IconMessage,
  IconFlipFlops,
  IconLogout,
} from "@tabler/icons-react";
import { auth, logout } from "../api/client";

interface UserData {
  name: string;
  email: string;
}

const navData = [
  { to: "/dashboard", label: "Dashboard", icon: IconDashboard },
  { to: "/api-keys", label: "API Keys", icon: IconKey },
  { to: "/jobs", label: "Jobs", icon: IconListDetails },
  { to: "/webhooks", label: "Webhooks", icon: IconLink },
  { to: "/playground", label: "Playground", icon: IconPlayerPlay },
  { to: "/chat", label: "Chat", icon: IconMessage },
  { to: "/fusion", label: "Fusion", icon: IconFlipFlops },
];

export default function Layout({ children }: { children: React.ReactNode }) {
  const [opened, { toggle }] = useDisclosure();
  const [user, setUser] = useState<UserData | null>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useMantineTheme();

  useEffect(() => {
    auth.me().then(setUser).catch(() => {});
  }, []);

  const currentPath = location.pathname;

  return (
    <AppShell
      header={{ height: 60 }}
      navbar={{
        width: 240,
        breakpoint: "sm",
        collapsed: { mobile: !opened },
      }}
      padding="md"
    >
      <AppShell.Header>
        <Group h="100%" px="md" justify="space-between">
          <Group gap="xs">
            <Burger opened={opened} onClick={toggle} hiddenFrom="sm" size="sm" />
            <Text fw={700} size="lg" variant="gradient" gradient={{ from: "indigo", to: "cyan" }}>
              🔥 Goozfire
            </Text>
            <Badge size="sm" variant="light" color="gray">
              v0.1.0
            </Badge>
          </Group>
          <Group gap="sm">
            {user && (
              <Text size="sm" c="dimmed" visibleFrom="sm">
                {user.name}
              </Text>
            )}
            <Avatar size={32} color="indigo" radius="xl">
              {user?.name?.charAt(0) || "G"}
            </Avatar>
          </Group>
        </Group>
      </AppShell.Header>

      <AppShell.Navbar p="xs">
        <Stack gap={4} mt="sm">
          {navData.map((item) => {
            const isActive = currentPath === item.to;
            const Icon = item.icon;
            return (
              <UnstyledButton
                key={item.to}
                onClick={() => navigate(item.to)}
                style={(theme) => ({
                  display: "flex",
                  alignItems: "center",
                  gap: rem(10),
                  padding: `${rem(10)} ${rem(12)}`,
                  borderRadius: theme.radius.md,
                  color: isActive ? theme.white : theme.colors.gray[4],
                  backgroundColor: isActive ? theme.colors.indigo[7] : "transparent",
                  "&:hover": {
                    backgroundColor: isActive
                      ? theme.colors.indigo[7]
                      : theme.colors.dark[5],
                  },
                  transition: "all 0.15s ease",
                })}
              >
                <Icon size={18} stroke={1.5} />
                <Text size="sm" fw={isActive ? 600 : 400}>
                  {item.label}
                </Text>
              </UnstyledButton>
            );
          })}
        </Stack>

        <Box style={{ flex: 1 }} />

        <UnstyledButton
          onClick={() => {
            logout();
            navigate("/login");
          }}
          style={(theme) => ({
            display: "flex",
            alignItems: "center",
            gap: rem(10),
            padding: `${rem(10)} ${rem(12)}`,
            borderRadius: theme.radius.md,
            color: theme.colors.red[5],
            "&:hover": {
              backgroundColor: theme.colors.dark[5],
            },
          })}
        >
          <IconLogout size={18} stroke={1.5} />
          <Text size="sm">Logout</Text>
        </UnstyledButton>
      </AppShell.Navbar>

      <AppShell.Main bg={theme.colors.dark[7]}>
        {children}
      </AppShell.Main>
    </AppShell>
  );
}
