// src/components/TransactionHistory.js

import React, { useState, useEffect } from 'react';
import { db } from '../firebaseConfig';
import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';
import '../Styles/TransactionHistory.css';

const TransactionHistory = ({ userId }) => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!userId) return;

    const transactionsRef = collection(db, `users/${userId}/transactions`);
    const q = query(
      transactionsRef,
      orderBy('timestamp', 'desc'),
      limit(10)
    );

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const transactionList = [];
      querySnapshot.forEach((doc) => {
        transactionList.push({
          id: doc.id,
          ...doc.data(),
        });
      });
      setTransactions(transactionList);
      setLoading(false);
    }, (err) => {
      console.error('Error fetching transactions:', err);
      setError('Error al cargar las transacciones. Por favor, intenta de nuevo más tarde.');
      setLoading(false);
    });

    // Cleanup listener on unmount
    return () => unsubscribe();
  }, [userId]);

  if (loading) {
    return <div className="loading">Cargando transacciones...</div>;
  }

  if (error) {
    return <div className="error">{error}</div>;
  }

  return (
    <div className="transaction-history">
      <h2>Historial de Transacciones</h2>
      {transactions.length === 0 ? (
        <p>No hay transacciones recientes.</p>
      ) : (
        <ul className="transaction-list">
          {transactions.map((transaction) => (
            <li key={transaction.id} className={`transaction-item ${transaction.status}`}>
              <div className="transaction-type">
                {transaction.type === 'recharge' ? 'Recarga' : 'Retiro'}
              </div>
              <div className="transaction-amount">
                {transaction.type === 'recharge' ? '+' : '-'}${transaction.amount.toFixed(2)}
              </div>
              <div className="transaction-date">
                {transaction.timestamp && transaction.timestamp.toDate().toLocaleString()}
              </div>
              <div className={`transaction-status ${transaction.status}`}>
                {transaction.status === 'completed' ? 'Completado' : 'Pendiente'}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default TransactionHistory;
