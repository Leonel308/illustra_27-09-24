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
import { v4 as uuidv4 } from 'uuid';
import ImageCropperModal from './ImageCropperModal';
import styles from '../../Styles/ProfileStyles/ProfileServices.module.css';
import {
  FaPlus,
  FaTrash,
  FaToggleOn,
  FaToggleOff,
  FaCheck,
  FaTimes,
} from 'react-icons/fa';

const ProfileServices = ({ isOwner, userId, onHire }) => {
  const [servicesList, setServicesList] = useState([]);
  const [loadingServicesList, setLoadingServicesList] = useState(true);
  const [showServiceForm, setShowServiceForm] = useState(false);
  const [confirmServiceDelete, setConfirmServiceDelete] = useState(null);
  const [isDeletingServiceId, setIsDeletingServiceId] = useState(null);

  const [serviceTitle, setServiceTitle] = useState('');
  const [serviceDescription, setServiceDescription] = useState('');
  const [servicePrice, setServicePrice] = useState('');
  const [serviceError, setServiceError] = useState('');
  const [isAddingService, setIsAddingService] = useState(false);
  const [isCropperOpen, setIsCropperOpen] = useState(false);
  const [imageSrc, setImageSrc] = useState(null);
  const [croppedImageFile, setCroppedImageFile] = useState(null);
  const [croppedImageUrl, setCroppedImageUrl] = useState(null);

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

  const handleServiceImageChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      if (!file.type.startsWith('image/')) {
        setServiceError('El archivo seleccionado no es una imagen.');
        return;
      }
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
        currency: 'ARS',
        imageUrl: serviceImageUrl,
        imagePath: imagePath,
        createdAt: new Date(),
        isDisabled: false,
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

  const handleToggleServiceStatus = async (serviceId, currentStatus) => {
    try {
      const serviceRef = doc(db, 'users', userId, 'Services', serviceId);
      await updateDoc(serviceRef, { isDisabled: !currentStatus });
    } catch (error) {
      console.error('Error al cambiar el estado del servicio:', error);
      setServiceError(
        'Error al cambiar el estado del servicio. Inténtalo de nuevo.'
      );
    }
  };

  const validateServiceForm = () => {
    if (
      !serviceTitle.trim() ||
      !serviceDescription.trim() ||
      !servicePrice.trim() ||
      !croppedImageFile
    ) {
      setServiceError('Todos los campos son obligatorios.');
      return false;
    }
    if (isNaN(servicePrice) || parseFloat(servicePrice) <= 0) {
      setServiceError('El precio debe ser un número válido mayor que cero.');
      return false;
    }
    return true;
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

  return (
    <div className={styles.servicesContainer}>
      <h2 className={styles.servicesTitle}>Mis Servicios</h2>
      {isOwner && (
        <button
          className={styles.servicesAddButton}
          onClick={() => setShowServiceForm(true)}
          aria-label="Añadir nuevo servicio"
        >
          <FaPlus className={styles.buttonIcon} />
          Añadir Nuevo Servicio
        </button>
      )}

      <div className={styles.servicesGrid}>
        {loadingServicesList ? (
          <p className={styles.loadingText}>Cargando servicios...</p>
        ) : servicesList.length === 0 ? (
          <p className={styles.noServicesText}>
            No hay servicios disponibles.
          </p>
        ) : (
          servicesList.map((service) => (
            <div key={service.serviceID} className={styles.serviceCard}>
              <div className={styles.serviceImageContainer}>
                <img
                  src={service.imageUrl}
                  alt={service.title}
                  className={styles.serviceImage}
                />
                {service.isDisabled && (
                  <div className={styles.serviceDisabledOverlay}>
                    <span>Deshabilitado</span>
                  </div>
                )}
              </div>
              <div className={styles.serviceInfo}>
                <h3 className={styles.serviceTitle}>{service.title}</h3>
                <p className={styles.serviceDescription}>
                  {service.description}
                </p>
                <p className={styles.servicePrice}>
                  Desde ARS${Number(service.price).toFixed(2)}
                </p>
                {!isOwner && !service.isDisabled && (
                  <button
                    className={styles.serviceHireButton}
                    onClick={() => onHire(userId, service.serviceID)}
                    aria-label={`Contratar servicio ${service.title}`}
                  >
                    Contratar
                  </button>
                )}
              </div>
              {isOwner && (
                <div className={styles.serviceActions}>
                  <button
                    className={`${styles.serviceActionButton} ${styles.serviceToggleButton}`}
                    onClick={() =>
                      handleToggleServiceStatus(
                        service.serviceID,
                        service.isDisabled
                      )
                    }
                    aria-label={
                      service.isDisabled
                        ? `Habilitar servicio ${service.title}`
                        : `Deshabilitar servicio ${service.title}`
                    }
                  >
                    {service.isDisabled ? (
                      <>
                        <FaToggleOff className={styles.buttonIcon} />
                        Habilitar
                      </>
                    ) : (
                      <>
                        <FaToggleOn className={styles.buttonIcon} />
                        Deshabilitar
                      </>
                    )}
                  </button>
                  <button
                    className={`${styles.serviceActionButton} ${styles.serviceDeleteButton}`}
                    onClick={() => setConfirmServiceDelete(service.serviceID)}
                    disabled={isDeletingServiceId === service.serviceID}
                    aria-label={`Eliminar servicio ${service.title}`}
                  >
                    <FaTrash className={styles.buttonIcon} />
                    Eliminar
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {showServiceForm && (
        <div className={styles.modal}>
          <div className={styles.modalContent}>
            <button
              className={styles.closeButton}
              onClick={() => setShowServiceForm(false)}
              aria-label="Cerrar formulario"
            >
              <FaTimes />
            </button>
            <h3 className={styles.modalTitle}>Añadir Nuevo Servicio</h3>
            <div className={styles.formLayout}>
              <div className={styles.formInputs}>
                <input
                  type="text"
                  value={serviceTitle}
                  onChange={(e) => setServiceTitle(e.target.value)}
                  placeholder="Título del Servicio"
                  className={styles.formInput}
                />
                <textarea
                  value={serviceDescription}
                  onChange={(e) => setServiceDescription(e.target.value)}
                  placeholder="Descripción del Servicio"
                  className={styles.formTextarea}
                />
                <input
                  type="number"
                  value={servicePrice}
                  onChange={(e) => setServicePrice(e.target.value)}
                  placeholder="Precio Inicial (ARS$)"
                  className={styles.formInput}
                />
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleServiceImageChange}
                  className={styles.formFileInput}
                />
                {croppedImageUrl && (
                  <div className={styles.croppedImagePreview}>
                    <img
                      src={croppedImageUrl}
                      alt="Vista previa de la imagen recortada"
                    />
                  </div>
                )}
              </div>
            </div>
            <button
              onClick={handleAddService}
              disabled={isAddingService}
              className={styles.formSubmitButton}
            >
              {isAddingService ? 'Añadiendo...' : 'Añadir Servicio'}
            </button>
            {serviceError && (
              <p className={styles.servicesError}>{serviceError}</p>
            )}
          </div>
        </div>
      )}

      {isCropperOpen && (
        <ImageCropperModal
          isOpen={isCropperOpen}
          onClose={() => setIsCropperOpen(false)}
          onSave={handleCroppedImage}
          imageSrc={imageSrc}
          aspect={1}
          width={1080}
          height={1080}
        />
      )}

      {confirmServiceDelete && (
        <div className={styles.deleteModal}>
          <div className={styles.deleteModalContent}>
            <button
              className={styles.closeButton}
              onClick={() => setConfirmServiceDelete(null)}
              aria-label="Cerrar diálogo"
            >
              <FaTimes />
            </button>
            <h3>Confirmar Eliminación</h3>
            <p>¿Estás seguro de que quieres eliminar este servicio?</p>
            <div className={styles.deleteModalActions}>
              <button
                onClick={() => {
                  const service = servicesList.find(
                    (s) => s.serviceID === confirmServiceDelete
                  );
                  handleDeleteService(confirmServiceDelete, service.imagePath);
                }}
                disabled={isDeletingServiceId === confirmServiceDelete}
                className={styles.confirmDeleteButton}
                aria-label="Confirmar eliminación"
              >
                <FaCheck className={styles.buttonIcon} />
                Confirmar
              </button>
              <button
                onClick={() => setConfirmServiceDelete(null)}
                className={styles.cancelDeleteButton}
                aria-label="Cancelar eliminación"
              >
                <FaTimes className={styles.buttonIcon} />
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {serviceError && (
        <p className={styles.servicesError}>{serviceError}</p>
      )}
    </div>
  );
};

export default ProfileServices;
