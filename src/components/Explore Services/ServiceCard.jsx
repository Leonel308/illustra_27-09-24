import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaEye, FaHeart, FaShareAlt, FaClock, FaTag } from 'react-icons/fa';
import styles from './exploreServices.module.css';

export default function ServiceCard({ service, isOwnService }) {
  const navigate = useNavigate();
  const [isFavorite, setIsFavorite] = useState(false);

  const handleHire = (e) => {
    e.stopPropagation();
    navigate('/service-request', { state: { service } });
  };

  const handleViewMore = () => {
    navigate(`/service/${service.serviceID}`);
  };

  const handleToggleFavorite = (e) => {
    e.stopPropagation();
    setIsFavorite(!isFavorite);
  };

  const handleShare = (e) => {
    e.stopPropagation();
    if (navigator.share) {
      navigator.share({
        title: service.title,
        text: `Check out this service: ${service.title}`,
        url: window.location.href,
      }).catch(console.error);
    } else {
      alert('Share this service: ' + window.location.href);
    }
  };

  const truncateText = (text, maxLength) => {
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
  };

  return (
    <div className={styles.serviceCard} onClick={handleViewMore}>
      <div className={styles.serviceImageContainer}>
        <img
          src={service.imageUrl || '/placeholder.svg'}
          alt={service.title}
          className={styles.serviceImage}
        />
        <div className={styles.viewMoreOverlay}>
          <FaEye className={styles.viewMoreIcon} />
          <span>Ver más</span>
        </div>
        <button 
          className={`${styles.favoriteButton} ${isFavorite ? styles.favoriteActive : ''}`} 
          onClick={handleToggleFavorite}
          aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
        >
          <FaHeart />
        </button>
        <button 
          className={styles.shareButton} 
          onClick={handleShare}
          aria-label="Share this service"
        >
          <FaShareAlt />
        </button>
      </div>

      <div className={styles.serviceInfo}>
        <div className={styles.serviceProvider}>
          <img
            src={service.photoURL || '/user-placeholder.png'}
            alt={service.username}
            className={styles.providerImage}
          />
          <span className={styles.providerName}>{truncateText(service.username, 15)}</span>
        </div>
        <h3 className={styles.serviceTitle}>{truncateText(service.title, 50)}</h3>
        <div className={styles.serviceMetadata}>
          <span className={styles.serviceCategory}>
            <FaTag className={styles.metadataIcon} />
            {service.category}
          </span>
          <span className={styles.serviceDeliveryTime}>
            <FaClock className={styles.metadataIcon} />
            {service.deliveryTime || 'Consultar'}
          </span>
        </div>
        <p className={styles.servicePrice}>
          ARS ${Number(service.price).toFixed(2)}
        </p>
      </div>

      {!isOwnService && (
        <button
          className={styles.serviceHireButton}
          onClick={handleHire}
          aria-label={`Contratar servicio ${service.title}`}
        >
          Contratar
        </button>
      )}
    </div>
  );
}