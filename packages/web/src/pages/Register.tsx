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
  ThemeIcon,
} from "@mantine/core";
import { IconAlertCircle, IconFlame } from "@tabler/icons-react";
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
    <>
      <style>{`
        @keyframes authCardMount {
          from { opacity: 0; transform: translateY(20px) scale(0.98); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        .auth-card {
          animation: authCardMount 0.4s ease-out;
          transition: transform 0.2s ease;
        }
        .auth-card:hover {
          transform: translateY(-2px);
        }
      `}</style>
      <Center mih="100vh" style={{ background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)" }}>
        <Card
          w={400}
          p="xl"
          radius="lg"
          className="auth-card"
          style={{
            border: "2px solid",
            borderImage: "linear-gradient(135deg, #3b5bdb 0%, #22b8cf 100%) 1",
            background: "#1a1b1e",
          }}
        >
          <Card.Section inheritPadding py="md" style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
            <Center>
              <Box>
                <Center mb="xs">
                  <ThemeIcon size="xl" radius="xl" variant="gradient" gradient={{ from: "orange", to: "red" }}>
                    <IconFlame size={24} aria-label="Goozfire" />
                  </ThemeIcon>
                </Center>
                <Title
                  order={2}
                  ta="center"
                  style={{
                    background: "linear-gradient(135deg, #4dabf7 0%, #22b8cf 100%)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                  }}
                >
                  Create Account
                </Title>
                <Text c="dimmed" size="sm" ta="center">
                  Join Goozfire
                </Text>
              </Box>
            </Center>
          </Card.Section>

          <form onSubmit={handleSubmit}>
            <Stack gap="md" pt="md">
              {error && (
                <Alert
                  icon={<IconAlertCircle size={16} />}
                  color="red"
                  variant="light"
                  style={{ border: "1px solid #fa5252" }}
                  aria-live="polite"
                >
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
                name="name"
                autoComplete="name"
              />

              <TextInput
                label="Email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                name="email"
                autoComplete="email"
              />

              <PasswordInput
                label="Password"
                placeholder="At least 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={e => e.key==='Enter' && handleSubmit(e as any)}
                required
                minLength={6}
                name="password"
                autoComplete="new-password"
              />

              <Button
                type="submit"
                fullWidth
                loading={loading}
                loaderProps={{ type: "dots" }}
                variant="gradient"
                gradient={{ from: "indigo", to: "cyan" }}
              >
                {loading ? "Creating account\u2026" : "Create account"}
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
    </>
  );
}
