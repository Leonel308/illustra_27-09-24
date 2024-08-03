import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../firebaseConfig';
import { doc, updateDoc } from 'firebase/firestore';

const CallbackPage = () => {
  const navigate = useNavigate();
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
  }, [navigate]);

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