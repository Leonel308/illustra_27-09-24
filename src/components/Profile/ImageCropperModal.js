import React, { useState } from 'react';
import Cropper from 'react-easy-crop';
import Modal from 'react-modal';
import { getCroppedImg } from '../utils/cropImage'; // Asegúrate de importar la función correctamente
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
      const croppedImage = await getCroppedImg(imageSrc, croppedAreaPixels);
      onSave(croppedImage);
    } catch (error) {
      console.error('Error cropping image: ', error);
    }
  };

  return (
    <Modal isOpen={isOpen} onRequestClose={onClose} ariaHideApp={false}>
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
