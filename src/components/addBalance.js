// src/components/AddBalance.js

import React, { useState, useContext, useCallback } from 'react';
import UserContext from '../context/UserContext';
import TermsAndConditions from './TermsAndConditions';
import '../Styles/addBalance.css'; // Asegúrate de que el nombre coincide

const AddBalance = ({ onClose }) => {
  const { user, authToken } = useContext(UserContext); // Eliminado 'loading' y 'contextError' si no se usan
  const [baseAmount, setBaseAmount] = useState('');
  const [error, setError] = useState('');
  const [loadingRequest, setLoadingRequest] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false); // Nuevo estado para la confirmación

  // Definir las comisiones
  const platformCommissionRate = 0.05; // 5%
  const mercadoPagoFeeRate = 0.127; // 12.7%

  // Calcular comisiones y total
  const numericBaseAmount = parseInt(baseAmount, 10) || 0;
  const platformCommission = numericBaseAmount * platformCommissionRate;
  const totalBeforeMP = numericBaseAmount + platformCommission;
  const mercadoPagoFee = totalBeforeMP * mercadoPagoFeeRate;
  const totalAmount = parseFloat((totalBeforeMP + mercadoPagoFee).toFixed(2));

  const handleNext = useCallback(() => {
    // Limpiamos errores previos
    setError('');

    // Validamos que el monto sea válido
    if (numericBaseAmount <= 0) {
      setError('Por favor, ingrese un monto válido.');
      return;
    }

    // Validamos que el usuario haya aceptado los términos
    if (!acceptedTerms) {
      setError('Debes aceptar los términos y condiciones.');
      return;
    }

    // Pasamos a la etapa de confirmación
    setIsConfirming(true);
  }, [numericBaseAmount, acceptedTerms]);

  const handleConfirm = useCallback(async () => {
    // Limpiamos errores previos y activamos el estado de carga
    setError('');
    setLoadingRequest(true);

    // Validamos que el usuario esté autenticado
    if (!user?.uid) {
      setError('Error: el UID no está disponible.');
      setLoadingRequest(false);
      return;
    }

    try {
      // Validamos que authToken esté disponible
      if (!authToken) {
        setError('Error: No se pudo obtener el token de autenticación.');
        setLoadingRequest(false);
        return;
      }

      // Obtener la URL de la API desde las variables de entorno
      const API_URL = process.env.REACT_APP_API_URL || 'https://us-central1-illustra-6ca8a.cloudfunctions.net/api';

      // Realizamos la solicitud para generar el pago en el backend
      const response = await fetch(
        `${API_URL}/createAddBalancePayment`,
        {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}` // Usar authToken del contexto
          },
          body: JSON.stringify({ amount: numericBaseAmount, uid: user.uid })
        }
      );

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Error desconocido');

      // Redirigimos al usuario a la página de pago si todo está correcto
      window.location.href = data.init_point;

      // Retornamos para asegurar que el flujo termina aquí si la redirección ocurre
      return;
    } catch (err) {
      // Mostramos el error si ocurre un problema al crear el pago
      setError(err.message || 'Error al crear el pago. Por favor, intenta de nuevo.');
    } finally {
      // Desactivamos el estado de carga al finalizar
      setLoadingRequest(false);
    }
  }, [numericBaseAmount, user, authToken]);

  const handleCancel = useCallback(() => {
    if (isConfirming) {
      // Si está en la etapa de confirmación, volver a la etapa de ingreso
      setIsConfirming(false);
    } else {
      // Limpiamos los datos ingresados y los estados
      setBaseAmount('');
      setAcceptedTerms(false);
      setError('');
      // Llamamos la función onClose para cerrar el modal
      onClose();
    }
  }, [isConfirming, onClose]);

  // Función para manejar cambios en el input y asegurar que solo se ingresen números enteros
  const handleInputChange = (e) => {
    const value = e.target.value;

    // Permitir solo números y evitar entradas con decimales
    if (/^\d*$/.test(value)) {
      setBaseAmount(value);
    }
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

          {!isConfirming ? (
            <>
              <input
                type="text" // Cambiado de 'number' a 'text' para manejar mejor la validación
                placeholder="Ingrese el monto"
                value={baseAmount}
                onChange={handleInputChange}
                className="modal-addBalance-input"
                inputMode="numeric"
                pattern="\d*"
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
            </>
          ) : (
            <div className="modal-addBalance-confirmation">
              <p><strong>Monto a recargar:</strong> ${numericBaseAmount.toFixed(2)}</p>
              <p style={{ color: 'gray' }}><strong>Comisión de recarga (5%):</strong> ${platformCommission.toFixed(2)}</p>
              <p style={{ color: 'gray' }}><strong>Comisión de Mercado Pago (12.7%):</strong> ${mercadoPagoFee.toFixed(2)}</p>
              <p><strong>Total a pagar:</strong> ${totalAmount.toFixed(2)}</p>
            </div>
          )}
        </div>
        <div className="modal-addBalance-footer">
          <button onClick={handleCancel} className="modal-addBalance-button">
            {isConfirming ? 'Atrás' : 'Cancelar'}
          </button>
          {!isConfirming ? (
            <button onClick={handleNext} disabled={loadingRequest || !baseAmount || !acceptedTerms} className="modal-addBalance-button primary">
              Siguiente
            </button>
          ) : (
            <button onClick={handleConfirm} disabled={loadingRequest} className="modal-addBalance-button primary">
              {loadingRequest ? (
                <>
                  <span className="modal-addBalance-loader"></span> Procesando
                </>
              ) : (
                'Confirmar'
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default AddBalance;
