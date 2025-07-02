"use client";
import '../i18n/i18n';
import React, { useState } from "react";
import Link from "next/link";
import { Nav, Button } from "react-bootstrap";
import { useTranslation } from "react-i18next";

const menuItems = [
  { href: "/", label: "Home", icon: "🏠" },
  { href: "/profile", label: "User Profile", icon: "👤" },
  { href: "/settings", label: "App Settings", icon: "⚙️" },
  { href: "/about", label: "About", icon: "ℹ️" },
];

export default function SidebarLayout({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const { t } = useTranslation();

  return (
    <div className="d-flex">
      <div className={`sidebar border-end p-2 d-flex flex-column align-items-${collapsed ? 'center' : 'start'}`} style={{ minHeight: '100vh', minWidth: collapsed ? 60 : 200, background: '#23272b', color: '#f8f9fa', transition: 'min-width 0.2s' }}>
        <Button variant="outline-light" size="sm" className="mb-3" onClick={() => setCollapsed(!collapsed)}>
          {collapsed ? '»' : '«'}
        </Button>
        <Nav className="flex-column w-100">
          {menuItems.map((item) => (
            <Nav.Link as={Link} href={item.href} key={item.href} className="d-flex align-items-center mb-2" style={{ justifyContent: collapsed ? 'center' : 'start', color: '#f8f9fa' }}>
              <span style={{ fontSize: 22 }}>{item.icon}</span>
              {!collapsed && <span className="ms-2">{t(item.label.toLowerCase()) || item.label}</span>}
            </Nav.Link>
          ))}
        </Nav>
      </div>
      <main className="flex-grow-1 p-3">{children}</main>
    </div>
  );
}
