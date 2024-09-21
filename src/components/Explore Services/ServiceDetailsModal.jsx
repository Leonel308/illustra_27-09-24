import React from 'react';
import styles from './serviceDetailsModal.module.css'; // Create this new CSS file

const ServiceDetailsModal = ({ service, closeModal }) => {
  return (
    <div className={styles.modalOverlay} onClick={closeModal}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <button className={styles.closeButton} onClick={closeModal}>X</button>
        <h2>{service.title}</h2>
        <img src={service.imageUrl || '/placeholder.svg'} alt={service.title} className={styles.serviceImage} />
        <p><strong>Precio:</strong> ARS${Number(service.price).toFixed(2)}</p>
        <p><strong>Descripción:</strong> {service.description}</p>
        <p><strong>Proveedor:</strong> {service.username}</p>
        {/* Add more service details here */}
      </div>
    </div>
  );
};

export default ServiceDetailsModal;
