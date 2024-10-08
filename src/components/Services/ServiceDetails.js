import React, { useState, useEffect, useContext } from 'react';
import { useParams } from 'react-router-dom';
import { db, storage } from '../../firebaseConfig';
import { doc, getDoc, updateDoc, collection, addDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import UserContext from '../../context/UserContext';
import '../../Styles/ServiceDetails.css';

const ServiceDetails = () => {
  const { user } = useContext(UserContext);
  const { requestId, clientId } = useParams();
  const [serviceDetails, setServiceDetails] = useState(null);
  const [completedImages, setCompletedImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isContractor, setIsContractor] = useState(false);

  useEffect(() => {
    const fetchServiceDetails = async () => {
      try {
        const serviceRef = doc(db, 'users', user.uid === clientId ? clientId : user.uid, 'ServiceRequests', requestId);
        const serviceDoc = await getDoc(serviceRef);

        if (serviceDoc.exists()) {
          setServiceDetails(serviceDoc.data());
          setIsContractor(user.uid === clientId);  // Verifica si el usuario es el contratador
        } else {
          setError('No se encontraron los detalles del servicio.');
        }
      } catch (error) {
        console.error('Error al obtener los detalles del servicio:', error);
        setError('Hubo un error al obtener los detalles del servicio.');
      }
    };

    fetchServiceDetails();
  }, [requestId, user.uid, clientId]);

  const handleFilesChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    setCompletedImages(selectedFiles);
  };

  const handleSubmit = async () => {
    if (completedImages.length === 0) {
      alert('Por favor, sube al menos una imagen del trabajo completado.');
      return;
    }

    setLoading(true);
    try {
      const uploadedFiles = await Promise.all(
        completedImages.map(async (file) => {
          const fileRef = ref(storage, `completed-services/${user.uid}/${file.name}`);
          await uploadBytes(fileRef, file);
          const fileUrl = await getDownloadURL(fileRef);
          return fileUrl;
        })
      );

      const serviceRef = doc(db, 'users', user.uid, 'ServiceRequests', requestId);
      await updateDoc(serviceRef, { completedImages: uploadedFiles, status: 'delivered' });

      const clientServiceRef = doc(db, 'users', clientId, 'ServiceHired', requestId);
      await updateDoc(clientServiceRef, { completedImages: uploadedFiles, status: 'delivered' });

      // Enviar notificación al cliente
      const notificationsRef = collection(db, 'users', clientId, 'Notifications');
      await addDoc(notificationsRef, {
        message: `El servicio "${serviceDetails.serviceTitle}" ha sido completado.`,
        timestamp: new Date(),
        read: false,
      });

      alert('Trabajo entregado con éxito.');
    } catch (error) {
      console.error('Error al subir el trabajo:', error);
      setError('Hubo un error al subir el trabajo. Inténtelo de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptWork = async () => {
    try {
      await updateDoc(doc(db, 'users', clientId, 'ServiceHired', requestId), {
        status: 'accepted',
      });

      // Enviar notificación al trabajador
      const notificationsRef = collection(db, 'users', user.uid, 'Notifications');
      await addDoc(notificationsRef, {
        message: `El cliente ha aceptado el trabajo para "${serviceDetails.serviceTitle}".`,
        timestamp: new Date(),
        read: false,
      });

      alert('Has aceptado el trabajo.');
    } catch (error) {
      console.error('Error al aceptar el trabajo:', error);
      setError('Hubo un error al aceptar el trabajo. Inténtelo de nuevo.');
    }
  };

  return (
    <div className="service-details-container">
      <h2>Detalles del Servicio</h2>
      {error && <p className="error-message">{error}</p>}
      {serviceDetails ? (
        <div>
          <h3>{serviceDetails.serviceTitle}</h3>
          <p>{serviceDetails.description}</p>
          <p>Precio: ${serviceDetails.servicePrice}</p>
          <h4>Imágenes Subidas por el Cliente</h4>
          <div className="images-container">
            {serviceDetails.files && serviceDetails.files.map((file, index) => (
              <img key={index} src={file} alt={`Cliente imagen ${index + 1}`} />
            ))}
          </div>

          {isContractor ? (
            // Vista para el contratador
            <div>
              <h4>Acciones del Contratador</h4>
              <button onClick={handleAcceptWork} disabled={loading}>
                {loading ? 'Procesando...' : 'Aceptar Trabajo'}
              </button>
            </div>
          ) : (
            // Vista para el trabajador
            <div>
              <h4>Subir Trabajo Completado</h4>
              <input type="file" multiple accept="image/*" onChange={handleFilesChange} />
              <button onClick={handleSubmit} disabled={loading}>
                {loading ? 'Enviando...' : 'Enviar Trabajo'}
              </button>
            </div>
          )}
        </div>
      ) : (
        <p>Cargando detalles del servicio...</p>
      )}
    </div>
  );
};

export default ServiceDetails;
