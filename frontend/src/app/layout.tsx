import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "GenomeCanvas — Protein Explorer",
  description: "Interactive protein exploration platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        <div className="noise-overlay" />
        {children}
      </body>
    </html>
  );
}
