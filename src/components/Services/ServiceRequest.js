import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db, storage } from '../../firebaseConfig';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { doc, addDoc, getDoc, setDoc, collection, updateDoc } from 'firebase/firestore';
import '../../Styles/ServiceRequest.css';
import UserContext from '../../context/UserContext';

const ServiceRequest = () => {
  const { user: currentUser } = useContext(UserContext);
  const { illustratorID, serviceId } = useParams();  // illustratorID es el del servicio contratado
  const navigate = useNavigate();
  const [description, setDescription] = useState('');
  const [files, setFiles] = useState([]);
  const [serviceTitle, setServiceTitle] = useState('');
  const [servicePrice, setServicePrice] = useState(0);
  const [serviceDescription, setServiceDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchServiceDetails = async () => {
      try {
        if (illustratorID && serviceId) {
          const serviceRef = doc(db, 'users', illustratorID, 'Services', serviceId);
          const serviceDoc = await getDoc(serviceRef);

          if (serviceDoc.exists()) {
            const serviceData = serviceDoc.data();
            setServiceTitle(serviceData.title);
            setServicePrice(Number(serviceData.price));
            setServiceDescription(serviceData.description);

            if (currentUser && currentUser.uid === illustratorID) {
              setError('No puedes contratar tu propio servicio, pero puedes ver los detalles.');
            }
          } else {
            setError('El servicio no existe.');
          }
        } else {
          setError('Los parámetros de servicio no son válidos.');
        }
      } catch (error) {
        console.error('Error fetching service details:', error);
        setError('Hubo un error al obtener los detalles del servicio.');
      }
    };

    fetchServiceDetails();
  }, [serviceId, illustratorID, currentUser]);

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
    console.log('Intentando enviar solicitud de servicio...');
    
    // Validaciones iniciales
    if (!description) {
      setError('Por favor, completa la descripción.');
      console.log('Error: Descripción faltante.');
      return;
    }

    if (!currentUser) {
      setError('Debes estar logueado para hacer una solicitud.');
      console.log('Error: Usuario no autenticado.');
      return;
    }

    if (currentUser.uid === illustratorID) {
      setError('No puedes contratar tu propio servicio.');
      console.log('Error: Usuario intentando contratar su propio servicio.');
      return;
    }

    try {
      const userRef = doc(db, 'users', currentUser.uid);
      const userDoc = await getDoc(userRef);
      const userData = userDoc.data();

      if (Number(userData.balance) < servicePrice) {
        setError('Saldo insuficiente. Por favor, recarga tu billetera.');
        console.log('Error: Saldo insuficiente.');
        return;
      }

      setLoading(true);
      setError('');

      const currentUserId = currentUser.uid;
      const serviceRequestRef = collection(db, 'users', illustratorID, 'ServiceRequests');

      let uploadedFiles = [];

      if (files.length > 0) {
        console.log('Subiendo archivos...');
        uploadedFiles = await Promise.all(
          files.map(async (file) => {
            const uniqueFileName = `${Date.now()}_${file.name}`; // Evitar colisiones
            const fileRef = ref(storage, `service-requests/${illustratorID}/${uniqueFileName}`);
            await uploadBytes(fileRef, file);
            const downloadURL = await getDownloadURL(fileRef);
            console.log(`Archivo subido: ${downloadURL}`);
            return downloadURL;
          })
        );
      }

      // Crear el nuevo documento en ServiceRequests
      const newRequest = {
        description,
        files: uploadedFiles,
        serviceTitle,
        serviceDescription,
        servicePrice,
        createdAt: new Date(),
        status: 'pending',
        clientId: currentUserId,
        clientUsername: currentUser.username || 'Cliente', // Asegúrate de que el username esté disponible
        illustratorHiredId: illustratorID,
        acceptedByClient: false, // Alineado con ServiceHired
        serviceID: '', // Será llenado después de obtener el ID del documento
      };

      const docRef = await addDoc(serviceRequestRef, newRequest);
      console.log('Solicitud de servicio creada con ID:', docRef.id);

      // Actualizar el campo serviceID en ServiceRequests
      await updateDoc(docRef, { serviceID: docRef.id });
      console.log('Campo serviceID actualizado en ServiceRequests.');

      // Crear un pago en la subcolección Payments del usuario
      const paymentRef = await addDoc(collection(db, 'users', currentUserId, 'Payments'), {
        amount: servicePrice,
        illustratorHiredId: illustratorID,
        paymentMethod: 'wallet',
        serviceID: docRef.id,
        status: 'pending',
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      console.log('Pago creado con ID:', paymentRef.id);

      // Actualizar el request con el ID del pago
      await updateDoc(docRef, { paymentId: paymentRef.id });
      console.log('Campo paymentId actualizado en ServiceRequests.');

      // Actualizar el balance del cliente
      await updateDoc(userRef, {
        balance: Number(userData.balance) - servicePrice,
        pendingBalance: (userData.pendingBalance || 0) + servicePrice,
      });
      console.log('Balance del cliente actualizado.');

      // Crear un documento correspondiente en la subcolección ServiceHired del cliente
      const clientServiceHiredRef = doc(db, 'users', currentUserId, 'ServiceHired', docRef.id);
      await setDoc(clientServiceHiredRef, {
        illustratorHiredId: illustratorID,
        serviceTitle: serviceTitle,
        serviceDescription: serviceDescription,
        servicePrice: servicePrice,
        description: description,
        files: uploadedFiles,
        status: 'pending',
        createdAt: new Date(),
        serviceID: docRef.id,
        acceptedByClient: false,
      });
      console.log('Documento creado en ServiceHired con ID:', docRef.id);

      // Enviar notificación al ilustrador
      const notificationsRef = collection(db, 'users', illustratorID, 'Notifications');
      await addDoc(notificationsRef, {
        message: `Has recibido una nueva solicitud de servicio para "${serviceTitle}".`,
        timestamp: new Date(),
        read: false,
      });
      console.log('Notificación enviada al ilustrador.');

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
          accept="image/*" 
          onChange={handleFilesChange} 
        />
        {files.length > 0 && <p>{files.length} archivo(s) seleccionados</p>}
      </div>
      <button onClick={submitServiceRequest} disabled={loading || (currentUser?.uid === illustratorID)}>
        {loading ? 'Enviando...' : 'Enviar Solicitud'}
      </button>
    </div>
  );
};

export default ServiceRequest;
