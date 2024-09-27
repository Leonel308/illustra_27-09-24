import React from 'react';
import './PaymentStatus.css'; // Asegúrate de crear y estilizar este archivo

const Pending = () => {
  return (
    <div className="payment-status-container">
      <h1>Pago Pendiente</h1>
      <p>Tu pago está siendo procesado. Recibirás una notificación una vez que se complete.</p>
      <div className="loader"></div> {/* Añade un spinner o animación de carga */}
    </div>
  );
};

export default Pending;
