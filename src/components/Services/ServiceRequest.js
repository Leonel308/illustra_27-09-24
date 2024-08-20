import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db, storage } from '../../firebaseConfig';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { doc, addDoc, getDoc, setDoc, collection, updateDoc } from 'firebase/firestore';
import '../../Styles/ServiceRequest.css';
import UserContext from '../../context/UserContext';
import PaymentMethodModal from './PaymentMethodModal';

const ServiceRequest = () => {
  const { user: currentUser } = useContext(UserContext);
  const { serviceId, illustratorID } = useParams();
  const navigate = useNavigate();
  const [description, setDescription] = useState('');
  const [files, setFiles] = useState([]);
  const [serviceTitle, setServiceTitle] = useState('');
  const [servicePrice, setServicePrice] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  useEffect(() => {
    const fetchServiceDetails = async () => {
      try {
        if (illustratorID && serviceId) {
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

  const handlePaymentMethodSelection = async (method) => {
    setShowPaymentModal(false);

    if (method === 'wallet') {
      const userRef = doc(db, 'users', currentUser.uid);
      const userDoc = await getDoc(userRef);
      const userData = userDoc.data();
      
      if (Number(userData.balance) >= servicePrice) {  // Asegurarse de que balance sea un número
        await submitServiceRequest(method);
      } else {
        setError('Saldo insuficiente. Por favor, recarga tu billetera.');
      }
    } else if (method === 'mercadoPago') {
      handleMercadoPago();
    }
  };

  const handleMercadoPago = async () => {
    try {
      // Crear una preferencia de pago en tu backend o directamente desde el frontend usando la API de Mercado Pago.
      const response = await fetch('https://us-central1-illustra-6ca8a.cloudfunctions.net/api/createPayment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: servicePrice,
          description: serviceTitle,
          payerEmail: currentUser.email,
        }),
      });

      const data = await response.json();

      if (data.init_point) {
        window.location.href = data.init_point; // Redirigir a la página de pago de Mercado Pago
      } else {
        setError('Hubo un problema al procesar el pago con Mercado Pago. Por favor, inténtalo de nuevo.');
      }
    } catch (error) {
      console.error('Error al redirigir a Mercado Pago:', error);
      setError('Hubo un problema al procesar el pago con Mercado Pago. Por favor, inténtalo de nuevo.');
    }
  };

  const submitServiceRequest = async (paymentMethod) => {
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
        paymentId: '',
      };

      const docRef = await addDoc(serviceRequestRef, newRequest);

      const paymentRef = await addDoc(collection(db, 'users', currentUserId, 'Payments'), {
        amount: servicePrice,
        illustratorID: illustratorID,
        paymentMethod,
        serviceID: docRef.id,
        status: 'pending',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      await updateDoc(docRef, { paymentId: paymentRef.id });

      if (paymentMethod === 'wallet') {
        const userRef = doc(db, 'users', currentUserId);
        const userDoc = await getDoc(userRef);
        const userData = userDoc.data();

        await updateDoc(userRef, {
          balance: Number(userData.balance) - servicePrice,
          pendingBalance: (userData.pendingBalance || 0) + servicePrice,
        });
      }

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

  const handleSubmit = () => {
    if (!description || files.length === 0) {
      setError('Por favor, completa la descripción y adjunta al menos un archivo.');
    } else {
      setShowPaymentModal(true);
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
      <button onClick={handleSubmit} disabled={loading || currentUser?.uid === illustratorID}>
        {loading ? 'Enviando...' : 'Enviar Solicitud'}
      </button>

      {showPaymentModal && (
        <PaymentMethodModal
          show={showPaymentModal}
          onClose={() => setShowPaymentModal(false)}
          onSelect={handlePaymentMethodSelection}
        />
      )}
    </div>
  );
};

export default ServiceRequest;
