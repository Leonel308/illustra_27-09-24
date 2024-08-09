import React, { useState, useContext } from 'react';
import { updateDoc, doc } from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import UserContext from '../../context/UserContext';
import './ProfileBio.css';

const ProfileBio = ({ bio, isOwner, setBio, setError }) => {
  const { user } = useContext(UserContext);
  const [editingBio, setEditingBio] = useState(false);

  const handleBioChange = (e) => {
    setBio(e.target.value);
  };

  const handleSaveBio = async () => {
    if (user) {
      try {
        await updateDoc(doc(db, 'users', user.uid), { bio });
        setEditingBio(false);
      } catch (error) {
        console.error("Error saving bio: ", error);
        setError('Error saving bio. Please try again.');
      }
    }
  };

  const handleEditBio = () => {
    setEditingBio(true);
  };

  return (
    <div className="bio-container">
      <div className="bio">
        {isOwner && editingBio ? (
          <>
            <textarea 
              value={bio} 
              onChange={handleBioChange} 
              placeholder="Escribe tu biografía..." 
              maxLength={460} 
              style={{ whiteSpace: "normal", wordWrap: "break-word", overflowWrap: "break-word" }} 
            />
            <button onClick={handleSaveBio}>Guardar</button>
          </>
        ) : (
          <>
            <p style={{ 
              color: bio ? "#000" : "gray", 
              fontStyle: bio ? "normal" : "italic",
              whiteSpace: "normal", 
              wordWrap: "break-word", 
              overflowWrap: "break-word" 
            }}>
              {bio || "Sin biografía"}
            </p>
            {isOwner && <button onClick={handleEditBio}>Editar</button>}
          </>
        )}
      </div>
    </div>
  );
};

export default ProfileBio;