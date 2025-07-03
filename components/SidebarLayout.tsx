"use client";
import '../i18n/i18n';
import React, { useState } from "react";
import Link from "next/link";
import { Nav, Button } from "react-bootstrap";
import { useTranslation } from "react-i18next";

const menuItems = [
  { href: "/", key: "home", icon: <svg width="22" height="22" fill="none" stroke="#fff" strokeWidth="2" viewBox="0 0 24 24"><path d="M3 12L12 3l9 9"/><path d="M9 21V9h6v12"/></svg> },
  { href: "/profile", key: "profile", icon: <svg width="22" height="22" fill="none" stroke="#fff" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="8" r="4"/><path d="M4 21v-2a4 4 0 014-4h8a4 4 0 014 4v2"/></svg> },
  { href: "/settings", key: "settings", icon: <svg width="22" height="22" fill="none" stroke="#fff" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 01-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09a1.65 1.65 0 00-1-1.51 1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09a1.65 1.65 0 001.51-1 1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06a1.65 1.65 0 001.82.33h.09A1.65 1.65 0 008.91 3.09V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51h.09a1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06a1.65 1.65 0 00-.33 1.82v.09a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/></svg> },
  { href: "/about", key: "about", icon: <svg width="22" height="22" fill="none" stroke="#fff" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg> },
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
              {!collapsed && <span className="ms-2">{t(item.key)}</span>}
            </Nav.Link>
          ))}
        </Nav>
      </div>
      <main className="flex-grow-1 p-3">{children}</main>
    </div>
  );
}
