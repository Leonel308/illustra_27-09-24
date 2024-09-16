import React, { useEffect, useState } from 'react';
import { db } from '../firebaseConfig';
import { collection, onSnapshot, updateDoc, doc, getDoc, deleteDoc, query, orderBy, limit } from 'firebase/firestore';
import '../Styles/AdminDashboard.css';
import axios from 'axios';
import SendNotification from '../components/sendNotifications';

const AdminDashboard = () => {
  const [withdrawalRequests, setWithdrawalRequests] = useState([]);
  const [allTransactions, setAllTransactions] = useState([]);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'withdrawalRequests'), (snapshot) => {
      const requests = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter(request => request.amount > 0);
      setWithdrawalRequests(requests);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const fetchAllTransactions = async () => {
      const transactionsRef = collection(db, 'transactions');
      const q = query(transactionsRef, orderBy('timestamp', 'desc'), limit(100));
      
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const transactions = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setAllTransactions(transactions);
      });

      return () => unsubscribe();
    };

    fetchAllTransactions();
  }, []);

  const handleApprove = async (requestId) => {
    try {
      const requestRef = doc(db, 'withdrawalRequests', requestId);
      const requestDoc = await getDoc(requestRef);
      const requestData = requestDoc.data();

      const amountWithCommission = requestData.amount * 0.9;

      const userRef = doc(db, 'users', requestData.userId);
      const userDoc = await getDoc(userRef);
      const userData = userDoc.data();
      
      const paymentResponse = await axios.post('https://us-central1-illustra-6ca8a.cloudfunctions.net/api/createPayment', {
        amount: amountWithCommission,
        description: 'Retiro de fondos',
        payerEmail: userData.email
      });

      if (paymentResponse.data.init_point) {
        window.location.href = paymentResponse.data.init_point;

        await updateDoc(requestRef, { status: 'approved' });
        await deleteDoc(requestRef);
        setWithdrawalRequests(withdrawalRequests.filter(request => request.id !== requestId));
        alert('Solicitud aprobada y procesada');
      } else {
        throw new Error('Error en la creación del pago');
      }
    } catch (error) {
      console.error('Error approving request:', error);
      alert('Error al aprobar la solicitud. Por favor, intente de nuevo.');
    }
  };

  const handleDeny = async (requestId) => {
    try {
      const requestRef = doc(db, 'withdrawalRequests', requestId);
      const requestDoc = await getDoc(requestRef);
      const requestData = requestDoc.data();

      const userRef = doc(db, 'users', requestData.userId);
      await updateDoc(userRef, { balance: requestData.amount });

      await deleteDoc(requestRef);

      setWithdrawalRequests(withdrawalRequests.filter(request => request.id !== requestId));

      alert('Solicitud denegada');
    } catch (error) {
      console.error('Error denying request:', error);
      alert('Error al denegar la solicitud');
    }
  };

  return (
    <div className="admin-dashboard">
      <h1>Dashboard de Admin</h1>
      <SendNotification />
      <h2>Solicitudes de Retiro</h2>
      {withdrawalRequests.map(request => (
        <div key={request.id} className="withdrawal-request">
          <img src={request.userPhotoURL} alt={request.username} className="user-photo" />
          <span>{request.username}</span>
          <span>${(request.amount * 0.9).toLocaleString('es-AR')}</span>
          <button onClick={() => handleApprove(request.id)}>Aprobar</button>
          <button onClick={() => handleDeny(request.id)}>Denegar</button>
        </div>
      ))}
      <h2>Todas las Transacciones</h2>
      <ul className="transaction-list">
        {allTransactions.map((transaction) => (
          <li key={transaction.id} className="transaction-item">
            <div className="transaction-user">{transaction.userId}</div>
            <div className="transaction-type">
              {transaction.type === 'recharge' ? 'Recarga' : 'Retiro'}
            </div>
            <div className="transaction-amount">
              {transaction.type === 'recharge' ? '+' : '-'}${transaction.amount.toFixed(2)}
            </div>
            <div className="transaction-date">
              {transaction.timestamp.toDate().toLocaleString()}
            </div>
            <div className="transaction-status">
              {transaction.status === 'completed' ? 'Completado' : 'Pendiente'}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default AdminDashboard;