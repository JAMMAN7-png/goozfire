import React, { useEffect, useState } from "react";
import { apiKeys as apiKeysClient } from "../api/client";

interface ApiKeyItem {
  id: number;
  name: string;
  key_prefix: string;
  key_last_chars: string;
  created_at: string;
  last_used_at: string | null;
  is_active: number;
}

export default function ApiKeys() {
  const [keys, setKeys] = useState<ApiKeyItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newKeyName, setNewKeyName] = useState("");
  const [createdKey, setCreatedKey] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const loadKeys = () => {
    setLoading(true);
    apiKeysClient
      .list()
      .then((res) => setKeys(res.keys || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadKeys();
  }, []);

  const handleCreate = async () => {
    if (!newKeyName.trim()) return;
    try {
      const res = await apiKeysClient.create(newKeyName.trim());
      setCreatedKey(res.key);
      setNewKeyName("");
      setShowCreate(false);
      loadKeys();
    } catch (err: any) {
      alert(err.message || "Failed to create key");
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Revoke this API key? This cannot be undone.")) return;
    try {
      await apiKeysClient.delete(id);
      loadKeys();
    } catch (err: any) {
      alert(err.message || "Failed to delete key");
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "24px",
        }}
      >
        <h1 style={{ fontSize: "22px", fontWeight: 700, margin: 0, color: "#111" }}>
          API Keys
        </h1>
        <button
          onClick={() => setShowCreate(!showCreate)}
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
          + New Key
        </button>
      </div>

      {/* Create key form */}
      {showCreate && (
        <div
          style={{
            background: "#fff",
            borderRadius: "12px",
            padding: "20px 24px",
            boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
            marginBottom: "20px",
          }}
        >
          <label
            style={{
              display: "block",
              fontSize: "13px",
              fontWeight: 600,
              color: "#374151",
              marginBottom: "6px",
            }}
          >
            Key Name
          </label>
          <div style={{ display: "flex", gap: "8px" }}>
            <input
              type="text"
              value={newKeyName}
              onChange={(e) => setNewKeyName(e.target.value)}
              placeholder="e.g., Production API"
              style={{
                flex: 1,
                padding: "10px 14px",
                border: "1px solid #d1d5db",
                borderRadius: "8px",
                fontSize: "14px",
                outline: "none",
              }}
              onKeyDown={(e) => e.key === "Enter" && handleCreate()}
            />
            <button
              onClick={handleCreate}
              style={{
                padding: "10px 20px",
                background: "#059669",
                color: "#fff",
                border: "none",
                borderRadius: "8px",
                fontSize: "13px",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Create
            </button>
          </div>
        </div>
      )}

      {/* Newly created key display */}
      {createdKey && (
        <div
          style={{
            background: "#fefce8",
            border: "1px solid #eab308",
            borderRadius: "12px",
            padding: "20px 24px",
            marginBottom: "20px",
          }}
        >
          <div style={{ fontSize: "13px", fontWeight: 600, color: "#92400e", marginBottom: "8px" }}>
            🗝️ API Key Created — Copy it now. You won't see it again!
          </div>
          <div
            style={{
              display: "flex",
              gap: "8px",
              alignItems: "center",
              background: "#fff",
              padding: "10px 14px",
              borderRadius: "8px",
              border: "1px solid #eab308",
            }}
          >
            <code
              style={{
                flex: 1,
                fontSize: "13px",
                color: "#1a1a2e",
                wordBreak: "break-all",
              }}
            >
              {createdKey}
            </code>
            <button
              onClick={() => copyToClipboard(createdKey)}
              style={{
                padding: "6px 12px",
                background: "#4f46e5",
                color: "#fff",
                border: "none",
                borderRadius: "6px",
                fontSize: "12px",
                cursor: "pointer",
                whiteSpace: "nowrap",
              }}
            >
              {copied ? "Copied!" : "Copy"}
            </button>
            <button
              onClick={() => setCreatedKey(null)}
              style={{
                padding: "6px 12px",
                background: "none",
                color: "#666",
                border: "1px solid #d1d5db",
                borderRadius: "6px",
                fontSize: "12px",
                cursor: "pointer",
              }}
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Keys list */}
      {loading ? (
        <div style={{ color: "#888", padding: "20px" }}>Loading...</div>
      ) : keys.length === 0 ? (
        <div
          style={{
            background: "#fff",
            borderRadius: "12px",
            padding: "40px",
            textAlign: "center",
            boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
          }}
        >
          <div style={{ fontSize: "32px", marginBottom: "8px" }}>🔑</div>
          <p style={{ color: "#888", margin: 0, fontSize: "14px" }}>
            No API keys yet. Create one to get started.
          </p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {keys.map((key) => (
            <div
              key={key.id}
              style={{
                background: "#fff",
                borderRadius: "12px",
                padding: "16px 20px",
                boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: "14px", fontWeight: 600, color: "#111" }}>
                  {key.name}
                </div>
                <div style={{ fontSize: "12px", color: "#888", marginTop: "4px", fontFamily: "monospace" }}>
                  {key.key_prefix}••••{key.key_last_chars}
                </div>
                <div style={{ fontSize: "11px", color: "#a0a0a0", marginTop: "2px" }}>
                  Created: {new Date(key.created_at).toLocaleDateString()}
                  {key.last_used_at && ` · Last used: ${new Date(key.last_used_at).toLocaleDateString()}`}
                </div>
              </div>
              <button
                onClick={() => handleDelete(key.id)}
                title={key.is_active ? "Revoke key" : "Already revoked"}
                style={{
                  padding: "6px 14px",
                  background: key.is_active ? "#fef2f2" : "#f5f5f5",
                  color: key.is_active ? "#dc2626" : "#a0a0a0",
                  border: "none",
                  borderRadius: "6px",
                  fontSize: "12px",
                  cursor: key.is_active ? "pointer" : "not-allowed",
                }}
              >
                {key.is_active ? "Revoke" : "Revoked"}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
