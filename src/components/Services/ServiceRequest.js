import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db, storage } from '../../firebaseConfig';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { doc, addDoc, getDoc, setDoc, collection } from 'firebase/firestore';
import '../../Styles/ServiceRequest.css';
import UserContext from '../../context/UserContext';
import PaymentMethodModal from './PaymentMethodModal'; // Importing the modal

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
  const [showPaymentModal, setShowPaymentModal] = useState(false); // State for payment modal

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

  const handlePaymentMethodSelection = async (method) => {
    setShowPaymentModal(false);

    if (method === 'wallet') {
      // Implement wallet payment logic
      const userRef = doc(db, 'users', currentUser.uid);
      const userDoc = await getDoc(userRef);

      if (userDoc.exists()) {
        const userData = userDoc.data();
        if (userData.balance >= servicePrice) {
          // Deduct balance and proceed with service request
          await setDoc(userRef, { balance: userData.balance - servicePrice }, { merge: true });
          await submitServiceRequest();
        } else {
          alert('Saldo insuficiente en la billetera.');
        }
      } else {
        alert('Error al verificar el saldo.');
      }
    } else if (method === 'mercadoPago') {
      // Implement Mercado Pago payment logic
      await handleMercadoPagoPayment();
    }
  };

  const handleMercadoPagoPayment = async () => {
    // Implement the Mercado Pago payment logic here
    // Reuse the donation button code to initiate the payment process
  };

  const submitServiceRequest = async () => {
    if (!description || files.length === 0) {
      alert('Por favor, complete la descripción y adjunte al menos un archivo.');
      return;
    }

    if (!currentUser) {
      alert('Debes estar logueado para hacer una solicitud.');
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
      };

      const docRef = await addDoc(serviceRequestRef, newRequest);

      // Update the client's workbench (ServiceHired)
      const clientServiceHiredRef = doc(db, 'users', currentUserId, 'ServiceHired', docRef.id);
      await setDoc(clientServiceHiredRef, {
        illustratorId: userId,
        serviceTitle: serviceTitle,
        servicePrice: servicePrice,
        status: 'pending',
        createdAt: new Date(),
      });

      // Send notification to the illustrator
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

  const handleSubmit = () => {
    setShowPaymentModal(true);
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
      <button onClick={handleSubmit} disabled={loading}>
        {loading ? 'Enviando...' : 'Enviar Solicitud'}
      </button>

      {/* Show payment method modal */}
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
