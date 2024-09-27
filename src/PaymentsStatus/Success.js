// src/components/Success.js

import React, { useEffect, useState, useContext } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import UserContext from '../context/UserContext';

const Success = () => {
  const [status, setStatus] = useState('Verificando pago...');
  const location = useLocation();
  const navigate = useNavigate();
  const { user, authToken } = useContext(UserContext); // Obtener user y authToken desde el contexto

  useEffect(() => {
    const verifyPayment = async () => {
      const params = new URLSearchParams(location.search);
      const transactionId = params.get('transactionId'); // Obtener transactionId de la URL

      if (!transactionId || !user) {
        setStatus('Error: Información de pago incompleta');
        return;
      }

      try {
        const response = await fetch('https://us-central1-illustra-6ca8a.cloudfunctions.net/api/verifyPayment', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}` // Usar authToken del contexto
          },
          body: JSON.stringify({ uid: user.uid, transactionId }), // Enviar uid y transactionId
        });

        const data = await response.json();

        if (data.success) {
          setStatus('¡Pago exitoso! Tu saldo ha sido actualizado.');
          // Redirigir después de unos segundos si lo deseas
          setTimeout(() => {
            navigate('/dashboard'); // Cambia '/dashboard' por la ruta que prefieras
          }, 3000);
        } else {
          setStatus(`Error: ${data.message || 'Información de pago incompleta.'}`);
        }
      } catch (error) {
        console.error('Error al verificar el pago:', error);
        setStatus('Error al verificar el pago. Por favor, contacta a soporte.');
      }
    };

    verifyPayment();
  }, [location, navigate, user, authToken]);

  return (
    <div className="payment-status-container">
      <h1>Estado del Pago</h1>
      <p>{status}</p>
    </div>
  );
};

export default Success;
