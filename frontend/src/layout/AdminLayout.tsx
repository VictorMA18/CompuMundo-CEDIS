import { Outlet } from 'react-router-dom';
import { useState } from 'react';
import Sidebar from './Sidebar';
import logo from '../assets/logo-escuela.png';
import './AdminLayout.css';

export default function AdminLayout() {
  const [title, setTitle] = useState('');

  return (
    <div className="admin-root">
      <header className="top-header">
        <img src={logo} alt="Logo" className="top-logo" />
        <div className="header-text">
          <h2>Centro de Documentación</h2>
          <p>Ingeniería de Sistemas</p>
        </div>
      </header>

      <div className="admin-layout">
        <Sidebar />

        <main className="content">
          {title && (
            <div className="page-title-bar">
              <h1>{title}</h1>
            </div>
          )}

          <div className="page-content">
            <Outlet context={setTitle} />
          </div>
        </main>
      </div>
    </div>
  );
}
