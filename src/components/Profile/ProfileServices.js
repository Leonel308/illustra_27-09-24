import React, { useState, useContext, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { db, storage } from '../../firebaseConfig';
import { doc, collection, addDoc, getDocs, deleteDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import UserContext from '../../context/UserContext';
import '../../Styles/ProfileStyles/ProfileServices.css';

const ProfileServices = ({ isOwner }) => {
  const { userId } = useParams();
  const { user } = useContext(UserContext);
  const [services, setServices] = useState([]);
  const [serviceTitle, setServiceTitle] = useState('');
  const [serviceDescription, setServiceDescription] = useState('');
  const [servicePrice, setServicePrice] = useState('');
  const [serviceImage, setServiceImage] = useState(null);
  const [estimatedHours, setEstimatedHours] = useState(1);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchServices = async () => {
      const servicesRef = collection(db, 'users', userId, 'Services');
      const servicesSnapshot = await getDocs(servicesRef);
      const servicesList = servicesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
      setServices(servicesList);
    };

    fetchServices();
  }, [userId]);

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
    if (/^\d{0,5}$/.test(value)) {
      setServicePrice(value);
    }
  };

  const formatPrice = (price) => {
    return `$${Number(price).toLocaleString()}`;
  };

  const handleAddService = async () => {
    if (serviceTitle && serviceDescription && servicePrice && serviceImage && user) {
      setLoading(true);
      try {
        const serviceImageRef = ref(storage, `services/${user.uid}/${serviceImage.name}`);
        await uploadBytes(serviceImageRef, serviceImage);
        const serviceImageUrl = await getDownloadURL(serviceImageRef);

        const newService = {
          title: serviceTitle,
          description: serviceDescription,
          price: parseInt(servicePrice),
          imageUrl: serviceImageUrl,
          estimatedHours,
        };

        const serviceRef = collection(db, 'users', user.uid, 'Services');
        await addDoc(serviceRef, newService);

        setServices((prevServices) => [...prevServices, newService]);
        setServiceTitle('');
        setServiceDescription('');
        setServicePrice('');
        setServiceImage(null);
        setEstimatedHours(1);
        setError('');
        setShowForm(false);
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

  const handleDeleteService = async (service) => {
    if (user) {
      setLoading(true);
      try {
        const serviceRef = doc(db, 'users', user.uid, 'Services', service.id);
        await deleteDoc(serviceRef);

        const serviceImageRef = ref(storage, `services/${user.uid}/${service.imageUrl.split('%2F')[2].split('?')[0]}`);
        await deleteObject(serviceImageRef);

        setServices((prevServices) => prevServices.filter(s => s.id !== service.id));
        setError('');
      } catch (error) {
        console.error('Error al eliminar el servicio:', error);
        setError('Error al eliminar el servicio. Por favor, inténtelo de nuevo.');
      } finally {
        setLoading(false);
      }
    }
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
                maxLength={240}
              />
              <p className="char-counter">{serviceDescription.length}/240</p>
              <input 
                type="text" 
                value={servicePrice} 
                onChange={handlePriceChange} 
                placeholder="Precio del Servicio" 
              />
              <input 
                type="file" 
                accept="image/*" 
                onChange={handleServiceImageChange} 
              />

              <label htmlFor="estimated-hours">Horas estimadas para completar el servicio: {estimatedHours}</label>
              <input
                type="range"
                id="estimated-hours"
                min="1"
                max="72"
                value={estimatedHours}
                onChange={(e) => setEstimatedHours(e.target.value)}
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
            <p className="price">{formatPrice(service.price)}</p>
            <p>Horas estimadas: {service.estimatedHours} horas</p>
            <div className="service-actions">
              {/* Verificar si el usuario está viendo su propio perfil */}
              {user.uid !== userId && (
                <button onClick={() => navigate(`/service-request/${userId}/${service.id}`)}>Contratar</button>
              )}
              {isOwner && (
                <button 
                  className="delete-button" 
                  onClick={() => handleDeleteService(service)}
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
