// src/components/HomeComponents/WelcomeBox.js

import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Pagination, Autoplay, EffectFade } from 'swiper/modules';
import { ArrowRight } from 'lucide-react';
import 'swiper/css';
import 'swiper/css/pagination';
import 'swiper/css/effect-fade';
import './WelcomeBox.css';

const API_ENDPOINT = '/api/random-portfolio-images';
const PLACEHOLDER_IMAGE = '/path/to/placeholder-image.jpg';

const WelcomeBox = ({ portfolioImages = [], user }) => {
  const navigate = useNavigate();
  const [randomImages, setRandomImages] = useState([]);
  const [imagesLoaded, setImagesLoaded] = useState({});
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchRandomImages = async () => {
      try {
        const response = await fetch(API_ENDPOINT);
        if (!response.ok) {
          throw new Error(`Error: ${response.statusText}`);
        }
        const data = await response.json();
        const validImages = data.filter((image) => image && image.url);
        setRandomImages(validImages);
      } catch (err) {
        console.error('Error fetching random images:', err);
        setError('No se pudieron cargar las imágenes.');
        setRandomImages([]);
      }
    };

    if (portfolioImages.length === 0) {
      fetchRandomImages();
    }
  }, [portfolioImages]);

  const displayImages = useMemo(() => {
    const images = portfolioImages.length > 0 ? portfolioImages : randomImages;
    return images.filter((image) => image && (typeof image === 'string' || image.url));
  }, [portfolioImages, randomImages]);

  const handleImageLoad = (imageUrl) => {
    setImagesLoaded((prev) => ({ ...prev, [imageUrl]: true }));
  };

  const handleImageError = (imageUrl) => {
    setImagesLoaded((prev) => ({ ...prev, [imageUrl]: false }));
  };

  const handleNavigate = (path) => {
    navigate(path);
  };

  return (
    <section className="welcome-box">
      {user ? (
        <>
          <Swiper
            modules={[Pagination, Autoplay, EffectFade]}
            spaceBetween={0}
            slidesPerView={1}
            effect="fade"
            pagination={{
              clickable: true,
              bulletClass: 'swiper-pagination-bullet',
              bulletActiveClass: 'swiper-pagination-bullet-active',
            }}
            autoplay={{ delay: 5000, disableOnInteraction: false }}
            className="welcome-swiper"
            aria-label="Galería de imágenes de portafolio"
          >
            {displayImages.length > 0 ? (
              displayImages.map((image, index) => {
                const imageUrl = typeof image === 'string' ? image : image.url;
                if (imagesLoaded[imageUrl] === false) {
                  return null;
                }
                return (
                  <SwiperSlide key={index}>
                    <div className="slide-content">
                      <img
                        src={imageUrl}
                        alt={`Portafolio ${index + 1}`}
                        className="slide-image"
                        loading="lazy"
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
                  <img
                    src={PLACEHOLDER_IMAGE}
                    alt="Placeholder"
                    className="slide-image"
                    loading="lazy"
                  />
                  <div className="slide-overlay" />
                  <div className="slide-placeholder">No hay imágenes disponibles</div>
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
              <button
                onClick={() => handleNavigate('/exploreServices')}
                className="cta-button start-button"
                aria-label="Comienza ahora"
              >
                Comienza ahora
                <ArrowRight className="button-icon" />
              </button>
              <button
                onClick={() => handleNavigate('/explore-posts')}
                className="cta-button feed-button"
                aria-label="Ir al Feed"
              >
                Feed
                <ArrowRight className="button-icon" />
              </button>
              <button
                onClick={() => handleNavigate('/explore-users')}
                className="cta-button users-button"
                aria-label="Ver Usuarios"
              >
                Usuarios
                <ArrowRight className="button-icon" />
              </button>
              <button
                onClick={() => handleNavigate('/learn-more')}
                className="cta-button learn-button"
                aria-label="Aprende más"
              >
                Aprende más
                <ArrowRight className="button-icon" />
              </button>
            </div>
            {error && <p className="error-message">{error}</p>}
          </div>
        </>
      ) : (
        <div className="welcome-content guest-content">
          <h1 className="welcome-title">¡Bienvenido a Illustra!</h1>
          <p className="welcome-description">
            Para descubrir artistas, contratar servicios y promocionar tus ilustraciones, debes estar registrado.
          </p>
          <div className="welcome-buttons">
            <button
              onClick={() => handleNavigate('/register')}
              className="cta-button register-button"
              aria-label="Registrarse"
            >
              Registrarse
              <ArrowRight className="button-icon" />
            </button>
            <button
              onClick={() => handleNavigate('/login')}
              className="cta-button login-button"
              aria-label="Iniciar Sesión"
            >
              Iniciar Sesión
              <ArrowRight className="button-icon" />
            </button>
          </div>
        </div>
      )}
    </section>
  );
};

export default WelcomeBox;
