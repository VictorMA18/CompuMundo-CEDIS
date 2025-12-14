import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "./Sidebar.css";

export default function AdminSidebar() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const menu = [
    { label: "Dashboard", path: "/admin", icon: "🏠" },
    { label: "Préstamos", path: "/admin/prestamos", icon: "📚" },
    { label: "Bibliografías", path: "/admin/bibliografias", icon: "📖" },
    { label: "Lectores", path: "/admin/lectores", icon: "👥" },
    { label: "Reportes", path: "/admin/reportes", icon: "📊" },
  ];

  return (
    <div className="sidebar">
      {/* USUARIO */}
      <div className="user-box">
        <div className="avatar">AD</div>
        <p className="username">{user?.email}</p>
        <p className="role">Administrador</p>
      </div>

      {/* MENÚ */}
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

      {/* LOGOUT */}
      <button className="logout-btn" onClick={handleLogout}>
        ⏻ Cerrar sesión
      </button>
    </div>
  );
}

