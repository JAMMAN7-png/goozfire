import React, { useEffect, useState } from "react";

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

export default function Jobs() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");

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
    loadJobs(filter);
    const interval = setInterval(() => loadJobs(filter), 5000);
    return () => clearInterval(interval);
  }, [filter]);

  const statusColor = (status: string) => {
    switch (status) {
      case "completed": return "#059669";
      case "processing": return "#d97706";
      case "failed": return "#dc2626";
      case "queued": return "#6b7280";
      default: return "#6b7280";
    }
  };

  const typeIcon = (type: string) => {
    switch (type) {
      case "research": return "🔬";
      case "batch": return "📦";
      case "crawl": return "🕸️";
      case "extract": return "🧩";
      default: return "📋";
    }
  };

  return (
    <div style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
        <h1 style={{ fontSize: "22px", fontWeight: 700, margin: 0, color: "#111" }}>Jobs</h1>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          style={{
            padding: "8px 14px",
            border: "1px solid #d1d5db",
            borderRadius: "8px",
            fontSize: "13px",
            background: "#fff",
          }}
        >
          <option value="">All Status</option>
          <option value="queued">Queued</option>
          <option value="processing">Processing</option>
          <option value="completed">Completed</option>
          <option value="failed">Failed</option>
        </select>
      </div>

      {loading && jobs.length === 0 ? (
        <div style={{ color: "#888", padding: "20px" }}>Loading...</div>
      ) : jobs.length === 0 ? (
        <div style={{ background: "#fff", borderRadius: "12px", padding: "40px", textAlign: "center", boxShadow: "0 1px 3px rgba(0,0,0,0.08)" }}>
          <div style={{ fontSize: "32px", marginBottom: "8px" }}>📋</div>
          <p style={{ color: "#888", margin: 0, fontSize: "14px" }}>No jobs yet. Run a research or batch task to see it here.</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {jobs.map((job) => (
            <div key={job.id} style={{
              background: "#fff",
              borderRadius: "10px",
              padding: "14px 18px",
              boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
              display: "flex",
              alignItems: "center",
              gap: "14px",
            }}>
              <div style={{ fontSize: "20px" }}>{typeIcon(job.type)}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: "13px", fontWeight: 600, color: "#111" }}>
                  {job.type.charAt(0).toUpperCase() + job.type.slice(1)} #{job.id}
                </div>
                <div style={{ fontSize: "11px", color: "#888", marginTop: "2px" }}>
                  {new Date(job.created_at).toLocaleString()}
                  {job.completed_at && ` · Completed: ${new Date(job.completed_at).toLocaleString()}`}
                </div>
              </div>
              <div style={{
                padding: "4px 10px",
                borderRadius: "6px",
                fontSize: "11px",
                fontWeight: 600,
                color: "#fff",
                background: statusColor(job.status),
              }}>
                {job.status}
              </div>
              <div style={{ fontSize: "11px", color: "#888" }}>
                {job.progress}%
              </div>
              {job.error && (
                <div style={{ fontSize: "10px", color: "#dc2626", maxWidth: "200px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {job.error}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
