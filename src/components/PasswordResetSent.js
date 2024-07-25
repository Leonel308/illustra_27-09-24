import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../firebaseConfig';
import '../Styles/PasswordResetSent.css'; // Crea y ajusta el CSS según sea necesario

const PasswordResetSent = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const timeout = setTimeout(async () => {
      await auth.signOut();
      navigate('/login');
    }, 3000); // Cambia el tiempo según sea necesario

    return () => clearTimeout(timeout);
  }, [navigate]);

  return (
    <div className="password-reset-sent-container">
      <h2>Correo de restauración de contraseña enviado</h2>
      <p>Espere unos momentos...</p>
      <div className="spinner"></div>
    </div>
  );
};

export default PasswordResetSent;
