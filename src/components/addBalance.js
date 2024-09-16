import React, { useState, useContext } from 'react';
import UserContext from '../context/UserContext';
import TermsAndConditions from './TermsAndConditions';
import '../Styles/addBalance.css';

const AddBalance = ({ onClose }) => {
  const { user } = useContext(UserContext);
  const [amount, setAmount] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  const handleAddBalance = async () => {
    setError('');
    setLoading(true);

    if (!user?.uid) {
      setError('Error: el UID no está disponible.');
      setLoading(false);
      return;
    }

    if (!acceptedTerms) {
      setError('Debes aceptar los términos y condiciones.');
      setLoading(false);
      return;
    }

    try {
      // Hacer la solicitud para crear el pago en el backend
      const response = await fetch('https://us-central1-illustra-6ca8a.cloudfunctions.net/api/createAddBalancePayment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount, uid: user.uid })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error);

      // Redirigir al usuario a la página de pago
      window.location.href = data.init_point;

    } catch (err) {
      setError(err.message || 'Error al crear el pago. Por favor, intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    // Limpiar los datos ingresados
    setAmount('');
    setAcceptedTerms(false);
    setError('');
    // Cerrar el modal
    onClose();
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h3>Añadir Saldo</h3>
        </div>
        <div className="modal-body">
          {error && (
            <div className="alert alert-danger">
              <strong>Error:</strong> {error}
            </div>
          )}
          <input 
            type="number" 
            placeholder="Ingrese el monto" 
            value={amount} 
            onChange={(e) => setAmount(e.target.value)}
            className="form-input" 
          />

          <div className="terms-section">
            <div className="terms-scrollable">
              <TermsAndConditions />
            </div>
            <div className="checkbox-container">
              <input 
                type="checkbox" 
                id="terms" 
                checked={acceptedTerms} 
                onChange={(e) => setAcceptedTerms(e.target.checked)} 
              />
              <label htmlFor="terms">He leído y acepto los términos y condiciones</label>
            </div>
          </div>
        </div>
        <div className="modal-footer">
          <button onClick={handleCancel}>Cancelar</button>
          <button onClick={handleAddBalance} disabled={loading || !amount || !acceptedTerms}>
            {loading ? (
              <>
                <span className="loader" />Procesando
              </>
            ) : (
              'Añadir'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddBalance;
