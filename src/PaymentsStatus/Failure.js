import React from 'react';
import { useNavigate } from 'react-router-dom';
import './PaymentStatus.css'; // Asegúrate de crear y estilizar este archivo

const Failure = () => {
  const navigate = useNavigate();

  const handleRetry = () => {
    navigate('/add-balance'); // Cambia '/add-balance' por la ruta correcta para reintentar el pago
  };

  return (
    <div className="payment-status-container">
      <h1>Pago Fallido</h1>
      <p>Hubo un problema con tu pago. Por favor, intenta nuevamente.</p>
      <button onClick={handleRetry} className="retry-button">Reintentar Pago</button>
    </div>
  );
};

export default Failure;
