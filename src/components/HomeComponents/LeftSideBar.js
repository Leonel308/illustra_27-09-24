// LeftSideBar.js

import React, { useState, useEffect } from 'react';
import styles from './LeftSideBar.module.css';

const SFW_CATEGORIES = [
  'General', 'OC', 'Furry', 'Realismo', 'Anime', 'Manga', 'Paisajes',
  'Retratos', 'Arte Conceptual', 'Fan Art', 'Pixel Art',
  'Cómic', 'Abstracto', 'Minimalista', 'Chibi',
  'Ilustración Infantil', 'Steampunk', 'Ciencia Ficción',
  'Fantasía', 'Cyberpunk', 'Retro'
];

const NSFW_CATEGORIES = [
  'Hentai', 'Yuri', 'Yaoi', 'Gore', 'Bondage',
  'Futanari', 'Tentáculos', 'Furry NSFW',
  'Monstruos', 'Femdom', 'Maledom'
];

function LeftSideBar({ onFilterChange }) {
  const [showNSFW, setShowNSFW] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilters, setActiveFilters] = useState([]);

  useEffect(() => {
    onFilterChange({ showNSFW, activeFilters, searchTerm });
  }, [showNSFW, activeFilters, searchTerm, onFilterChange]);

  const handleNSFWToggle = () => {
    setShowNSFW(prevShowNSFW => !prevShowNSFW);
    if (showNSFW) {
      setActiveFilters(prevFilters => prevFilters.filter(filter => !NSFW_CATEGORIES.includes(filter)));
    }
  };

  const handleFilterChange = (filter) => {
    setActiveFilters(prevFilters => {
      if (prevFilters.includes(filter)) {
        return prevFilters.filter(f => f !== filter);
      } else {
        return [...prevFilters, filter];
      }
    });
  };

  const filterCategories = (categories) => {
    return categories.filter(category =>
      category.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  return (
    <div className={styles.leftSidebar}>
      <div className={styles.sidebarContent}>
        <input
          type="text"
          placeholder="Buscar categorías..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className={styles.searchInput}
        />
        <button
          className={styles.nsfwToggle}
          onClick={handleNSFWToggle}
        >
          {showNSFW ? 'Ocultar NSFW' : 'Mostrar NSFW'}
        </button>
        <div className={styles.categorySection}>
          <h3 className={styles.categoryTitle}>Categorías SFW</h3>
          <div className={styles.categoryList}>
            {filterCategories(SFW_CATEGORIES).map(category => (
              <button
                key={category}
                className={`${styles.categoryButton} ${activeFilters.includes(category) ? styles.active : ''}`}
                onClick={() => handleFilterChange(category)}
              >
                {category}
              </button>
            ))}
          </div>
        </div>
        {showNSFW && (
          <div className={styles.categorySection}>
            <h3 className={styles.categoryTitle}>Categorías NSFW</h3>
            <div className={styles.categoryList}>
              {filterCategories(NSFW_CATEGORIES).map(category => (
                <button
                  key={category}
                  className={`${styles.categoryButton} ${activeFilters.includes(category) ? styles.active : ''}`}
                  onClick={() => handleFilterChange(category)}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default LeftSideBar;
