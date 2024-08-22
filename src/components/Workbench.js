import React, { useEffect, useState, useContext } from 'react';
import { db } from '../firebaseConfig';
import { collection, getDocs, updateDoc, deleteDoc, addDoc, getDoc, doc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import UserContext from '../context/UserContext';
import '../Styles/Workbench.css';

const Workbench = () => {
  const { user } = useContext(UserContext);
  const [receivedRequests, setReceivedRequests] = useState([]);
  const [hiredRequests, setHiredRequests] = useState([]);
  const [activeTab, setActiveTab] = useState('received');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchRequests = async () => {
      if (user) {
        // Fetch received service requests
        const receivedRef = collection(db, 'users', user.uid, 'ServiceRequests');
        const receivedSnapshot = await getDocs(receivedRef);

        const requestsWithUsernames = await Promise.all(
          receivedSnapshot.docs.map(async (docSnapshot) => {
            const requestData = docSnapshot.data();
            const clientRef = doc(db, 'users', requestData.clientId);
            const clientDoc = await getDoc(clientRef);
            const clientUsername = clientDoc.exists() ? clientDoc.data().clientUsername : 'Usuario desconocido';
            return { id: docSnapshot.id, ...requestData, clientUsername };
          })
        );
        setReceivedRequests(requestsWithUsernames);

        // Fetch hired services
        const hiredRef = collection(db, 'users', user.uid, 'ServiceHired');
        const hiredSnapshot = await getDocs(hiredRef);

        const hiredWithUsernames = await Promise.all(
          hiredSnapshot.docs.map(async (docSnapshot) => {
            const requestData = docSnapshot.data();
            const illustratorRef = doc(db, 'users', requestData.illustratorId);
            const illustratorDoc = await getDoc(illustratorRef);
            const illustratorUsername = illustratorDoc.exists() ? illustratorDoc.data().username : 'Usuario desconocido';
            return { id: docSnapshot.id, ...requestData, illustratorUsername };
          })
        );
        setHiredRequests(hiredWithUsernames);
      }
    };

    fetchRequests();
  }, [user]);

  const handleAccept = async (requestId, clientId) => {
    try {
      // Update request status to "in progress"
      await updateDoc(doc(db, 'users', user.uid, 'ServiceRequests', requestId), {
        status: 'in progress',
      });

      await updateDoc(doc(db, 'users', clientId, 'ServiceHired', requestId), {
        status: 'in progress',
      });

      setReceivedRequests(receivedRequests.map(request =>
        request.id === requestId ? { ...request, status: 'in progress' } : request
      ));

      alert('Solicitud aceptada. Estado actualizado a "in progress".');
    } catch (error) {
      console.error('Error al aceptar la solicitud:', error);
      alert('Hubo un error al aceptar la solicitud. Intenta nuevamente.');
    }
  };

  const handleDeny = async (requestId, clientId, serviceTitle, servicePrice, paymentId) => {
    try {
      // Retrieve the client data before making any changes
      const clientRef = doc(db, 'users', clientId);
      const clientDoc = await getDoc(clientRef);
      const clientData = clientDoc.data();

      // Delete request from the illustrator's side
      await deleteDoc(doc(db, 'users', user.uid, 'ServiceRequests', requestId));
      setReceivedRequests(receivedRequests.filter(request => request.id !== requestId));

      // Delete request from the client's side
      await deleteDoc(doc(db, 'users', clientId, 'ServiceHired', requestId));
      setHiredRequests(hiredRequests.filter(request => request.id !== requestId));

      // Send notification to the client
      const notificationsRef = collection(db, 'users', clientId, 'Notifications');
      await addDoc(notificationsRef, {
        message: `Tu solicitud para el servicio "${serviceTitle}" ha sido denegada.`,
        timestamp: new Date(),
        read: false,
      });

      // Update payment status
      const paymentRef = doc(db, 'users', clientId, 'Payments', paymentId);
      await updateDoc(paymentRef, {
        status: 'rejected',
        updatedAt: new Date(),
      });

      // Update the client's balance and pending balance
      await updateDoc(clientRef, {
        balance: clientData.balance + servicePrice,
        pendingBalance: clientData.pendingBalance - servicePrice,
      });

      alert('Solicitud denegada, saldo devuelto y notificación enviada al cliente.');
    } catch (error) {
      console.error('Error al denegar la solicitud:', error);
      alert('Hubo un error al denegar la solicitud. Intenta nuevamente.');
    }
  };

  const handleViewDetails = (requestId, clientId, role) => {
    const path = role === 'worker'
      ? `/service-details-worker/${requestId}/${clientId}`
      : `/service-details-user/${requestId}/${clientId}`;
    navigate(path);
  };

  return (
    <div className="workbench-container">
      <h1>Mesa de Trabajo</h1>
      <div className="tabs">
        <button
          className={activeTab === 'received' ? 'active' : ''}
          onClick={() => setActiveTab('received')}
          aria-label="Contrataciones Recibidas"
        >
          Contrataciones Recibidas
        </button>
        <button
          className={activeTab === 'hired' ? 'active' : ''}
          onClick={() => setActiveTab('hired')}
          aria-label="Contrataciones Realizadas"
        >
          Contrataciones Realizadas
        </button>
      </div>

      {activeTab === 'received' ? (
        receivedRequests.length > 0 ? (
          receivedRequests.map(request => (
            <div key={request.id} className="workbench-item">
              <h3>{request.serviceTitle}</h3>
              <p>{request.description}</p>
              <p>Solicitado por: {request.clientUsername}</p>
              <p>Precio: ${request.servicePrice}</p>
              <p>Estado: {request.status}</p>
              {request.status === 'delivered' ? (
                <button className="waiting-confirmation-button">Esperando confirmación...</button>
              ) : request.status === 'in progress' ? (
                <button
                  className="view-details-button"
                  onClick={() => handleViewDetails(request.id, request.clientId, 'worker')}
                >
                  Ver detalles
                </button>
              ) : (
                <>
                  <button onClick={() => handleAccept(request.id, request.clientId)}>Aceptar</button>
                  <button onClick={() => handleDeny(request.id, request.clientId, request.serviceTitle, request.servicePrice, request.paymentId)}>Denegar</button>
                </>
              )}
            </div>
          ))
        ) : (
          <p>No tienes solicitudes recibidas pendientes.</p>
        )
      ) : (
        hiredRequests.length > 0 ? (
          hiredRequests.map(request => (
            <div key={request.id} className="workbench-item">
              <h3>{request.serviceTitle}</h3>
              <p>{request.description}</p>
              <p>Proveedor del servicio: {request.illustratorUsername}</p>
              <p>Precio: ${request.servicePrice}</p>
              <p>Estado: {request.status}</p>
              <button
                className="view-details-button"
                onClick={() => handleViewDetails(request.id, user.uid, 'user')}
              >
                Ver detalles
              </button>
            </div>
          ))
        ) : (
          <p>No has realizado ninguna contratación.</p>
        )
      )}
    </div>
  );
};

export default Workbench;
