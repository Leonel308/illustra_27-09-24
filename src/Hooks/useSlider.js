import { useState } from 'react';

// Hook que controla el deslizamiento de imágenes
const useSlider = (initialIndex = 0, totalCount = 0, itemsPerPage = 4) => {
  const [slideIndex, setSlideIndex] = useState(initialIndex);

  const handlePrev = () => {
    setSlideIndex((prevIndex) => Math.max(prevIndex - 1, 0));
  };

  const handleNext = () => {
    setSlideIndex((prevIndex) => Math.min(prevIndex + 1, totalCount - itemsPerPage));
  };

  return { slideIndex, handlePrev, handleNext };
};

export default useSlider;
