// functions/index.js

const functions = require('firebase-functions');
const admin = require('firebase-admin');
const axios = require('axios');
const cors = require('cors');
const express = require('express');
const dotenv = require('dotenv');

// Cargar variables de entorno desde el archivo .env (solo útil localmente)
dotenv.config();

// Inicializar Firebase Admin
admin.initializeApp();

// Crear una instancia de Express
const app = express();

// Definir los orígenes permitidos para CORS
const allowedOrigins = ['https://illustra.app', 'http://localhost:3000'];

// Configurar CORS para permitir solicitudes desde orígenes específicos
app.use(cors({
  origin: allowedOrigins,
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Middleware para manejar OPTIONS preflight requests
app.options('*', cors({
  origin: allowedOrigins,
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Credenciales de Mercado Pago desde variables de entorno o configuración de Firebase
const MERCADO_PAGO_CLIENT_ID = process.env.MERCADOPAGO_CLIENT_ID || functions.config().mercadopago.client_id;
const MERCADO_PAGO_CLIENT_SECRET = process.env.MERCADOPAGO_CLIENT_SECRET || functions.config().mercadopago.client_secret;
const REDIRECT_URI = process.env.MERCADOPAGO_REDIRECT_URI || functions.config().mercadopago.redirect_uri;
const ACCESS_TOKEN = process.env.MERCADOPAGO_ACCESS_TOKEN || functions.config().mercadopago.access_token;

// Middleware de autenticación
const authenticate = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token de autenticación requerido.' });
  }

  const token = authHeader.split(' ')[1];
  
  try {
    const decodedToken = await admin.auth().verifyIdToken(token);
    req.user = decodedToken; // Adjuntar el token decodificado a la solicitud
    next();
  } catch (error) {
    console.error('Error al verificar el token de autenticación:', error);
    return res.status(401).json({ error: 'Token de autenticación inválido.' });
  }
};

// Función para guardar una transacción
const saveTransaction = async (uid, type, amount, status, transactionId) => {
  try {
    const transactionRef = admin.firestore().collection('users').doc(uid).collection('transactions').doc(transactionId);
    await transactionRef.set({
      type,
      amount,
      status,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      transactionId,
    });
    console.log(`Transacción guardada: ${transactionId} para el usuario: ${uid}`);
  } catch (error) {
    console.error('Error al guardar la transacción:', error);
  }
};

// Ruta: Crear Preferencia de Pago para Añadir Saldo
app.post('/createAddBalancePayment', authenticate, async (req, res) => {
  const { amount } = req.body;
  const uid = req.user.uid; // Obtener uid del usuario autenticado

  // Validar campos requeridos
  if (!amount) {
    console.error("Falta el campo requerido: amount");
    return res.status(400).json({ error: "Falta el campo requerido: amount" });
  }

  // Validar que el monto sea un número positivo
  if (isNaN(amount) || parseFloat(amount) <= 0) {
    console.error("El monto no es un número válido:", amount);
    return res.status(400).json({ error: "El monto debe ser un número positivo." });
  }

  try {
    // Obtener datos del usuario desde Firestore
    const userDoc = await admin.firestore().collection('users').doc(uid).get();

    if (!userDoc.exists) {
      console.error('Usuario no encontrado:', uid);
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    const userData = userDoc.data();
    const payerEmail = userData.email; // Suponiendo que el correo electrónico está almacenado

    // Generar un ID único para la transacción
    const transactionId = admin.firestore().collection('users').doc(uid).collection('transactions').doc().id;

    // Crear external_reference con formato: uid_transactionId
    const externalReference = `${uid}_${transactionId}`;

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
        success: `https://illustra.app/success?transactionId=${transactionId}`,
        failure: "https://illustra.app/failure",
        pending: "https://illustra.app/pending",
      },
      auto_return: "approved",
      external_reference: externalReference, // Incluir external_reference
    };

    // Enviar la solicitud a Mercado Pago
    const response = await axios.post("https://api.mercadopago.com/checkout/preferences", preference, {
      headers: {
        Authorization: `Bearer ${ACCESS_TOKEN}`
      }
    });

    // Guardar la transacción como pendiente
    await admin.firestore().collection('users').doc(uid).collection('transactions').doc(transactionId).set({
      type: 'recharge',
      amount: parseFloat(amount),
      status: 'pending',
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      paymentId: null,
      external_reference: externalReference,
    });

    // Incrementar el pendingBalance
    await admin.firestore().collection('users').doc(uid).update({
      pendingBalance: admin.firestore.FieldValue.increment(parseFloat(amount))
    });

    console.log(`Preferencia de pago creada para usuario: ${uid}, Transaction ID: ${transactionId}`);

    // Devolver la URL de Mercado Pago
    res.json({ init_point: response.data.init_point });
  } catch (error) {
    console.error("Error al crear la preferencia de pago:", error.response ? error.response.data : error.message);
    res.status(500).json({ error: "Error al crear la preferencia de pago" });
  }
});

// Ruta: Webhook de Notificación de Pagos de Mercado Pago
app.post('/paymentNotification', async (req, res) => {
  const { type, data } = req.body;

  console.log('Webhook recibido:', JSON.stringify(req.body, null, 2));

  if (type === 'payment') {
    try {
      const paymentId = data.id;

      // Obtener la información del pago desde Mercado Pago
      const paymentResponse = await axios.get(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
        headers: { Authorization: `Bearer ${ACCESS_TOKEN}` }
      });

      console.log('Respuesta de Mercado Pago:', JSON.stringify(paymentResponse.data, null, 2));

      const paymentStatus = paymentResponse.data.status;
      const externalReference = paymentResponse.data.external_reference;
      const amount = paymentResponse.data.transaction_amount;

      console.log(`Estado del pago: ${paymentStatus}`);
      console.log(`external_reference: ${externalReference}`);
      console.log(`Monto de la transacción: ${amount}`);

      // Verificar que external_reference esté bien formado
      if (!externalReference) {
        console.error('external_reference está vacío o no existe:', externalReference);
        res.sendStatus(200); // Aceptar la notificación pero no procesarla
        return;
      }

      const parts = externalReference.split('_');
      if (parts.length !== 2) {
        console.error('external_reference no tiene el formato esperado:', externalReference);
        res.sendStatus(200);
        return;
      }

      const [uid, transactionId] = parts;
      console.log(`UID: ${uid}, Transaction ID: ${transactionId}`);

      if (paymentStatus === 'approved' && uid && transactionId) {
        const userRef = admin.firestore().collection('users').doc(uid);
        const transactionRef = userRef.collection('transactions').doc(transactionId);
        const transactionDoc = await transactionRef.get();

        if (transactionDoc.exists) {
          const transactionData = transactionDoc.data();
          console.log(`Estado actual de la transacción: ${transactionData.status}`);

          if (transactionData.status === 'pending') {
            // Actualizar balance y pendingBalance
            await userRef.update({
              balance: admin.firestore.FieldValue.increment(amount),
              pendingBalance: admin.firestore.FieldValue.increment(-amount)
            });

            // Actualizar la transacción a 'completed' y añadir paymentId
            await transactionRef.update({
              status: 'completed',
              paymentId: paymentId,
              completedAt: admin.firestore.FieldValue.serverTimestamp()
            });

            console.log(`Transacción ${transactionId} completada para el usuario ${uid}`);
          } else {
            console.log(`La transacción ${transactionId} ya fue procesada con estado: ${transactionData.status}`);
          }
        } else {
          console.error(`Transacción ${transactionId} no encontrada para el usuario ${uid}`);
        }
      } else {
        console.error('Información de pago incompleta o estado no aprobado:', data);
      }

      res.sendStatus(200); // Aceptar la notificación
    } catch (error) {
      console.error('Error al manejar el webhook:', error.response ? error.response.data : error.message);
      res.status(500).json({ error: 'Error al manejar el webhook' });
    }
  } else {
    // Ignorar otros tipos de notificaciones
    console.log(`Notificación ignorada de tipo: ${type}`);
    res.sendStatus(200);
  }
});

// Ruta: Verificar el Pago
app.post('/verifyPayment', authenticate, async (req, res) => {
  const { transactionId } = req.body;
  const uid = req.user.uid; // Obtener uid del usuario autenticado

  if (!transactionId) {
    console.error("Falta el campo requerido: transactionId");
    return res.status(400).json({ error: "Falta el campo requerido: transactionId" });
  }

  try {
    const transactionRef = admin.firestore().collection('users').doc(uid).collection('transactions').doc(transactionId);
    const transactionDoc = await transactionRef.get();

    if (!transactionDoc.exists) {
      console.error(`Transacción ${transactionId} no encontrada para el usuario ${uid}`);
      return res.status(404).json({ error: "Transacción no encontrada." });
    }

    const transactionData = transactionDoc.data();

    if (transactionData.status === 'completed') {
      res.json({ success: true, message: "Pago verificado y balance actualizado" });
    } else if (transactionData.status === 'pending') {
      res.json({ success: false, message: "El pago aún está pendiente." });
    } else {
      res.json({ success: false, message: "Estado de pago desconocido." });
    }
  } catch (error) {
    console.error('Error al verificar el pago:', error);
    res.status(500).json({ error: 'Error al verificar el pago' });
  }
});

// Ruta: Obtener Token de Autorización de Mercado Pago
app.get('/mercadoPagoToken', authenticate, async (req, res) => {
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

    console.log(`Tokens de Mercado Pago actualizados para el usuario: ${state}`);
    res.json(response.data);
  } catch (error) {
    console.error("Error al obtener tokens de Mercado Pago:", error.response ? error.response.data : error.message);
    res.status(500).json({ error: "Error al obtener tokens de Mercado Pago" });
  }
});

// Ruta: Desvincular Mercado Pago
app.get('/unlinkMercadoPago', authenticate, async (req, res) => {
  const uid = req.user.uid;

  try {
    // Eliminar los tokens de Firestore
    const userRef = admin.firestore().collection('users').doc(uid);
    await userRef.update({
      mercadoPagoAccessToken: admin.firestore.FieldValue.delete(),
      mercadoPagoRefreshToken: admin.firestore.FieldValue.delete(),
    });
    console.log(`Cuenta de Mercado Pago desvinculada para el usuario: ${uid}`);
    res.json({ message: "Cuenta de Mercado Pago desvinculada." });
  } catch (error) {
    console.error("Error al desvincular cuenta de Mercado Pago:", error);
    res.status(500).json({ error: "Error al desvincular Mercado Pago." });
  }
});

// Ruta: Aprobar Pagos a Usuarios (Retiros)
app.post('/approvePayment', authenticate, async (req, res) => {
  const { amount } = req.body;
  const uid = req.user.uid;

  if (!amount) {
    console.error("Falta el campo requerido: amount");
    return res.status(400).json({ error: "Falta el campo requerido: amount" });
  }

  // Validar que el monto sea un número positivo
  if (isNaN(amount) || parseFloat(amount) <= 0) {
    console.error("El monto no es un número válido:", amount);
    return res.status(400).json({ error: "El monto debe ser un número positivo." });
  }

  try {
    // Obtener el token de acceso desde Firestore
    const userRef = admin.firestore().collection('users').doc(uid);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      console.error("Usuario no encontrado:", uid);
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    const userData = userDoc.data();
    const accessToken = userData.mercadoPagoAccessToken;

    if (!accessToken) {
      console.error("El usuario no tiene un token de Mercado Pago válido:", uid);
      return res.status(400).json({ error: "El usuario no tiene un token de Mercado Pago válido." });
    }

    // Crear la solicitud de pago
    const paymentData = {
      transaction_amount: parseFloat(amount),
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
        balance: admin.firestore.FieldValue.increment(-parseFloat(amount)),
        pendingBalance: admin.firestore.FieldValue.increment(-parseFloat(amount))
      });

      // Generar un ID único para la transacción
      const transactionId = admin.firestore().collection('users').doc(uid).collection('transactions').doc().id;

      // Guardar la transacción
      await saveTransaction(uid, 'withdrawal', parseFloat(amount), 'completed', transactionId);

      console.log(`Pago aprobado y procesado para el usuario: ${uid}, Transaction ID: ${transactionId}`);
      res.json({ message: "Pago aprobado y procesado" });
    } else {
      throw new Error('El pago no fue aprobado');
    }
  } catch (error) {
    console.error("Error al aprobar el pago:", error.response ? error.response.data : error.message);
    res.status(500).json({ error: "Error al aprobar el pago" });
  }
});

