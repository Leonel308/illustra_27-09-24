import React, { useState, useContext } from 'react';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../../firebaseConfig';
import ImageCropperModal from './ImageCropperModal';
import UserContext from '../../context/UserContext';

export default function ProfileBackground({ onSave }) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [showCropper, setShowCropper] = useState(false);
  const [imageSrc, setImageSrc] = useState(null);
  const [croppedImage, setCroppedImage] = useState(null);
  const { user } = useContext(UserContext);

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImageSrc(reader.result); // Muestra la imagen seleccionada en el modal
        setSelectedFile(file); // Guarda el archivo seleccionado
        setShowCropper(true); // Abre el modal para recortar
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveCroppedImage = async (croppedBlob) => {
    try {
      if (croppedBlob && user) {
        const storageRef = ref(storage, `backgrounds/${user.uid}_${selectedFile.name}`);
        const croppedFile = new File([croppedBlob], selectedFile.name, { type: 'image/jpeg' });
        
        // Sube la imagen recortada a Firebase Storage
        await uploadBytes(storageRef, croppedFile);
        const downloadURL = await getDownloadURL(storageRef);
        
        // Llama a onSave con la URL de la imagen recortada
        onSave(downloadURL);
      }
    } catch (error) {
      console.error("Error uploading cropped image: ", error);
    }
    setShowCropper(false); // Cierra el modal de recorte después de guardar
  };

  return (
    <div className="mt-4">
      <input
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="w-full mb-2 text-sm text-gray-200 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-violet-50 file:text-violet-700 hover:file:bg-violet-100"
      />
      {showCropper && (
        <ImageCropperModal
          isOpen={showCropper}
          imageSrc={imageSrc}
          onClose={() => setShowCropper(false)}
          onSave={handleSaveCroppedImage}
          aspectRatio={16 / 9} // Relación de aspecto para la imagen de fondo
        />
      )}
      <button
        onClick={handleSaveCroppedImage}
        className="w-full bg-purple-600 text-white py-2 px-4 rounded-md hover:bg-purple-700 transition duration-300"
      >
        Save Background
      </button>
    </div>
  );
}
