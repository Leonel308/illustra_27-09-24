import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { db, storage } from '../../firebaseConfig';
import { doc, collection, addDoc, deleteDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import UserContext from '../../context/UserContext';
import '../../Styles/ProfileStyles/ProfileServices.css';

const ProfileServices = ({ services = [], isOwner, setServices }) => {
  const { user } = useContext(UserContext);
  const [serviceTitle, setServiceTitle] = useState('');
  const [serviceDescription, setServiceDescription] = useState('');
  const [servicePrice, setServicePrice] = useState('');
  const [serviceImage, setServiceImage] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const navigate = useNavigate();

  const handleServiceImageChange = (e) => {
    setServiceImage(e.target.files[0]);
  };

  const handleTitleChange = (e) => {
    const value = e.target.value;
    if (value.length <= 60) {
      setServiceTitle(value);
    }
  };

  const handleDescriptionChange = (e) => {
    const value = e.target.value;
    if (value.length <= 240) {
      setServiceDescription(value);
    }
  };

  const handlePriceChange = (e) => {
    const value = e.target.value;
    if (/^\d*\.?\d{0,2}$/.test(value) && value.length <= 7) {  // Permite números con hasta dos decimales y un máximo de 7 caracteres
      setServicePrice(value);
    }
  };

  const handleAddService = async () => {
    if (serviceTitle && serviceDescription && servicePrice && serviceImage && user) {
      setLoading(true);
      try {
        const serviceImageRef = ref(storage, `services/${user.uid}/${serviceImage.name}`);
        await uploadBytes(serviceImageRef, serviceImage);
        const serviceImageUrl = await getDownloadURL(serviceImageRef);

        const newService = {
          illustratorId: user.uid,
          title: serviceTitle,
          description: serviceDescription,
          price: parseFloat(servicePrice),  // Guarda el precio como número
          imageUrl: serviceImageUrl,
          createdAt: new Date(),
        };

        const servicesRef = collection(db, 'users', user.uid, 'Services');
        const serviceDocRef = await addDoc(servicesRef, newService);

        setServices((prevServices) => [...prevServices, { ...newService, id: serviceDocRef.id }]);
        setServiceTitle('');
        setServiceDescription('');
        setServicePrice('');
        setServiceImage(null);
        setError('');
        setShowForm(false); // Ocultar el formulario después de agregar el servicio
      } catch (error) {
        console.error('Error al agregar el servicio:', error);
        setError('Error al agregar el servicio. Por favor, inténtelo de nuevo.');
      } finally {
        setLoading(false);
      }
    } else {
      setError('Por favor, complete todos los campos y cargue una imagen.');
    }
  };

  const handleDeleteService = async (serviceId, imageUrl) => {
    if (user) {
      setLoading(true);
      try {
        const serviceRef = doc(db, 'users', user.uid, 'Services', serviceId);
        await deleteDoc(serviceRef);

        const serviceImageRef = ref(storage, `services/${user.uid}/${imageUrl.split('%2F')[2].split('?')[0]}`);
        await deleteObject(serviceImageRef);

        setServices((prevServices) => prevServices.filter((service) => service.id !== serviceId));
        setError('');
      } catch (error) {
        console.error('Error al eliminar el servicio:', error);
        setError('Error al eliminar el servicio. Por favor, inténtelo de nuevo.');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleHireService = (serviceId, illustratorId) => {
    navigate(`/service-request/${illustratorId}/${serviceId}`);
  };

  return (
    <div className="services-container">
      {isOwner && (
        <>
          <div className="add-service-header" onClick={() => setShowForm(!showForm)}>
            <h3>AÑADIR SERVICIO <span className={showForm ? 'rotate' : ''}>+</span></h3>
          </div>
          {showForm && (
            <div className="add-service-form">
              <input 
                type="text" 
                value={serviceTitle} 
                onChange={handleTitleChange} 
                placeholder="Título del Servicio" 
              />
              <p className="char-counter">{serviceTitle.length}/60</p>
              <textarea 
                value={serviceDescription} 
                onChange={handleDescriptionChange} 
                placeholder="Descripción del Servicio" 
              />
              <p className="char-counter">{serviceDescription.length}/240</p>
              <input 
                type="text" 
                value={servicePrice} 
                onChange={handlePriceChange} 
                placeholder="Precio del Servicio" 
              />
              <p className="char-counter">{servicePrice.length}/7</p>
              <input 
                type="file" 
                accept="image/*" 
                onChange={handleServiceImageChange} 
              />
              <button onClick={handleAddService} disabled={loading}>
                {loading ? 'Agregando...' : 'Agregar Servicio'}
              </button>
              {error && <p className="error">{error}</p>}
            </div>
          )}
        </>
      )}
      <div className="services-list">
        {services.map((service) => (
          <div key={service.id} className="service-item">
            <img src={service.imageUrl} alt={service.title} />
            <h4>{service.title}</h4>
            <p>{service.description}</p>
            <p className="service-price">${service.price.toFixed(2)}</p>
            <div className="service-actions">
              <button onClick={() => handleHireService(service.id, service.illustratorId)}>Contratar</button>
              {isOwner && (
                <button 
                  className="delete-button" 
                  onClick={() => handleDeleteService(service.id, service.imageUrl)}
                  disabled={loading}
                >
                  {loading ? 'Eliminando...' : '-'}
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProfileServices;
