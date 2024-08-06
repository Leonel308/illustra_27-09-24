const functions = require('firebase-functions');
const admin = require('firebase-admin');
const axios = require('axios');
const cors = require('cors');
const express = require('express');
const dotenv = require('dotenv');

dotenv.config(); // Cargar variables de entorno desde el archivo .env

admin.initializeApp();

const app = express();
const allowedOrigins = ['https://illustra-6ca8a.web.app', 'http://localhost:3000'];
app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) === -1) {
      const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  }
}));

const MERCADO_PAGO_CLIENT_ID = process.env.MERCADOPAGO_CLIENT_ID || functions.config().mercadopago.client_id;
const MERCADO_PAGO_CLIENT_SECRET = process.env.MERCADOPAGO_CLIENT_SECRET || functions.config().mercadopago.client_secret;
const REDIRECT_URI = process.env.MERCADOPAGO_REDIRECT_URI || functions.config().mercadopago.redirect_uri;
const ACCESS_TOKEN = process.env.MERCADOPAGO_ACCESS_TOKEN || functions.config().mercadopago.access_token;

// Función para crear un pago
app.post('/createPayment', async (req, res) => {
  const { amount, description, payerEmail } = req.body;

  if (!amount || !description || !payerEmail) {
    return res.status(400).send("Missing required fields: amount, description, payerEmail");
  }

  const preference = {
    items: [
      {
        title: "Donación",
        unit_price: parseFloat(amount),
        quantity: 1,
      },
    ],
    payer: {
      email: payerEmail,
    },
    back_urls: {
      success: "https://illustra-6ca8a.web.app/success",
      failure: "https://illustra-6ca8a.web.app/failure",
      pending: "https://illustra-6ca8a.web.app/pending",
    },
    auto_return: "approved",
  };

  try {
    const response = await axios.post("https://api.mercadopago.com/checkout/preferences", preference, {
      headers: {
        Authorization: `Bearer ${ACCESS_TOKEN}`
      }
    });
    res.json({ init_point: response.data.init_point });
  } catch (error) {
    console.error("Error creating preference:", error);
    res.status(500).send("Error creating preference");
  }
});

// Función para manejar el token de Mercado Pago
app.get('/mercadoPagoToken', async (req, res) => {
  if (req.method === 'OPTIONS') {
    res.set('Access-Control-Allow-Origin', 'https://illustra-6ca8a.web.app');
    res.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.set('Access-Control-Allow-Headers', 'Content-Type');
    res.set('Access-Control-Max-Age', '3600');
    res.status(204).send('');
    return;
  }

  const { code, state } = req.query;

  console.log("Received code:", code);
  console.log("Received state:", state);

  if (!code || !state) {
    console.error("Parámetros de URL inválidos: ", req.query);
    return res.status(400).send("Parámetros de URL inválidos.");
  }

  try {
    const response = await axios.post("https://api.mercadopago.com/oauth/token", {
      grant_type: "authorization_code",
      client_id: MERCADO_PAGO_CLIENT_ID,
      client_secret: MERCADO_PAGO_CLIENT_SECRET,
      code: code,
      redirect_uri: REDIRECT_URI,
    });

    console.log("Mercado Pago response:", response.data);

    const { access_token, refresh_token } = response.data;

    const userRef = admin.firestore().collection('users').doc(state);
    await userRef.update({
      mercadoPagoAccessToken: access_token,
      mercadoPagoRefreshToken: refresh_token,
    });

    res.set('Access-Control-Allow-Origin', 'https://illustra-6ca8a.web.app');
    res.json(response.data);
  } catch (error) {
    console.error("Error al obtener tokens de Mercado Pago:", error.response ? error.response.data : error.message);
    res.status(500).send("Error al obtener tokens de Mercado Pago");
  }
});

