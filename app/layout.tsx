import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

// Las fuentes se descargan en build y se sirven desde el propio dominio
// (sin peticiones a Google en tiempo de ejecución).
const inter = Inter({ subsets: ["latin"], variable: "--font-sans", display: "swap" });
const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "DevHub :: Panel de Productividad",
  description:
    "Hub de productividad para desarrolladores — entornos Docker, laboratorio de rendimiento de caché y repositorio de snippets.",
};

export const viewport: Viewport = {
  themeColor: "#0a0b0d",
  colorScheme: "dark",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="es" className={`dark ${inter.variable} ${jetbrainsMono.variable}`}>
      <body>
        <a
          href="#overview"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded focus:bg-carbon-800 focus:px-3 focus:py-2 focus:font-mono focus:text-xs focus:text-neon-blue"
        >
          Saltar al contenido
        </a>
        {children}
      </body>
    </html>
  );
}
