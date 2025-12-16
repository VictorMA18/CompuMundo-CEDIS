import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import Login from '../pages/auth/Login';
import PrivateRoute from './PrivateRoute';

import AdminLayout from '../layout/AdminLayout';
import Prestamos from '../pages/admin/Prestamos';
import Lectores from '../pages/admin/Lectores';
import Documentos from '../pages/admin/Documentos';
import Usuarios from '../pages/admin/Usuarios';
import Categorias from '../pages/admin/Categorias';
import Home from '../pages/admin/Home';
import Autores from '../pages/admin/Autores';
import MaterialFisico from '../pages/admin/MaterialFisico';
import MaterialVirtual from '../pages/admin/MaterialVirtual';
import Reportes from '../pages/admin/Reportes';

function LegacyRedirect({ fromBase }: { fromBase: string }) {
  const { pathname } = useLocation();
  const rest = pathname.startsWith(fromBase) ? pathname.slice(fromBase.length) : '';
  return <Navigate to={`/app${rest || ''}`} replace />;
}

export default function AppRouter() {
  return (
    <Routes>
      {/* Ruta inicial */}
      <Route path="/" element={<Navigate to="/login" />} />

      {/* Login */}
      <Route path="/login" element={<Login />} />

      {/* APP (ruta única autenticada) */}
      <Route
        path="/app/*"
        element={
          <PrivateRoute>
            <AdminLayout />
          </PrivateRoute>
        }
      >
        <Route index element={<Home />} />
        <Route path="prestamos" element={<Prestamos />} />
        <Route path="lectores" element={<Lectores />} />
        <Route path="documentos" element={<Documentos />} />
        <Route path="usuarios" element={<Usuarios />} />
        <Route path="configuracion/categorias" element={<Categorias />} />
        <Route path="autores" element={<Autores />} />
        <Route path="material-fisico" element={<MaterialFisico />} />
        <Route path="material-virtual" element={<MaterialVirtual />} />
        <Route path="reportes" element={<Reportes />} />
      </Route>

      {/* Legacy paths (antes separados por rol) */}
      <Route path="/admin/*" element={<LegacyRedirect fromBase="/admin" />} />
      <Route path="/bibliotecario/*" element={<LegacyRedirect fromBase="/bibliotecario" />} />

      <Route path="*" element={<Navigate to="/login" />} />
    </Routes>
  );
}
