import { Link, useLocation } from "react-router-dom";
import { useAuth } from  "../context/AuthContext"; 
import "./Sidebar.css";

export default function AdminSidebar() {
  const { pathname } = useLocation();
  const { user } = useAuth(); // Obtenemos el rol del usuario

  const menu = [
    { label: "Dashboard", path: "/admin", icon: "🏠" },
    { label: "Préstamos", path: "/admin/prestamos", icon: "📚" },
    { label: "Bibliografías", path: "/admin/bibliografias", icon: "📖" },
    { label: "Lectores", path: "/admin/lectores", icon: "👥" },
    { label: "Reportes", path: "/admin/reportes", icon: "📊" },
  ];

  return (
    <div className="sidebar">
      <div className="user-box">
        <div className="avatar">JG</div>
        <p className="username">{user?.email}</p>
        <p className="role">Administrador</p>
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

      <button className="logout">⏻ Cerrar sesión</button>
    </div>
  );
}

