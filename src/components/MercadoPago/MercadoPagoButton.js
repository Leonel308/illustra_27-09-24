import React, { useState, useContext, useEffect } from 'react';
// import { useNavigate } from 'react-router-dom'; // Verifica si es necesario
import { db } from '../../firebaseConfig';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import UserContext from '../../context/UserContext';

const MercadoPagoButton = () => {
  const { user } = useContext(UserContext);
  const [isLinked, setIsLinked] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const checkMercadoPagoLinked = async () => {
      if (user) {
        const userRef = doc(db, 'users', user.uid);
        const userDoc = await getDoc(userRef);
        if (userDoc.exists() && userDoc.data().mercadoPagoAccessToken) {
          setIsLinked(true);
        }
      }
    };
    checkMercadoPagoLinked();
  }, [user]);

  const handleConnect = () => {
    const clientId = process.env.REACT_APP_MERCADOPAGO_CLIENT_ID;
    const redirectUri = process.env.REACT_APP_MERCADOPAGO_REDIRECT_URI;
    const authUrl = `https://auth.mercadopago.com.ar/authorization?response_type=code&client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&state=${user.uid}`;
    window.location.href = authUrl;
  };

  const handleDisconnect = async () => {
    setLoading(true);
    try {
      const response = await fetch(`https://us-central1-illustra-6ca8a.cloudfunctions.net/api/unlinkMercadoPago?uid=${user.uid}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(`Network response was not ok: ${text}`);
      }

      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        mercadoPagoAccessToken: null,
        mercadoPagoRefreshToken: null,
      });

      setIsLinked(false);
      alert('Cuenta de Mercado Pago desvinculada con éxito.');
    } catch (error) {
      console.error('Error al desvincular Mercado Pago:', error);
      alert(`Error al desvincular Mercado Pago: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {isLinked ? (
        <button onClick={handleDisconnect} disabled={loading}>
          {loading ? 'Desvinculando...' : 'Desvincular Mercado Pago'}
        </button>
      ) : (
        <button onClick={handleConnect} disabled={loading}>
          {loading ? 'Conectando...' : 'Conectar con Mercado Pago'}
        </button>
      )}
    </div>
  );
};

export default MercadoPagoButton;
