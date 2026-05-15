import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
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
      .catch(() => {
        logout();
      })
      .finally(() => setLoading(false));
  }, []);

  const card = (title: string, value: string | number, color: string) => (
    <div
      style={{
        background: "#fff",
        borderRadius: "12px",
        padding: "20px 24px",
        boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
        flex: 1,
        minWidth: "180px",
      }}
    >
      <div style={{ fontSize: "12px", color: "#888", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px" }}>
        {title}
      </div>
      <div style={{ fontSize: "28px", fontWeight: 700, color, marginTop: "8px" }}>
        {value}
      </div>
    </div>
  );

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", padding: "60px", color: "#888" }}>
        Loading...
      </div>
    );
  }

  return (
    <div style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
      <h1 style={{ fontSize: "22px", fontWeight: 700, margin: "0 0 4px", color: "#111" }}>
        Welcome{user ? `, ${user.name}` : ""}
      </h1>
      <p style={{ fontSize: "14px", color: "#888", margin: "0 0 24px" }}>
        Goozfire Search API & MCP Gateway
      </p>

      {/* Stats cards */}
      <div style={{ display: "flex", gap: "16px", marginBottom: "28px", flexWrap: "wrap" }}>
        {stats
          ? <>
              {card("Total Requests", stats.total_requests.toLocaleString(), "#4f46e5")}
              {card("Credits Used", stats.total_credits.toLocaleString(), "#059669")}
              {card("Avg Response", `${stats.avg_response_time_ms}ms`, "#d97706")}
            </>
          : <>
              {card("Total Requests", 0, "#4f46e5")}
              {card("Credits Used", 0, "#059669")}
              {card("Avg Response", "0ms", "#d97706")}
            </>
        }
      </div>

      <div style={{ display: "flex", gap: "24px", flexWrap: "wrap" }}>
        {/* Usage by Endpoint */}
        <div
          style={{
            background: "#fff",
            borderRadius: "12px",
            padding: "20px 24px",
            boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
            flex: 1,
            minWidth: "300px",
          }}
        >
          <h3 style={{ margin: "0 0 16px", fontSize: "15px", color: "#111" }}>
            Usage by Endpoint
          </h3>
          {stats && stats.by_endpoint.length > 0 ? (
            <table style={{ width: "100%", fontSize: "13px", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: "2px solid #f0f0f0" }}>
                  <th style={{ textAlign: "left", padding: "6px 8px", color: "#888", fontWeight: 600 }}>Endpoint</th>
                  <th style={{ textAlign: "right", padding: "6px 8px", color: "#888", fontWeight: 600 }}>Requests</th>
                  <th style={{ textAlign: "right", padding: "6px 8px", color: "#888", fontWeight: 600 }}>Credits</th>
                </tr>
              </thead>
              <tbody>
                {stats.by_endpoint.map((e) => (
                  <tr key={e.endpoint} style={{ borderBottom: "1px solid #f5f5f5" }}>
                    <td style={{ padding: "8px", fontWeight: 500 }}>{e.endpoint}</td>
                    <td style={{ padding: "8px", textAlign: "right" }}>{e.count}</td>
                    <td style={{ padding: "8px", textAlign: "right" }}>{e.credits}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p style={{ color: "#a0a0a0", fontSize: "13px", margin: 0 }}>
              No usage data yet. Try the Playground to make your first request.
            </p>
          )}
        </div>

        {/* Usage by Day */}
        <div
          style={{
            background: "#fff",
            borderRadius: "12px",
            padding: "20px 24px",
            boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
            flex: 1,
            minWidth: "300px",
          }}
        >
          <h3 style={{ margin: "0 0 16px", fontSize: "15px", color: "#111" }}>
            Usage (Last 7 Days)
          </h3>
          {stats && stats.by_day.length > 0 ? (
            <div style={{ display: "flex", gap: "4px", alignItems: "flex-end", height: "120px" }}>
              {stats.by_day.map((d) => {
                const maxCount = Math.max(...stats.by_day.map((x) => x.count));
                const height = maxCount > 0 ? (d.count / maxCount) * 100 : 0;
                return (
                  <div
                    key={d.date}
                    style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: "4px" }}
                  >
                    <div
                      style={{
                        width: "100%",
                        background: "#4f46e5",
                        borderRadius: "4px 4px 0 0",
                        height: `${Math.max(height, 4)}%`,
                        opacity: 0.8,
                        transition: "height 0.3s",
                        minHeight: "4px",
                      }}
                      title={`${d.date}: ${d.count} requests`}
                    />
                    <span style={{ fontSize: "9px", color: "#888", writingMode: "vertical-lr", textOrientation: "mixed" }}>
                      {d.date.slice(5)}
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            <p style={{ color: "#a0a0a0", fontSize: "13px", margin: 0 }}>
              No daily data yet.
            </p>
          )}
        </div>
      </div>

      {/* Quick actions */}
      <div style={{ marginTop: "28px" }}>
        <h3 style={{ fontSize: "15px", color: "#111", margin: "0 0 12px" }}>Quick Actions</h3>
        <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
          <button
            onClick={() => navigate("/api-keys")}
            style={{
              padding: "10px 20px",
              background: "#4f46e5",
              color: "#fff",
              border: "none",
              borderRadius: "8px",
              fontSize: "13px",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Create API Key
          </button>
          <button
            onClick={() => navigate("/playground")}
            style={{
              padding: "10px 20px",
              background: "#fff",
              color: "#374151",
              border: "1px solid #d1d5db",
              borderRadius: "8px",
              fontSize: "13px",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Try Playground
          </button>
        </div>
      </div>
    </div>
  );
}
