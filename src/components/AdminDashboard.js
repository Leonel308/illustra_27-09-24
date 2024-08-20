import React, { useEffect, useState } from 'react';
import { db } from '../firebaseConfig';
import { collection, onSnapshot, updateDoc, doc, getDoc, deleteDoc } from 'firebase/firestore';
import '../Styles/AdminDashboard.css';
import axios from 'axios';
import SendNotification from '../components/sendNotifications'; // Import the SendNotification component

const AdminDashboard = () => {
  const [withdrawalRequests, setWithdrawalRequests] = useState([]);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'withdrawalRequests'), (snapshot) => {
      const requests = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter(request => request.amount > 0); // Filtrar las solicitudes con monto mayor a 0
      setWithdrawalRequests(requests);
    });

    return () => unsubscribe();
  }, []);

  const handleApprove = async (requestId) => {
    try {
      const requestRef = doc(db, 'withdrawalRequests', requestId);
      const requestDoc = await getDoc(requestRef); // Obtener el documento de la solicitud
      const requestData = requestDoc.data();

      // Aplicar comisión del 10%
      const amountWithCommission = requestData.amount * 0.9;

      // Obtener el accessToken del usuario
      const userRef = doc(db, 'users', requestData.userId);
      const userDoc = await getDoc(userRef);
      const userData = userDoc.data();
      
      // Crear el pago utilizando tu endpoint de Firebase Functions
      const paymentResponse = await axios.post('https://us-central1-illustra-6ca8a.cloudfunctions.net/api/createPayment', {
        amount: amountWithCommission,
        description: 'Retiro de fondos',
        payerEmail: userData.email
      });

      if (paymentResponse.data.init_point) {
        // Redirigir a la página de Mercado Pago con el enlace proporcionado
        window.location.href = paymentResponse.data.init_point;

        // Actualizar el estado de la solicitud a 'approved'
        await updateDoc(requestRef, { status: 'approved' });
        // Eliminar la solicitud de retiro de la base de datos
        await deleteDoc(requestRef);
        // Actualizar el estado en la UI
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
      const requestDoc = await getDoc(requestRef); // Obtener el documento de la solicitud
      const requestData = requestDoc.data();

      // Restablecer el balance del usuario
      const userRef = doc(db, 'users', requestData.userId);
      await updateDoc(userRef, { balance: requestData.amount });

      // Eliminar la solicitud de retiro de la base de datos
      await deleteDoc(requestRef);

      // Actualizar el estado en la UI
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
      <SendNotification /> {/* Include the SendNotification component here */}
      {withdrawalRequests.map(request => (
        <div key={request.id} className="withdrawal-request">
          <img src={request.userPhotoURL} alt={request.username} className="user-photo" />
          <span>{request.username}</span>
          <span>${(request.amount * 0.9).toLocaleString('es-AR')}</span> {/* Muestra el monto con la comisión aplicada */}
          <button onClick={() => handleApprove(request.id)}>Aprobar</button>
          <button onClick={() => handleDeny(request.id)}>Denegar</button>
        </div>
      ))}
    </div>
  );
};

export default AdminDashboard;
