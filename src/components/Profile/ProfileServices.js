import React, { useState, useEffect, useCallback } from 'react';
import { db, storage } from '../../firebaseConfig';
import { collection, getDocs, addDoc, deleteDoc, doc, updateDoc } from 'firebase/firestore'; 
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { useNavigate } from 'react-router-dom';
import '../../Styles/ProfileStyles/ProfileServices.css';

const ProfileServices = ({ isOwner, userId }) => {
  const [servicesList, setServicesList] = useState([]);
  const [serviceTitle, setServiceTitle] = useState('');
  const [serviceDescription, setServiceDescription] = useState('');
  const [servicePrice, setServicePrice] = useState('');
  const [serviceImage, setServiceImage] = useState(null);
  const [serviceError, setServiceError] = useState('');
  const [loadingService, setLoadingService] = useState(false);
  const [loadingServicesList, setLoadingServicesList] = useState(true);
  const [showServiceForm, setShowServiceForm] = useState(false);
  const [confirmServiceDelete, setConfirmServiceDelete] = useState(null);
  const navigate = useNavigate();

  const handleServiceImageChange = (e) => setServiceImage(e.target.files[0]);

  const handleTitleChange = (e) => {
    if (e.target.value.length <= 60) {
      setServiceTitle(e.target.value);
    }
  };

  const handleDescriptionChange = (e) => {
    if (e.target.value.length <= 360) {
      setServiceDescription(e.target.value);
    }
  };

  const handlePriceChange = (e) => setServicePrice(e.target.value);

  const validateServiceForm = () => {
    if (!serviceTitle || !serviceDescription || !servicePrice || !serviceImage) {
      setServiceError('Todos los campos son obligatorios.');
      return false;
    }
    if (!/^\d+(\.\d{1,2})?$/.test(servicePrice)) {
      setServiceError('El precio debe ser un número válido con máximo 2 decimales.');
      return false;
    }
    return true;
  };

  const handleAddService = async () => {
    if (!validateServiceForm()) return;
    setLoadingService(true);
    try {
      const serviceImageRef = ref(storage, `services/${userId}/${serviceImage.name}`);
      await uploadBytes(serviceImageRef, serviceImage);
      const serviceImageUrl = await getDownloadURL(serviceImageRef);

      const newService = {
        illustratorId: userId,
        title: serviceTitle,
        description: serviceDescription,
        price: parseFloat(servicePrice),
        imageUrl: serviceImageUrl,
        serviceID: '', 
        createdAt: new Date(),
      };

      const servicesRef = collection(db, 'users', userId, 'Services');
      const addedService = await addDoc(servicesRef, newService);

      const serviceID = addedService.id;
      const serviceDocRef = doc(db, 'users', userId, 'Services', serviceID);
      await updateDoc(serviceDocRef, { serviceID });

      setServicesList((prev) => [...prev, { ...newService, serviceID }]);
      resetServiceForm();
    } catch (error) {
      console.error('Error al añadir el servicio:', error);
      setServiceError('Error al añadir el servicio. Inténtalo de nuevo.');
    } finally {
      setLoadingService(false);
    }
  };

  const resetServiceForm = () => {
    setServiceTitle('');
    setServiceDescription('');
    setServicePrice('');
    setServiceImage(null);
    setServiceError('');
    setShowServiceForm(false);
  };

  const handleDeleteService = async (serviceId, imageUrl) => {
    setLoadingService(true);
    try {
      const serviceRef = doc(db, 'users', userId, 'Services', serviceId);
      await deleteDoc(serviceRef);
      const imageRef = ref(storage, `services/${userId}/${imageUrl.split('%2F')[2].split('?')[0]}`);
      await deleteObject(imageRef);

      setServicesList((prev) => prev.filter((service) => service.serviceID !== serviceId));
      setConfirmServiceDelete(null);
    } catch (error) {
      console.error('Error al eliminar el servicio:', error);
      setServiceError('Error al eliminar el servicio. Inténtalo de nuevo.');
    } finally {
      setLoadingService(false);
    }
  };

  const reloadServicesList = useCallback(async () => {
    setLoadingServicesList(true);
    try {
      const servicesRef = collection(db, 'users', userId, 'Services');
      const querySnapshot = await getDocs(servicesRef);

      const servicesData = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        price: doc.data().price || 0,
      }));
      setServicesList(servicesData);
    } catch (error) {
      console.error('Error al cargar los servicios:', error);
      setServiceError('Error al cargar los servicios. Inténtalo de nuevo.');
    } finally {
      setLoadingServicesList(false);
    }
  }, [userId]);

  useEffect(() => {
    reloadServicesList();
  }, [reloadServicesList]);

  return (
    <div className="services-container">
      <h2 className="services-title">Mis Servicios</h2>
      {isOwner && (
        <button className="services-add-button" onClick={() => setShowServiceForm(!showServiceForm)}>
          {showServiceForm ? 'Cancelar' : 'Añadir Nuevo Servicio'}
        </button>
      )}

      {showServiceForm && (
        <div className="services-form">
          <input 
            type="text" 
            value={serviceTitle} 
            onChange={handleTitleChange} 
            placeholder="Título del Servicio (máx. 60 caracteres)" 
          />
          <textarea 
            value={serviceDescription} 
            onChange={handleDescriptionChange} 
            placeholder="Descripción del Servicio (máx. 360 caracteres)" 
          />
          <input 
            type="text" 
            value={servicePrice} 
            onChange={handlePriceChange} 
            placeholder="Precio Inicial" 
          />
          <input 
            type="file" 
            accept="image/*" 
            onChange={handleServiceImageChange} 
          />
          <button onClick={handleAddService} disabled={loadingService}>
            {loadingService ? 'Añadiendo...' : 'Añadir Servicio'}
          </button>
          {serviceError && <p className="services-error">{serviceError}</p>}
        </div>
      )}

      <div className="services-grid">
        {loadingServicesList ? (
          <p>Cargando servicios...</p>
        ) : servicesList.length === 0 ? (
          <p>No hay servicios disponibles.</p>
        ) : (
          servicesList.map((service) => (
            <div key={service.serviceID} className="services-card">
              <div className="services-image-container">
                <img src={service.imageUrl} alt={service.title} className="services-image" />
              </div>
              <div className="services-info">
                <h3>{service.title}</h3>
                <p className="services-description">{service.description}</p>
                <p className="services-price">Desde US${service.price.toFixed(2)}</p>
                {!isOwner && (
                  <button 
                    className="services-hire-button" 
                    onClick={() => navigate(`/service-request/${userId}/${service.serviceID}`)}
                  >
                    Contratar
                  </button>
                )}
              </div>
              {isOwner && (
                <>
                  <button 
                    className="services-delete-button" 
                    onClick={() => setConfirmServiceDelete(service.serviceID)}
                    disabled={loadingService}
                  >
                    {loadingService ? 'Eliminando...' : 'Eliminar'}
                  </button>
                  {confirmServiceDelete === service.serviceID && (
                    <div className="services-confirm-delete">
                      <p>¿Estás seguro de que quieres eliminar este servicio?</p>
                      <button onClick={() => handleDeleteService(service.serviceID, service.imageUrl)}>Confirmar</button>
                      <button onClick={() => setConfirmServiceDelete(null)}>Cancelar</button>
                    </div>
                  )}
                </>
              )}
            </div>
          ))
        )}
      </div>
      {servicesList.length > 0 && (
        <button className="services-view-all-button">Ver todos ({servicesList.length})</button>
      )}
    </div>
  );
};

export default ProfileServices;
