import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import { datosEmpresa } from "@/lib/empresa";

export async function generateMetadata(): Promise<Metadata> {
  return { title: datosEmpresa().nombre, description: "Edificios, unidades, inquilinos, contratos y cobros" };
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="es">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link
          href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600&family=Manrope:wght@600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
