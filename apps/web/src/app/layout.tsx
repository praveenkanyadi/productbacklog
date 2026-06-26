import type { Metadata } from "next";
import { Nav } from "@/components/nav";
import "./globals.css";

export const metadata: Metadata = {
  title: "Extra Duty Management",
  description: "EDM - Employee extra duty requests and approvals",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-background font-sans antialiased">
        <Nav />
        <main className="container mx-auto px-6 py-8">{children}</main>
      </body>
    </html>
  );
}
