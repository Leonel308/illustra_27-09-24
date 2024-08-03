import React, { useEffect, useState, useContext } from 'react';
import { db } from '../firebaseConfig';
import { collection, getDocs, updateDoc, doc } from 'firebase/firestore';
import UserContext from '../context/UserContext';
import '../Styles/Workbench.css';

const Workbench = () => {
  const { user } = useContext(UserContext);
  const [receivedRequests, setReceivedRequests] = useState([]);
  const [hiredRequests, setHiredRequests] = useState([]);
  const [activeTab, setActiveTab] = useState('received'); // Default tab is 'received'

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

  const handleAccept = async (requestId) => {
    await updateDoc(doc(db, 'users', user.uid, 'ServiceRequests', requestId), {
      status: 'accepted',
    });
    alert('Solicitud aceptada');
    // Opcional: Redirigir a una página de detalles o actualizaciones adicionales
  };

  const handleDeny = async (requestId) => {
    const reason = prompt('Por favor, explique el motivo de la denegación:');
    if (reason) {
      await updateDoc(doc(db, 'users', user.uid, 'ServiceRequests', requestId), {
        status: 'denied',
        reason,
      });
      alert('Solicitud denegada');
    }
  };

  return (
    <div className="workbench-container">
      <h2>Mesa de Trabajo</h2>
      <div className="tabs">
        <button 
          className={activeTab === 'received' ? 'active' : ''} 
          onClick={() => setActiveTab('received')}
        >
          Contrataciones Recibidas
        </button>
        <button 
          className={activeTab === 'hired' ? 'active' : ''} 
          onClick={() => setActiveTab('hired')}
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
              <button onClick={() => handleAccept(request.id)}>Aceptar</button>
              <button onClick={() => handleDeny(request.id)}>Denegar</button>
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
