import type { Metadata } from "next";
import { Space_Grotesk, JetBrains_Mono } from "next/font/google";
import { siteConfig } from "@/config/site";
import { Toaster } from "@/components/ui/toaster";
import "./globals.css";

// Force all pages to be dynamic - this app requires auth/DB on every route
export const dynamic = 'force-dynamic';

const sans = Space_Grotesk({
  variable: "--font-sans",
  subsets: ["latin"],
});

const mono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Finbers Link | Build Skills, Prove Readiness, and Get Hired",
  description: siteConfig.description,
  metadataBase: new URL("https://finbers-link.example.com"),
  icons: [{ url: "/favicon.ico" }],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${sans.variable} ${mono.variable} bg-background text-foreground antialiased`}>
        <div className="relative flex min-h-screen flex-col">
          {children}
        </div>
        <Toaster />
      </body>
    </html>
  );
}
