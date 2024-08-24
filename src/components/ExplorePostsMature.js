import React, { useEffect, useState } from 'react';
import Feed from '../components/Feed/Feed';
import '../Styles/ExplorePostsMature.css';

const categories = [
  'Todos', 'NSFW', 'Hentai', 'Yuri', 'Yaoi', 'Ecchi', 'Gore', 'Futanari', 'Bondage', 'Tentacle'
];

const ExplorePostsMature = () => {
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
    <div className="explore-posts-mature-container">
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
        collectionName="PostsCollectionMature"
        searchTerm={searchTerm}
        activeCategory={activeCategory}
      />
    </div>
  );
};

export default ExplorePostsMature;
