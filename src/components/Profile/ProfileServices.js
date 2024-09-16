import React, { useState, useEffect } from 'react';
import { db, storage } from '../../firebaseConfig';
import {
  collection,
  addDoc,
  deleteDoc,
  doc,
  updateDoc,
  onSnapshot,
} from 'firebase/firestore';
import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from 'firebase/storage';
import { useNavigate } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import ImageCropperModal from './ImageCropperModal';
import styles from '../../Styles/ProfileStyles/ProfileServices.module.css'; // Importación correcta del CSS Module

const ProfileServices = ({ isOwner, userId }) => {
  const [servicesList, setServicesList] = useState([]);
  const [serviceTitle, setServiceTitle] = useState('');
  const [serviceDescription, setServiceDescription] = useState('');
  const [servicePrice, setServicePrice] = useState('');
  const [serviceError, setServiceError] = useState('');
  const [isAddingService, setIsAddingService] = useState(false);
  const [isDeletingServiceId, setIsDeletingServiceId] = useState(null);
  const [loadingServicesList, setLoadingServicesList] = useState(true);
  const [showServiceForm, setShowServiceForm] = useState(false);
  const [confirmServiceDelete, setConfirmServiceDelete] = useState(null);
  const navigate = useNavigate();

  // Estados para el cropper
  const [isCropperOpen, setIsCropperOpen] = useState(false);
  const [imageSrc, setImageSrc] = useState(null);
  const [croppedImageFile, setCroppedImageFile] = useState(null);
  const [croppedImageUrl, setCroppedImageUrl] = useState(null);

  const handleServiceImageChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = () => {
        setImageSrc(reader.result);
        setIsCropperOpen(true);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCroppedImage = (croppedImage) => {
    const fileName = `cropped_${Date.now()}.png`;
    const croppedFile = new File([croppedImage], fileName, {
      type: 'image/png',
    });
    setCroppedImageFile(croppedFile);
    setCroppedImageUrl(URL.createObjectURL(croppedImage));
    setIsCropperOpen(false);
  };

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

  const handlePriceChange = (e) => {
    const value = e.target.value;
    if (!isNaN(value) && value >= 0) {
      setServicePrice(value);
    }
  };

  const validateServiceForm = () => {
    if (!serviceTitle) {
      setServiceError('El título del servicio es obligatorio.');
      return false;
    }
    if (!serviceDescription) {
      setServiceError('La descripción del servicio es obligatoria.');
      return false;
    }
    if (!servicePrice) {
      setServiceError('El precio del servicio es obligatorio.');
      return false;
    }
    if (isNaN(servicePrice) || parseFloat(servicePrice) <= 0) {
      setServiceError('El precio debe ser un número válido mayor que cero.');
      return false;
    }
    if (!croppedImageFile) {
      setServiceError('La imagen del servicio es obligatoria.');
      return false;
    }
    return true;
  };

  const handleAddService = async () => {
    if (!validateServiceForm()) return;
    setIsAddingService(true);
    try {
      const uniqueImageName = `${uuidv4()}_${croppedImageFile.name}`;
      const imagePath = `services/${userId}/${uniqueImageName}`;
      const serviceImageRef = ref(storage, imagePath);
      await uploadBytes(serviceImageRef, croppedImageFile);
      const serviceImageUrl = await getDownloadURL(serviceImageRef);

      const newService = {
        illustratorId: userId,
        title: serviceTitle,
        description: serviceDescription,
        price: parseFloat(servicePrice),
        currency: 'ARS', // Set currency to ARS
        imageUrl: serviceImageUrl,
        imagePath: imagePath,
        createdAt: new Date(),
      };

      const servicesRef = collection(db, 'users', userId, 'Services');
      const addedService = await addDoc(servicesRef, newService);

      const serviceID = addedService.id;
      const serviceDocRef = doc(db, 'users', userId, 'Services', serviceID);
      await updateDoc(serviceDocRef, { serviceID });

      resetServiceForm();
    } catch (error) {
      console.error('Error al añadir el servicio:', error);
      setServiceError('Error al añadir el servicio. Inténtalo de nuevo.');
    } finally {
      setIsAddingService(false);
    }
  };

  const resetServiceForm = () => {
    setServiceTitle('');
    setServiceDescription('');
    setServicePrice('');
    setCroppedImageFile(null);
    setCroppedImageUrl(null);
    setServiceError('');
    setShowServiceForm(false);
  };

  const handleDeleteService = async (serviceId, imagePath) => {
    setIsDeletingServiceId(serviceId);
    try {
      const serviceRef = doc(db, 'users', userId, 'Services', serviceId);
      await deleteDoc(serviceRef);
      const imageRef = ref(storage, imagePath);
      await deleteObject(imageRef);
      setConfirmServiceDelete(null);
    } catch (error) {
      console.error('Error al eliminar el servicio:', error);
      setServiceError('Error al eliminar el servicio. Inténtalo de nuevo.');
    } finally {
      setIsDeletingServiceId(null);
    }
  };

  useEffect(() => {
    const servicesRef = collection(db, 'users', userId, 'Services');
    const unsubscribe = onSnapshot(servicesRef, (snapshot) => {
      const servicesData = snapshot.docs.map((doc) => ({
        serviceID: doc.id,
        ...doc.data(),
      }));
      setServicesList(servicesData);
      setLoadingServicesList(false);
    });

    return () => unsubscribe();
  }, [userId]);

  return (
    <div className={styles.servicesContainer}>
      <h2 className={styles.servicesTitle}>Mis Servicios</h2>
      {isOwner && (
        <button
          className={styles.servicesAddButton}
          onClick={() => setShowServiceForm(!showServiceForm)}
        >
          {showServiceForm ? 'Cancelar' : 'Añadir Nuevo Servicio'}
        </button>
      )}

      {showServiceForm && (
        <div className={styles.servicesForm}>
          <label htmlFor="service-title">Título del Servicio</label>
          <input
            id="service-title"
            type="text"
            value={serviceTitle}
            onChange={handleTitleChange}
            placeholder="Título del Servicio (máx. 60 caracteres)"
          />
          <p>{serviceTitle.length}/60 caracteres</p>

          <label htmlFor="service-description">Descripción del Servicio</label>
          <textarea
            id="service-description"
            value={serviceDescription}
            onChange={handleDescriptionChange}
            placeholder="Descripción del Servicio (máx. 360 caracteres)"
          />
          <p>{serviceDescription.length}/360 caracteres</p>

          <label htmlFor="service-price">Precio Inicial (ARS$)</label>
          <input
            id="service-price"
            type="number"
            value={servicePrice}
            onChange={handlePriceChange}
            placeholder="Precio Inicial"
            min="0"
            step="0.01"
          />

          <label htmlFor="service-image">Imagen del Servicio</label>
          <input
            id="service-image"
            type="file"
            accept="image/*"
            onChange={handleServiceImageChange}
          />

          {croppedImageUrl && (
            <div className={styles.croppedImagePreview}>
              <img
                src={croppedImageUrl}
                alt="Vista previa de la imagen recortada"
              />
            </div>
          )}

          <button onClick={handleAddService} disabled={isAddingService}>
            {isAddingService ? 'Añadiendo...' : 'Añadir Servicio'}
          </button>
          {serviceError && (
            <p className={styles.servicesError}>{serviceError}</p>
          )}
        </div>
      )}

      {/* Image Cropper Modal */}
      {isCropperOpen && (
        <ImageCropperModal
          isOpen={isCropperOpen}
          onClose={() => setIsCropperOpen(false)}
          onSave={handleCroppedImage}
          imageSrc={imageSrc}
          aspect={16 / 9}
        />
      )}

      <div className={styles.servicesGrid}>
        {loadingServicesList ? (
          <p>Cargando servicios...</p>
        ) : servicesList.length === 0 ? (
          <p>No hay servicios disponibles.</p>
        ) : (
          servicesList.map((service) => (
            <div key={service.serviceID} className={styles.servicesCard}>
              <div className={styles.servicesImageContainer}>
                <img
                  src={service.imageUrl}
                  alt={service.title}
                  className={styles.servicesImage}
                  loading="lazy"
                />
              </div>
              <div className={styles.servicesInfo}>
                <h3>{service.title}</h3>
                <p className={styles.servicesDescription}>
                  {service.description}
                </p>
                <p className={styles.servicesPrice}>
                  Desde ARS${Number(service.price).toFixed(2)}
                </p>
                {!isOwner && (
                  <button
                    className={styles.servicesHireButton}
                    onClick={() =>
                      navigate(
                        `/service-request/${userId}/${service.serviceID}`
                      )
                    }
                  >
                    Contratar
                  </button>
                )}
              </div>
              {isOwner && (
                <>
                  <button
                    className={styles.servicesDeleteButton}
                    onClick={() => setConfirmServiceDelete(service.serviceID)}
                    disabled={isDeletingServiceId === service.serviceID}
                  >
                    {isDeletingServiceId === service.serviceID
                      ? 'Eliminando...'
                      : 'Eliminar'}
                  </button>
                  {confirmServiceDelete === service.serviceID && (
                    <div className={styles.servicesConfirmDelete}>
                      <p>
                        ¿Estás seguro de que quieres eliminar este servicio?
                      </p>
                      <button
                        onClick={() =>
                          handleDeleteService(
                            service.serviceID,
                            service.imagePath
                          )
                        }
                        disabled={isDeletingServiceId === service.serviceID}
                      >
                        Confirmar
                      </button>
                      <button
                        onClick={() => setConfirmServiceDelete(null)}
                        disabled={isDeletingServiceId === service.serviceID}
                      >
                        Cancelar
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          ))
        )}
      </div>
      {servicesList.length > 0 && (
        <button className={styles.servicesViewAllButton}>
          Ver todos ({servicesList.length})
        </button>
      )}
    </div>
  );
};

export default ProfileServices;
