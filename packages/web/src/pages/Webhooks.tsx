import React, { useEffect, useState } from "react";

interface WebhookItem {
  id: number;
  url: string;
  events: string[];
  is_active: boolean;
  created_at: string;
  last_triggered_at: string | null;
  last_triggered_status: number | null;
}

export default function Webhooks() {
  const [hooks, setHooks] = useState<WebhookItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newUrl, setNewUrl] = useState("");
  const [newEvents, setNewEvents] = useState("job.completed");
  const [message, setMessage] = useState("");

  const token = () => localStorage.getItem("goozfire_token");

  const loadHooks = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/v1/webhooks", {
        headers: { Authorization: `Bearer ${token()}` },
      });
      const data = await res.json();
      setHooks(data.webhooks || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHooks();
  }, []);

  const handleCreate = async () => {
    if (!newUrl.trim()) return;
    const events = newEvents.split(",").map((e) => e.trim()).filter(Boolean);
    try {
      const res = await fetch("/api/v1/webhooks", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token()}` },
        body: JSON.stringify({ url: newUrl.trim(), events }),
      });
      const data = await res.json();
      if (data.success) {
        setMessage(`Webhook created! Secret: ${data.webhook.secret}`);
        setNewUrl("");
        setShowCreate(false);
        loadHooks();
      } else {
        setMessage(`Error: ${data.error}`);
      }
    } catch (err: any) {
      setMessage(`Error: ${err.message}`);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this webhook?")) return;
    try {
      await fetch(`/api/v1/webhooks/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token()}` },
      });
      loadHooks();
    } catch (err: any) {
      setMessage(`Error: ${err.message}`);
    }
  };

  const handleToggle = async (hook: WebhookItem) => {
    try {
      await fetch(`/api/v1/webhooks/${hook.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token()}` },
        body: JSON.stringify({ is_active: !hook.is_active }),
      });
      loadHooks();
    } catch (err: any) {
      setMessage(`Error: ${err.message}`);
    }
  };

  return (
    <div style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
        <h1 style={{ fontSize: "22px", fontWeight: 700, margin: 0, color: "#111" }}>Webhooks</h1>
        <button onClick={() => setShowCreate(!showCreate)} style={{
          padding: "10px 20px", background: "#4f46e5", color: "#fff",
          border: "none", borderRadius: "8px", fontSize: "13px", fontWeight: 600, cursor: "pointer",
        }}>+ Add Webhook</button>
      </div>

      {message && (
        <div style={{
          background: "#fefce8", border: "1px solid #eab308", borderRadius: "8px",
          padding: "10px 14px", fontSize: "13px", marginBottom: "16px", color: "#92400e",
        }}>
          {message}
          <button onClick={() => setMessage("")} style={{
            float: "right", background: "none", border: "none", cursor: "pointer", color: "#92400e", fontWeight: 600,
          }}>x</button>
        </div>
      )}

      {showCreate && (
        <div style={{
          background: "#fff", borderRadius: "12px", padding: "20px 24px",
          boxShadow: "0 1px 3px rgba(0,0,0,0.08)", marginBottom: "20px",
        }}>
          <div style={{ marginBottom: "12px" }}>
            <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#374151", marginBottom: "4px" }}>Webhook URL</label>
            <input type="url" value={newUrl} onChange={(e) => setNewUrl(e.target.value)}
              placeholder="https://example.com/webhook" style={{
                width: "100%", padding: "10px 14px", border: "1px solid #d1d5db",
                borderRadius: "8px", fontSize: "14px", outline: "none", boxSizing: "border-box",
              }} />
          </div>
          <div style={{ marginBottom: "12px" }}>
            <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#374151", marginBottom: "4px" }}>Events (comma-separated)</label>
            <input type="text" value={newEvents} onChange={(e) => setNewEvents(e.target.value)}
              placeholder="job.completed, job.failed" style={{
                width: "100%", padding: "10px 14px", border: "1px solid #d1d5db",
                borderRadius: "8px", fontSize: "14px", outline: "none", boxSizing: "border-box",
              }} />
            <div style={{ fontSize: "11px", color: "#888", marginTop: "4px" }}>
              Options: job.completed, job.failed, job.progress, crawl.completed
            </div>
          </div>
          <div style={{ display: "flex", gap: "8px" }}>
            <button onClick={handleCreate} style={{
              padding: "10px 20px", background: "#059669", color: "#fff",
              border: "none", borderRadius: "8px", fontSize: "13px", fontWeight: 600, cursor: "pointer",
            }}>Create</button>
            <button onClick={() => setShowCreate(false)} style={{
              padding: "10px 20px", background: "#fff", color: "#374151",
              border: "1px solid #d1d5db", borderRadius: "8px", fontSize: "13px", cursor: "pointer",
            }}>Cancel</button>
          </div>
        </div>
      )}

      {loading ? (
        <div style={{ padding: "20px", color: "#888" }}>Loading...</div>
      ) : hooks.length === 0 ? (
        <div style={{ background: "#fff", borderRadius: "12px", padding: "40px", textAlign: "center", boxShadow: "0 1px 3px rgba(0,0,0,0.08)" }}>
          <div style={{ fontSize: "32px", marginBottom: "8px" }}>🔗</div>
          <p style={{ color: "#888", margin: 0, fontSize: "14px" }}>No webhooks configured. Add one to receive event notifications.</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {hooks.map((hook) => (
            <div key={hook.id} style={{
              background: "#fff", borderRadius: "10px", padding: "14px 18px",
              boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: "13px", fontWeight: 600, color: "#111", wordBreak: "break-all" }}>
                    {hook.url}
                  </div>
                  <div style={{ fontSize: "11px", color: "#888", marginTop: "4px", display: "flex", gap: "8px", flexWrap: "wrap" }}>
                    {hook.events.map((e) => (
                      <span key={e} style={{
                        background: "#f0f0f0", padding: "2px 8px", borderRadius: "4px", fontSize: "10px",
                      }}>{e}</span>
                    ))}
                    <span>· Created: {new Date(hook.created_at).toLocaleDateString()}</span>
                    {hook.last_triggered_at && (
                      <span>· Last: {new Date(hook.last_triggered_at).toLocaleString()} ({hook.last_triggered_status})</span>
                    )}
                  </div>
                </div>
                <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                  <button onClick={() => handleToggle(hook)} style={{
                    padding: "5px 12px", borderRadius: "6px", fontSize: "11px", fontWeight: 600, cursor: "pointer",
                    background: hook.is_active ? "#fefce8" : "#f0f0f0",
                    color: hook.is_active ? "#92400e" : "#666",
                    border: "none",
                  }}>
                    {hook.is_active ? "Active" : "Paused"}
                  </button>
                  <button onClick={() => handleDelete(hook.id)} style={{
                    padding: "5px 12px", borderRadius: "6px", fontSize: "11px", cursor: "pointer",
                    background: "#fef2f2", color: "#dc2626", border: "none",
                  }}>Delete</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
