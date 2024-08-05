import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db, storage } from '../../firebaseConfig';
import { doc, getDoc, updateDoc, collection, addDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import UserContext from '../../context/UserContext';
import '../../Styles/ServiceDetailsWorker.css';

const ServiceDetailsWorker = () => {
  const { user, loading, error } = useContext(UserContext);
  const { requestId, clientId } = useParams();
  const navigate = useNavigate();
  const [serviceDetails, setServiceDetails] = useState(null);
  const [completedImages, setCompletedImages] = useState([]);
  const [comment, setComment] = useState('');
  const [submitLoading, setSubmitLoading] = useState(false);
  const [fetchError, setFetchError] = useState('');

  useEffect(() => {
    const fetchServiceDetails = async () => {
      if (user && !loading) {
        try {
          const serviceRef = doc(db, 'users', user.uid, 'ServiceRequests', requestId);
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
  }, [user, loading, requestId]);

  const handleFilesChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    setCompletedImages(selectedFiles);
  };

  const handleSubmit = async () => {
    if (completedImages.length === 0) {
      alert('Por favor, sube al menos una imagen del trabajo completado.');
      return;
    }

    setSubmitLoading(true);
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
      await updateDoc(serviceRef, { completedImages: uploadedFiles, status: 'delivered', comment });

      const clientServiceRef = doc(db, 'users', clientId, 'ServiceHired', requestId);
      await updateDoc(clientServiceRef, { completedImages: uploadedFiles, status: 'delivered', comment });

      // Enviar notificación al cliente
      const notificationsRef = collection(db, 'users', clientId, 'Notifications');
      await addDoc(notificationsRef, {
        message: `El servicio "${serviceDetails.serviceTitle}" ha sido completado.`,
        timestamp: new Date(),
        read: false,
      });

      alert('Trabajo entregado con éxito.');
      navigate(`/workbench`);
    } catch (error) {
      console.error('Error al subir el trabajo:', error);
      setFetchError('Hubo un error al subir el trabajo. Inténtelo de nuevo.');
    } finally {
      setSubmitLoading(false);
    }
  };

  if (loading) {
    return <p>Cargando...</p>; // O un spinner de carga si lo prefieres
  }

  if (error || fetchError) {
    return <p className="error-message">{error || fetchError}</p>;
  }

  if (!user) {
    return <p className="error-message">No se ha iniciado sesión.</p>;
  }

  return (
    <div className="service-details-container">
      <h2>Detalles del Servicio para Trabajador</h2>
      {serviceDetails ? (
        <div className="service-details-content">
          <div className="service-details-info">
            <p className="price">Precio: ${serviceDetails.servicePrice}</p>
            <h3>Título: {serviceDetails.serviceTitle}</h3>
            <h4>Descripción:</h4>
            <p>{serviceDetails.description}</p>
          </div>
          <div className="service-details-image">
            <h4>Imágenes Subidas por el Cliente</h4>
            <div className="images-container">
              {serviceDetails.files && serviceDetails.files.map((file, index) => (
                <img key={index} src={file} alt={`Cliente imagen ${index + 1}`} />
              ))}
            </div>
          </div>
          <div className="service-details-info">
            <h4>Comentario del Trabajo</h4>
            <textarea
              placeholder="Describe el trabajo realizado..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              maxLength={360}
              rows={5}
            />
          </div>
          <div className="service-details-info">
            <h4>Subir Trabajo Completado</h4>
            <input type="file" multiple accept="image/*" onChange={handleFilesChange} />
          </div>
          <button onClick={handleSubmit} disabled={submitLoading}>
            {submitLoading ? 'Enviando...' : 'Entregar Trabajo'}
          </button>
        </div>
      ) : (
        <p>Cargando detalles del servicio...</p>
      )}
    </div>
  );
};

export default ServiceDetailsWorker;
