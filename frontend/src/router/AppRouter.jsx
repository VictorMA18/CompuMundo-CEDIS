import { Routes, Route, Navigate } from "react-router-dom";
import Login from "../pages/Login";
import PrivateRoute from "./PrivateRoute";

import AdminLayout from "../layout/AdminLayout";
import Prestamos from "../pages/Prestamos";
import Lectores from "../pages/Lectores";

export default function AppRouter() {
  return (
    <Routes>

      {/* Ruta inicial */}
      <Route path="/" element={<Navigate to="/login" />} />

      {/* Login */}
      <Route path="/login" element={<Login />} />

      {/* ADMIN */}
      <Route
        path="/admin/*"
        element={
          <PrivateRoute>
            <AdminLayout />
          </PrivateRoute>
        }
      >
        <Route index element={<Prestamos />} />
        <Route path="prestamos" element={<Prestamos />} />
        <Route path="lectores" element={<Lectores />} />
      </Route>

      {/* BIBLIOTECARIO */}
      <Route
        path="/bibliotecario/*"
        element={
          <PrivateRoute>
            <AdminLayout />
          </PrivateRoute>
        }
      >
        <Route index element={<Prestamos />} />
        <Route path="prestamos" element={<Prestamos />} />
        <Route path="lectores" element={<Lectores />} />
      </Route>

      <Route path="*" element={<Navigate to="/login" />} />
    </Routes>
  );
}

