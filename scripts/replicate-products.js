// Script para replicar productos de un lugar a todos los demás lugares en Firestore
// Ubicación: scripts/replicate-products.js

const { initializeApp} = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

// Inicializa Firebase
initializeApp({
  credential: require('firebase-admin').credential.cert(require('../serviceAccountKey.json')),
});

const db = getFirestore();

const SOURCE_PLACE_NAME = 'Kiosko Samsung - Village Plaza'; // Buscar por nombre
const PROMOTIONS_COLLECTION = 'promotions';
const PLACES_COLLECTION = 'places';

async function replicateProducts() {
  try {
    console.log(`🚀 Iniciando replicación de productos desde "${SOURCE_PLACE_NAME}"...\n`);

    // 1. Encontrar el lugar fuente por nombre
    const placesSnapshot = await db.collection(PLACES_COLLECTION).get();
    let sourcePlace = null;
    const allPlaces = [];

    placesSnapshot.forEach(doc => {
      const data = doc.data();
      const placeId = doc.id;
      if (data.name === SOURCE_PLACE_NAME) {
        sourcePlace = { id: placeId, ...data };
      } else {
        allPlaces.push({ id: placeId, ...data });
      }
    });

    if (!sourcePlace) {
      console.error(`❌ No se encontró el lugar: "${SOURCE_PLACE_NAME}"`);
      return;
    }

    console.log(`✅ Lugar fuente encontrado: ${sourcePlace.name}`);
    console.log(`   ID: ${sourcePlace.id}\n`);

    // 2. Obtener los productos del lugar fuente
    const sourceProductsSnapshot = await db.collection(PROMOTIONS_COLLECTION)
      .where('placeId', '==', sourcePlace.id)
      .get();

    const sourceProducts = [];
    sourceProductsSnapshot.forEach(doc => {
      sourceProducts.push({
        id: doc.id,
        ...doc.data()
      });
    });

    if (sourceProducts.length === 0) {
      console.error(`❌ No hay productos en "${SOURCE_PLACE_NAME}"`);
      return;
    }

    console.log(`✅ Encontrados ${sourceProducts.length} productos:\n`);
    sourceProducts.forEach((p, i) => {
      console.log(`   ${i + 1}. ${p.title} - $${p.price}`);
    });
    console.log();

    if (allPlaces.length === 0) {
      console.log('ℹ️  No hay otros lugares para replicar.');
      return;
    }

    console.log(`✅ Encontrados ${allPlaces.length} lugares destino\n`);

    // 3. Para cada lugar, eliminar productos antiguos y crear nuevos
    let totalDeleted = 0;
    let totalCreated = 0;

    for (const targetPlace of allPlaces) {
      console.log(`📍 Procesando: ${targetPlace.name}`);

      // Eliminar productos anteriores
      const existingProducts = await db.collection(PROMOTIONS_COLLECTION)
        .where('placeId', '==', targetPlace.id)
        .get();

      for (const doc of existingProducts.docs) {
        await doc.ref.delete();
        totalDeleted++;
      }

      console.log(`   🗑️  Eliminados ${existingProducts.docs.length} productos anteriores`);

      // Crear copias de los productos de Village Plaza
      for (const sourceProduct of sourceProducts) {
        const newProduct = {
          title: sourceProduct.title || '',
          description: sourceProduct.description || '',
          price: sourceProduct.price ?? 0,
          originalPrice: sourceProduct.originalPrice ?? null,
          imageUrl: sourceProduct.imageUrl || '',
          placeId: targetPlace.id,
          placeName: targetPlace.name,
          cityId: targetPlace.cityId,
          cityName: targetPlace.cityName,
          createdAt: new Date(),
        };

        await db.collection(PROMOTIONS_COLLECTION).add(newProduct);
        totalCreated++;
      }

      console.log(`   ✅ ${sourceProducts.length} productos creados\n`);
    }

    console.log(`\n🎉 ¡Replicación completada!`);
    console.log(`   📊 Resumen:`);
    console.log(`      - Productos eliminados: ${totalDeleted}`);
    console.log(`      - Productos creados: ${totalCreated}`);
    console.log(`      - Lugares actualizados: ${allPlaces.length}`);
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    process.exit();
  }
}

replicateProducts();
