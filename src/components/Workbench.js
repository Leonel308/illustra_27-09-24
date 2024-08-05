import React, { useEffect, useState, useContext } from 'react';
import { db } from '../firebaseConfig';
import { collection, getDocs, updateDoc, deleteDoc, doc, addDoc } from 'firebase/firestore';
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

  const handleAccept = async (requestId, clientId) => {
    try {
      // Actualizar el estado de la solicitud a "in progress" en la colección del ilustrador
      await updateDoc(doc(db, 'users', user.uid, 'ServiceRequests', requestId), {
        status: 'in progress',
      });

      // Actualizar el estado de la solicitud a "in progress" en la colección del contratante
      await updateDoc(doc(db, 'users', clientId, 'ServiceHired', requestId), {
        status: 'in progress',
      });

      // Actualizar la interfaz del ilustrador
      setReceivedRequests(receivedRequests.map(request =>
        request.id === requestId ? { ...request, status: 'in progress' } : request
      ));

      alert('Solicitud aceptada. Estado actualizado a "in progress".');
    } catch (error) {
      console.error('Error al aceptar la solicitud:', error);
      alert('Hubo un error al aceptar la solicitud. Intenta nuevamente.');
    }
  };

  const handleDeny = async (requestId, clientId, serviceTitle) => {
    try {
      // Eliminar la solicitud de la base de datos
      await deleteDoc(doc(db, 'users', user.uid, 'ServiceRequests', requestId));
      setReceivedRequests(receivedRequests.filter(request => request.id !== requestId));

      // Eliminar la solicitud de la colección ServiceHired del cliente
      await deleteDoc(doc(db, 'users', clientId, 'ServiceHired', requestId));
      setHiredRequests(hiredRequests.filter(request => request.id !== requestId));

      // Enviar notificación al cliente
      const notificationsRef = collection(db, 'users', clientId, 'Notifications');
      await addDoc(notificationsRef, {
        message: `Tu solicitud para el servicio "${serviceTitle}" ha sido denegada.`,
        timestamp: new Date(),
        read: false,
      });

      alert('Solicitud denegada y notificación enviada al cliente.');
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
                  <button onClick={() => handleAccept(request.id, request.clientId)}>Aceptar</button>
                  <button onClick={() => handleDeny(request.id, request.clientId, request.serviceTitle)}>Denegar</button>
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
