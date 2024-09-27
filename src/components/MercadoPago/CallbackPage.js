// src/pages/CallbackPage.js

import React, { useEffect, useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../../firebaseConfig';
import { doc, updateDoc } from 'firebase/firestore';
import UserContext from '../../context/UserContext'; // Importar el contexto de usuario

const CallbackPage = () => {
  const navigate = useNavigate();
  const { user, authToken } = useContext(UserContext); // Obtener authToken del contexto
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchTokens = async () => {
      const query = new URLSearchParams(window.location.search);
      const code = query.get('code');
      const state = query.get('state');

      if (code && state) {
        try {
          const response = await fetch(`https://us-central1-illustra-6ca8a.cloudfunctions.net/api/mercadoPagoToken?code=${code}&state=${state}`, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            }
          });

          if (!response.ok) {
            const text = await response.text();
            throw new Error(`Network response was not ok: ${text}`);
          }

          const data = await response.json();
          const { access_token, refresh_token } = data;

          const userRef = doc(db, 'users', state);
          await updateDoc(userRef, {
            mercadoPagoAccessToken: access_token,
            mercadoPagoRefreshToken: refresh_token
          });

          // Llamar al endpoint /verifyPayment
          await verifyPayment(state);

          navigate('/configuration');
        } catch (error) {
          console.error('Error al obtener tokens:', error);
          setError(`Error al obtener tokens: ${error.message}`);
        } finally {
          setLoading(false);
        }
      } else {
        console.error('Parámetros de URL inválidos:', window.location.search);
        setError('Parámetros de URL inválidos.');
        setLoading(false);
      }
    };

    fetchTokens();
  }, [navigate, authToken, user]);

  const verifyPayment = async (uid) => {
    if (!authToken) {
      setError('No autorizado: Falta el token de autenticación.');
      setLoading(false);
      return;
    }

    console.log('Enviando authToken en verifyPayment:', authToken); // Log agregado

    try {
      const response = await fetch('https://us-central1-illustra-6ca8a.cloudfunctions.net/api/verifyPayment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}` // Incluir el token de autenticación
        },
        body: JSON.stringify({ uid }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Error desconocido');
      }

      console.log('Verificación de pago exitosa:', data);
    } catch (error) {
      console.error('Error al verificar el pago:', error);
      setError(`Error al verificar el pago: ${error.message}`);
    }
  };

  return (
    <div>
      {loading ? (
        <h2>Procesando autenticación...</h2>
      ) : error ? (
        <div>
          <h2>Ha ocurrido un error</h2>
          <p>{error}</p>
        </div>
      ) : (
        <h2>Autenticación completada con éxito</h2>
      )}
    </div>
  );
};

export default CallbackPage;
