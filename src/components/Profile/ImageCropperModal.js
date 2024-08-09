import React, { useState, useRef } from 'react';
import { Cropper } from 'react-cropper';
import 'cropperjs/dist/cropper.css';
import Modal from './Modal';
import './ImageCropperModal.css';

const ImageCropperModal = ({ show, onClose, onSave, aspectRatio }) => {
  const [src, setSrc] = useState(null);
  const cropperRef = useRef(null);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setSrc(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveCrop = () => {
    const cropper = cropperRef.current?.cropper;
    const canvas = cropper.getCroppedCanvas({
      minWidth: 1200,
      minHeight: 300,
      maxWidth: 6000,
      maxHeight: 1500,
    });

    canvas.toBlob((blob) => {
      const file = new File([blob], 'croppedImage.png', { type: 'image/png' });
      onSave(file);
      handleCloseModal();
    });
  };

  const handleCloseModal = () => {
    setSrc(null);
    onClose();
  };

  const handleClickOutside = (e) => {
    if (e.target.className.includes('modal-overlay')) {
      handleCloseModal();
    }
  };

  return (
    <Modal show={show} onClose={handleCloseModal} title="Ajustar imagen" onClick={handleClickOutside}>
      {!src ? (
        <input type="file" accept="image/*" onChange={handleFileChange} />
      ) : (
        <>
          <Cropper
            src={src}
            style={{ height: 400, width: '100%' }}
            initialAspectRatio={aspectRatio || 4 / 1}
            aspectRatio={aspectRatio || 4 / 1}
            guides={true}
            viewMode={1}
            minCropBoxWidth={1200}
            minCropBoxHeight={300}
            cropBoxResizable={true}
            ref={cropperRef}
          />
          <div className="button-container">
            <button onClick={handleSaveCrop} className="save-button">Guardar</button>
            <button onClick={handleCloseModal} className="cancel-button">Cancelar</button>
          </div>
        </>
      )}
    </Modal>
  );
};

export default ImageCropperModal;
