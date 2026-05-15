import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Card,
  TextInput,
  PasswordInput,
  Button,
  Text,
  Title,
  Stack,
  Center,
  Box,
  Alert,
  Anchor,
} from "@mantine/core";
import { IconBrandFirebase, IconAlertCircle } from "@tabler/icons-react";
import { auth, setToken } from "../api/client";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await auth.login(email, password);
      setToken(res.access_token);
      navigate("/dashboard");
    } catch (err: any) {
      setError(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Center mih="100vh" style={{ background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)" }}>
      <Card w={400} p="xl" radius="lg" withBorder>
        <form onSubmit={handleSubmit}>
          <Stack gap="md">
            <Center>
              <Box>
                <Title order={2} ta="center">
                  🔥 Goozfire
                </Title>
                <Text c="dimmed" size="sm" ta="center">
                  Search API & MCP Gateway
                </Text>
              </Box>
            </Center>

            {error && (
              <Alert icon={<IconAlertCircle size={16} />} color="red" variant="light">
                {error}
              </Alert>
            )}

            <TextInput
              label="Email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoFocus
            />

            <PasswordInput
              label="Password"
              placeholder="Your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            <Button type="submit" fullWidth loading={loading} loaderProps={{ type: "dots" }}>
              Sign in
            </Button>

            <Text ta="center" size="sm" c="dimmed">
              Don't have an account?{" "}
              <Anchor component={Link} to="/register" fw={600}>
                Register
              </Anchor>
            </Text>
          </Stack>
        </form>
      </Card>
    </Center>
  );
}
