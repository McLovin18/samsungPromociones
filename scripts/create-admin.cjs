// Script para crear la cuenta de administrador usando Firebase Admin.
// Uso:
//   set FIREBASE_SERVICE_ACCOUNT_PATH=./serviceAccountKey.json
//   set ADMIN_EMAIL=admin@tudominio.com
//   set ADMIN_PASSWORD=una-contraseña-segura
//   npm run create-admin
//
// En macOS / Linux usa `export` en lugar de `set`.

const { initializeApp, cert } = require("firebase-admin/app");
const { getAuth } = require("firebase-admin/auth");
const path = require("path");

async function main() {
  const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;
  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!serviceAccountPath) {
    console.error("FIREBASE_SERVICE_ACCOUNT_PATH no está definido.");
    console.error("Apunta al archivo JSON de cuenta de servicio que descargaste desde la consola de Firebase.");
    process.exit(1);
  }

  if (!adminEmail || !adminPassword) {
    console.error("ADMIN_EMAIL y ADMIN_PASSWORD deben estar definidos como variables de entorno.");
    process.exit(1);
  }

  const resolvedPath = path.resolve(serviceAccountPath);
  // Este require carga el JSON de la cuenta de servicio. NO lo subas al repositorio.
  const serviceAccount = require(resolvedPath);

  initializeApp({
    credential: cert(serviceAccount),
  });

  const auth = getAuth();

  try {
    // Si ya existe, simplemente lo mostramos.
    const existing = await auth.getUserByEmail(adminEmail).catch(() => null);
    if (existing) {
      console.log("Ya existe un usuario con ese correo. UID:", existing.uid);
      return;
    }

    const user = await auth.createUser({
      email: adminEmail,
      password: adminPassword,
      emailVerified: false,
      disabled: false,
    });

    console.log("Usuario admin creado correctamente. UID:", user.uid);
  } catch (error) {
    console.error("Error creando usuario admin:", error);
    process.exit(1);
  }
}

main();
