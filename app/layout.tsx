import type { Metadata } from "next";
import "./globals.css";
import Image from "next/image";

export const metadata: Metadata = {
  title: "Promociones Samsung Ecuador",
  description: "Landing de promociones por ciudad y punto de venta",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-950 to-slate-900 text-slate-50">
        <header className="sticky top-0 z-20 border-b border-slate-200 bg-white">
          <div className="mx-auto flex max-w-6xl flex-col items-center justify-center px-4 py-3 sm:py-4">
            <div className="flex flex-col items-center gap-1.5">
              <div className="relative h-10 w-40 sm:h-12 sm:w-48">
                <Image
                  src="/logoSamsung.png"
                  alt="Samsung"
                  fill
                  sizes="192px"
                  className="object-contain"
                  priority
                />
              </div>
            </div>
          </div>
        </header>
        <main className="mx-auto max-w-6xl px-4 py-2 sm:py-8">{children}</main>
      </body>
    </html>
  );
}
