import dynamic from "next/dynamic";
import type { Metadata } from "next";
import "./globals.css";
import Image from "next/image";
import Script from "next/script";

export const metadata: Metadata = {
  title: "Promociones Samsung Ecuador | Ofertas Exclusivas",
  description: "Descubre las mejores promociones y ofertas exclusivas de Samsung en Ecuador. Encuentra smartphones, tablets, televisores y más con descuentos increíbles en tu ciudad.",
  keywords: ["Samsung", "Ecuador", "promociones", "ofertas", "smartphones", "Galaxy", "descuentos", "electrónica"],
  authors: [{ name: "Samsung Ecuador" }],
  creator: "Samsung Ecuador",
  category: "technology",
  applicationName: "Samsung Ecuador Promociones",
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
        <Script id="gtm" strategy="beforeInteractive">
          {`
          (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
          new Date().getTime(),event:'gtm.js'});
          var f=d.getElementsByTagName(s)[0],
          j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';
          j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;
          f.parentNode.insertBefore(j,f);
          })(window,document,'script','dataLayer','GTM-K8NT2C8K');
          `}
        </Script>
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
        <noscript>
          <iframe
            src="https://www.googletagmanager.com/ns.html?id=GTM-K8NT2C8K"
            height="0"
            width="0"
            style={{ display: "none", visibility: "hidden" }}
          />
        </noscript>


        <Script
          id="jsonld"
          type="application/ld+json"
          strategy="afterInteractive"
        >
        {JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Organization",
          name: "Samsung Ecuador",
          url: "https://www.samsungecuador.com",
          logo: "https://www.samsungecuador.com/og-image.png",
          sameAs: [
            "https://www.facebook.com/",
            "https://www.instagram.com/"
          ]
        })}
        </Script>

        <header className="sticky top-0 z-20 border-b border-slate-200 bg-white">
          <div className="mx-auto flex max-w-6xl items-center justify-center px-4 py-3 sm:py-4">
            {/* Grid de 5 columnas: 20% imagen, 60% contenido, 20% vacío */}
            <div className="grid grid-cols-5 gap-4 w-full items-center">
              {/* 20% - Imagen de Ecuador */}
              <div className="flex items-center justify-center">
                <div className="relative w-12 h-12 sm:w-12 sm:h-12">
                  <Image
                    src="/logoS.png"
                    alt="Ecuador"
                    fill
                    sizes="100px"
                    className="object-contain"
                  />
                </div>
              </div>

              {/* 60% - Contenido Samsung (3 columnas) */}
              <div className="col-span-3 flex flex-col items-center gap-1.5">
                <div className="relative h-10 w-40 sm:h-12 sm:w-48">
                  <a href="/">
                    <Image
                      src="/logoSamsung.png"
                      alt="Samsung"
                      fill
                      sizes="192px"
                      className="object-contain"
                      priority
                    />
                  </a>
                </div>
                <div className="text-black text-center text-sm sm:text-xl">
                  Vive la mejor experiencia en nuestras tiendas físicas.
                </div>
              </div>

              {/* 20% - Espacio vacío */}
              <div></div>
            </div>
          </div>
        </header>
        <main className="mx-auto max-w-6xl px-4 py-2 sm:py-8">{children}</main>
      </body>
    </html>
  );
}
