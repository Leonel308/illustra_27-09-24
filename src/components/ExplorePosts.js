// src/components/ExplorePosts.js
import React, { useEffect, useState } from 'react';
import Feed from '../components/Feed/Feed';
import '../Styles/ExplorePosts.css';

const ExplorePosts = () => {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 1000); // Simula el tiempo de carga

    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="explore-title">Explora a Otros Artistas</h1> {/* Título añadido */}
      <Feed collectionName="PostsCollection" />
    </div>
  );
};

export default ExplorePosts;
