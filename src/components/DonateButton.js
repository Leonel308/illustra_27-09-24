import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { auth, db } from '../firebaseConfig';
import { doc, getDoc } from 'firebase/firestore';

const DonateButton = ({ amount, description, payerEmail }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [canReceiveDonations, setCanReceiveDonations] = useState(false);

  useEffect(() => {
    const checkUserTokens = async () => {
      const user = auth.currentUser;
      if (user) {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          if (userData.mercadoPagoAccessToken) {
            setCanReceiveDonations(true);
          }
        }
      }
    };

    checkUserTokens();
  }, []);

  const handleDonation = async () => {
    if (!amount || !description || !payerEmail) {
      setError('Todos los campos son obligatorios.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await axios.post('https://us-central1-illustra-6ca8a.cloudfunctions.net/api/createPayment', {
        amount: amount,
        description: 'Donación', // Aquí se asegura de que el título sea "Donación"
        payerEmail: payerEmail
      });

      if (response.data && response.data.init_point) {
        window.location.href = response.data.init_point;
      } else {
        console.error('init_point not found in response:', response.data);
        setError('No se pudo iniciar la donación. Por favor, inténtalo de nuevo.');
      }
    } catch (error) {
      console.error('Error creating donation preference:', error);
      setError('Ocurrió un error al procesar tu donación. Por favor, inténtalo de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <button onClick={handleDonation} disabled={loading || !canReceiveDonations}>
        {loading ? 'Procesando...' : canReceiveDonations ? `Donar $${amount}` : 'Cuenta no vinculada'}
      </button>
    </div>
  );
};

export default DonateButton;
