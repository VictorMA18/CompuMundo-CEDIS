import Sidebar from "./Sidebar";
import "./AdminLayout.css";
import { Outlet } from "react-router-dom";
import { useState } from "react";

export default function AdminLayout() {
  const [title, setTitle] = useState("");

  return (
    <div className="admin-layout">
      <Sidebar />

      <main className="content">
        <header className="header">
          <h2>Centro de Documentación de Ingeniería de Sistemas</h2>
        </header>

        {title && (
          <div className="page-title">
            <h1>{title}</h1>
          </div>
        )}

        <div className="page-content">
          {/* Aquí se envía setTitle a las páginas */}
          <Outlet context={setTitle} />
        </div>
      </main>
    </div>
  );
}