// Función para desvincular Mercado Pago
app.get('/unlinkMercadoPago', async (req, res) => {
  const { uid } = req.query;

  if (!uid) {
    return res.status(400).send("Parámetros de URL inválidos. No se pudo desvincular Mercado Pago.");
  }

  try {
    const userRef = admin.firestore().collection('users').doc(uid);
    await userRef.update({
      mercadoPagoAccessToken: admin.firestore.FieldValue.delete(),
      mercadoPagoRefreshToken: admin.firestore.FieldValue.delete(),
    });
    res.send("Cuenta de Mercado Pago desvinculada.");
  } catch (error) {
    console.error("Error al desvincular cuenta de Mercado Pago:", error);
    res.status(500).send("Error al desvincular Mercado Pago.");
  }
});

// Función para aprobar pagos a usuarios
app.post('/approvePayment', async (req, res) => {
  const { userId, amount } = req.body;

  if (!userId || !amount) {
    return res.status(400).send("Missing required fields: userId, amount");
  }

  try {
    const userRef = admin.firestore().collection('users').doc(userId);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      return res.status(404).send("User not found");
    }

    const userData = userDoc.data();
    const accessToken = userData.mercadoPagoAccessToken;

    const paymentData = {
      transaction_amount: amount,
      reason: "Withdrawal",
      payment_method_id: "account_money",
      payer: {
        type: "customer",
        id: userId
      }
    };

    const paymentResponse = await axios.post("https://api.mercadopago.com/v1/payments", paymentData, {
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    });

    if (paymentResponse.data && paymentResponse.data.status === "approved") {
      // Actualizar el balance del usuario en Firestore
      await userRef.update({
        balance: admin.firestore.FieldValue.increment(-amount),
        pendingBalance: admin.firestore.FieldValue.increment(-amount)
      });

      res.send("Payment approved and processed");
    } else {
      throw new Error('Payment not approved');
    }
  } catch (error) {
    console.error("Error approving payment:", error);
    res.status(500).send("Error approving payment");
  }
});

// Función para manejar notificaciones de Mercado Pago (webhook)
app.post('/paymentNotification', async (req, res) => {
  const { type, data } = req.body;

  if (type === 'payment') {
    try {
      const paymentId = data.id;
      const paymentResponse = await axios.get(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
        headers: { Authorization: `Bearer ${ACCESS_TOKEN}` }
      });

      const paymentStatus = paymentResponse.data.status;
      const userId = paymentResponse.data.payer.id;
      const amount = paymentResponse.data.transaction_amount;

      if (paymentStatus === 'approved') {
        const withdrawalRequestRef = admin.firestore().collection('withdrawalRequests').doc(userId);
        await withdrawalRequestRef.update({ status: 'approved' });
        await withdrawalRequestRef.delete();

        // Actualizar el balance del usuario en Firestore
        const userRef = admin.firestore().collection('users').doc(userId);
        await userRef.update({
          balance: admin.firestore.FieldValue.increment(-amount),
          pendingBalance: admin.firestore.FieldValue.increment(-amount)
        });
      }

      res.sendStatus(200);
    } catch (error) {
      console.error('Error handling webhook:', error);
      res.status(500).send('Error handling webhook');
    }
  } else {
    res.sendStatus(200);
  }
});

// Función para actualizar el pendingBalance cuando se deniega una solicitud o se transfiere al ilustrador
app.post('/updatePendingBalance', async (req, res) => {
  const { userId, amount, action } = req.body;

  if (!userId || !amount || !action) {
    return res.status(400).send("Missing required fields: userId, amount, action");
  }

  try {
    const userRef = admin.firestore().collection('users').doc(userId);
    
    if (action === 'refund') {
      // Devolver saldo al balance y reducir el pendingBalance
      await userRef.update({
        balance: admin.firestore.FieldValue.increment(amount),
        pendingBalance: admin.firestore.FieldValue.increment(-amount)
      });
    } else if (action === 'transfer') {
      // Reducir el pendingBalance (ya que se transfiere al ilustrador)
      await userRef.update({
        pendingBalance: admin.firestore.FieldValue.increment(-amount)
      });
    }

    res.send("Pending balance updated successfully");
  } catch (error) {
    console.error("Error updating pending balance:", error);
    res.status(500).send("Error updating pending balance");
  }
});

// Exportar la aplicación Express como una función de Firebase
exports.api = functions.https.onRequest(app);
