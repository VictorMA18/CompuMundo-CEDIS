import { Link, useLocation } from "react-router-dom";
import { useAuth } from  "../context/AuthContext";
import "./Sidebar.css";

export default function BibliotecarioSidebar() {
  const { pathname } = useLocation();
  const { user } = useAuth(); // Obtenemos el rol del usuario

  const menu = [
    { label: "Dashboard", path: "/bibliotecario", icon: "🏠" },
    { label: "Préstamos", path: "/bibliotecario/prestamos", icon: "📚" },
    { label: "Documentos", path: "/bibliotecario/documentos", icon: "📑" },
    { label: "Lectores", path: "/bibliotecario/lectores", icon: "👥" },
    { label: "Reportes", path: "/bibliotecario/reportes", icon: "📊" },
    { label: "Usuarios", path: "/bibliotecario/usuarios", icon: "👤" },
    { label: "Configuración", path: "/bibliotecario/configuracion", icon: "⚙️" },
  ];

  return (
    <div className="sidebar">
      <div className="user-box">
        <div className="avatar">BL</div>
        <p className="username">{user?.email}</p>
        <p className="role">Bibliotecario</p>
      </div>

      <nav className="menu">
        {menu.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={pathname === item.path ? "active" : ""}
          >
            <span className="icon">{item.icon}</span>
            {item.label}
          </Link>
        ))}
      </nav>
    </div>
  );
}

