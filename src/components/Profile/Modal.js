import React from 'react';
import '../../Styles/ProfileStyles/Modal.css';  // Asegúrate de que la ruta de importación es correcta

const Modal = ({ imageUrl, onClose }) => {
  if (!imageUrl) return null;

  return (
    <div className="modal" onClick={onClose}>
      <span className="close" onClick={onClose}>&times;</span>
      <img src={imageUrl} alt="Enlarged portfolio item" className="modal-content" />
    </div>
  );
};

export default Modal;
