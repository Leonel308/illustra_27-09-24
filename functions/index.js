const functions = require('firebase-functions');
const admin = require('firebase-admin');
const axios = require('axios');
const cors = require('cors');
const express = require('express');
const dotenv = require('dotenv');

// Cargar variables de entorno desde el archivo .env
dotenv.config(); 

// Inicializar Firebase Admin
admin.initializeApp();

const app = express();
const allowedOrigins = ['https://illustra.app', 'http://localhost:3000'];

// Configurar CORS para permitir solicitudes desde orígenes específicos
app.use(cors({
  origin: allowedOrigins,
  methods: 'GET, POST, OPTIONS',
  allowedHeaders: 'Content-Type',
}));

// Middleware para manejar OPTIONS preflight requests
app.options('*', cors());

// Credenciales de Mercado Pago desde variables de entorno o configuración de Firebase
const MERCADO_PAGO_CLIENT_ID = process.env.MERCADOPAGO_CLIENT_ID || functions.config().mercadopago.client_id;
const MERCADO_PAGO_CLIENT_SECRET = process.env.MERCADOPAGO_CLIENT_SECRET || functions.config().mercadopago.client_secret;
const REDIRECT_URI = process.env.MERCADOPAGO_REDIRECT_URI || functions.config().mercadopago.redirect_uri;
const ACCESS_TOKEN = process.env.MERCADOPAGO_ACCESS_TOKEN || functions.config().mercadopago.access_token;

// Función para guardar una transacción
const saveTransaction = async (uid, type, amount, status) => {
  try {
    const userRef = admin.firestore().collection('users').doc(uid);
    await userRef.collection('transactions').add({
      type,
      amount,
      status,
      timestamp: admin.firestore.FieldValue.serverTimestamp()
    });
  } catch (error) {
    console.error('Error al guardar la transacción:', error);
  }
};

// Función para crear un pago en Mercado Pago (también usada para añadir saldo)
app.post('/createAddBalancePayment', async (req, res) => {
  const { amount, uid } = req.body;

  // Validar los campos requeridos
  if (!amount || !uid) {
    return res.status(400).json({ error: "Faltan campos requeridos: amount, uid" });
  }

  try {
    // Obtener los datos del usuario desde Firestore
    const userDoc = await admin.firestore().collection('users').doc(uid).get();
    
    if (!userDoc.exists) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    const userData = userDoc.data();
    const payerEmail = userData.email; // Obtener el correo del usuario

    // Crear la preferencia de pago en Mercado Pago
    const preference = {
      items: [
        {
          title: 'Recarga de saldo',
          unit_price: parseFloat(amount),
          quantity: 1,
        },
      ],
      payer: {
        email: payerEmail,
      },
      back_urls: {
        success: `https://illustra.app/success?uid=${uid}`,
        failure: "https://illustra.app/failure",
        pending: "https://illustra.app/pending",
      },
      auto_return: "approved",
    };

    // Enviar la solicitud a Mercado Pago
    const response = await axios.post("https://api.mercadopago.com/checkout/preferences", preference, {
      headers: {
        Authorization: `Bearer ${ACCESS_TOKEN}`
      }
    });

    // Guardar la transacción
    await saveTransaction(uid, 'recharge', parseFloat(amount), 'pending');

    // Devolver la URL de Mercado Pago
    res.json({ init_point: response.data.init_point });
  } catch (error) {
    console.error("Error al crear la preferencia de pago:", error.message);
    res.status(500).json({ error: "Error al crear la preferencia de pago" });
  }
});

// Función para verificar el estado del pago y actualizar balance/pending balance
app.post('/verifyPayment', async (req, res) => {
  const { uid, paymentId } = req.body;

  if (!uid || !paymentId) {
    return res.status(400).json({ error: "Faltan campos requeridos: uid, paymentId" });
  }

  try {
    const paymentResponse = await axios.get(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
      headers: { Authorization: `Bearer ${ACCESS_TOKEN}` }
    });

    if (paymentResponse.data.status === 'approved') {
      const userRef = admin.firestore().collection('users').doc(uid);
      await userRef.update({
        balance: admin.firestore.FieldValue.increment(paymentResponse.data.transaction_amount),
        pendingBalance: admin.firestore.FieldValue.increment(-paymentResponse.data.transaction_amount)
      });

      // Actualizar el estado de la transacción
      await saveTransaction(uid, 'recharge', paymentResponse.data.transaction_amount, 'completed');

      res.json({ success: true, message: "Pago verificado y balance actualizado" });
    } else {
      res.json({ success: false, message: "El pago no ha sido aprobado" });
    }
  } catch (error) {
    console.error('Error al verificar el pago:', error);
    res.status(500).json({ error: 'Error al verificar el pago' });
  }
});

