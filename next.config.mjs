/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false, // Desactivar en desarrollo para evitar doble render
  // Permite que el build de producción continúe aunque haya errores de TypeScript
  typescript: {
    ignoreBuildErrors: true,
  },
  // Opcional: omitir errores de ESLint en el build de producción
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Optimizaciones
  poweredByHeader: false,
  images: {
    unoptimized: true, // Más rápido en desarrollo
  },
};

export default nextConfig;
