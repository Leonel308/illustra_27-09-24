import React, { useState } from 'react';
import '../Styles/addBalance.css'; // Asegúrate de que la ruta del archivo CSS sea correcta

const AddBalanceModal = ({ onClose, onAddBalance }) => {
  const [amount, setAmount] = useState('');

  const handleAddBalance = () => {
    const numericAmount = Number(amount);
    if (!isNaN(numericAmount) && numericAmount > 0) {
      onAddBalance(numericAmount);
    } else {
      alert('Por favor ingrese una cantidad válida.');
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-container">
        <h2>Añadir Saldo</h2>
        <input
          type="number"
          placeholder="Ingrese cantidad"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />
        <div className="modal-buttons">
          <button onClick={handleAddBalance}>Añadir</button>
          <button onClick={onClose}>Cancelar</button>
        </div>
      </div>
    </div>
  );
};

export default AddBalanceModal;
