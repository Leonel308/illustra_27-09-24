import React, { useState, useContext } from 'react';
import { db, storage } from '../../firebaseConfig';
import { collection, addDoc, Timestamp, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import UserContext from '../../context/UserContext';
import ImageCropperModal from '../../components/Profile/ImageCropperModal';
import '../../components/HomeComponents/CreatePostModal.css';

const categories = {
  "SFW": [
    'OC', 'Furry', 'Realismo', 'Anime', 'Manga', 'Paisajes',
    'Retratos', 'Arte Conceptual', 'Fan Art', 'Pixel Art', 
    'Cómic', 'Abstracto', 'Minimalista', 'Chibi', 
    'Ilustración Infantil', 'Steampunk', 'Ciencia Ficción',
    'Fantasía', 'Cyberpunk', 'Retro'
  ],
  "NSFW": [
    'Hentai', 'Yuri', 'Yaoi', 'Gore', 'Bondage', 
    'Futanari', 'Tentáculos', 'Furry NSFW', 
    'Monstruos', 'Femdom', 'Maledom'
  ]
};

const CreatePostModal = ({ isOpen, onClose }) => {
  const { user } = useContext(UserContext);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [mainCategory, setMainCategory] = useState('SFW');
  const [subCategory, setSubCategory] = useState('OC');
  const [imageSrc, setImageSrc] = useState(null);
  const [croppedImage, setCroppedImage] = useState(null);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [showCropper, setShowCropper] = useState(false);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onloadend = () => {
        setImageSrc(reader.result);
        setShowCropper(true);
      };
    }
  };

  const handleSaveCroppedImage = (croppedFile) => {
    setCroppedImage(croppedFile);
    setShowCropper(false);
  };

  const handleCancelCrop = () => {
    setShowCropper(false);
    setImageSrc(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!description || (isExpanded && !title)) {
      setError('Descripción obligatoria. El título es obligatorio si expandes la publicación.');
      return;
    }

    setIsSubmitting(true);

    const isAdultContent = mainCategory === 'NSFW';
    const collectionName = isAdultContent ? 'PostsCollectionMature' : 'PostsCollection';

    try {
      const postRef = await addDoc(collection(db, collectionName), {
        userID: user.uid,
        title: isExpanded ? title : description.substring(0, 60),
        description,
        category: `${mainCategory} - ${subCategory}`,
        isAdultContent,
        timestamp: Timestamp.fromDate(new Date()),
      });

      const postId = postRef.id;

      if (croppedImage) {
        const imageRef = ref(storage, `posts/${user.uid}/${postId}`);
        await uploadBytes(imageRef, croppedImage);
        const imageURL = await getDownloadURL(imageRef);
        await updateDoc(postRef, { imageURL });
      }

      onClose();
    } catch (error) {
      console.error("Error creating post: ", error);
      setError('Error al crear la publicación. Por favor, inténtalo de nuevo.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    isOpen && (
      <div className="modal-overlay">
        <div className="modal-content">
          <form onSubmit={handleSubmit}>
            <textarea
              placeholder="¿Qué está pasando?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
            />
            {isExpanded && (
              <>
                <input
                  type="text"
                  placeholder="Título"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required={isExpanded}
                />
                <select
                  value={mainCategory}
                  onChange={(e) => {
                    setMainCategory(e.target.value);
                    setSubCategory(categories[e.target.value][0]);
                  }}
                  required
                >
                  <option value="SFW">SFW</option>
                  <option value="NSFW">NSFW</option>
                </select>
                <select
                  value={subCategory}
                  onChange={(e) => setSubCategory(e.target.value)}
                  required
                >
                  {categories[mainCategory].map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
                <input type="file" accept="image/*" onChange={handleImageChange} />
                {croppedImage && (
                  <div className="image-preview">
                    <img src={URL.createObjectURL(croppedImage)} alt="Preview" />
                  </div>
                )}
              </>
            )}
            <div className="button-group">
              <button type="button" onClick={() => setIsExpanded(!isExpanded)}>
                {isExpanded ? 'Reducir' : 'Agregar más detalles'}
              </button>
              <button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Publicando...' : 'Publicar'}
              </button>
              <button type="button" onClick={onClose}>Cerrar</button>
            </div>
          </form>

          {showCropper && (
            <ImageCropperModal
              isOpen={showCropper}
              onClose={handleCancelCrop}
              onSave={handleSaveCroppedImage}
              imageSrc={imageSrc}
              aspect={4 / 3}
            />
          )}
        </div>
      </div>
    )
  );
};

export default CreatePostModal;
