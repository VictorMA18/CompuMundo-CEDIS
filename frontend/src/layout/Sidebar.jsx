import { useAuth } from "../context/AuthContext";
import AdminSidebar from "./AdminSidebar";
import BibliotecarioSidebar from "./BibliotecarioSidebar";

export default function Sidebar() {
  const { user } = useAuth();

  console.log("Sidebar user:", user);

  if (!user) {
    return (
      <aside style={{ width: 260, background: "#a80000", color: "white", padding: 20 }}>
        Cargando sesión...
      </aside>
    );
  }

  switch (user.role) {
    case "admin":
      return <AdminSidebar />;

    case "bibliotecario":
      return <BibliotecarioSidebar />;

    default:
      return (
        <aside style={{ width: 260, padding: 20 }}>
          <p style={{ color: "black" }}>
            Rol no autorizado: <b>{user.role}</b>
          </p>
        </aside>
      );
  }
}

