import React, { useState, useEffect } from 'react';
import { db, auth } from '../../firebaseConfig';
import {
  collectionGroup,
  getDocs,
  query,
  doc,
  getDoc,
  where,
} from 'firebase/firestore';
import ServiceCard from './ServiceCard';
import styles from './exploreServices.module.css';
import { FaSpinner, FaFilter, FaSort } from 'react-icons/fa';

const ExploreServices = () => {
  const [servicesList, setServicesList] = useState([]);
  const [loadingServicesList, setLoadingServicesList] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [filter, setFilter] = useState('all');
  const [sort, setSort] = useState('recent');

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(setCurrentUser);
    return unsubscribe;
  }, []);

  useEffect(() => {
    const fetchServices = async () => {
      setLoadingServicesList(true);
      try {
        const servicesQuery = query(
          collectionGroup(db, 'Services'),
          where('isDisabled', '==', false)
        );
        const servicesSnapshot = await getDocs(servicesQuery);

        const servicesPromises = servicesSnapshot.docs.map(async (serviceDoc) => {
          const serviceData = serviceDoc.data();
          const userId = serviceData.illustratorId || serviceDoc.ref.parent.parent.id;

          const userDocRef = doc(db, 'users', userId);
          const userDocSnap = await getDoc(userDocRef);
          const userData = userDocSnap.data();

          return {
            ...serviceData,
            serviceID: serviceDoc.id,
            userId: userId,
            username: userData?.username || 'Usuario desconocido',
            photoURL: userData?.photoURL || '/user-placeholder.png',
            createdAt: serviceData.createdAt?.toDate(),
          };
        });

        const allServices = await Promise.all(servicesPromises);

        const activeServices = allServices.filter(
          (service) =>
            service.title &&
            service.description &&
            service.price &&
            !service.isDisabled
        );

        setServicesList(activeServices);
      } catch (error) {
        console.error('Error fetching services:', error);
      } finally {
        setLoadingServicesList(false);
      }
    };

    fetchServices();
  }, []);

  const filteredAndSortedServices = servicesList
    .filter((service) => filter === 'all' || service.category === filter)
    .sort((a, b) => {
      if (sort === 'recent') return b.createdAt - a.createdAt;
      if (sort === 'price-low') return a.price - b.price;
      if (sort === 'price-high') return b.price - a.price;
      return 0;
    });

  return (
    <div className={styles.servicesContainer}>
      <h1 className={styles.servicesTitle}>Explora Servicios</h1>

      <div className={styles.controlsContainer}>
        <div className={styles.filterContainer}>
          <FaFilter className={styles.controlIcon} />
          <select
            className={styles.filterSelect}
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          >
            <option value="all">Todas las categorías</option>
            <option value="illustration">Ilustración</option>
            <option value="design">Diseño</option>
            <option value="animation">Animación</option>
          </select>
        </div>

        <div className={styles.sortContainer}>
          <FaSort className={styles.controlIcon} />
          <select
            className={styles.sortSelect}
            value={sort}
            onChange={(e) => setSort(e.target.value)}
          >
            <option value="recent">Más recientes</option>
            <option value="price-low">Precio: Bajo a Alto</option>
            <option value="price-high">Precio: Alto a Bajo</option>
          </select>
        </div>
      </div>

      {loadingServicesList ? (
        <div className={styles.loadingContainer}>
          <FaSpinner className={styles.loadingSpinner} />
          <p className={styles.loadingText}>Cargando servicios...</p>
        </div>
      ) : filteredAndSortedServices.length === 0 ? (
        <p className={styles.noServicesText}>No hay servicios disponibles.</p>
      ) : (
        <div className={styles.servicesGrid}>
          {filteredAndSortedServices.map((service) => (
            <ServiceCard
              key={service.serviceID}
              service={service}
              isOwnService={currentUser?.uid === service.userId}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default ExploreServices;
