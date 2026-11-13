import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SIGESUB · Gestión y Trazabilidad de Subvenciones Públicas",
  description:
    "Plataforma institucional para el control presupuestario, seguimiento de subvenciones concedidas, proyectos de inversión y expedientes vinculados.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className="antialiased selection:bg-slate-900 selection:text-white">
        {children}
      </body>
    </html>
  );
}
