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
    // Limpiamos errores previos y activamos el estado de carga
    setError('');
    setLoading(true);

    // Validamos que el usuario esté autenticado y que haya aceptado los términos
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
      // Realizamos la solicitud para generar el pago en el backend
      const response = await fetch(
        'https://us-central1-illustra-6ca8a.cloudfunctions.net/api/createAddBalancePayment',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ amount, uid: user.uid })
        }
      );

      const data = await response.json();
      if (!response.ok) throw new Error(data.error);

      // Redirigimos al usuario a la página de pago si todo está correcto
      window.location.href = data.init_point;

      // Retornamos para asegurar que el flujo termina aquí si la redirección ocurre
      return;
    } catch (err) {
      // Mostramos el error si ocurre un problema al crear el pago
      setError(err.message || 'Error al crear el pago. Por favor, intenta de nuevo.');
    } finally {
      // Desactivamos el estado de carga al finalizar
      setLoading(false);
    }
  };

  const handleCancel = () => {
    // Limpiamos los datos ingresados y los estados
    setAmount('');
    setAcceptedTerms(false);
    setError('');
    // Llamamos la función onClose para cerrar el modal
    onClose();
  };

  return (
    <div className="modal-addBalance-overlay">
      <div className="modal-addBalance-content">
        <div className="modal-addBalance-header">
          <h3>Añadir Saldo</h3>
        </div>
        <div className="modal-addBalance-body">
          {error && (
            <div className="modal-addBalance-alert-danger">
              <strong>Error:</strong> {error}
            </div>
          )}
          <input
            type="number"
            placeholder="Ingrese el monto"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="modal-addBalance-input"
          />

          <div className="modal-addBalance-terms-section">
            <div className="modal-addBalance-terms-scrollable">
              <TermsAndConditions />
            </div>
            <div className="modal-addBalance-checkbox-container">
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
        <div className="modal-addBalance-footer">
          <button onClick={handleCancel}>Cancelar</button>
          <button onClick={handleAddBalance} disabled={loading || !amount || !acceptedTerms}>
            {loading ? (
              <>
                <span className="modal-addBalance-loader" />Procesando
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
