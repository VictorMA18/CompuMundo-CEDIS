import { Routes, Route, Navigate } from "react-router-dom";
import Login from "../pages/Login";
import PrivateRoute from "./PrivateRoute";

import AdminLayout from "../layout/AdminLayout";
import Prestamos from "../pages/Prestamos";
import Lectores from "../pages/Lectores";

export default function AppRouter() {
  return (
    <Routes>
      {/* Login fuera de AdminLayout */}
      <Route path="/login" element={<Login />} />

      <Route
        path="/admin/*" 
        element={
          <PrivateRoute>
            <AdminLayout />
          </PrivateRoute>
        }
      >
        <Route index element={<Prestamos />} /> {/* o Dashboard */}
        <Route path="prestamos" element={<Prestamos />} />
        <Route path="lectores" element={<Lectores />} />
      </Route>

      <Route path="*" element={<Navigate to="/login" />} />
    </Routes>
  );
}

