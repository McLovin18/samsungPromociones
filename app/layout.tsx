import type { Metadata } from "next";
import "./globals.css";
import Image from "next/image";

export const metadata: Metadata = {
  title: "Promociones Samsung Ecuador | Ofertas Exclusivas",
  description: "Descubre las mejores promociones y ofertas exclusivas de Samsung en Ecuador. Encuentra smartphones, tablets, televisores y más con descuentos increíbles en tu ciudad.",
  keywords: ["Samsung", "Ecuador", "promociones", "ofertas", "smartphones", "Galaxy", "descuentos", "electrónica"],
  authors: [{ name: "Samsung Ecuador" }],
  creator: "Samsung Ecuador",
  publisher: "Samsung Ecuador",
  metadataBase: new URL("https://www.samsungecuador.com"),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "es_EC",
    url: "https://www.samsungecuador.com",
    siteName: "Samsung Ecuador Promociones",
    title: "Promociones Samsung Ecuador | Ofertas Exclusivas",
    description: "Descubre las mejores promociones y ofertas exclusivas de Samsung en Ecuador. Smartphones, tablets, televisores y más con descuentos increíbles.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Samsung Ecuador - Promociones y Ofertas Exclusivas",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Promociones Samsung Ecuador | Ofertas Exclusivas",
    description: "Descubre las mejores promociones y ofertas exclusivas de Samsung en Ecuador. Smartphones, tablets, televisores y más.",
    images: ["/og-image.jpeg"],
    creator: "@SamsungEcuador",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: [
      { url: "/og-image.jpeg", type: "image/jpeg" },
    ],
    apple: "/og-image.jpeg",
    shortcut: "/og-image.jpeg",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <head>
        <link
          rel="preload"
          href="https://static.samsung.com/images/ic/site/fonts/samsungone-400.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
        <link
          rel="preload"
          href="https://static.samsung.com/images/ic/site/fonts/samsungone-700.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
        <style
          dangerouslySetInnerHTML={{
            __html: `
              @font-face {
                font-family: 'SamsungOne';
                src: url('https://static.samsung.com/images/ic/site/fonts/samsungone-400.woff2') format('woff2'),
                     url('https://static.samsung.com/images/ic/site/fonts/samsungone-400.woff') format('woff');
                font-weight: 400;
                font-style: normal;
                font-display: swap;
              }
              @font-face {
                font-family: 'SamsungOne';
                src: url('https://static.samsung.com/images/ic/site/fonts/samsungone-700.woff2') format('woff2'),
                     url('https://static.samsung.com/images/ic/site/fonts/samsungone-700.woff') format('woff');
                font-weight: 700;
                font-style: normal;
                font-display: swap;
              }
              html, body, * {
                font-family: 'SamsungOne', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
              }
            `,
          }}
        />
      </head>
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
