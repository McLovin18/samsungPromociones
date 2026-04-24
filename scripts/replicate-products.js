// Script para replicar productos de un lugar a todos los demás lugares en Firestore
// Ubicación: scripts/replicate-products.js

const { initializeApp} = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

// Inicializa Firebase
initializeApp({
  credential: require('firebase-admin').credential.cert(require('../serviceAccountKey.json')),
});

const db = getFirestore();

const SOURCE_PLACE_NAME = 'Kiosko Samsung - Mall del Sol'; // Buscar por nombre
const PROMOTIONS_COLLECTION = 'promotions';
const PLACES_COLLECTION = 'places';

function getCreatedAtMs(value) {
  if (!value) return 0;
  if (value instanceof Date) return value.getTime();
  if (typeof value.toDate === 'function') return value.toDate().getTime();
  if (typeof value.seconds === 'number') return value.seconds * 1000;
  return 0;
}

function sortProducts(items) {
  return [...items].sort((a, b) => {
    const orderA = typeof a.order === 'number' ? a.order : Number.MAX_SAFE_INTEGER;
    const orderB = typeof b.order === 'number' ? b.order : Number.MAX_SAFE_INTEGER;

    if (orderA !== orderB) return orderA - orderB;

    return getCreatedAtMs(a.createdAt) - getCreatedAtMs(b.createdAt);
  });
}

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

    const sortedSourceProducts = sortProducts(sourceProducts).map((product, index) => ({
      ...product,
      order: typeof product.order === 'number' ? product.order : index,
    }));

    if (sortedSourceProducts.length === 0) {
      console.error(`❌ No hay productos en "${SOURCE_PLACE_NAME}"`);
      return;
    }

    console.log(`✅ Encontrados ${sortedSourceProducts.length} productos:\n`);
    sortedSourceProducts.forEach((p, i) => {
      console.log(`   ${i + 1}. [order ${p.order}] ${p.sku || 'sin-sku'} - ${p.title} - $${p.price}`);
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

      // Crear copias de los productos de Mall del Sol manteniendo sku y order
      for (const [index, sourceProduct] of sortedSourceProducts.entries()) {
        const newProduct = {
          sku: sourceProduct.sku || '',
          title: sourceProduct.title || '',
          description: sourceProduct.description || '',
          price: sourceProduct.price ?? 0,
          originalPrice: sourceProduct.originalPrice ?? null,
          imageUrl: sourceProduct.imageUrl || '',
          active: sourceProduct.active ?? true,
          order: typeof sourceProduct.order === 'number' ? sourceProduct.order : index,
          placeId: targetPlace.id,
          placeName: targetPlace.name,
          cityId: targetPlace.cityId,
          cityName: targetPlace.cityName,
          createdAt: new Date(),
        };

        await db.collection(PROMOTIONS_COLLECTION).add(newProduct);
        totalCreated++;
      }

      console.log(`   ✅ ${sortedSourceProducts.length} productos creados\n`);
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
