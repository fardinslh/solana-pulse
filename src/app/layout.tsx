import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SolanaPulse | Solana Ecosystem State Report",
  description:
    "An automatically updating, keyless report covering Solana network performance, validators, economics, real-world assets, news and upgrades.",
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
