// src/components/Modal.js

import React from 'react';
import ReactDOM from 'react-dom';
import styles from '../Styles/Modal.module.css'; // Usaremos CSS Modules para el estilo

const Modal = ({ isOpen, onClose, children }) => {
  if (!isOpen) return null;

  return ReactDOM.createPortal(
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <button className={styles.closeButton} onClick={onClose}>
          &times;
        </button>
        {children}
      </div>
    </div>,
    document.getElementById('modal-root') // Asegúrate de tener un div con id 'modal-root' en tu index.html
  );
};

export default Modal;
