import { Routes, Route } from "react-router-dom";
import Login from "../pages/Login";
import PrivateRoute from "./PrivateRoute";

import AdminLayout from "../layout/AdminLayout";
import Prestamos from "../pages/Prestamos";
import Lectores from "../pages/Lectores";

export default function AppRouter() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      <Route
        path="/admin"
        element={
          <PrivateRoute>
            <AdminLayout />
          </PrivateRoute>
        }
      >
        <Route path="prestamos" element={<Prestamos />} />
        <Route path="lectores" element={<Lectores />} />
      </Route>
    </Routes>
  );
}

