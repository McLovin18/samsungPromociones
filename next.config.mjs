/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Permite que el build de producción continúe aunque haya errores de TypeScript
  typescript: {
    ignoreBuildErrors: true,
  },
  // Opcional: omitir errores de ESLint en el build de producción
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
