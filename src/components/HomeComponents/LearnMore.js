import React from 'react';
import styles from './LearnMore.module.css';
import { FaUsers, FaPaintBrush, FaHandshake, FaSmile } from 'react-icons/fa';

const LearnMore = () => {
  return (
    <div className={styles.learnMoreContainer}>
      {/* Introducción */}
      <section className={styles.introSection}>
        <h1 className={styles.title}>Bienvenido a Illustra</h1>
        <p className={styles.subtitle}>
          La plataforma que conecta a artistas talentosos con quienes buscan servicios creativos.
        </p>
      </section>

      {/* Características */}
      <section className={styles.featuresSection}>
        <h2 className={styles.sectionTitle}>¿Por qué elegir Illustra?</h2>
        <div className={styles.featuresGrid}>
          <div className={styles.featureItem}>
            <FaPaintBrush className={styles.featureIcon} />
            <h3 className={styles.featureTitle}>Artistas Talentosos</h3>
            <p className={styles.featureDescription}>
              Encuentra y contrata a los mejores artistas para tus proyectos.
            </p>
          </div>
          <div className={styles.featureItem}>
            <FaUsers className={styles.featureIcon} />
            <h3 className={styles.featureTitle}>Comunidad Creativa</h3>
            <p className={styles.featureDescription}>
              Únete a una comunidad activa y comparte tus ideas.
            </p>
          </div>
          <div className={styles.featureItem}>
            <FaHandshake className={styles.featureIcon} />
            <h3 className={styles.featureTitle}>Procesos Seguros</h3>
            <p className={styles.featureDescription}>
              Realiza transacciones y comunicaciones de forma segura.
            </p>
          </div>
          <div className={styles.featureItem}>
            <FaSmile className={styles.featureIcon} />
            <h3 className={styles.featureTitle}>Satisfacción Garantizada</h3>
            <p className={styles.featureDescription}>
              Nuestro compromiso es tu satisfacción total.
            </p>
          </div>
        </div>
      </section>

      {/* Cómo Funciona */}
      <section className={styles.howItWorksSection}>
        <h2 className={styles.sectionTitle}>¿Cómo Funciona?</h2>
        <div className={styles.stepsContainer}>
          <div className={styles.stepItem}>
            <div className={styles.stepNumber}>1</div>
            <h3 className={styles.stepTitle}>Explora Servicios</h3>
            <p className={styles.stepDescription}>
              Navega entre una variedad de servicios ofrecidos por artistas.
            </p>
          </div>
          <div className={styles.stepItem}>
            <div className={styles.stepNumber}>2</div>
            <h3 className={styles.stepTitle}>Contacta al Artista</h3>
            <p className={styles.stepDescription}>
              Comunícate para detallar tu proyecto y resolver dudas.
            </p>
          </div>
          <div className={styles.stepItem}>
            <div className={styles.stepNumber}>3</div>
            <h3 className={styles.stepTitle}>Realiza el Pago</h3>
            <p className={styles.stepDescription}>
              Efectúa el pago de manera segura a través de nuestra plataforma.
            </p>
          </div>
          <div className={styles.stepItem}>
            <div className={styles.stepNumber}>4</div>
            <h3 className={styles.stepTitle}>Recibe tu Proyecto</h3>
            <p className={styles.stepDescription}>
              Obtén el resultado final y disfruta del trabajo realizado.
            </p>
          </div>
        </div>
      </section>

      {/* Llamado a la Acción */}
      <section className={styles.ctaSection}>
        <h2 className={styles.ctaTitle}>¿Listo para Comenzar?</h2>
        <p className={styles.ctaDescription}>
          Únete a Illustra y haz realidad tus ideas creativas.
        </p>
        <button
          className={styles.ctaButton}
          onClick={() => window.location.href = '/register'}
        >
          Regístrate Ahora
        </button>
      </section>
    </div>
  );
};

export default LearnMore;
