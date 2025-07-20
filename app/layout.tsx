import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import TopNavLayout from "../components/TopNavLayout";
import { AuthProvider } from "../context/AuthContext";
import { CreditsProvider } from "../context/CreditsContext";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ExoMinutes",
  description: "ExoMinutes - Générateur d'exercices éducatifs pour les parents et enseignants.",
  icons: {
    icon: "/pen-icon.svg",
    shortcut: "/pen-icon.svg",
    apple: "/pen-icon.svg"
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <head>
        <link rel="icon" href="/pen-icon.svg" type="image/svg+xml" />
        <title>ExoMinutes</title>
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        <AuthProvider>
          <CreditsProvider>
            <TopNavLayout>{children}</TopNavLayout>
          </CreditsProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
