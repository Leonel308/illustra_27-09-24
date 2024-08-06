import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db, storage } from '../../firebaseConfig';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { doc, addDoc, getDoc, setDoc, collection, updateDoc } from 'firebase/firestore'; // Asegúrate de importar updateDoc
import '../../Styles/ServiceRequest.css';
import UserContext from '../../context/UserContext';

const ServiceRequest = () => {
  const { user: currentUser } = useContext(UserContext);
  const { serviceId, userId } = useParams();
  const navigate = useNavigate();
  const [description, setDescription] = useState('');
  const [files, setFiles] = useState([]);
  const [serviceTitle, setServiceTitle] = useState('');
  const [servicePrice, setServicePrice] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchServiceDetails = async () => {
      try {
        const serviceRef = doc(db, 'users', userId, 'Services', serviceId);
        const serviceDoc = await getDoc(serviceRef);
        if (serviceDoc.exists()) {
          const serviceData = serviceDoc.data();
          setServiceTitle(serviceData.title);
          setServicePrice(serviceData.price);
        } else {
          setError('El documento no existe.');
        }
      } catch (error) {
        console.error('Error fetching service details:', error);
        setError('Hubo un error al obtener los detalles del servicio.');
      }
    };

    if (serviceId && userId) {
      fetchServiceDetails();
    }
  }, [serviceId, userId]);

  const handleFilesChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    if (selectedFiles.length > 6) {
      alert('Puedes subir un máximo de 6 imágenes.');
      setFiles(selectedFiles.slice(0, 6));
    } else {
      setFiles(selectedFiles);
    }
  };

  const submitServiceRequest = async () => {
    if (!description) {
      setError('Por favor, complete la descripción.');
      return;
    }

    if (files.length === 0) {
      setError('Por favor, adjunte al menos un archivo.');
      return;
    }

    if (!currentUser) {
      setError('Debes estar logueado para hacer una solicitud.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const currentUserId = currentUser.uid;
      const serviceRequestRef = collection(db, 'users', userId, 'ServiceRequests');

      const uploadedFiles = await Promise.all(
        files.map(async (file) => {
          const fileRef = ref(storage, `service-requests/${userId}/${file.name}`);
          await uploadBytes(fileRef, file);
          const fileUrl = await getDownloadURL(fileRef);
          return fileUrl;
        })
      );

      const newRequest = {
        description,
        files: uploadedFiles,
        serviceTitle,
        servicePrice,
        createdAt: new Date(),
        status: 'pending',
        clientId: currentUserId,
        paymentId: '', // Este campo se actualizará después de crear el documento en Payments
      };

      const docRef = await addDoc(serviceRequestRef, newRequest);

      // Crear un registro de pago en la subcolección Payments del usuario
      const paymentRef = await addDoc(collection(db, 'users', currentUserId, 'Payments'), {
        amount: servicePrice,
        illustratorID: userId,
        paymentMethod: 'wallet',
        serviceID: docRef.id, // Aquí guardamos el ID del servicio
        status: 'pending',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // Actualizar el paymentId en la solicitud de servicio
      await updateDoc(docRef, { paymentId: paymentRef.id });

      // Actualizar el balance y el pendingBalance del usuario
      const userRef = doc(db, 'users', currentUserId);
      const userDoc = await getDoc(userRef);
      const userData = userDoc.data();

      await updateDoc(userRef, {
        balance: userData.balance - servicePrice,
        pendingBalance: (userData.pendingBalance || 0) + servicePrice,
      });

      // Guardar la solicitud en ServiceHired con serviceID
      const clientServiceHiredRef = doc(db, 'users', currentUserId, 'ServiceHired', docRef.id);
      await setDoc(clientServiceHiredRef, {
        illustratorId: userId,
        serviceTitle: serviceTitle,
        servicePrice: servicePrice,
        status: 'pending',
        createdAt: new Date(),
        serviceID: docRef.id, // Guardar el serviceID en ServiceHired
      });

      // Enviar notificación al ilustrador
      const notificationsRef = collection(db, 'users', userId, 'Notifications');
      await addDoc(notificationsRef, {
        message: `Has recibido una nueva solicitud de servicio para "${serviceTitle}".`,
        timestamp: new Date(),
        read: false,
      });

      alert('Solicitud enviada con éxito');
      navigate(`/profile/${currentUserId}`);
    } catch (error) {
      console.error('Error al enviar la solicitud:', error);
      setError('Hubo un error al enviar la solicitud. Por favor, inténtelo de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="service-request-container">
      <h2>Solicitar Servicio</h2>
      {error && <p className="error-message">{error}</p>}
      {serviceTitle ? <h3>{serviceTitle}</h3> : <p>Cargando título...</p>}
      <p>Costo: ${servicePrice ? servicePrice.toLocaleString() : 'Cargando precio...'}</p>
      <textarea
        placeholder="Describa lo que necesita"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
      />
      <div className="file-input-wrapper">
        <input 
          type="file" 
          multiple 
          accept=".png" 
          onChange={handleFilesChange} 
        />
        {files.length > 0 && <p>{files.length} archivo(s) seleccionados</p>}
      </div>
      <button onClick={submitServiceRequest} disabled={loading}>
        {loading ? 'Enviando...' : 'Enviar Solicitud'}
      </button>
    </div>
  );
};

export default ServiceRequest;
