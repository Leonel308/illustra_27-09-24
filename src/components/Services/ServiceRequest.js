import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db, storage } from '../../firebaseConfig';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { doc, addDoc, getDoc, setDoc, collection, updateDoc } from 'firebase/firestore';
import '../../Styles/ServiceRequest.css';
import UserContext from '../../context/UserContext';

const ServiceRequest = () => {
  const { user: currentUser } = useContext(UserContext);
  const { illustratorID, serviceId } = useParams();
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
        if (illustratorID && serviceId) {
          console.log(`Fetching service with ID: ${serviceId} from illustrator: ${illustratorID}`);
          const serviceRef = doc(db, 'users', illustratorID, 'Services', serviceId);
          const serviceDoc = await getDoc(serviceRef);

          if (serviceDoc.exists()) {
            const serviceData = serviceDoc.data();
            console.log("Service document found:", serviceData);
            setServiceTitle(serviceData.title);
            setServicePrice(Number(serviceData.price));  // Convertir precio a número

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
    if (!description) {
      setError('Por favor, completa la descripción.');
      return;
    }

    if (files.length === 0) {
      setError('Por favor, adjunta al menos un archivo.');
      return;
    }

    if (!currentUser) {
      setError('Debes estar logueado para hacer una solicitud.');
      return;
    }

    if (currentUser.uid === illustratorID) {
      setError('No puedes contratar tu propio servicio.');
      return;
    }

    const userRef = doc(db, 'users', currentUser.uid);
    const userDoc = await getDoc(userRef);
    const userData = userDoc.data();

    if (Number(userData.balance) < servicePrice) {
      setError('Saldo insuficiente. Por favor, recarga tu billetera.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const currentUserId = currentUser.uid;
      const serviceRequestRef = collection(db, 'users', illustratorID, 'ServiceRequests');

      const uploadedFiles = await Promise.all(
        files.map(async (file) => {
          const fileRef = ref(storage, `service-requests/${illustratorID}/${file.name}`);
          await uploadBytes(fileRef, file);
          return await getDownloadURL(fileRef);
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
        clientUsername: currentUser.username,
      };

      const docRef = await addDoc(serviceRequestRef, newRequest);

      const paymentRef = await addDoc(collection(db, 'users', currentUserId, 'Payments'), {
        amount: servicePrice,
        illustratorID: illustratorID,
        paymentMethod: 'wallet',
        serviceID: docRef.id,
        status: 'pending',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      await updateDoc(docRef, { paymentId: paymentRef.id });

      await updateDoc(userRef, {
        balance: Number(userData.balance) - servicePrice,
        pendingBalance: (userData.pendingBalance || 0) + servicePrice,
      });

      const clientServiceHiredRef = doc(db, 'users', currentUserId, 'ServiceHired', docRef.id);
      await setDoc(clientServiceHiredRef, {
        illustratorId: illustratorID,
        serviceTitle: serviceTitle,
        servicePrice: servicePrice,
        status: 'pending',
        createdAt: new Date(),
        serviceID: docRef.id,
      });

      const notificationsRef = collection(db, 'users', illustratorID, 'Notifications');
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
          accept="image/*" 
          onChange={handleFilesChange} 
        />
        {files.length > 0 && <p>{files.length} archivo(s) seleccionados</p>}
      </div>
      <button onClick={submitServiceRequest} disabled={loading || currentUser?.uid === illustratorID}>
        {loading ? 'Enviando...' : 'Enviar Solicitud'}
      </button>
    </div>
  );
};

export default ServiceRequest;
