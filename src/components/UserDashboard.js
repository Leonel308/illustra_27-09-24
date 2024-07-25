import React, { useContext, useState, useEffect } from 'react';
import UserContext from '../context/UserContext';
import { db } from '../firebaseConfig';
import { collection, addDoc, updateDoc, doc, onSnapshot } from 'firebase/firestore';
import '../Styles/UserDashboard.css';

const UserDashboard = () => {
  const { user, setUser } = useContext(UserContext);
  const [error, setError] = useState('');

  useEffect(() => {
    if (user) {
      const userRef = doc(db, 'users', user.uid);
      const unsubscribe = onSnapshot(userRef, (docSnapshot) => {
        if (docSnapshot.exists()) {
          const userData = docSnapshot.data();
          setUser({ uid: user.uid, ...userData });
        }
      });

      return () => unsubscribe();
    }
  }, [user, setUser]);

  const handleWithdrawalRequest = async () => {
    if (!user || user.balance <= 0) {
      setError('No tienes suficiente saldo para retirar.');
      return;
    }

    try {
      // Crear la solicitud de retiro
      await addDoc(collection(db, 'withdrawalRequests'), {
        userId: user.uid,
        username: user.username,
        userPhotoURL: user.photoURL,
        amount: user.balance,
        status: 'pending',
        createdAt: new Date()
      });

      // Actualizar el balance del usuario en Firestore
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, { balance: 0 });

      // Actualizar el balance del usuario en el estado
      setUser({ ...user, balance: 0 });

      alert('Solicitud de retiro enviada.');
      setError('');
    } catch (error) {
      console.error('Error al crear la solicitud de retiro:', error);
      setError('Error al crear la solicitud de retiro.');
    }
  };

  return (
    <div className="user-dashboard">
      <h1>Dashboard de Usuario</h1>
      <p className="balance">Saldo: ${user ? user.balance.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : 'Cargando...'}</p>
      <button onClick={handleWithdrawalRequest}>Retirar</button>
      {error && <p className="error">{error}</p>}
      <p className="info">Los retiros pueden tardar hasta 24 horas</p>
    </div>
  );
};

export default UserDashboard;
