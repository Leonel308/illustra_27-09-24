import React, { useState } from 'react';
import { updateDoc, doc } from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import styles from '../../Styles/ProfileStyles/ProfileBio.module.css';

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
    <div className={styles.profileBio}>
      <h2 className={styles.bioTitle}>Biografía</h2>
      {isEditing ? (
        <form onSubmit={handleSubmit} className={styles.bioForm}>
          <textarea
            value={editedBio}
            onChange={handleBioChange}
            placeholder="Escribe tu biografía aquí..."
            maxLength={200}
            className={styles.bioTextarea}
          />
          <div className={styles.bioActions}>
            <button type="submit" className={`${styles.bioButton} ${styles.save}`}>
              Guardar
            </button>
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className={`${styles.bioButton} ${styles.cancel}`}
            >
              Cancelar
            </button>
          </div>
        </form>
      ) : (
        <div className={styles.bioContent}>
          <p>{bio || 'No hay biografía disponible.'}</p>
          {isOwner && (
            <button
              onClick={() => setIsEditing(true)}
              className={`${styles.bioButton} ${styles.edit}`}
            >
              Editar
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default ProfileBio;