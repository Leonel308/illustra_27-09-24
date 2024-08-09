import React from 'react';
import './ProfileTabs.css';

const ProfileTabs = ({ activeTab, setActiveTab }) => {
  return (
    <div className="tabs">
      <button className={`tab ${activeTab === 'services' ? 'active' : ''}`} onClick={() => setActiveTab('services')}>Servicios</button>
      <button className={`tab ${activeTab === 'portfolio' ? 'active' : ''}`} onClick={() => setActiveTab('portfolio')}>Portafolio</button>
      <button className={`tab ${activeTab === 'feed' ? 'active' : ''}`} onClick={() => setActiveTab('feed')}>Actividades</button>
      <button className={`tab ${activeTab === 'friends' ? 'active' : ''}`} onClick={() => setActiveTab('friends')}>Amigos/Seguidores</button>
    </div>
  );
};

export default ProfileTabs;