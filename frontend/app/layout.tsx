import type { Metadata } from "next";
import { Newsreader, Space_Grotesk } from "next/font/google";
import "./globals.css";

const uiFont = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const displayFont = Newsreader({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
  adjustFontFallback: false,
});


export const metadata: Metadata = {
  title: "GenomeCanvas",
  description: "An interactive protein universe for exploring targets, diseases, drugs, and structures.",
};


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${uiFont.variable} ${displayFont.variable}`}>{children}</body>
    </html>
  );
}
