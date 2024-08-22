import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db } from '../../firebaseConfig';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import UserContext from '../../context/UserContext';
import '../../Styles/ServiceDetailsUser.css';

const ServiceDetailsUser = () => {
  const { user } = useContext(UserContext);
  const { requestId, illustratorId } = useParams();
  const navigate = useNavigate();
  const [serviceDetails, setServiceDetails] = useState(null);
  const [fetchError, setFetchError] = useState('');

  useEffect(() => {
    const fetchServiceDetails = async () => {
      if (user) {
        try {
          const serviceRef = doc(db, 'users', user.uid, 'ServiceHired', requestId);
          const serviceDoc = await getDoc(serviceRef);

          if (serviceDoc.exists()) {
            setServiceDetails(serviceDoc.data());
          } else {
            setFetchError('No se encontraron los detalles del servicio.');
          }
        } catch (error) {
          console.error('Error al obtener los detalles del servicio:', error);
          setFetchError('Hubo un error al obtener los detalles del servicio.');
        }
      }
    };

    fetchServiceDetails();
  }, [user, requestId]);

  const handleDownloadFiles = async () => {
    if (serviceDetails && serviceDetails.completedImages) {
      for (const [index, file] of serviceDetails.completedImages.entries()) {
        try {
          const response = await fetch(file, { mode: 'no-cors' }); // Usar 'no-cors' para evitar problemas de CORS
          const blob = await response.blob();
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.style.display = 'none';
          a.href = url;
          a.download = `Trabajo_${index + 1}.${blob.type.split('/')[1]}`; // Mantiene la extensión del archivo
          document.body.appendChild(a);
          a.click();
          window.URL.revokeObjectURL(url);
        } catch (error) {
          console.error('Error al descargar el archivo:', error);
        }
      }
    } else {
      alert('No hay archivos disponibles para descargar.');
    }
  };

  const handleAcceptDelivery = async () => {
    if (!window.confirm('¿Estás seguro de que deseas aceptar la entrega de este servicio?')) {
      return;
    }

    try {
      const illustratorRef = doc(db, 'users', illustratorId);
      const illustratorDoc = await getDoc(illustratorRef);
      const illustratorData = illustratorDoc.data();

      const clientRef = doc(db, 'users', user.uid);
      const clientDoc = await getDoc(clientRef);
      const clientData = clientDoc.data();

      // Transfer pendingBalance to illustrator's balance
      await updateDoc(illustratorRef, {
        balance: illustratorData.balance + serviceDetails.servicePrice,
      });

      await updateDoc(clientRef, {
        pendingBalance: clientData.pendingBalance - serviceDetails.servicePrice,
      });

      alert('Entrega aceptada. Los fondos han sido transferidos.');
      navigate(`/workbench`);
    } catch (error) {
      console.error('Error al aceptar la entrega:', error);
      setFetchError('Hubo un error al aceptar la entrega. Inténtelo de nuevo.');
    }
  };

  if (fetchError) {
    return <p className="error-message">{fetchError}</p>;
  }

  return (
    <div className="service-details-container">
      <h2>Detalles del Servicio para Usuario</h2>
      {serviceDetails ? (
        <div className="service-details-content">
          <div className="service-details-info">
            <p className="price">Precio: ${serviceDetails.servicePrice}</p>
            <h3>Título: {serviceDetails.serviceTitle}</h3>
            <h4>Descripción:</h4>
            <p>{serviceDetails.description}</p>
          </div>
          <div className="service-details-image">
            <h4>Imágenes Completadas por el Trabajador</h4>
            <div className="images-container">
              {serviceDetails.completedImages && serviceDetails.completedImages.map((file, index) => (
                <div key={index} className="image-item">
                  <img src={file} alt={`Trabajo imagen ${index + 1}`} />
                </div>
              ))}
            </div>
          </div>
          <div className="actions-container">
            <button onClick={handleDownloadFiles} className="download-button">
              Descargar Archivos
            </button>
            <button onClick={handleAcceptDelivery} className="accept-button">
              Aceptar Entrega
            </button>
          </div>
        </div>
      ) : (
        <p>Cargando detalles del servicio...</p>
      )}
    </div>
  );
};

export default ServiceDetailsUser;
