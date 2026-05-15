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
import { IconAlertCircle } from "@tabler/icons-react";
import { auth, setToken } from "../api/client";

export default function Register() {
  const [name, setName] = useState("");
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
      const res = await auth.register(email, name, password);
      setToken(res.access_token);
      navigate("/dashboard");
    } catch (err: any) {
      setError(err.message || "Registration failed");
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
                  Create Account
                </Title>
                <Text c="dimmed" size="sm" ta="center">
                  Join Goozfire
                </Text>
              </Box>
            </Center>

            {error && (
              <Alert icon={<IconAlertCircle size={16} />} color="red" variant="light">
                {error}
              </Alert>
            )}

            <TextInput
              label="Name"
              placeholder="Your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              autoFocus
            />

            <TextInput
              label="Email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <PasswordInput
              label="Password"
              placeholder="At least 6 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
            />

            <Button type="submit" fullWidth loading={loading} loaderProps={{ type: "dots" }}>
              Create account
            </Button>

            <Text ta="center" size="sm" c="dimmed">
              Already have an account?{" "}
              <Anchor component={Link} to="/login" fw={600}>
                Sign in
              </Anchor>
            </Text>
          </Stack>
        </form>
      </Card>
    </Center>
  );
}
