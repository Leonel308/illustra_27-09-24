// src/components/UserDashboard.js

import React, { useContext, useState, useEffect } from 'react';
import UserContext from '../context/UserContext';
import { db } from '../firebaseConfig';
import { 
  collection, 
  addDoc, 
  updateDoc, 
  serverTimestamp, 
  increment,
  doc,           // Importación agregada
  onSnapshot     // Importación agregada
} from 'firebase/firestore'; // Importaciones necesarias
import '../Styles/UserDashboard.css'; // Asegúrate de que el nombre del archivo coincida exactamente
import TransactionHistory from './TransactionHistory';

const UserDashboard = () => {
  const { user, setUser } = useContext(UserContext); // Obtener tanto user como setUser
  const [error, setError] = useState('');

  useEffect(() => {
    if (user) {
      const userRef = doc(db, 'users', user.uid);
      const unsubscribe = onSnapshot(userRef, (docSnapshot) => {
        if (docSnapshot.exists()) {
          const userData = docSnapshot.data();
          setUser({ uid: user.uid, ...userData }); // Actualizar el estado del usuario
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
      // Crear una solicitud de retiro en la colección 'withdrawalRequests'
      await addDoc(collection(db, 'withdrawalRequests'), {
        userId: user.uid,
        username: user.username,
        userPhotoURL: user.photoURL,
        amount: user.balance,
        status: 'pending',
        createdAt: serverTimestamp()
      });

      // Actualizar el balance y pendingBalance
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        balance: 0, // Establecer a 0
        pendingBalance: increment(user.balance)
      });

      // Actualizar el estado del usuario en el contexto
      setUser({ 
        ...user, 
        balance: 0, // Establecer a 0
        pendingBalance: (user.pendingBalance || 0) + user.balance 
      });

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
      <p className="balance">
        Saldo Disponible: $
        {user 
          ? user.balance.toLocaleString('es-AR', { 
              minimumFractionDigits: 2, 
              maximumFractionDigits: 2 
            }) 
          : 'Cargando...'}
      </p>
      <p className="pending-balance">
        Saldo Pendiente: $
        {user 
          ? (user.pendingBalance || 0).toLocaleString('es-AR', { 
              minimumFractionDigits: 2, 
              maximumFractionDigits: 2 
            }) 
          : 'Cargando...'}
      </p>
      <button onClick={handleWithdrawalRequest}>Retirar</button>
      {error && <p className="error">{error}</p>}
      <p className="info">Los retiros pueden tardar hasta 24 horas</p>
      <TransactionHistory userId={user ? user.uid : null} />
    </div>
  );
};

export default UserDashboard;
