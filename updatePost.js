// updatePosts.js

const admin = require('firebase-admin');
const path = require('path');

// Carga las credenciales de la cuenta de servicio
const serviceAccount = require(path.join(__dirname, 'serviceAccountKey.json'));

// Inicializa el SDK de Firebase Admin con las credenciales
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

async function updateCollection(collectionName, isNSFW) {
  const collectionRef = db.collection(collectionName);
  const snapshot = await collectionRef.get();

  let batch = db.batch();
  let batchCount = 0;
  let totalUpdated = 0;

  for (const doc of snapshot.docs) {
    const data = doc.data();
    let newCategory = data.category;

    if (newCategory) {
      if (newCategory.startsWith('SFW - ')) {
        newCategory = newCategory.replace('SFW - ', '');
      } else if (newCategory.startsWith('NSFW - ')) {
        newCategory = newCategory.replace('NSFW - ', '');
      }
    }

    batch.update(doc.ref, {
      category: newCategory,
      isNSFW: isNSFW
    });

    batchCount++;

    if (batchCount === 500) {
      await batch.commit();
      console.log(`Se actualizaron 500 posts en ${collectionName}.`);
      batch = db.batch();
      batchCount = 0;
    }

    totalUpdated++;
  }

  if (batchCount > 0) {
    await batch.commit();
    console.log(`Se actualizaron ${batchCount} posts finales en ${collectionName}.`);
  }

  console.log(`Se actualizaron un total de ${totalUpdated} posts en ${collectionName}.`);
}

async function updatePosts() {
  try {
    // Actualizar PostsCollection (posts SFW)
    await updateCollection('PostsCollection', false);

    // Actualizar PostsCollectionMature (posts NSFW)
    await updateCollection('PostsCollectionMature', true);

    console.log('Todos los posts han sido actualizados.');
  } catch (error) {
    console.error('Error al actualizar los posts:', error);
  }
}

updatePosts();
