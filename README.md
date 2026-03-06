# Promociones Samsung Ecuador

Landing de promociones por ciudad y punto de venta con panel de administración.

## Stack

- Next.js (App Router, TypeScript)
- Tailwind CSS
- Firebase (Auth + Firestore)

## Configuración rápida

1. Instalar dependencias:

   ```bash
   npm install
   ```

2. Crear archivo `.env.local` en la raíz con tu proyecto de Firebase:

   ```bash
   NEXT_PUBLIC_FIREBASE_API_KEY=xxxx
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=xxxx
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=xxxx
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=xxxx
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=xxxx
   NEXT_PUBLIC_FIREBASE_APP_ID=xxxx
   ```

3. Ejecutar el entorno de desarrollo:

   ```bash
   npm run dev
   ```

4. Flujos principales

- Landing pública en `/`:
  - Elige ciudad → elige lugar → se muestran promociones como cards informativas (no clickeables).
- Panel admin (solo para usuarios autenticados de Firebase):
  - `/admin/login`: login / registro de admin.
  - `/admin`: crear país, ciudades y lugares.
  - `/admin/promotions`: ver inventario de lugares, filtrar por ciudad/lugar y crear promociones por lugar.

Asegúrate de crear al menos un país (Ecuador), ciudades y lugares desde el panel admin antes de cargar promociones.
"# samsungPromociones" 
