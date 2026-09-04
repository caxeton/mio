import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "DevHub :: Panel de Productividad",
  description:
    "Hub de productividad para desarrolladores — entornos Docker, laboratorio de rendimiento de caché y repositorio de snippets.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className="dark">
      <body>{children}</body>
    </html>
  );
}
