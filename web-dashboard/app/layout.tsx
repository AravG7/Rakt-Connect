"use client";
import "./globals.css";
import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { label: "Overview", icon: "📊", href: "/", section: "DASHBOARD" },
  { label: "Inventory Control", icon: "🩸", href: "/inventory", badge: "3", badgeType: "warning" },
  { label: "Emergency Broadcast", icon: "🚨", href: "/emergency", badge: "!", badgeType: "critical" },
  { label: "Transfer Marketplace", icon: "🔄", href: "/marketplace" },
  { label: "Donor Management", icon: "👤", href: "/donors", section: "MANAGEMENT" },
  { label: "Unit Lifecycle", icon: "📦", href: "/units" },
  { label: "Analytics & AI", icon: "🧠", href: "/analytics", section: "INTELLIGENCE" },
  { label: "Hemovigilance", icon: "🛡️", href: "/hemovigilance" },
  { label: "Compliance", icon: "📋", href: "/compliance", section: "REGULATORY" },
  { label: "Rare Registry", icon: "🧬", href: "/rare-registry", section: "SPECIALIZED" },
  { label: "Disaster Mode", icon: "⚠️", href: "/disaster-mode", badge: "!", badgeType: "warning" },
  { label: "HCX Gateway", icon: "💳", href: "/hcx-gateway" },
];

function Sidebar() {
  const pathname = usePathname();

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
        <div className="sidebar-hospital">
          <div className="sidebar-hospital-avatar">AH</div>
          <div>
            <div className="sidebar-hospital-name">Apollo Hospital</div>
            <div className="sidebar-hospital-id">HFR-KA-0421</div>
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
        <div className="app-layout">
          <Sidebar />
          <main className="main-content">{children}</main>
        </div>
      </body>
    </html>
  );
}
