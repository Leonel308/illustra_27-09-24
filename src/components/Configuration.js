import React, { useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { db, auth } from '../firebaseConfig';
import { sendPasswordResetEmail } from 'firebase/auth';
import '../Styles/Configuration.css';
import UserContext from '../context/UserContext';
import MercadoPagoButton from './MercadoPago/MercadoPagoButton';
import Spinner from './Spinner';

const Configuration = () => {
  const { user } = useContext(UserContext);
  const [newUsername, setNewUsername] = useState('');
  const [newPaymentMethodUSD, setNewPaymentMethodUSD] = useState('');
  const [newPaymentMethodARS, setNewPaymentMethodARS] = useState('');
  const [donationAmounts, setDonationAmounts] = useState([1000, 5000, 10000, 20000]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [usernameChangeDate, setUsernameChangeDate] = useState(null);
  const [canChangeUsername, setCanChangeUsername] = useState(true);
  const [loading, setLoading] = useState(true);
  const [warning, setWarning] = useState('');

  const navigate = useNavigate();

  useEffect(() => {
    const fetchUserData = async () => {
      if (user) {
        const userRef = doc(db, 'users', user.uid);
        const userDoc = await getDoc(userRef);
        if (userDoc.exists()) {
          const data = userDoc.data();
          if (data.usernameChangeDate) {
            setUsernameChangeDate(data.usernameChangeDate.toDate());
            const now = new Date();
            const diffTime = Math.abs(now - data.usernameChangeDate.toDate());
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            setCanChangeUsername(diffDays >= 14);
          }
        }
        setLoading(false);  // Desactiva el estado de carga después de obtener los datos
      } else {
        navigate('/login');
      }
    };

    fetchUserData();
  }, [user, navigate]);

  const handleAddDonationAmount = () => {
    if (donationAmounts.length < 5) {
      if (donationAmounts.some(amount => amount < 500 || !amount.toString().trim())) {
        setWarning('El monto debe ser mayor o igual a 500 y no puede haber espacios en blanco.');
        return;
      }
      setDonationAmounts([...donationAmounts, 500]); // Añade un valor predeterminado de 500
      setWarning('');
    } else {
      setError('No puedes añadir más de 5 montos de donación.');
    }
  };

  const handleDonationAmountChange = (index, value) => {
    if (/^\d*$/.test(value) && value.length <= 11) {
      const newAmounts = [...donationAmounts];
      newAmounts[index] = value;
      setDonationAmounts(newAmounts);
      if (value < 500 || !value.trim()) {
        setWarning('El monto debe ser mayor o igual a 500 y no puede haber espacios en blanco.');
      } else {
        setWarning('');
      }
    }
  };

  const handleRemoveDonationAmount = (index) => {
    if (index !== 0) {
      const newAmounts = donationAmounts.filter((_, i) => i !== index);
      setDonationAmounts(newAmounts);
    } else {
      setError('No puedes eliminar el primer monto de donación.');
    }
  };

  const handleUsernameChange = async () => {
    if (!newUsername.trim()) {
      setError('El nombre de usuario no puede estar vacío.');
      return;
    }

    if (!canChangeUsername) {
      setError('No puedes cambiar el nombre de usuario hasta que pasen 14 días desde el último cambio.');
      return;
    }

    try {
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        username: newUsername,
        username_lower: newUsername.toLowerCase(),
        usernameChangeDate: new Date()
      });
      setSuccess('Nombre de usuario actualizado con éxito.');
      setError('');
      setCanChangeUsername(false);
      setUsernameChangeDate(new Date());
    } catch (error) {
      console.error('Error actualizando el nombre de usuario:', error);
      setError('Error actualizando el nombre de usuario.');
      setSuccess('');
    }
  };

  const handlePasswordReset = async () => {
    try {
      await sendPasswordResetEmail(auth, user.email);
      navigate('/password-reset-sent');
    } catch (error) {
      console.error('Error enviando el correo de restablecimiento de contraseña:', error);
      setError('Error enviando el correo de restablecimiento de contraseña.');
      setSuccess('');
    }
  };

  const handleSaveConfiguration = async () => {
    try {
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        paymentMethodUSD: newPaymentMethodUSD,
        paymentMethodARS: newPaymentMethodARS,
        donationAmounts: donationAmounts.filter(amount => amount)
      });
      setSuccess('Configuración guardada con éxito.');
      setError('');
    } catch (error) {
      console.error('Error guardando la configuración:', error);
      setError('Error guardando la configuración.');
      setSuccess('');
    }
  };

  const handleCVUChange = (e) => {
    const value = e.target.value.replace(/\s/g, '');
    if (/^\d*$/.test(value) && value.length <= 22) {
      setNewPaymentMethodARS(value);
    }
  };

  if (loading) {
    return (
      <div className="main-content">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="main-content">
      <div className="configuration-container">
        <h2 className="configuration-header">Editar perfil</h2>
        
        <div className="configuration-section">
          <h3>Usuario</h3>
          <label>Nombre de usuario</label>
          <input 
            type="text" 
            placeholder="Cambiar nombre de usuario" 
            value={newUsername}
            onChange={(e) => setNewUsername(e.target.value)}
            disabled={!canChangeUsername}
          />
          {usernameChangeDate && !canChangeUsername && (
            <p className="info-message">
              No puedes cambiar el nombre de usuario hasta {new Date(usernameChangeDate.getTime() + 14 * 24 * 60 * 60 * 1000).toLocaleDateString()}.
            </p>
          )}
          <button onClick={handleUsernameChange} disabled={!canChangeUsername}>
            Cambiar nombre de usuario
          </button>
          <button className="forgot-password-button" onClick={handlePasswordReset}>Olvidé mi contraseña</button>
        </div>
        
        <div className="configuration-section">
          <h3>Método de pago</h3>
          <label>Añadir método de pago en dólares</label>
          <input 
            type="text" 
            placeholder="Añadir método de pago en dólares"
            value={newPaymentMethodUSD}
            onChange={(e) => setNewPaymentMethodUSD(e.target.value)}
          />
          <label>Ingrese el CVU/CBU para recibir tu dinero</label>
          <input 
            type="text" 
            placeholder="Ingrese el CVU/CBU para recibir tu dinero"
            value={newPaymentMethodARS}
            onChange={handleCVUChange}
            maxLength={22}
          />
          <MercadoPagoButton />
        </div>
        
        <div className="configuration-section">
          <h3>Donaciones</h3>
          {donationAmounts.map((amount, index) => (
            <div key={index} className="donation-amount">
              <input
                type="text"
                value={amount}
                onChange={(e) => handleDonationAmountChange(index, e.target.value)}
                maxLength={11}
              />
              {index !== 0 && (
                <button className="delete-button" onClick={() => handleRemoveDonationAmount(index)}>X</button>
              )}
            </div>
          ))}
          {donationAmounts.length < 5 && (
            <button onClick={handleAddDonationAmount}>Añadir botón de donación</button>
          )}
          {warning && <p className="warning-message">{warning}</p>}
        </div>
        
        <button className="save-button" onClick={handleSaveConfiguration}>Guardar</button>
        {error && <p className="error-message">{error}</p>}
        {success && <p className="success-message">{success}</p>}
      </div>
    </div>
  );
};

export default Configuration;
