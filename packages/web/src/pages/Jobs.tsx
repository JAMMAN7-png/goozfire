import { useEffect, useState } from "react";
import {
  Title, Text, Paper, Group, Badge, Stack, Select, Skeleton, Timeline, ThemeIcon, Card,
} from "@mantine/core";
import {
  IconListDetails, IconLoader, IconPlayerPlay, IconCheck, IconX,
} from "@tabler/icons-react";

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

const statusGradient: Record<string, string> = {
  completed: "linear-gradient(135deg, #20c997, #12b886)",
  processing: "linear-gradient(135deg, #fab005, #fd7e14)",
  failed: "linear-gradient(135deg, #ff6b6b, #fa5252)",
  queued: "linear-gradient(135deg, #868e96, #495057)",
};

const dateFormatter = new Intl.DateTimeFormat(undefined, {
  year: "numeric", month: "short", day: "numeric",
  hour: "2-digit", minute: "2-digit", second: "2-digit",
});

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "";
  return dateFormatter.format(new Date(dateStr));
}

function JobTimeline({ job }: { job: Job }) {
  const getActive = (step: string) => {
    const order = ["queued", "processing", "completed", "failed"];
    const current = order.indexOf(job.status);
    const stepIdx = order.indexOf(step);
    if (step === "failed") {
      return job.status === "failed";
    }
    if (step === "completed") {
      return job.status === "completed";
    }
    return stepIdx <= current;
  };

  const getColor = (step: string) => {
    if (job.status === "failed" && step === "failed") return "red";
    if (job.status === "failed" && step === "completed") return "gray";
    if (getActive(step)) return statusColor[job.status] || "blue";
    return "gray";
  };

  return (
    <Timeline
      active={
        job.status === "failed"
          ? 2
          : job.status === "completed"
            ? 2
            : job.status === "processing"
              ? 1
              : 0
      }
      bulletSize={24}
      lineWidth={2}
      styles={{
        itemBullet: {
          background:
            job.status === "failed"
              ? "linear-gradient(135deg, #ff6b6b, #fa5252)"
              : job.status === "completed"
                ? "linear-gradient(135deg, #20c997, #12b886)"
                : job.status === "processing"
                  ? "linear-gradient(135deg, #fab005, #fd7e14)"
                  : "linear-gradient(135deg, #868e96, #495057)",
          borderColor: "transparent",
        },
      }}
    >
      <Timeline.Item
        bullet={
          <ThemeIcon size={22} variant="gradient" gradient={{ from: "indigo", to: "cyan" }} radius="xl">
            <IconLoader size={12} />
          </ThemeIcon>
        }
        title="Queued"
      >
        <Text size="xs" c="dimmed">
          {formatDate(job.created_at)}
        </Text>
      </Timeline.Item>
      <Timeline.Item
        bullet={
          <ThemeIcon size={22} variant="gradient" gradient={{ from: "yellow", to: "orange" }} radius="xl">
            <IconPlayerPlay size={12} />
          </ThemeIcon>
        }
        title="Processing"
      >
        <Text size="xs" c="dimmed">
          {job.started_at ? formatDate(job.started_at) : "Waiting..."}
        </Text>
      </Timeline.Item>
      <Timeline.Item
        bullet={
          <ThemeIcon
            size={22}
            variant="gradient"
            gradient={
              job.status === "failed"
                ? { from: "red", to: "pink" }
                : { from: "teal", to: "green" }
            }
            radius="xl"
          >
            {job.status === "failed" ? <IconX size={12} /> : <IconCheck size={12} />}
          </ThemeIcon>
        }
        title={job.status === "failed" ? "Failed" : "Completed"}
      >
        <Text size="xs" c="dimmed">
          {job.completed_at
            ? formatDate(job.completed_at)
            : job.status === "failed"
              ? "Error occurred"
              : "In progress..."}
        </Text>
      </Timeline.Item>
    </Timeline>
  );
}

