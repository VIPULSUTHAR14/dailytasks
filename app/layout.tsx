import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { SpotlightClient } from "@/components/SpotlightClient";
import { AppShell } from "@/components/AppShell";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AlgoCraft Workspace",
  description: "High-velocity algorithmic workspace, practice sprints, and habit tracking",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var saved = localStorage.getItem('algocraft_theme') || 'striking-simple';
                  var lightThemes = ['mono-light','metallic-chic','vibrant-calm','minimal-warm','youthful-fun','close-to-nature','lively-soothing'];
                  var mode = lightThemes.indexOf(saved) !== -1 ? 'light' : 'dark';
                  document.documentElement.setAttribute('data-theme', saved);
                  document.documentElement.setAttribute('data-mode', mode);
                } catch(e) {}
              })();
            `,
          }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <SpotlightClient />
        <div className="app-canvas min-h-screen w-full flex flex-col">
          <AppShell>
            {children}
          </AppShell>
        </div>
      </body>
    </html>
  );
}
