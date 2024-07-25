import React, { useState, useContext } from 'react';
import { db, storage } from '../firebaseConfig';
import { collection, addDoc, Timestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useNavigate } from 'react-router-dom';
import UserContext from '../context/UserContext';
import '../Styles/PostForm.css';

const PostForm = () => {
  const { user } = useContext(UserContext);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isAdultContent, setIsAdultContent] = useState(false);
  const [image, setImage] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleImageChange = (e) => {
    if (e.target.files[0]) {
      setImage(e.target.files[0]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title || !description) {
      setError('Title and Description are required');
      return;
    }

    setLoading(true);
    setError('');

    try {
      let imageURL = '';
      if (image) {
        const imageRef = ref(storage, `postImages/${user.uid}/${image.name}`);
        await uploadBytes(imageRef, image);
        imageURL = await getDownloadURL(imageRef);
      }

      await addDoc(collection(db, 'PostsCollection'), {
        userID: user.uid,
        title,
        description,
        imageURL,
        isAdultContent,
        timestamp: Timestamp.now()
      });

      navigate('/lienzos');
    } catch (error) {
      console.error('Error creating post: ', error);
      setError('Error creating post. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Cargando...</p>
      </div>
    );
  }

  return (
    <div className="post-form-container">
      <form className="post-form" onSubmit={handleSubmit}>
        <h2>Create a New Post</h2>
        {error && <p className="error">{error}</p>}
        <div className="form-group">
          <label htmlFor="title">Title</label>
          <input
            type="text"
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength="100"
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="description">Description</label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            maxLength="500"
            required
          />
        </div>
        <div className="form-group">
          <label>
            <input
              type="checkbox"
              checked={isAdultContent}
              onChange={(e) => setIsAdultContent(e.target.checked)}
            />
            Is this content for adults only?
          </label>
        </div>
        <div className="form-group">
          <label htmlFor="image">Upload Image</label>
          <input type="file" id="image" accept="image/*" onChange={handleImageChange} />
        </div>
        <button type="submit" disabled={loading}>
          {loading ? 'Creating...' : 'Create Post'}
        </button>
      </form>
    </div>
  );
};

export default PostForm;
