import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { db, storage } from '../firebaseConfig';
import { collection, addDoc, Timestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import UserContext from '../context/UserContext';
import '../Styles/CreatePost.css';

const CreatePost = () => {
  const { user } = useContext(UserContext);
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isAdultContent, setIsAdultContent] = useState(false);
  const [image, setImage] = useState(null);
  const [error, setError] = useState('');

  const handleImageChange = (e) => {
    if (e.target.files[0]) {
      setImage(e.target.files[0]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title || !description || !image) {
      setError('Todos los campos son obligatorios.');
      return;
    }

    try {
      const imageRef = ref(storage, `posts/${user.uid}/${image.name}`);
      await uploadBytes(imageRef, image);
      const imageURL = await getDownloadURL(imageRef);

      await addDoc(collection(db, 'PostsCollection'), {
        userID: user.uid,
        title,
        description,
        isAdultContent,
        imageURL,
        timestamp: Timestamp.fromDate(new Date())
      });

      navigate('/home');
    } catch (error) {
      console.error("Error creating post: ", error);
      setError('Error al crear la publicación. Por favor, inténtalo de nuevo.');
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
            maxLength={60} // Máximo 60 caracteres para el título
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
            maxLength={240} // Máximo 240 caracteres para la descripción
            required
          />
          <small>{description.length}/240 caracteres</small>
        </div>
        <div className="form-group">
          <label htmlFor="isAdultContent">
            <input
              type="checkbox"
              id="isAdultContent"
              checked={isAdultContent}
              onChange={(e) => setIsAdultContent(e.target.checked)}
            />
            Contenido para adultos
          </label>
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
        <button type="submit">Publicar</button>
      </form>
    </div>
  );
};

export default CreatePost;
