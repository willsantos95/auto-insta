import type { Metadata } from "next";
import "@/styles/theme.css";
import "./globals.css";

export const metadata: Metadata = {
  title: "Instagram Auto | Porão da Net",
  description: "Automação própria de comentários e mensagens do Instagram.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
