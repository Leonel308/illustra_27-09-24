// src/components/Layout.js
import React from 'react';
import Header from './Header';
import '../Styles/Layout.css';  // Asegúrate de que la ruta sea correcta

const Layout = ({ children }) => {
  return (
    <div>
      <Header />
      <main>
        <div className="container">
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;