// Función para manejar el token de autorización de Mercado Pago
app.get('/mercadoPagoToken', async (req, res) => {
  const { code, state } = req.query;

  if (!code || !state) {
    console.error("Parámetros de URL inválidos: ", req.query);
    return res.status(400).json({ error: "Parámetros de URL inválidos." });
  }

  try {
    // Solicitar el token de acceso
    const response = await axios.post("https://api.mercadopago.com/oauth/token", {
      grant_type: "authorization_code",
      client_id: MERCADO_PAGO_CLIENT_ID,
      client_secret: MERCADO_PAGO_CLIENT_SECRET,
      code: code,
      redirect_uri: REDIRECT_URI,
    });

    const { access_token, refresh_token } = response.data;

    // Guardar los tokens en Firestore
    const userRef = admin.firestore().collection('users').doc(state);
    await userRef.update({
      mercadoPagoAccessToken: access_token,
      mercadoPagoRefreshToken: refresh_token,
    });

    res.json(response.data);
  } catch (error) {
    console.error("Error al obtener tokens de Mercado Pago:", error.response ? error.response.data : error.message);
    res.status(500).json({ error: "Error al obtener tokens de Mercado Pago" });
  }
});

// Función para desvincular Mercado Pago
app.get('/unlinkMercadoPago', async (req, res) => {
  const { uid } = req.query;

  if (!uid) {
    return res.status(400).json({ error: "Parámetros de URL inválidos. No se pudo desvincular Mercado Pago." });
  }

  try {
    // Eliminar los tokens de Firestore
    const userRef = admin.firestore().collection('users').doc(uid);
    await userRef.update({
      mercadoPagoAccessToken: admin.firestore.FieldValue.delete(),
      mercadoPagoRefreshToken: admin.firestore.FieldValue.delete(),
    });
    res.json({ message: "Cuenta de Mercado Pago desvinculada." });
  } catch (error) {
    console.error("Error al desvincular cuenta de Mercado Pago:", error);
    res.status(500).json({ error: "Error al desvincular Mercado Pago." });
  }
});

// Función para aprobar pagos a usuarios
app.post('/approvePayment', async (req, res) => {
  const { uid, amount } = req.body;

  if (!uid || !amount) {
    return res.status(400).json({ error: "Faltan campos requeridos: uid, amount" });
  }

  try {
    // Obtener el token de acceso desde Firestore
    const userRef = admin.firestore().collection('users').doc(uid);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    const userData = userDoc.data();
    const accessToken = userData.mercadoPagoAccessToken;

    // Crear la solicitud de pago
    const paymentData = {
      transaction_amount: amount,
      reason: "Retiro",
      payment_method_id: "account_money",
      payer: {
        type: "customer",
        id: uid
      }
    };

    // Enviar la solicitud de pago a Mercado Pago
    const paymentResponse = await axios.post("https://api.mercadopago.com/v1/payments", paymentData, {
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    });

    if (paymentResponse.data && paymentResponse.data.status === "approved") {
      // Actualizar el balance en Firestore
      await userRef.update({
        balance: admin.firestore.FieldValue.increment(-amount),
        pendingBalance: admin.firestore.FieldValue.increment(-amount)
      });

      // Guardar la transacción
      await saveTransaction(uid, 'withdrawal', amount, 'completed');

      res.json({ message: "Pago aprobado y procesado" });
    } else {
      throw new Error('El pago no fue aprobado');
    }
  } catch (error) {
    console.error("Error al aprobar el pago:", error);
    res.status(500).json({ error: "Error al aprobar el pago" });
  }
});

