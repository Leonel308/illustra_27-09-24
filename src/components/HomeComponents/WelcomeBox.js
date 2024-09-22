import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Pagination, Autoplay } from 'swiper/modules';
import { ArrowRight } from 'lucide-react';
import 'swiper/css';
import 'swiper/css/pagination';
import './WelcomeBox.css';

const WelcomeBox = ({ portfolioImages = [] }) => {
  const navigate = useNavigate();
  const [randomImages, setRandomImages] = useState([]);
  const [imagesLoaded, setImagesLoaded] = useState({});

  useEffect(() => {
    const fetchRandomImages = async () => {
      try {
        const response = await fetch('/api/random-portfolio-images');
        const data = await response.json();
        setRandomImages(
          data.filter((image) => image && image.url)
        );
      } catch (error) {
        console.error('Error fetching random images:', error);
        setRandomImages([]);
      }
    };

    if (portfolioImages.length === 0) {
      fetchRandomImages();
    }
  }, [portfolioImages]);

  const displayImages = (portfolioImages.length > 0 ? portfolioImages : randomImages).filter(
    (image) => image && (typeof image === 'string' || image.url)
  );

  const handleImageLoad = (imageUrl) => {
    setImagesLoaded((prev) => ({ ...prev, [imageUrl]: true }));
  };

  const handleImageError = (imageUrl) => {
    setImagesLoaded((prev) => ({ ...prev, [imageUrl]: false }));
  };

  return (
    <div className="welcome-box">
      <Swiper
        modules={[Pagination, Autoplay]}
        spaceBetween={0}
        slidesPerView={1}
        pagination={{
          clickable: true,
          bulletClass: 'swiper-pagination-bullet',
          bulletActiveClass: 'swiper-pagination-bullet-active',
        }}
        autoplay={{ delay: 5000, disableOnInteraction: false }}
        className="welcome-swiper"
      >
        {displayImages.length > 0 ? (
          displayImages.map((image) => {
            if (!image) return null;
            const imageUrl = typeof image === 'string' ? image : image.url;
            if (imagesLoaded[imageUrl] === false) {
              return null;
            }
            return (
              <SwiperSlide key={imageUrl}>
                <div className="slide-content">
                  <img
                    src={imageUrl}
                    alt="Portafolio"
                    className="slide-image"
                    onLoad={() => handleImageLoad(imageUrl)}
                    onError={() => handleImageError(imageUrl)}
                  />
                  <div className="slide-overlay" />
                </div>
              </SwiperSlide>
            );
          })
        ) : (
          <SwiperSlide>
            <div className="slide-content">
              <div className="slide-placeholder">No hay imágenes disponibles</div>
              <div className="slide-overlay" />
            </div>
          </SwiperSlide>
        )}
      </Swiper>
      <div className="welcome-content">
        <h1 className="welcome-title">¡Descubre Illustra!</h1>
        <p className="welcome-description">
          Conecta con artistas, contrata servicios y promociona tus ilustraciones.
        </p>
        <div className="welcome-buttons">
          <button onClick={() => navigate('/exploreServices')} className="cta-button start-button">
            Comienza ahora
            <ArrowRight className="button-icon" />
          </button>
          <button onClick={() => navigate('/learn-more')} className="cta-button learn-button">
            Aprende más
          </button>
        </div>
      </div>
    </div>
  );
};

export default WelcomeBox;
