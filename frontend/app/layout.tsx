import type { Metadata } from "next";
import "./globals.css";


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
      <body>{children}</body>
    </html>
  );
}
