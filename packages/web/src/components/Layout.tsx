import React, { useEffect, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { auth, logout } from "../api/client";

const styles = {
  container: {
    display: "flex",
    minHeight: "100vh",
    fontFamily:
      '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  } as React.CSSProperties,
  sidebar: {
    width: "240px",
    background: "#1a1a2e",
    color: "#e0e0e0",
    display: "flex",
    flexDirection: "column",
    padding: "0",
    flexShrink: 0,
  } as React.CSSProperties,
  logo: {
    padding: "24px 20px",
    fontSize: "20px",
    fontWeight: 700,
    color: "#fff",
    borderBottom: "1px solid rgba(255,255,255,0.08)",
    display: "flex",
    alignItems: "center",
    gap: "8px",
  } as React.CSSProperties,
  nav: {
    flex: 1,
    padding: "12px 0",
  },
  link: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    padding: "10px 20px",
    color: "#a0a0b8",
    textDecoration: "none",
    fontSize: "14px",
    transition: "all 0.15s",
    borderLeft: "3px solid transparent",
  } as React.CSSProperties,
  linkActive: {
    color: "#fff",
    background: "rgba(79,70,229,0.15)",
    borderLeft: "3px solid #4f46e5",
  } as React.CSSProperties,
  main: {
    flex: 1,
    background: "#f5f5f7",
    display: "flex",
    flexDirection: "column",
  } as React.CSSProperties,
  header: {
    background: "#fff",
    padding: "16px 32px",
    borderBottom: "1px solid #e5e5e5",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  } as React.CSSProperties,
  userInfo: {
    fontSize: "13px",
    color: "#666",
    display: "flex",
    alignItems: "center",
    gap: "12px",
  } as React.CSSProperties,
  content: {
    flex: 1,
    padding: "24px 32px",
    overflow: "auto",
  } as React.CSSProperties,
  logoutBtn: {
    background: "none",
    border: "1px solid #ddd",
    borderRadius: "6px",
    padding: "6px 14px",
    fontSize: "12px",
    color: "#666",
    cursor: "pointer",
  } as React.CSSProperties,
  footer: {
    padding: "16px 20px",
    borderTop: "1px solid rgba(255,255,255,0.08)",
    fontSize: "11px",
    color: "#666",
    textAlign: "center",
  } as React.CSSProperties,
};

const navItems = [
  { to: "/dashboard", label: "Dashboard", icon: "◇" },
  { to: "/api-keys", label: "API Keys", icon: "⚷" },
  { to: "/jobs", label: "Jobs", icon: "📋" },
  { to: "/webhooks", label: "Webhooks", icon: "🔗" },
  { to: "/playground", label: "Playground", icon: "▶" },
];

export default function Layout({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<{ name: string; email: string } | null>(
    null
  );
  const navigate = useNavigate();

  useEffect(() => {
    auth
      .me()
      .then(setUser)
      .catch(() => {});
  }, []);

  return (
    <div style={styles.container}>
      <div style={styles.sidebar}>
        <div style={styles.logo}>
          <span style={{ fontSize: "24px" }}>🔥</span> Goozfire
        </div>
        <nav style={styles.nav}>
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              style={({ isActive }) => ({
                ...styles.link,
                ...(isActive ? styles.linkActive : {}),
              })}
            >
              <span style={{ width: "20px", textAlign: "center" }}>
                {item.icon}
              </span>
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div style={styles.footer}>v0.1.0</div>
      </div>
      <div style={styles.main}>
        <div style={styles.header}>
          <div />
          <div style={styles.userInfo}>
            {user && (
              <span>
                {user.name} ({user.email})
              </span>
            )}
            <button
              style={styles.logoutBtn}
              onClick={() => {
                logout();
                navigate("/login");
              }}
            >
              Logout
            </button>
          </div>
        </div>
        <div style={styles.content}>{children}</div>
      </div>
    </div>
  );
}