// Ruta: Actualizar Pending Balance (Reembolsos y Transferencias)
app.post('/updatePendingBalance', authenticate, async (req, res) => {
  const { amount, action } = req.body;
  const uid = req.user.uid;

  if (!amount || !action) {
    console.error("Faltan campos requeridos: amount, action");
    return res.status(400).json({ error: "Faltan campos requeridos: amount, action" });
  }

  // Validar que el monto sea un número positivo
  if (isNaN(amount) || parseFloat(amount) <= 0) {
    console.error("El monto no es un número válido:", amount);
    return res.status(400).json({ error: "El monto debe ser un número positivo." });
  }

  try {
    const userRef = admin.firestore().collection('users').doc(uid);

    if (action === 'refund') {
      // Devolver saldo al balance y reducir el pendingBalance
      await userRef.update({
        balance: admin.firestore.FieldValue.increment(parseFloat(amount)),
        pendingBalance: admin.firestore.FieldValue.increment(-parseFloat(amount))
      });
      // Generar un ID único para la transacción
      const transactionId = admin.firestore().collection('users').doc(uid).collection('transactions').doc().id;
      // Guardar la transacción de reembolso
      await saveTransaction(uid, 'refund', parseFloat(amount), 'completed', transactionId);
      console.log(`Reembolso completado para el usuario: ${uid}, Transaction ID: ${transactionId}`);
    } else if (action === 'transfer') {
      // Reducir el pendingBalance
      await userRef.update({
        pendingBalance: admin.firestore.FieldValue.increment(-parseFloat(amount))
      });
      // Generar un ID único para la transacción
      const transactionId = admin.firestore().collection('users').doc(uid).collection('transactions').doc().id;
      // Guardar la transacción de transferencia
      await saveTransaction(uid, 'transfer', parseFloat(amount), 'completed', transactionId);
      console.log(`Transferencia completada para el usuario: ${uid}, Transaction ID: ${transactionId}`);
    } else {
      console.error("Acción inválida:", action);
      return res.status(400).json({ error: "Acción inválida. Debe ser 'refund' o 'transfer'." });
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

// Firestore trigger para manejar actualizaciones de imágenes
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
