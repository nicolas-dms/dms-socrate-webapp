"use client";
import '../i18n/i18n';
import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Container, Nav, Navbar, Button } from "react-bootstrap";
import Image from "next/image";
import { useTranslation } from "react-i18next";
import { useAuth } from "../context/AuthContext";
import { useCredits } from "../context/CreditsContext";
import LanguageSwitcher from "./LanguageSwitcher";

export default function TopNavLayout({ children }: { children: React.ReactNode }) {
  const { t } = useTranslation();
  const { user, logout } = useAuth();
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
                  {/* Authenticated Menu Items */}
                  <Nav.Link as={Link} href="/generate" className="d-flex align-items-center mx-2">
                    <Image src="/pen-icon.svg" alt="" width={18} height={18} className="me-1" />
                    Générer
                  </Nav.Link>

                  <Nav.Link as={Link} href="/sessions" className="d-flex align-items-center mx-2">
                    <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" className="me-1">
                      <rect x="3" y="4" width="18" height="18" rx="2"/>
                      <path d="M16 2v4M8 2v4M3 10h18"/>
                    </svg>
                    Mes fiches
                  </Nav.Link>

                  {/* Credits Button */}
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

                  {/* Account Button */}
                  <Nav.Link as={Link} href="/account" className="d-flex align-items-center mx-2">
                    <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" className="me-1">
                      <circle cx="12" cy="8" r="4"/>
                      <path d="M4 21v-2a4 4 0 714-4h8a4 4 0 714 4v2"/>
                    </svg>
                    Mon compte
                  </Nav.Link>
                </>
              ) : (
                <>
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
