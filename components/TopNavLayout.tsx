"use client";
import '../i18n/i18n';
import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Container, Nav, Navbar, Button, Dropdown } from "react-bootstrap";
import Image from "next/image";
import { useTranslation } from "react-i18next";
import { useAuth } from "../context/AuthContext";
import { useCredits } from "../context/CreditsContext";
import LanguageSwitcher from "./LanguageSwitcher";

export default function TopNavLayout({ children }: { children: React.ReactNode }) {
  const { t } = useTranslation();  const { user, logout } = useAuth();
  const { credits } = useCredits();
  const pathname = usePathname();

  // Always show navigation now
  const isHomePage = pathname === '/';

  return (
    <div className="d-flex flex-column min-vh-100">
      {/* Top Navigation Bar */}
      <Navbar bg="light" expand="lg" className="border-bottom" style={{ background: '#f8f6f1' }}>
        <Container>
          {/* Logo */}
          <Navbar.Brand as={Link} href="/" className="d-flex align-items-center">
            <Image
              src="/pen-icon.svg"
              alt="ExoMinutes"
              width={32}
              height={32}
              className="me-2"
            />
            <span style={{ fontSize: '1.5rem', fontWeight: 700, color: '#2c3e50' }}>
              ExoMinutes
            </span>
          </Navbar.Brand>

          <Navbar.Toggle aria-controls="basic-navbar-nav" />
          <Navbar.Collapse id="basic-navbar-nav">
            <Nav className="ms-auto d-flex align-items-center">
              {user ? (
                <>
                  {/* Authenticated Menu Items */}                  <Nav.Link as={Link} href="/generate" className="d-flex align-items-center mx-2">
                    <Image src="/pen-icon.svg" alt="" width={18} height={18} className="me-1" />
                    Générer
                  </Nav.Link>

                  <Nav.Link as={Link} href="/sessions" className="d-flex align-items-center mx-2">
                    <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" className="me-1">
                      <rect x="3" y="4" width="18" height="18" rx="2"/>
                      <path d="M16 2v4M8 2v4M3 10h18"/>
                    </svg>
                    Mes fiches
                  </Nav.Link>                  {/* Credits Button */}
                  <Nav.Link as={Link} href="/buy-credits" className="d-flex align-items-center mx-2">
                    <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" className="me-1">
                      <circle cx="12" cy="12" r="10"/>
                      <path d="M12 8v4l3 3"/>
                    </svg>
                    Crédits
                    <span className="badge bg-warning text-dark ms-1">
                      {credits?.current_balance || 0}
                    </span>
                  </Nav.Link>

                  {/* Language Switcher */}
                  <div className="mx-2">
                    <LanguageSwitcher />
                  </div>

                  {/* Profile Dropdown */}
                  <Dropdown className="mx-2">
                    <Dropdown.Toggle variant="outline-secondary" className="d-flex align-items-center border-0">
                      <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <circle cx="12" cy="8" r="4"/>
                        <path d="M4 21v-2a4 4 0 014-4h8a4 4 0 014 4v2"/>
                      </svg>
                    </Dropdown.Toggle>

                    <Dropdown.Menu align="end">
                      <Dropdown.Item as={Link} href="/profile">
                        <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" className="me-2">
                          <circle cx="12" cy="8" r="4"/>
                          <path d="M4 21v-2a4 4 0 014-4h8a4 4 0 014 4v2"/>
                        </svg>
                        {t('profile')}
                      </Dropdown.Item>
                      <Dropdown.Item as={Link} href="/settings">
                        <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" className="me-2">
                          <circle cx="12" cy="12" r="3"/>
                          <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 01-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09a1.65 1.65 0 00-1-1.51 1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09a1.65 1.65 0 001.51-1 1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06a1.65 1.65 0 001.82.33h.09A1.65 1.65 0 008.91 3.09V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51h.09a1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06a1.65 1.65 0 00-.33 1.82v.09a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/>
                        </svg>
                        {t('settings')}
                      </Dropdown.Item>
                      <Dropdown.Item as={Link} href="/about">
                        <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" className="me-2">
                          <circle cx="12" cy="12" r="10"/>
                          <line x1="12" y1="16" x2="12" y2="12"/>
                          <line x1="12" y1="8" x2="12.01" y2="8"/>
                        </svg>
                        {t('about')}
                      </Dropdown.Item>
                      <Dropdown.Divider />
                      <Dropdown.Item onClick={logout}>
                        <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" className="me-2">
                          <path d="M16 17l5-5-5-5M21 12H9"/>
                          <rect x="3" y="5" width="6" height="14" rx="2"/>
                        </svg>
                        {t('logout')}
                      </Dropdown.Item>
                    </Dropdown.Menu>
                  </Dropdown>
                </>
              ) : (                <>
                  {/* Non-authenticated Menu Items - Show on all pages */}
                  <Nav.Link as={Link} href="/login" className="mx-2">
                    Connexion
                  </Nav.Link>
                  <Link href="/generate" className="ms-2">
                    <Button variant="primary">
                      Essayez gratuitement
                    </Button>
                  </Link>
                </>
              )}
            </Nav>
          </Navbar.Collapse>
        </Container>
      </Navbar>

      {/* Main Content */}
      <main className="flex-grow-1">
        {children}
      </main>
    </div>
  );
}
