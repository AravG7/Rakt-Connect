"use client";
import "./globals.css";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AuthProvider, useAuth } from "../lib/auth-context";
import { AuthModal } from "../components/AuthModal";

const navItems = [
  { label: "Overview", icon: "📊", href: "/", section: "DASHBOARD" },
  { label: "Inventory Control", icon: "🩸", href: "/inventory", badge: "3", badgeType: "warning" },
  { label: "Emergency Broadcast", icon: "🚨", href: "/emergency", badge: "!", badgeType: "critical" },
  { label: "Transfer Marketplace", icon: "🔄", href: "/marketplace" },
  { label: "Donor Management", icon: "👤", href: "/donors", section: "MANAGEMENT" },
  { label: "Unit Lifecycle", icon: "📦", href: "/units" },
  { label: "Analytics & AI", icon: "🧠", href: "/analytics", section: "INTELLIGENCE" },
  { label: "Algorithm Lab", icon: "⚡", href: "/algorithms", badge: "DEMO", badgeType: "safe" },
  { label: "Hemovigilance", icon: "🛡️", href: "/hemovigilance" },
  { label: "Compliance", icon: "📋", href: "/compliance", section: "REGULATORY" },
  { label: "Rare Registry", icon: "🧬", href: "/rare-registry", section: "SPECIALIZED" },
  { label: "Disaster Mode", icon: "⚠️", href: "/disaster-mode", badge: "!", badgeType: "warning" },
  { label: "HCX Gateway", icon: "💳", href: "/hcx-gateway" },
];

function Sidebar() {
  const pathname = usePathname();
  const { user, openAuthModal } = useAuth();

  let currentSection = "";

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="sidebar-logo">R</div>
        <div>
          <div className="sidebar-title">Rakt-Connect</div>
          <div className="sidebar-subtitle">Blood Bank Hub</div>
        </div>
      </div>

      <nav className="sidebar-nav">
        {navItems.map((item) => {
          const showSection = item.section && item.section !== currentSection;
          if (item.section) currentSection = item.section;
          const isActive = pathname === item.href;

          return (
            <div key={item.href}>
              {showSection && (
                <div className="sidebar-section-label">{item.section}</div>
              )}
              <Link
                href={item.href}
                className={`sidebar-link ${isActive ? "active" : ""}`}
              >
                <span className="sidebar-link-icon">{item.icon}</span>
                <span>{item.label}</span>
                {item.badge && (
                  <span className={`sidebar-badge ${item.badgeType || "info"}`}>
                    {item.badge}
                  </span>
                )}
              </Link>
            </div>
          );
        })}
      </nav>

      <div className="sidebar-footer">
        <div
          className="sidebar-hospital"
          onClick={openAuthModal}
          style={{ cursor: "pointer", transition: "all var(--transition-fast)" }}
          title="Click to change role or re-authenticate"
        >
          <div className="sidebar-hospital-avatar">
            {user ? user.name.substring(0, 2).toUpperCase() : "AH"}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              className="sidebar-hospital-name"
              style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
            >
              {user ? user.name : "Apollo Hospital"}
            </div>
            <div className="sidebar-hospital-id flex-between">
              <span>{user?.role ? user.role.replace(/_/g, " ") : "HFR-KA-0421"}</span>
              <span style={{ fontSize: "10px", color: "var(--rakt-400)", marginLeft: "4px" }}>🔑</span>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <title>Rakt-Connect | Blockchain Blood Bank Dashboard</title>
        <meta
          name="description"
          content="India's blockchain-powered blood bank management system. Real-time inventory, AI predictions, and NBTC-compliant operations."
        />
      </head>
      <body>
        <AuthProvider>
          <div className="app-layout">
            <Sidebar />
            <main className="main-content">
              {children}
            </main>
          </div>
          <AuthModal />
        </AuthProvider>
      </body>
    </html>
  );
}
