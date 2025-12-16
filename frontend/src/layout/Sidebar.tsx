import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Sidebar.css';

export default function Sidebar() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const menu = [
    { label: 'Home', path: '/app', icon: '🏠' },
    { label: 'Préstamos', path: '/app/prestamos', icon: '📚' },
    { label: 'Lectores', path: '/app/lectores', icon: '👥' },
    { label: 'Documentos', path: '/app/documentos', icon: '📑' },
    { label: 'Autores', path: '/app/autores', icon: '✍️' },
    { label: 'Material físico', path: '/app/material-fisico', icon: '📦' },
    { label: 'Material virtual', path: '/app/material-virtual', icon: '💾' },
    { label: 'Usuarios', path: '/app/usuarios', icon: '👤' },
    { label: 'Categorías', path: '/app/configuracion/categorias', icon: '🏷️' },
    { label: 'Reportes', path: '/app/reportes', icon: '📑' },
    { label: 'Dashboard', path: '/app/dashboard', icon: '📦' },
  ];

  return (
    <div className="sidebar">
      <div className="user-box">
        <div className="avatar">US</div>
        <div className="user-info">
          <p className="username">{user?.UsuEma || ''}</p>
          <p className="role">{user?.UsuTip || ''}</p>
        </div>
      </div>

      <nav className="menu">
        {menu.map((item) => (
          <Link key={item.path} to={item.path} className={pathname === item.path ? 'active' : ''}>
            <span className="icon">{item.icon}</span>
            {item.label}
          </Link>
        ))}
      </nav>

      <button className="logout-btn" onClick={handleLogout}>
        ⏻ Cerrar sesión
      </button>
    </div>
  );
}
