import React, { useState } from 'react';
import { auth, db, storage } from '../../firebaseConfig';
import { doc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import './ProfilePortfolio.css';

const ProfilePortfolio = ({ portfolio, isOwner, setPortfolio, setError }) => {
  const [file, setFile] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isNSFW, setIsNSFW] = useState(false);

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleUpload = async () => {
    if (!file) return;

    setLoading(true);

    try {
      const userId = auth.currentUser.uid;
      const fileRef = ref(storage, `portfolios/${userId}/${file.name}`);
      await uploadBytes(fileRef, file);
      const fileURL = await getDownloadURL(fileRef);

      const newPost = {
        url: fileURL,
        isNSFW: isNSFW
      };

      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        portfolio: arrayUnion(newPost)
      });

      setPortfolio([...portfolio, newPost]);
      setFile(null);
      setIsNSFW(false);
      setShowForm(false);
    } catch (error) {
      console.error("Error uploading file: ", error);
      setError('Error uploading file');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (item) => {
    setLoading(true);
    try {
      const userId = auth.currentUser.uid;
      const userRef = doc(db, 'users', userId);
      
      const fileRef = ref(storage, item.url);
      await deleteObject(fileRef);

      await updateDoc(userRef, {
        portfolio: arrayRemove(item)
      });

      setPortfolio(portfolio.filter(i => i !== item));
      setError('');
    } catch (error) {
      console.error("Error deleting file: ", error);
      setError('Error deleting file');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="profile-portfolio">
      <h2>Mi Portafolio</h2>
      {isOwner && (
        <>
          <div
            className={`add-portfolio-header ${showForm ? 'active' : ''}`}
            onClick={() => setShowForm(!showForm)}
          >
            <h3>AÑADIR PORTFOLIO <span className={showForm ? 'rotate' : ''}>+</span></h3>
          </div>
          {showForm && (
            <div className="upload-section">
              <input type="file" onChange={handleFileChange} />
              <div>
                <label>
                  <input type="checkbox" checked={isNSFW} onChange={() => setIsNSFW(!isNSFW)} />
                  Contenido para adultos (+18)
                </label>
              </div>
              <button onClick={handleUpload} disabled={loading}>
                {loading ? 'Añadiendo...' : 'Subir Archivo'}
              </button>
            </div>
          )}
        </>
      )}
      <div className="portfolio-items">
        {portfolio.map((item, index) => (
          <div key={index} className="portfolio-item">
            <img src={item.url} alt={`Portfolio ${index + 1}`} />
            {item.isNSFW && <p className="nsfw-label">NSFW</p>}
            {isOwner && (
              <button className="delete-button" onClick={() => handleDelete(item)}>X</button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProfilePortfolio;