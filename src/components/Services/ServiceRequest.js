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
  const [previewImages, setPreviewImages] = useState([]);
  const [serviceTitle, setServiceTitle] = useState('');
  const [servicePrice, setServicePrice] = useState(0);
  const [serviceDescription, setServiceDescription] = useState('');
  const [serviceImageUrl, setServiceImageUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);

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
            setServiceImageUrl(serviceData.imageUrl);

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
    let selectedFiles = Array.from(e.target.files);

    // Si se seleccionan más de 10 archivos, selecciona 10 archivos aleatorios
    if (selectedFiles.length > 10) {
      alert('Puedes subir un máximo de 10 imágenes.');
      selectedFiles = selectedFiles.sort(() => Math.random() - 0.5).slice(0, 10);
    }
    
    setFiles(selectedFiles);

    // Generar vistas previas
    const previewUrls = selectedFiles.map((file) => URL.createObjectURL(file));
    setPreviewImages(previewUrls);
  };

  const submitServiceRequest = async () => {
    if (!description) {
      setError('Por favor, completa la descripción.');
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

    // Mostrar el pop-up para confirmar el uso de la billetera
    const confirmPayment = window.confirm('Usted va a usar dinero de su billetera virtual, ¿desea continuar?');
    if (confirmPayment) {
      setShowModal(true); // Muestra el modal de pago si el usuario acepta continuar
    }
  };

  const processPayment = async (paymentMethod) => {
    try {
      setLoading(true);
      setError('');

      const userRef = doc(db, 'users', currentUser.uid);
      const userDoc = await getDoc(userRef);
      const userData = userDoc.data();

      if (paymentMethod === 'wallet' && Number(userData.balance) < servicePrice) {
        setError('Saldo insuficiente. Por favor, recarga tu billetera.');
        setLoading(false);
        return;
      }

      const currentUserId = currentUser.uid;
      const serviceRequestRef = collection(db, 'users', illustratorID, 'ServiceRequests');

      let uploadedFiles = [];

      if (files.length > 0) {
        uploadedFiles = await Promise.all(
          files.map(async (file) => {
            const uniqueFileName = `${Date.now()}_${file.name}`;
            const fileRef = ref(storage, `service-requests/${currentUserId}/${uniqueFileName}`);
            await uploadBytes(fileRef, file);
            return getDownloadURL(fileRef);
          })
        );
      }

      const newRequest = {
        description,
        files: uploadedFiles,
        serviceTitle,
        serviceDescription,
        servicePrice,
        createdAt: new Date(),
        status: 'pending',
        clientId: currentUserId,
        clientUsername: currentUser.username || 'Cliente',
        illustratorHiredId: illustratorID,
        acceptedByClient: false,
        serviceID: '',
        paymentMethod,
      };

      const docRef = await addDoc(serviceRequestRef, newRequest);
      await updateDoc(docRef, { serviceID: docRef.id });

      const paymentRef = await addDoc(collection(db, 'users', currentUserId, 'Payments'), {
        amount: servicePrice,
        illustratorHiredId: illustratorID,
        paymentMethod,
        serviceID: docRef.id,
        status: 'pending',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      await updateDoc(docRef, { paymentId: paymentRef.id });

      if (paymentMethod === 'wallet') {
        await updateDoc(userRef, {
          balance: Number(userData.balance) - servicePrice,
          pendingBalance: (userData.pendingBalance || 0) + servicePrice,
        });
      }

      const clientServiceHiredRef = doc(db, 'users', currentUserId, 'ServiceHired', docRef.id);
      await setDoc(clientServiceHiredRef, {
        illustratorHiredId: illustratorID,
        serviceTitle,
        serviceDescription,
        servicePrice,
        description,
        files: uploadedFiles,
        status: 'pending',
        createdAt: new Date(),
        serviceID: docRef.id,
        acceptedByClient: false,
        paymentMethod,
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
      setShowModal(false);
    }
  };

  return (
    <div className="service-request-container">
      <div className="service-request-card">
        <h2 className="service-request-title">Solicitar Servicio</h2>
        {error && <p className="error-message">{error}</p>}
        <div className="service-details">
          <div className="service-info">
            <h3 className="service-title">Servicio: {serviceTitle || 'Cargando...'}</h3>
            <p className="service-description-text">Descripción: {serviceDescription || 'Cargando...'}</p>
            <p className="service-price">Costo: ${servicePrice ? servicePrice.toLocaleString() : 'Cargando...'}</p>
          </div>
          {serviceImageUrl && (
            <div className="service-image-wrapper">
              <img src={serviceImageUrl} alt={serviceTitle} className="service-image" />
            </div>
          )}
        </div>
        <textarea
          className="service-description"
          placeholder="Describa lo que necesita"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
        <p className="file-input-description">Seleccione imágenes de referencia, máximo 10.</p>
        <div className="file-input-wrapper">
          <input 
            type="file" 
            multiple 
            accept="image/*" 
            onChange={handleFilesChange} 
            className="file-input"
          />
          <span className="file-input-label">Seleccionar archivos</span>
          {files.length > 0 && <p className="file-count">{files.length} archivo(s) seleccionados</p>}
        </div>

        {/* Mostrar la vista previa de las imágenes seleccionadas */}
        <div className="preview-container">
          <h4>Vista Previa de Imágenes Seleccionadas</h4>
          <div className="preview-images">
            {previewImages.length > 0 && previewImages.map((image, index) => (
              <img key={index} src={image} alt={`Vista previa ${index + 1}`} className="preview-image" />
            ))}
          </div>
        </div>

        <button 
          onClick={submitServiceRequest} 
          disabled={loading || (currentUser?.uid === illustratorID)}
          className="submit-button"
        >
          {loading ? 'Enviando...' : 'Enviar Solicitud'}
        </button>
      </div>

      {showModal && (
        <div className="payment-modal-overlay">
          <div className="payment-modal">
            <h3>Selecciona el método de pago</h3>
            <div className="payment-options">
              <button onClick={() => processPayment('wallet')} className="wallet-button">
                Pagar con Billetera
              </button>
            </div>
            <button onClick={() => setShowModal(false)} className="close-button">
              Cerrar
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ServiceRequest;