// Función para manejar notificaciones de pagos desde el webhook de Mercado Pago
app.post('/paymentNotification', async (req, res) => {
  const { type, data } = req.body;

  if (type === 'payment') {
    try {
      const paymentId = data.id;

      // Obtener la información del pago desde Mercado Pago
      const paymentResponse = await axios.get(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
        headers: { Authorization: `Bearer ${ACCESS_TOKEN}` }
      });

      const paymentStatus = paymentResponse.data.status;
      const uid = paymentResponse.data.payer.id;
      const amount = paymentResponse.data.transaction_amount;

      if (paymentStatus === 'approved') {
        const withdrawalRequestRef = admin.firestore().collection('withdrawalRequests').doc(uid);
        await withdrawalRequestRef.update({ status: 'approved' });
        await withdrawalRequestRef.delete();

        // Actualizar el balance del usuario
        const userRef = admin.firestore().collection('users').doc(uid);
        await userRef.update({
          balance: admin.firestore.FieldValue.increment(-amount),
          pendingBalance: admin.firestore.FieldValue.increment(-amount)
        });

        // Guardar la transacción
        await saveTransaction(uid, 'withdrawal', amount, 'completed');
      }

      res.sendStatus(200);
    } catch (error) {
      console.error('Error al manejar el webhook:', error);
      res.status(500).json({ error: 'Error al manejar el webhook' });
    }
  } else {
    res.sendStatus(200);
  }
});

// Función para actualizar el pendingBalance
app.post('/updatePendingBalance', async (req, res) => {
  const { uid, amount, action } = req.body;

  if (!uid || !amount || !action) {
    return res.status(400).json({ error: "Faltan campos requeridos: uid, amount, action" });
  }

  try {
    const userRef = admin.firestore().collection('users').doc(uid);
    
    if (action === 'refund') {
      // Devolver saldo al balance y reducir el pendingBalance
      await userRef.update({
        balance: admin.firestore.FieldValue.increment(amount),
        pendingBalance: admin.firestore.FieldValue.increment(-amount)
      });
      // Guardar la transacción de reembolso
      await saveTransaction(uid, 'refund', amount, 'completed');
    } else if (action === 'transfer') {
      // Reducir el pendingBalance
      await userRef.update({
        pendingBalance: admin.firestore.FieldValue.increment(-amount)
      });
      // Guardar la transacción de transferencia
      await saveTransaction(uid, 'transfer', amount, 'completed');
    }

    res.json({ message: "Pending balance actualizado exitosamente" });
  } catch (error) {
    console.error("Error al actualizar el pending balance:", error);
    res.status(500).json({ error: "Error al actualizar el pending balance" });
  }
});

// Función para actualizar imágenes en Firebase Storage y eliminar las anteriores
const updateProfileImage = async (uid, newImagePath, type) => {
  const userRef = admin.firestore().collection('users').doc(uid);
  const userDoc = await userRef.get();

  if (!userDoc.exists) {
    throw new Error('Usuario no encontrado');
  }

  const userData = userDoc.data();
  let oldImagePath = '';

  // Determinar el tipo de imagen que se está actualizando (perfil, banner o fondo)
  if (type === 'profile') {
    oldImagePath = userData.photoURL;
    await userRef.update({
      photoURL: newImagePath
    });
  } else if (type === 'banner') {
    oldImagePath = userData.bannerURL;
    await userRef.update({
      bannerURL: newImagePath
    });
  } else if (type === 'background') {
    oldImagePath = userData.backgroundURL;
    await userRef.update({
      backgroundURL: newImagePath
    });
  }

  // Eliminar la imagen anterior
  if (oldImagePath) {
    const oldFile = admin.storage().bucket().file(oldImagePath);
    await oldFile.delete();
    console.log(`Imagen eliminada: ${oldImagePath}`);
  }

  console.log(`Imagen actualizada: ${type} para el usuario: ${uid}`);
};

// Función que se ejecuta cuando se actualiza un documento de usuario en Firestore
exports.uploadImage = functions.firestore.document('users/{uid}').onUpdate(async (change, context) => {
  const newValue = change.after.data();
  const previousValue = change.before.data();

  // Verificar si la imagen de perfil ha cambiado
  if (newValue.photoURL !== previousValue.photoURL) {
    await updateProfileImage(context.params.uid, newValue.photoURL, 'profile');
  }

  // Verificar si el banner ha cambiado
  if (newValue.bannerURL !== previousValue.bannerURL) {
    await updateProfileImage(context.params.uid, newValue.bannerURL, 'banner');
  }

  // Verificar si el fondo ha cambiado
  if (newValue.backgroundURL !== previousValue.backgroundURL) {
    await updateProfileImage(context.params.uid, newValue.backgroundURL, 'background');
  }
});

// Exportar la aplicación Express como una función de Firebase
exports.api = functions.https.onRequest(app);
