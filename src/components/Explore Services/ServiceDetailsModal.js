import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FaTimes, FaTag, FaClock, FaUser, FaDollarSign } from 'react-icons/fa';
import styles from './serviceDetailsModal.module.css';

const ServiceDetailsModal = ({ service, closeModal }) => {
  const navigate = useNavigate();

  const handleHire = () => {
    navigate(`/service-request/${service.userId}/${service.serviceID}`);
  };

  const handleContact = () => {
    navigate(`/profile/${service.userId}`);
  };

  const handleViewProfile = () => {
    navigate(`/profile/${service.userId}`);
  };

  return (
    <div className={styles.modalOverlay} onClick={closeModal}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <div className={styles.imageContainer}>
          <img
            src={service.imageUrl || '/placeholder.svg'}
            alt={service.title}
            className={styles.serviceImage}
          />
          <button
            onClick={closeModal}
            className={styles.closeButton}
            aria-label="Cerrar"
          >
            <FaTimes />
          </button>
        </div>

        <div className={styles.modalBody}>
          <h2 className={styles.serviceTitle}>{service.title}</h2>

          <div className={styles.providerInfo}>
            <img
              src={service.photoURL || '/user-placeholder.png'}
              alt={service.username}
              className={styles.providerImage}
            />
            <div>
              <h3 className={styles.providerName}>{service.username}</h3>
              <button className={styles.viewProfileButton} onClick={handleViewProfile}>
                Ver Perfil
              </button>
            </div>
          </div>

          <div className={styles.serviceDetails}>
            <div className={styles.detailItem}>
              <FaDollarSign className={styles.icon} />
              <span className={styles.price}>ARS ${Number(service.price).toFixed(2)}</span>
            </div>
            <div className={styles.detailItem}>
              <FaTag className={styles.icon} />
              <span>{service.category || 'Sin categoría'}</span>
            </div>
            <div className={styles.detailItem}>
              <FaClock className={styles.icon} />
              <span>{service.deliveryTime || 'Consultar'}</span>
            </div>
            <div className={styles.detailItem}>
              <FaUser className={styles.icon} />
              <span>{service.experience || 'No especificado'}</span>
            </div>
          </div>

          <div className={styles.description}>
            <h4>Descripción:</h4>
            <p>{service.description}</p>
          </div>

          <div className={styles.actionButtons}>
            <button
              onClick={handleHire}
              className={styles.hireButton}
            >
              Contratar
            </button>
            <button
              onClick={handleContact}
              className={styles.contactButton}
            >
              Contactar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ServiceDetailsModal;