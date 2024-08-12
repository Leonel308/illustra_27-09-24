import React, { useState } from 'react';
import Cropper from 'react-easy-crop';
import Modal from 'react-modal';
import { getCroppedImg } from '../utils/cropImage';
import './ImageCropperModal.css';

const ImageCropperModal = ({ isOpen, onClose, onSave, imageSrc, aspect }) => {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);

  const onCropComplete = (_, croppedAreaPixels) => {
    setCroppedAreaPixels(croppedAreaPixels);
  };

  const handleSave = async () => {
    try {
      // Aquí especificamos las dimensiones deseadas del banner recortado.
      const croppedImage = await getCroppedImg(imageSrc, croppedAreaPixels, 1600, 400);
      onSave(croppedImage);
    } catch (error) {
      console.error('Error cropping image: ', error);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={onClose}
      ariaHideApp={false}
      overlayClassName="modal-overlay"
      className="modal-content"
    >
      <div className="crop-container">
        <Cropper
          image={imageSrc}
          crop={crop}
          zoom={zoom}
          aspect={aspect}
          onCropChange={setCrop}
          onZoomChange={setZoom}
          onCropComplete={onCropComplete}
        />
      </div>
      <div className="controls">
        <button onClick={onClose}>Cancelar</button>
        <button onClick={handleSave}>Guardar</button>
      </div>
    </Modal>
  );
};

export default ImageCropperModal;
