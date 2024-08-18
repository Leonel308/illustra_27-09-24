import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { db, storage } from '../firebaseConfig';
import { collection, addDoc, Timestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import UserContext from '../context/UserContext';
import ImageCropperModal from '../components/Profile/ImageCropperModal';
import '../Styles/CreatePost.css';

const categories = {
  "SFW": ["OC", "Furry", "Realismo", "Anime", "Manga"],
  "NSFW": ["Hentai", "Yuri", "Gore"]
};

const CreatePost = () => {
  const { user } = useContext(UserContext);
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [mainCategory, setMainCategory] = useState('SFW');
  const [subCategory, setSubCategory] = useState(categories['SFW'][0]);
  const [imageSrc, setImageSrc] = useState(null); // Para mostrar la imagen en el modal
  const [croppedImage, setCroppedImage] = useState(null);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showModal, setShowModal] = useState(false); // Estado para mostrar/ocultar el modal

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onloadend = () => {
        setImageSrc(reader.result); // Configura la imagen para el modal
        setShowModal(true); // Muestra el modal
      };
    }
  };

  const handleSaveCroppedImage = async (croppedFile) => {
    setCroppedImage(croppedFile);
    setShowModal(false); // Cierra el modal después de recortar
  };

  const handleCancelCrop = () => {
    setShowModal(false);
    setImageSrc(null); // Resetea la imagen si se cancela el recorte
  };

  const handleMainCategoryChange = (e) => {
    const selectedMainCategory = e.target.value;
    setMainCategory(selectedMainCategory);
    setSubCategory(categories[selectedMainCategory][0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title || !description || !croppedImage) {
      setError('Todos los campos son obligatorios.');
      return;
    }

    setIsSubmitting(true);

    const isAdultContent = mainCategory === 'NSFW';
    const collectionName = isAdultContent ? 'PostsCollectionMature' : 'PostsCollection';

    try {
      const imageRef = ref(storage, `posts/${user.uid}/${croppedImage.name}`);
      await uploadBytes(imageRef, croppedImage);
      const imageURL = await getDownloadURL(imageRef);

      await addDoc(collection(db, collectionName), {
        userID: user.uid,
        title,
        description,
        category: `${mainCategory} - ${subCategory}`,
        isAdultContent,
        imageURL,
        timestamp: Timestamp.fromDate(new Date())
      });

      const navigateTo = isAdultContent ? '/explore-posts-mature' : '/explore-posts';
      navigate(navigateTo);
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
          <label htmlFor="mainCategory">Clasificación de Contenido</label>
          <select
            id="mainCategory"
            value={mainCategory}
            onChange={handleMainCategoryChange}
            required
          >
            <option value="SFW">SFW</option>
            <option value="NSFW">NSFW</option>
          </select>
        </div>
        <div className="form-group">
          <label htmlFor="subCategory">Categoría</label>
          <select
            id="subCategory"
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
              onClose={handleCancelCrop} // Maneja el cierre del modal al hacer clic en cerrar
              onSave={handleSaveCroppedImage}
              imageSrc={imageSrc}
              aspect={4 / 3} // Relación de aspecto 4:3 para la imagen de la publicación
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
