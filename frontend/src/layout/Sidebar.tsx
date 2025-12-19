import { useMemo } from 'react';
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

  // Función para calcular las iniciales dinámicamente
  const initials = useMemo(() => {
    if (!user) return '??';

    // 1. Intentar con Nombre y Apellido (si existen en el objeto user)
    // Ajusta UsuNom y UsuApe según las propiedades reales de tu backend
    const nombre = (user as any).UsuNom;
    const apellido = (user as any).UsuApe;

    if (nombre && apellido) {
      return `${nombre[0]}${apellido[0]}`.toUpperCase();
    }

    // 2. Fallback: Usar el Email (ej: juan.perez@dominio.com -> JP)
    if (user.UsuEma) {
      const emailPrefix = user.UsuEma.split('@')[0]; // toma 'juan.perez'
      const parts = emailPrefix.split(/[._-]/); // separa por . _ o -
      
      if (parts.length >= 2) {
        return (parts[0][0] + parts[1][0]).toUpperCase();
      }
      return parts[0][0].substring(0, 2).toUpperCase();
    }

    return 'U';
  }, [user]);

  const menu = useMemo(() => [
    { label: 'Home', path: '/app/home', icon: '🏠', roles: ['administrador']},
    { label: 'Dashboard', path: '/app/dashboard', icon: '📊', roles: ['administrador', 'bibliotecario']},
    { label: 'Préstamos', path: '/app/prestamos', icon: '📚', roles: ['administrador', 'bibliotecario'] },
    { label: 'Lectores', path: '/app/lectores', icon: '👥', roles: ['administrador', 'bibliotecario'] },
    { label: 'Lectores', path: '/app/lectores_c', icon: '👥', roles: ['consultor'] },
    { label: 'Documentos', path: '/app/documentos', icon: '📑', roles: ['administrador', 'bibliotecario']},
    { label: 'Documentos', path: '/app/documentos_c', icon: '📑', roles: ['consultor'] },
    { label: 'Autores', path: '/app/autores', icon: '✍️', roles: ['administrador', 'bibliotecario']},
    { label: 'Autores', path: '/app/autores_c', icon: '✍️', roles: ['consultor'] },
    { label: 'Material físico', path: '/app/material-fisico', icon: '📦', roles: ['administrador', 'bibliotecario'] },
    { label: 'Material virtual', path: '/app/material-virtual', icon: '💾', roles: ['administrador', 'bibliotecario'] },
    { label: 'Usuarios', path: '/app/usuarios', icon: '👤', roles: ['administrador'] },
    { label: 'Usuarios', path: '/app/usuarios_b', icon: '👤', roles: ['bibliotecario', 'consultor'] },
    { label: 'Categorías', path: '/app/configuracion/categorias', icon: '🏷️', roles: ['administrador', 'bibliotecario'] },
    { label: 'Categorías', path: '/app/configuracion/categorias_c', icon: '🏷️', roles: ['consultor'] },
    { label: 'Reportes', path: '/app/reportes', icon: '📑', roles: ['administrador', 'bibliotecario'] },
  ], []);

  const filteredMenu = useMemo(() => {
    return menu.filter(item => {
      if (!item.roles) return true;
      return item.roles.includes(user?.UsuTip || '');
    });
  }, [menu, user]);

  return (
    <div className="sidebar">
      <div className="user-box">
        {/* Aquí se muestran las iniciales dinámicas */}
        <div className="avatar">
          {initials}
        </div>
        <div className="user-info">
          <p className="username" title={user?.UsuEma}>{user?.UsuEma || ''}</p>
          <p className="role">{user?.UsuTip || ''}</p>
        </div>
      </div>

      <nav className="menu">
        {filteredMenu.map((item) => (
          <Link 
            key={item.path} 
            to={item.path} 
            className={pathname === item.path ? 'active' : ''}
          >
            <span className="icon">{item.icon}</span>
            <span className="label-text">{item.label}</span>
          </Link>
        ))}
      </nav>
      <button className="logout-btn" onClick={handleLogout}>
        <span className="icon">⏻</span> Cerrar sesión
      </button>
    </div>
  );
}
