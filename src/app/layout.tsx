import type { Metadata, Viewport } from "next";
import "./globals.css";
export const metadata: Metadata = {
  title: "My Personal — Seu espaço de evolução",
  description: "Treinamento com informação, consciência e acompanhamento.",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "My Personal",
  },
};
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#146e53",
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
