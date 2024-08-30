import React from 'react';
import { Home, Search, Bell, Mail, User } from 'lucide-react';

const LeftSidebar = () => {
  return (
    <div className="sidebar-left">
      <nav>
        <ul>
          <li><Home size={24} /> Inicio</li>
          <li><Search size={24} /> Explorar</li>
          <li><Bell size={24} /> Notificaciones</li>
          <li><Mail size={24} /> Mensajes</li>
          <li><User size={24} /> Perfil</li>
        </ul>
      </nav>
    </div>
  );
};

export default LeftSidebar;