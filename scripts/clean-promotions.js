// Script para limpiar y dejar solo los 6 productos promocionales de un lugar base en todos los lugares
// Ubicación: scripts/clean-promotions.js

const { initializeApp } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

// Inicializa Firebase
initializeApp({
  credential: require('firebase-admin').credential.cert(require('../serviceAccountKey.json')),
});

const db = getFirestore();

const SOURCE_PLACE_ID = 'R7g7tnIbvHQagnnAb7OL'; // Kiosko Samsung - Bahía Malecón 2000
const PROMOTIONS_COLLECTION = 'promotions';
const PLACES_COLLECTION = 'places';



async function addProductsToBasePlace() {
  // 1. Busca un lugar que no sea el base y tenga 6 productos
  const placesSnapshot = await db.collection(PLACES_COLLECTION).get();
  let sourcePlaceId = null;
  for (const doc of placesSnapshot.docs) {
    const placeId = doc.id;
    if (placeId === SOURCE_PLACE_ID) continue;
    const promosSnapshot = await db.collection(PROMOTIONS_COLLECTION)
      .where('placeId', '==', placeId)
      .get();
    if (promosSnapshot.size === 6) {
      sourcePlaceId = placeId;
      break;
    }
  }
  if (!sourcePlaceId) {
    console.error('No se encontró un lugar con 6 productos para copiar.');
    return;
  }

  // 2. Obtén los 6 productos del lugar fuente
  const sourceProductsSnapshot = await db.collection(PROMOTIONS_COLLECTION)
    .where('placeId', '==', sourcePlaceId)
    .get();
  const sourceProducts = sourceProductsSnapshot.docs.map(doc => doc.data());

  // 3. Obtén los datos del lugar base
  const basePlaceDoc = placesSnapshot.docs.find(doc => doc.id === SOURCE_PLACE_ID);
  const basePlaceData = basePlaceDoc ? basePlaceDoc.data() : {};

  // 4. Agrega los 6 productos al lugar base (sin eliminar nada)
  for (const product of sourceProducts) {
    const { price, ...rest } = product;
    const newProduct = {
      ...rest,
      placeId: SOURCE_PLACE_ID,
      placeName: basePlaceData.placeName || basePlaceData.name || '',
      createdAt: new Date(),
    };
    if (basePlaceData.cityId) newProduct.cityId = basePlaceData.cityId;
    if (basePlaceData.cityName) newProduct.cityName = basePlaceData.cityName;
    await db.collection(PROMOTIONS_COLLECTION).add(newProduct);
  }
  console.log('Agregados 6 productos al lugar base.');
}

addProductsToBasePlace().catch(console.error);
