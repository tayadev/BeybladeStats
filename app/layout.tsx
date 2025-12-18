import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ConvexAuthNextjsServerProvider } from "@convex-dev/auth/nextjs/server";
import ConvexClientProvider from "@/components/ConvexClientProvider";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Analytics } from "@vercel/analytics/next";
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"
  ),
  title: {
    default: "BLG Beyblade Stats",
    template: "%s | BLG Beyblade Stats",
  },
  description: "Track rankings, matches, and tournament results for Bladers League Gaming",
  keywords: [
    "beyblade",
    "stats",
    "rankings",
    "tournaments",
    "ELO",
    "leaderboard",
    "BLG",
    "Bladers League Gaming",
  ],
  icons: {
    icon: "/blg.svg",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: "BLG Beyblade Stats",
    title: "BLG Beyblade Stats",
    description: "Track rankings, matches, and tournament results for Bladers League Gaming",
    images: [
      {
        url: "/og-default.png",
        width: 1200,
        height: 630,
        alt: "BLG Beyblade Stats",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "BLG Beyblade Stats",
    description: "Track rankings, matches, and tournament results for Bladers League Gaming",
    images: ["/og-default.png"],
  },
  viewport: {
    width: "device-width",
    initialScale: 1,
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ConvexAuthNextjsServerProvider>
      <html lang="en">
        <body
          className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        >
          <ConvexClientProvider>{children}</ConvexClientProvider>
          <SpeedInsights />
          <Analytics />
        </body>
      </html>
    </ConvexAuthNextjsServerProvider>
  );
}
