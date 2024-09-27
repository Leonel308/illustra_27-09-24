import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { db, storage } from '../firebaseConfig';
import { collection, addDoc, Timestamp, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import UserContext from '../context/UserContext';
import ImageCropperModal from '../components/Profile/ImageCropperModal';
import '../Styles/CreatePost.css';

const categories = [
  'OC', 'Furry', 'Realismo', 'Anime', 'Manga', 'Paisajes',
  'Retratos', 'Arte Conceptual', 'Fan Art', 'Pixel Art',
  'Cómic', 'Abstracto', 'Minimalista', 'Chibi',
  'Ilustración Infantil', 'Steampunk', 'Ciencia Ficción',
  'Fantasía', 'Cyberpunk', 'Retro', 'Hentai', 'Yuri', 'Yaoi',
  'Gore', 'Bondage', 'Futanari', 'Tentáculos', 'Furry NSFW',
  'Monstruos', 'Femdom', 'Maledom'
];

const CreatePost = () => {
  const { user } = useContext(UserContext);
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('OC');
  const [isNSFW, setIsNSFW] = useState(false);
  const [imageSrc, setImageSrc] = useState(null);
  const [croppedImage, setCroppedImage] = useState(null);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showModal, setShowModal] = useState(false);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onloadend = () => {
        setImageSrc(reader.result);
        setShowModal(true);
      };
    }
  };

  const handleSaveCroppedImage = async (croppedFile) => {
    setCroppedImage(croppedFile);
    setShowModal(false);
  };

  const handleCancelCrop = () => {
    setShowModal(false);
    setImageSrc(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title || !description || !croppedImage) {
      setError('Todos los campos son obligatorios.');
      return;
    }

    setIsSubmitting(true);

    const collectionName = isNSFW ? 'PostsCollectionMature' : 'PostsCollection';

    try {
      const postRef = await addDoc(collection(db, collectionName), {
        userID: user.uid,
        title,
        description,
        category,
        isNSFW,
        timestamp: Timestamp.fromDate(new Date()),
      });

      const postId = postRef.id;

      const imageRef = ref(storage, `posts/${user.uid}/${postId}`);
      await uploadBytes(imageRef, croppedImage);
      const imageURL = await getDownloadURL(imageRef);

      await updateDoc(postRef, {
        imageURL,
      });

      navigate(isNSFW ? '/explore-posts-mature' : '/explore-posts');
    } catch (error) {
      console.error("Error creating post: ", error);
      setError('Error al crear la publicación. Por favor, inténtalo de nuevo.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="create-post-container">
      <h2>Crear Publicación</h2>
      {error && <p className="error">{error}</p>}
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="title">Título</label>
          <input
            type="text"
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={60}
            required
          />
          <small>{title.length}/60 caracteres</small>
        </div>
        <div className="form-group">
          <label htmlFor="description">Descripción</label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            maxLength={240}
            required
          />
          <small>{description.length}/240 caracteres</small>
        </div>
        <div className="form-group">
          <label htmlFor="isNSFW">Clasificación de Contenido</label>
          <select
            id="isNSFW"
            value={isNSFW ? 'NSFW' : 'SFW'}
            onChange={(e) => setIsNSFW(e.target.value === 'NSFW')}
            required
          >
            <option value="SFW">SFW</option>
            <option value="NSFW">NSFW</option>
          </select>
        </div>
        <div className="form-group">
          <label htmlFor="category">Categoría</label>
          <select
            id="category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            required
          >
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>
        <div className="form-group">
          <label htmlFor="image">Imagen</label>
          <input
            type="file"
            id="image"
            accept="image/*"
            onChange={handleImageChange}
            required
          />
        </div>

        {showModal && (
          <>
            <div className="image-cropper-overlay" onClick={handleCancelCrop}></div>
            <ImageCropperModal
              isOpen={showModal}
              onClose={handleCancelCrop}
              onSave={handleSaveCroppedImage}
              imageSrc={imageSrc}
              aspect={4 / 3}
            />
          </>
        )}

        <button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Publicando...' : 'Publicar'}
        </button>
      </form>
    </div>
  );
};

export default CreatePost;