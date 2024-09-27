import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

const Success = () => {
  const [status, setStatus] = useState('Verificando pago...');
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const verifyPayment = async () => {
      const params = new URLSearchParams(location.search);
      const uid = params.get('uid');
      const paymentId = params.get('payment_id'); // Asegúrate de que Mercado Pago envíe este parámetro

      if (!uid || !paymentId) {
        setStatus('Error: Información de pago incompleta');
        return;
      }

      try {
        const response = await fetch('https://us-central1-illustra-6ca8a.cloudfunctions.net/api/verifyPayment', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('authToken')}` // Asegúrate de almacenar y enviar el token de autenticación
          },
          body: JSON.stringify({ uid, paymentId }),
        });

        const data = await response.json();

        if (data.success) {
          setStatus('¡Pago exitoso! Tu saldo ha sido actualizado.');
          // Redirigir después de unos segundos si lo deseas
          setTimeout(() => {
            navigate('/dashboard'); // Cambia '/dashboard' por la ruta que prefieras
          }, 3000);
        } else {
          setStatus('El pago no ha sido aprobado. Por favor, contacta a soporte.');
        }
      } catch (error) {
        console.error('Error al verificar el pago:', error);
        setStatus('Error al verificar el pago. Por favor, contacta a soporte.');
      }
    };

    verifyPayment();
  }, [location, navigate]);

  return (
    <div className="payment-status-container">
      <h1>Estado del Pago</h1>
      <p>{status}</p>
    </div>
  );
};

export default Success;
