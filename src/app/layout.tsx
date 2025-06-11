import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "react-hot-toast";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Your Stock Portfolio - Real-time Stock Prices & Investment Dashboard",
  description:
    "Track your stocks effortlessly with real-time prices, company profiles, and personalized recommendations. Manage your investment portfolio and stay updated with the latest market trends.",
  keywords: [
    "stock portfolio",
    "stock prices",
    "investment dashboard",
    "real-time stocks",
    "stock tracking",
    "portfolio management",
    "stock market",
    "investment tracker",
    "financial dashboard",
  ].join(", "),
  openGraph: {
    title: "Your Stock Portfolio - Real-time Stock Prices & Investment Dashboard",
    description:
      "Track your stocks effortlessly with real-time prices, company profiles, and personalized recommendations. Manage your investment portfolio and stay updated with the latest market trends.",
    url: "https://stock-elimentary.vercel.app/",
    siteName: "Stock Tracker",
    type: "website",
    images: [
      {
        url: "https://stock-elimentary.vercel.app/",
        width: 1200,
        height: 630,
        alt: "Stock Portfolio Dashboard Preview",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Your Stock Portfolio - Real-time Stock Prices & Investment Dashboard",
    description:
      "Track your stocks effortlessly with real-time prices, company profiles, and personalized recommendations. Manage your investment portfolio and stay updated with the latest market trends.",
    images: ["https://yourdomain.com/og-image-portfolio.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Toaster position="top-right" />
        {children}
      </body>
    </html>
  );
}
