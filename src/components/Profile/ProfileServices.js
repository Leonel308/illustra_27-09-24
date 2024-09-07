import React, { useState, useEffect, useCallback } from 'react';
import { db, storage } from '../../firebaseConfig';
import { collection, getDocs, addDoc, deleteDoc, doc, updateDoc } from 'firebase/firestore'; // Aquí se agrega updateDoc
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { useNavigate } from 'react-router-dom';
import '../../Styles/ProfileStyles/ProfileServices.css';

const ProfileServices = ({ isOwner, userId }) => {
  const [services, setServices] = useState([]);
  const [serviceTitle, setServiceTitle] = useState('');
  const [serviceDescription, setServiceDescription] = useState('');
  const [servicePrice, setServicePrice] = useState('');
  const [serviceImage, setServiceImage] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingServices, setLoadingServices] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const navigate = useNavigate();

  // Manejo de cambios en los campos del formulario
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

  const validateForm = () => {
    if (!serviceTitle || !serviceDescription || !servicePrice || !serviceImage) {
      setError('Todos los campos son obligatorios.');
      return false;
    }
    if (!/^\d+(\.\d{1,2})?$/.test(servicePrice)) {
      setError('El precio debe ser un número válido con máximo 2 decimales.');
      return false;
    }
    return true;
  };

  const handleAddService = async () => {
    if (!validateForm()) return;
    setLoading(true);
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
        serviceID: '', // Aquí se inicializa como vacío y se llenará después de la creación
        createdAt: new Date(),
      };

      const servicesRef = collection(db, 'users', userId, 'Services');
      const addedService = await addDoc(servicesRef, newService);

      // Ahora actualizamos el documento recién creado con el ID generado
      const serviceID = addedService.id;
      const serviceDocRef = doc(db, 'users', userId, 'Services', serviceID);
      await updateDoc(serviceDocRef, { serviceID });

      setServices((prev) => [...prev, { ...newService, serviceID }]);
      resetForm();
    } catch (error) {
      console.error('Error al añadir el servicio:', error);
      setError('Error al añadir el servicio. Inténtalo de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setServiceTitle('');
    setServiceDescription('');
    setServicePrice('');
    setServiceImage(null);
    setError('');
    setShowForm(false);
  };

  const handleDeleteService = async (serviceId, imageUrl) => {
    setLoading(true);
    try {
      const serviceRef = doc(db, 'users', userId, 'Services', serviceId);
      await deleteDoc(serviceRef);
      const imageRef = ref(storage, `services/${userId}/${imageUrl.split('%2F')[2].split('?')[0]}`);
      await deleteObject(imageRef);

      setServices((prev) => prev.filter((service) => service.serviceID !== serviceId));
      setConfirmDelete(null);
    } catch (error) {
      console.error('Error al eliminar el servicio:', error);
      setError('Error al eliminar el servicio. Inténtalo de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  const reloadServices = useCallback(async () => {
    setLoadingServices(true);
    try {
      const servicesRef = collection(db, 'users', userId, 'Services');
      const querySnapshot = await getDocs(servicesRef);

      const servicesList = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        price: doc.data().price || 0,
      }));
      setServices(servicesList);
    } catch (error) {
      console.error('Error al cargar los servicios:', error);
      setError('Error al cargar los servicios. Inténtalo de nuevo.');
    } finally {
      setLoadingServices(false);
    }
  }, [userId]);

  useEffect(() => {
    reloadServices();
  }, [reloadServices]);

  return (
    <div className="services-container">
      <h2 className="services-title">Mis Servicios</h2>
      {isOwner && (
        <button className="add-service-button" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancelar' : 'Añadir Nuevo Servicio'}
        </button>
      )}

      {showForm && (
        <div className="add-service-form">
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
          <button onClick={handleAddService} disabled={loading}>
            {loading ? 'Añadiendo...' : 'Añadir Servicio'}
          </button>
          {error && <p className="error">{error}</p>}
        </div>
      )}

      <div className="services-grid">
        {loadingServices ? (
          <p>Cargando servicios...</p>
        ) : services.length === 0 ? (
          <p>No hay servicios disponibles.</p>
        ) : (
          services.map((service) => (
            <div key={service.serviceID} className="service-card">
              <div className="service-image-container">
                <img src={service.imageUrl} alt={service.title} className="service-image" />
              </div>
              <div className="service-info">
                <h3>{service.title}</h3>
                <p className="service-description">{service.description}</p>
                <p className="service-price">Desde US${service.price.toFixed(2)}</p>
                {!isOwner && (
                  <button 
                    className="hire-button" 
                    onClick={() => navigate(`/solicitudServicio/${service.serviceID}`)}
                  >
                    Contratar
                  </button>
                )}
              </div>
              {isOwner && (
                <>
                  <button 
                    className="delete-button" 
                    onClick={() => setConfirmDelete(service.serviceID)}
                    disabled={loading}
                  >
                    {loading ? 'Eliminando...' : 'Eliminar'}
                  </button>
                  {confirmDelete === service.serviceID && (
                    <div className="confirm-delete">
                      <p>¿Estás seguro de que quieres eliminar este servicio?</p>
                      <button onClick={() => handleDeleteService(service.serviceID, service.imageUrl)}>Confirmar</button>
                      <button onClick={() => setConfirmDelete(null)}>Cancelar</button>
                    </div>
                  )}
                </>
              )}
            </div>
          ))
        )}
      </div>
      {services.length > 0 && (
        <button className="view-all-button">Ver todos ({services.length})</button>
      )}
    </div>
  );
};

export default ProfileServices;