function JobCard({ job }: { job: Job }) {
  return (
    <Card
      padding="lg"
      radius="lg"
      withBorder
      className="job-card"
      style={{
        transition: "transform 0.2s, box-shadow 0.2s",
      }}
    >
      <Stack gap="md">
        <Group justify="space-between" wrap="nowrap">
          <Group gap="xs">
            <Text size="lg">{typeIcon[job.type] || "📋"}</Text>
            <div>
              <Text fw={600} size="sm">
                {job.type.charAt(0).toUpperCase() + job.type.slice(1)} Job
              </Text>
              <Text size="xs" c="dimmed" style={{ fontVariantNumeric: "tabular-nums" }}>
                #{job.id}
              </Text>
            </div>
          </Group>
          <Badge
            size="sm"
            styles={{
              root: {
                background: statusGradient[job.status] || statusGradient.queued,
                color: "#fff",
                border: "none",
                textTransform: "capitalize",
              },
            }}
          >
            {job.status}
          </Badge>
        </Group>

        {job.status === "processing" && (
          <div>
            <Group justify="space-between" mb={4}>
              <Text size="xs" c="dimmed">
                Progress
              </Text>
              <Text size="xs" fw={600} style={{ fontVariantNumeric: "tabular-nums" }}>
                {job.progress}%
              </Text>
            </Group>
            <div
              style={{
                width: "100%",
                height: 8,
                background: "var(--mantine-color-dark-5)",
                borderRadius: 4,
                overflow: "hidden",
              }}
            >
              <div
                className="progress-bar"
                style={{
                  width: `${job.progress}%`,
                  height: "100%",
                  background: "linear-gradient(90deg, #4c6ef5, #22b8cf)",
                  borderRadius: 4,
                  transition: "width 500ms ease-out",
                }}
              />
            </div>
          </div>
        )}

        <Group justify="space-between">
          <div>
            <Text size="xs" c="dimmed">
              Credits used
            </Text>
            <Text size="sm" fw={500} style={{ fontVariantNumeric: "tabular-nums" }}>
              {job.credits_used}
            </Text>
          </div>
          <div>
            <Text size="xs" c="dimmed">
              Created
            </Text>
            <Text size="sm" fw={500}>
              {formatDate(job.created_at)}
            </Text>
          </div>
        </Group>

        {job.error && (
          <Text size="xs" c="red" maw="100%" lineClamp={2}>
            {job.error}
          </Text>
        )}

        <JobTimeline job={job} />
      </Stack>
    </Card>
  );
}

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
    <Stack gap="lg" aria-live="polite">
      <style>{`
        .job-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
        }
        @media (prefers-reduced-motion: reduce) {
          .job-card { transition: none; }
          .job-card:hover { transform: none; box-shadow: none; }
          .progress-bar { transition: none; }
        }
      `}</style>
      <Group justify="space-between">
        <div>
          <Title
            order={2}
            style={{
              background: "linear-gradient(135deg, #667eea, #764ba2)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            Jobs
          </Title>
          <Text c="dimmed" size="sm">
            Track and manage async jobs
          </Text>
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
          onKeyDown={(e) => {
            if (e.key === "Enter") loadJobs(filter || "");
          }}
        />
      </Group>

      {loading && jobs.length === 0 ? (
        <Stack gap="xs">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} height={160} radius="lg" />
          ))}
        </Stack>
      ) : jobs.length === 0 ? (
        <Paper p="xl" ta="center" radius="md">
          <IconListDetails size={40} stroke={1} style={{ opacity: 0.3 }} />
          <Text c="dimmed" mt="sm">
            No jobs yet.
          </Text>
        </Paper>
      ) : (
        <Stack gap="md">
          {jobs.map((job) => (
            <JobCard key={job.id} job={job} />
          ))}
        </Stack>
      )}
    </Stack>
  );
}
