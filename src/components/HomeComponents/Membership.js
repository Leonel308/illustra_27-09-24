// Membership.js

import React, { forwardRef } from 'react';
import '../HomeComponents/Membership.css';

const Membership = forwardRef(({ onClose }, ref) => {
  return (
    <div className="membership-modal-overlay" onClick={onClose}>
      <div
        className="membership-modal-content"
        onClick={(e) => e.stopPropagation()}
        ref={ref}
      >
        <button className="membership-close-button" onClick={onClose}>
          &times;
        </button>
        <h2>Membresía</h2>
        <p>Próximamente</p>
        
        <div className="membership-benefits">
          <h3>Beneficios Exclusivos para Miembros</h3>
          <ul>
            <li>
              <strong>Sistema de Dibujo:</strong> Herramientas avanzadas para crear ilustraciones detalladas y profesionales.
            </li>
            <li>
              <strong>Historia de Undo/Redo:</strong> Revertir o rehacer acciones para facilitar el proceso creativo.
            </li>
            <li>
              <strong>Biblioteca de Activos:</strong> Acceso a una amplia colección de recursos como pinceles, texturas y patrones exclusivos.
            </li>
            <li>
              <strong>Herramienta de Vectorización:</strong> Crear y editar gráficos vectoriales con precisión y flexibilidad.
            </li>
            <li>
              <strong>Sistema de Exportación para Mejor Calidad:</strong> Exportar tus proyectos en formatos de alta resolución y múltiples formatos.
            </li>
          </ul>
        </div>
        
        <button className="membership-cta-button" onClick={() => alert('Proceso de suscripción en desarrollo.')}>
          ¡Únete Ahora!
        </button>
      </div>
    </div>
  );
});

export default Membership;
