import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useState } from "react";
import "./Sidebar.css";

export default function BibliotecarioSidebar() {
  const { pathname } = useLocation();
  const { user } = useAuth();
  const [openConfig, setOpenConfig] = useState(false);

  const menu = [
    { label: "Dashboard", path: "/bibliotecario", icon: "🏠" },
    { label: "Préstamos", path: "/bibliotecario/prestamos", icon: "📚" },
    { label: "Documentos", path: "/bibliotecario/documentos", icon: "📑" },
    { label: "Lectores", path: "/bibliotecario/lectores", icon: "👥" },
    { label: "Reportes", path: "/bibliotecario/reportes", icon: "📊" },
    { label: "Usuarios", path: "/bibliotecario/usuarios", icon: "👥" },
    {
      label: "Configuración",
      icon: "⚙️",
      children: [
        { label: "Categorías", path: "/bibliotecario/configuracion/categorias" },
      ],
    },
  ];

  return (
    <div className="sidebar">
      <div className="user-box">
        <div className="avatar">BL</div>
        <p className="username">{user?.email}</p>
        <p className="role">Bibliotecario</p>
      </div>

      <nav className="menu">
        {menu.map((item) =>
          item.children ? (
            <div key={item.label} className="submenu">
              <div
                className="submenu-title"
                onClick={() => setOpenConfig(!openConfig)}
              >
                <span className="icon">{item.icon}</span>
                {item.label}
                <span className={`arrow ${openConfig ? "open" : ""}`}>▾</span>
              </div>

              {openConfig && (
                <div className="submenu-items">
                  {item.children.map((sub) => (
                    <Link
                      key={sub.path}
                      to={sub.path}
                      className={
                        pathname === sub.path ? "active sub-item" : "sub-item"
                      }
                    >
                      {sub.label}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <Link
              key={item.path}
              to={item.path}
              className={pathname === item.path ? "active" : ""}
            >
              <span className="icon">{item.icon}</span>
              {item.label}
            </Link>
          )
        )}
      </nav>
    </div>
  );
}

