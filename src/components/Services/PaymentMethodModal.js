import React from 'react';
import '../../Styles/PaymentMethodModal.css'; // Asegúrate de crear un archivo CSS para el estilo

const PaymentMethodModal = ({ show, onClose, onSelect }) => {
  if (!show) {
    return null;
  }

  const handleSelect = (method) => {
    onSelect(method);
  };

  return (
    <div className="payment-modal-overlay">
      <div className="payment-modal">
        <h2>¿Cómo desea pagar?</h2>
        <div className="payment-options">
          <button onClick={() => handleSelect('mercadoPago')} className="mercado-pago-button">
            Mercado Pago
          </button>
          <button onClick={() => handleSelect('wallet')} className="wallet-button">
            Saldo de Billetera
          </button>
        </div>
        <button className="close-button" onClick={onClose}>
          Cerrar
        </button>
      </div>
    </div>
  );
};

export default PaymentMethodModal;
