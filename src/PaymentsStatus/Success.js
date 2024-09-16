import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';

const Success = () => {
  const [status, setStatus] = useState('Verificando pago...');
  const location = useLocation();

  useEffect(() => {
    const verifyPayment = async () => {
      const params = new URLSearchParams(location.search);
      const userId = params.get('userId');
      const paymentId = params.get('payment_id');

      if (!userId || !paymentId) {
        setStatus('Error: Información de pago incompleta');
        return;
      }

      try {
        const response = await fetch('https://us-central1-illustra-6ca8a.cloudfunctions.net/api/verifyPayment', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ userId, paymentId }),
        });

        const data = await response.json();

        if (data.success) {
          setStatus('¡Pago exitoso! Tu saldo ha sido actualizado.');
        } else {
          setStatus('El pago no ha sido aprobado. Por favor, contacta a soporte.');
        }
      } catch (error) {
        console.error('Error al verificar el pago:', error);
        setStatus('Error al verificar el pago. Por favor, contacta a soporte.');
      }
    };

    verifyPayment();
  }, [location]);

  return (
    <div>
      <h1>Estado del Pago</h1>
      <p>{status}</p>
    </div>
  );
};

export default Success;