// Script para replicar productos de un lugar a todos los demás lugares en Firestore
// Ubicación: scripts/replicate-products.js

const { initializeApp} = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

// Inicializa Firebase
initializeApp({
  credential: require('firebase-admin').credential.cert(require('../serviceAccountKey.json')),
});

const db = getFirestore();

// Configura estos valores según tu base de datos
const SOURCE_PLACE_ID = 'n940nYOEpSJbh1NepYFj'; // Mall de los Andes (Ambato)
const PROMOTIONS_COLLECTION = 'promotions';
const PLACES_COLLECTION = 'places';

async function replicateProducts() {
  // 1. Obtén todos los productos del lugar fuente
  const productsSnapshot = await db.collection(PROMOTIONS_COLLECTION)
    .where('placeId', '==', SOURCE_PLACE_ID)
    .get();

  if (productsSnapshot.empty) {
    console.log('No hay productos para replicar.');
    return;
  }

  // 2. Obtén todos los lugares
  const placesSnapshot = await db.collection(PLACES_COLLECTION).get();
  const places = [];
  placesSnapshot.forEach(doc => {
    const data = doc.data();
    // Usa el ID del documento como placeId
    const placeId = doc.id;
    const placeName = data.placeName || data.name;
    if (placeId !== SOURCE_PLACE_ID && placeId && placeName) {
      places.push({
        placeId,
        placeName,
        cityId: data.cityId || undefined,
        cityName: data.cityName || undefined
      });
    } else if (placeId !== SOURCE_PLACE_ID) {
      console.warn(`Lugar ignorado por campos incompletos: ${doc.id}`);
    }
  });

  if (places.length === 0) {
    console.log('No hay otros lugares para replicar.');
    return;
  }

  // 3. Replica cada producto en cada lugar
  for (const productDoc of productsSnapshot.docs) {
    const productData = productDoc.data();
    for (const place of places) {
      const { price, ...rest } = productData; // Elimina el campo price
      const newProduct = {
        ...rest,
        placeId: place.placeId,
        placeName: place.placeName,
        createdAt: new Date(), // Actualiza la fecha de creación
      };
      // Solo agrega cityId y cityName si existen
      if (place.cityId) newProduct.cityId = place.cityId;
      if (place.cityName) newProduct.cityName = place.cityName;
      await db.collection(PROMOTIONS_COLLECTION).add(newProduct);
      console.log(`Producto '${productData.title}' replicado en '${place.placeName}' (${place.cityName})`);
    }
  }

  console.log('Replicación completada.');
}

replicateProducts().catch(console.error);
