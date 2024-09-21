// src/components/Footer.js
import React from 'react';
import './Footer.css'; // Crea este archivo

const Footer = () => (
  <footer className="home-footer">
    <p>© {new Date().getFullYear()} Illustra. Todos los derechos reservados.</p>
    <p>Contact: <a href="mailto:support@illustra.app">support@illustra.app</a></p>
  </footer>
);

export default Footer;