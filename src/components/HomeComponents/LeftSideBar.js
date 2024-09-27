import React, { useState, useEffect, useCallback } from 'react';
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
  const [activeFilter, setActiveFilter] = useState(null);

  const handleFilterChange = useCallback(() => {
    onFilterChange({ showNSFW, activeFilter, searchTerm });
  }, [showNSFW, activeFilter, searchTerm, onFilterChange]);

  useEffect(() => {
    handleFilterChange();
  }, [handleFilterChange]);

  const toggleNSFW = () => {
    setShowNSFW(prev => !prev);
    if (showNSFW && NSFW_CATEGORIES.includes(activeFilter)) {
      setActiveFilter(null);
    }
  };

  const toggleFilter = (filter) => {
    setActiveFilter(prev => prev === filter ? null : filter);
  };

  const filterCategories = (categories) => 
    categories.filter(category => 
      category.toLowerCase().includes(searchTerm.toLowerCase())
    );

  return (
    <aside className={styles.leftSidebar} aria-label="Filtros de categorías">
      <div className={styles.sidebarContent}>
        <div className={styles.searchContainer}>
          <input
            type="text"
            placeholder="Buscar categorías..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={styles.searchInput}
            aria-label="Buscar categorías"
          />
        </div>
        <button
          className={`${styles.nsfwToggle} ${showNSFW ? styles.active : ''}`}
          onClick={toggleNSFW}
          aria-pressed={showNSFW}
          aria-label={showNSFW ? "Ocultar categorías NSFW" : "Mostrar categorías NSFW"}
        >
          {showNSFW ? 'Ocultar NSFW' : 'Mostrar NSFW'}
        </button>
        <CategorySection 
          title="Categorías SFW" 
          categories={filterCategories(SFW_CATEGORIES)} 
          activeFilter={activeFilter} 
          onToggle={toggleFilter} 
        />
        {showNSFW && (
          <CategorySection 
            title="Categorías NSFW" 
            categories={filterCategories(NSFW_CATEGORIES)} 
            activeFilter={activeFilter} 
            onToggle={toggleFilter} 
          />
        )}
      </div>
    </aside>
  );
}

function CategorySection({ title, categories, activeFilter, onToggle }) {
  return (
    <div className={styles.categorySection}>
      <h3 className={styles.categoryTitle}>{title}</h3>
      <div className={styles.categoryList}>
        {categories.map(category => (
          <button
            key={category}
            className={`${styles.categoryButton} ${activeFilter === category ? styles.active : ''}`}
            onClick={() => onToggle(category)}
            aria-pressed={activeFilter === category}
            aria-label={`Filtrar por ${category}`}
          >
            {category}
          </button>
        ))}
      </div>
    </div>
  );
}

export default LeftSideBar;