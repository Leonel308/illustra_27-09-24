// ExplorePosts.js
import React, { useEffect, useState } from 'react';
import Feed from '../components/Feed/Feed';
import '../Styles/ExplorePosts.css';

const categories = [
  'Todos', 'SFW', 'OC', 'Furry', 'Realismo', 'Anime', 'Manga', 'Paisajes',
  'Retratos', 'Arte Conceptual', 'Fan Art', 'Pixel Art', 'Cómic', 'Abstracto',
  'Minimalista', 'Chibi', 'Ilustración Infantil', 'Steampunk', 'Ciencia Ficción',
  'Fantasía', 'Cyberpunk', 'Retro'
];

const ExplorePosts = () => {
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState('Todos');

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 1000); // Simula el tiempo de carga
    return () => clearTimeout(timer);
  }, []);

  const handleSearch = (event) => {
    setSearchTerm(event.target.value);
  };

  const handleCategoryFilter = (category) => {
    setActiveCategory(category);
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="explore-posts-container">
      <div className="search-filter-container">
        <input
          type="text"
          placeholder="Buscar posts..."
          value={searchTerm}
          onChange={handleSearch}
          className="search-input"
        />
        <div className="filter-buttons">
          {categories.map((category) => (
            <button
              key={category}
              className={`filter-button ${activeCategory === category ? 'active' : ''}`}
              onClick={() => handleCategoryFilter(category)}
            >
              {category}
            </button>
          ))}
        </div>
      </div>
      <Feed
        collectionName="PostsCollection"
        searchTerm={searchTerm}
        activeCategory={activeCategory}
      />
    </div>
  );
};

export default ExplorePosts;
