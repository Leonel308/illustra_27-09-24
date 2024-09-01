import React, { useState, useEffect } from 'react';
import './LeftSideBar.css';

// Definir los filtros disponibles para las categorías SFW y NSFW
const filters = {
  SFW: [
    'General', 'OC', 'Furry', 'Realismo', 'Anime', 'Manga', 'Paisajes',
    'Retratos', 'Arte Conceptual', 'Fan Art', 'Pixel Art',
    'Cómic', 'Abstracto', 'Minimalista', 'Chibi',
    'Ilustración Infantil', 'Steampunk', 'Ciencia Ficción',
    'Fantasía', 'Cyberpunk', 'Retro'
  ],
  NSFW: [
    'General', 'Hentai', 'Yuri', 'Yaoi', 'Gore', 'Bondage',
    'Futanari', 'Tentáculos', 'Furry NSFW',
    'Monstruos', 'Femdom', 'Maledom'
  ]
};

const LeftSidebar = ({ onFilterChange }) => {
  // Estados para manejar la visibilidad de NSFW, término de búsqueda y filtros activos
  const [showNSFW, setShowNSFW] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilters, setActiveFilters] = useState({
    SFW: [],
    NSFW: []
  });

  useEffect(() => {
    // Llama a la función onFilterChange para actualizar los filtros en el componente principal
    onFilterChange({ showNSFW, activeFilters });
  }, [showNSFW, activeFilters, onFilterChange]);

  // Maneja el cambio de visibilidad del contenido NSFW
  const handleNSFWToggle = () => {
    setShowNSFW(!showNSFW);
    setActiveFilters(prev => ({ ...prev, NSFW: [] }));
  };

  // Maneja el cambio de filtros activos
  const handleFilterChange = (filterType, filter) => {
    setActiveFilters(prev => {
      const isFilterActive = prev[filterType].includes(filter);
      const updatedFilters = isFilterActive
        ? prev[filterType].filter(f => f !== filter)
        : [...prev[filterType], filter];

      return { ...prev, [filterType]: updatedFilters };
    });
  };

  // Renderiza los filtros según la categoría seleccionada
  const renderFilters = () => {
    const filterCategories = showNSFW ? ['SFW', 'NSFW'] : ['SFW'];
    return filterCategories.map(filterType => (
      <div key={filterType}>
        <h3 className="filter-category">{filterType === 'SFW' ? 'Filtros SFW' : 'Filtros NSFW'}</h3>
        <ul className="filter-list">
          {filters[filterType].map(filter => {
            const lowercaseFilter = filter.toLowerCase();
            if (lowercaseFilter.includes(searchTerm.toLowerCase())) {
              return (
                <li key={filter}>
                  <label>
                    <input
                      type="checkbox"
                      checked={activeFilters[filterType].includes(filter)}
                      onChange={() => handleFilterChange(filterType, filter)}
                    />
                    {filter}
                  </label>
                </li>
              );
            }
            return null;
          })}
        </ul>
      </div>
    ));
  };

  return (
    <div className="sidebar-left">
      <input
        type="text"
        className="filter-search"
        placeholder="Buscar filtros..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />
      <label className="nsfw-toggle">
        <input
          type="checkbox"
          checked={showNSFW}
          onChange={handleNSFWToggle}
        />
        Mostrar contenido NSFW
      </label>
      {renderFilters()}
    </div>
  );
};

export default LeftSidebar;
