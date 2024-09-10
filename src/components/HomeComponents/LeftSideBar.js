import React, { useState, useEffect } from 'react';
import './LeftSideBar.css';

// Filtros por categoría SFW y NSFW
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
  const [showNSFW, setShowNSFW] = useState(false); // Estado para manejar la visibilidad del contenido NSFW
  const [searchTerm, setSearchTerm] = useState(''); // Término de búsqueda en los filtros
  const [activeFilters, setActiveFilters] = useState({ SFW: [], NSFW: [] }); // Filtros seleccionados

  // Efecto para actualizar los filtros en el componente padre cuando cambian
  useEffect(() => {
    onFilterChange({ showNSFW, activeFilters });
  }, [showNSFW, activeFilters, onFilterChange]);

  // Maneja el cambio de la visibilidad del contenido NSFW
  const handleNSFWToggle = () => {
    setShowNSFW(prevShowNSFW => !prevShowNSFW);
    // Resetea los filtros NSFW al desactivar el contenido NSFW
    if (!showNSFW) {
      setActiveFilters(prevFilters => ({ ...prevFilters, NSFW: [] }));
    }
  };

  // Maneja la selección y deselección de filtros
  const handleFilterChange = (filterType, filter) => {
    setActiveFilters(prevFilters => {
      const isActive = prevFilters[filterType].includes(filter);
      const updatedFilters = isActive
        ? prevFilters[filterType].filter(f => f !== filter)
        : [...prevFilters[filterType], filter];
      return { ...prevFilters, [filterType]: updatedFilters };
    });
  };

  // Renderiza los filtros para cada categoría (SFW o NSFW)
  const renderFilters = () => {
    const categories = showNSFW ? ['SFW', 'NSFW'] : ['SFW']; // Muestra NSFW solo si está activado
    return categories.map(filterType => (
      <div key={filterType}>
        <h3 className="filter-category">{filterType === 'SFW' ? 'Filtros SFW' : 'Filtros NSFW'}</h3>
        <ul className="filter-list">
          {filters[filterType].map(filter => {
            const filterLower = filter.toLowerCase();
            if (filterLower.includes(searchTerm.toLowerCase())) {
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
      {/* Barra de búsqueda para los filtros */}
      <input
        type="text"
        className="filter-search"
        placeholder="Buscar filtros..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />
      {/* Toggle para activar/desactivar contenido NSFW */}
      <label className="nsfw-toggle">
        <input
          type="checkbox"
          checked={showNSFW}
          onChange={handleNSFWToggle}
        />
        Mostrar contenido NSFW
      </label>
      {/* Renderizado de los filtros */}
      {renderFilters()}
    </div>
  );
};

export default LeftSidebar;
