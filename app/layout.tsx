import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import CoffeePopup from "../components/CoffeePopup";


import { config } from '@fortawesome/fontawesome-svg-core'
import '@fortawesome/fontawesome-svg-core/styles.css'
config.autoAddCss = false

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const plausibleEnabled = process.env.NEXT_PUBLIC_PLAUSIBLE_ENABLED === "true";
const plausibleDomain = process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN;
const plausibleScript = process.env.NEXT_PUBLIC_PLAUSIBLE_SRC
  ?? "https://plausible.io/js/script.js";
const showCoffeePopup = process.env.NEXT_PUBLIC_COFFEE_ENABLED === "true";
const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "https://your-site.com";
const siteName = process.env.NEXT_PUBLIC_SITE_NAME ?? "Bitpanda Status - Community Edition";
const socialXUrl = process.env.NEXT_PUBLIC_SOCIAL_X_URL ?? "https://x.com/your-x-profile";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL ?? "https://your-site.com"),
  title: process.env.NEXT_PUBLIC_SITE_NAME ?? "Bitpanda Status - Community Edition",
  description: "Your community made alternative for status.bitpanda.com. Real-time status monitor for Bitpanda deposit, withdraw, staking, trading and more.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": siteName,
    "url": baseUrl,
    "description": "Your community made alternative for status.bitpanda.com. Real-time status monitor for Bitpanda deposit, withdraw, staking, trading and more.",
    "publisher": {
      "@type": "Organization",
      "name": siteName,
      "url": baseUrl,
      "sameAs": socialXUrl ? [socialXUrl] : []
    }
  };

  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
        />
        {plausibleEnabled && plausibleDomain ? (
          <script defer data-domain={plausibleDomain} src={plausibleScript}></script>
        ) : null}
        {showCoffeePopup ? <CoffeePopup /> : null}
        <div className="min-h-screen bg-linear-to-br from-gradient-start to-gradient-end font-sans">
          {children}
        </div>
      </body>
    </html>
  );
}
