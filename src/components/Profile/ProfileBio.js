import React, { useState } from 'react';
import { updateDoc, doc } from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import '../../Styles/ProfileStyles/ProfileBio.css';

const ProfileBio = ({ bio, isOwner, setBio, userId }) => {
  const [editedBio, setEditedBio] = useState(bio);
  const [isEditing, setIsEditing] = useState(false);

  const handleBioChange = (e) => {
    setEditedBio(e.target.value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, { bio: editedBio });
      setBio(editedBio);
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating bio:', error);
    }
  };

  return (
    <div className="profile-bio">
      <h2>Biografía</h2>
      {isEditing ? (
        <form onSubmit={handleSubmit} className="bio-form">
          <textarea
            value={editedBio}
            onChange={handleBioChange}
            placeholder="Escribe tu biografía aquí..."
            maxLength={200}
            className="bio-textarea"
          />
          <div className="bio-actions">
            <button type="submit" className="bio-button save">Guardar</button>
            <button type="button" onClick={() => setIsEditing(false)} className="bio-button cancel">Cancelar</button>
          </div>
        </form>
      ) : (
        <div className="bio-content">
          <p>{bio || 'No hay biografía disponible.'}</p>
          {isOwner && <button onClick={() => setIsEditing(true)} className="bio-button edit">Editar</button>}
        </div>
      )}
    </div>
  );
};

export default ProfileBio;