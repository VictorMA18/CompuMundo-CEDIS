import Sidebar from "./Sidebar";
import "./AdminLayout.css";

export default function AdminLayout({ title, children }) {
  return (
    <div className="admin-layout">
      <Sidebar />

      <main className="content">
        <header className="header">
          <h2>Centro de Documentaci√≥n de Ingenier√≠a de Sistemas</h2>
        </header>

        <div className="page-title">
          <h1>{title}</h1>
        </div>

        <div className="page-content">{children}</div>
      </main>
    </div>
  );
}

