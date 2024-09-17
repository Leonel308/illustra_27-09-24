import React, { useState } from 'react';
import Header from './Header';
import AddBalance from './addBalance';
import CreatePostModal from './CreatePost';
import '../Styles/Layout.css';

const Layout = ({ children }) => {
  const [activeModal, setActiveModal] = useState(null);

  // Función para abrir un modal y cerrar otros modales
  const openModal = (modalName) => {
    setActiveModal(modalName);
  };

  // Función para cerrar el modal activo
  const closeModal = () => {
    setActiveModal(null);
  };

  return (
    <div>
      <Header openModal={openModal} />
      <main>
        <div className="container">
          {children}
        </div>
      </main>

      {/* Modal de Añadir Saldo */}
      {activeModal === 'addBalance' && <AddBalance onClose={closeModal} />}

      {/* Modal de Crear Publicación */}
      {activeModal === 'createPost' && (
        <CreatePostModal isOpen={activeModal === 'createPost'} onClose={closeModal} />
      )}
    </div>
  );
};

export default Layout;
