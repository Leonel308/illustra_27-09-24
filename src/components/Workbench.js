import React, { useEffect, useState, useContext } from 'react';
import { db } from '../firebaseConfig';
import { collection, getDocs, updateDoc, deleteDoc, doc, addDoc, getDoc } from 'firebase/firestore'; // Make sure to import `getDoc`
import { useNavigate } from 'react-router-dom';
import UserContext from '../context/UserContext';
import '../Styles/Workbench.css';

const Workbench = () => {
  const { user } = useContext(UserContext);
  const [receivedRequests, setReceivedRequests] = useState([]);
  const [hiredRequests, setHiredRequests] = useState([]);
  const [activeTab, setActiveTab] = useState('received'); // Default tab is 'received'
  const navigate = useNavigate();

  useEffect(() => {
    const fetchRequests = async () => {
      if (user) {
        // Fetch received requests
        const receivedRef = collection(db, 'users', user.uid, 'ServiceRequests');
        const receivedSnapshot = await getDocs(receivedRef);
        setReceivedRequests(receivedSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));

        // Fetch hired requests
        const hiredRef = collection(db, 'users', user.uid, 'ServiceHired');
        const hiredSnapshot = await getDocs(hiredRef);
        setHiredRequests(hiredSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      }
    };

    fetchRequests();
  }, [user]);

  const handleAccept = async (requestId, clientId, servicePrice) => {
    try {
      // Update the status to "in progress" in the illustrator's collection
      await updateDoc(doc(db, 'users', user.uid, 'ServiceRequests', requestId), {
        status: 'in progress',
      });

      // Update the status to "in progress" in the client's collection
      await updateDoc(doc(db, 'users', clientId, 'ServiceHired', requestId), {
        status: 'in progress',
      });

      // Update the interface for the illustrator
      setReceivedRequests(receivedRequests.map(request =>
        request.id === requestId ? { ...request, status: 'in progress' } : request
      ));

      // Move funds from pendingBalance to the illustrator's balance
      const clientRef = doc(db, 'users', clientId);
      const clientDoc = await getDoc(clientRef);
      const clientData = clientDoc.data();

      await updateDoc(clientRef, {
        pendingBalance: clientData.pendingBalance - servicePrice,
      });

      const illustratorRef = doc(db, 'users', user.uid);
      const illustratorDoc = await getDoc(illustratorRef);
      const illustratorData = illustratorDoc.data();

      await updateDoc(illustratorRef, {
        balance: illustratorData.balance + servicePrice,
      });

      alert('Solicitud aceptada. Estado actualizado a "in progress".');
    } catch (error) {
      console.error('Error al aceptar la solicitud:', error);
      alert('Hubo un error al aceptar la solicitud. Intenta nuevamente.');
    }
  };

  const handleDeny = async (requestId, clientId, serviceTitle, servicePrice) => {
    try {
      // Delete the request from the illustrator's collection
      await deleteDoc(doc(db, 'users', user.uid, 'ServiceRequests', requestId));
      setReceivedRequests(receivedRequests.filter(request => request.id !== requestId));

      // Delete the request from the client's ServiceHired collection
      await deleteDoc(doc(db, 'users', clientId, 'ServiceHired', requestId));
      setHiredRequests(hiredRequests.filter(request => request.id !== requestId));

      // Send notification to the client
      const notificationsRef = collection(db, 'users', clientId, 'Notifications');
      await addDoc(notificationsRef, {
        message: `Tu solicitud para el servicio "${serviceTitle}" ha sido denegada.`,
        timestamp: new Date(),
        read: false,
      });

      // Refund the balance to the client
      const clientRef = doc(db, 'users', clientId);
      const clientDoc = await getDoc(clientRef);
      const clientData = clientDoc.data();

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
              <p>Precio: ${request.servicePrice}</p>
              <p>Estado: {request.status}</p>
              {request.status === 'in progress' ? (
                <button 
                  className="view-details-button"
                  onClick={() => handleViewDetails(request.id, request.clientId, 'worker')}
                >
                  Ver detalles
                </button>
              ) : (
                <>
                  <button onClick={() => handleAccept(request.id, request.clientId, request.servicePrice)}>Aceptar</button>
                  <button onClick={() => handleDeny(request.id, request.clientId, request.serviceTitle, request.servicePrice)}>Denegar</button>
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
