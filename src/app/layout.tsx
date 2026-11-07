import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Biogly — Free subdomains for student projects",
  description:
    "Biogly gives students a free subdomain for anything they build. Claim yourname.biogly.tech, point it at your project, and go live after a quick human review.",
  keywords: ["Biogly", "subdomain", "students", "free domain", "DNS", "student projects"],
  openGraph: {
    title: "Biogly — Free subdomains for student projects",
    description: "Claim yourname.biogly.tech and point it at anything you build.",
    siteName: "Biogly",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
