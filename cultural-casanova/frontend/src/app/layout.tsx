import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "The Cultural Casanova - Your Cross-Cultural Dating Coach",
  description: "Get romantic advice from Ricardo Corazón, the world's most passionate dating coach",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
