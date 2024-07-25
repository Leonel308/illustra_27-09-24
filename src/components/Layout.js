//Este codigo hara que el header envuelva todos los elementos directamente desde app.js
// src/components/Layout.js
import React from 'react';
import Header from './Header'; // Asegúrate de que la ruta es correcta

const Layout = ({ children }) => {
  return (
    <div>
      <Header />
      <main>
        {children}
      </main>
    </div>
  );
};

export default Layout;
