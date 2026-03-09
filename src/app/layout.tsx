import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "GEO Analyzer - Generative Engine Optimization Checker",
  description: "Check how well optimized your site is for AI crawlers and generative engines like ChatGPT, Claude, and Perplexity.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} antialiased bg-zinc-950`}>
        {children}
      </body>
    </html>
  );
}
