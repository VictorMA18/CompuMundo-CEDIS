import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import Login from '../pages/auth/Login';
import PrivateRoute from './PrivateRoute';
import RoleGuard from '../components/RoleGuard'; 
import AppIndex from './AppIndex';

import AdminLayout from '../layout/AdminLayout';
import Prestamos from '../pages/admin/Prestamos';
import Lectores from '../pages/admin/Lectores';
import Lectores_c from '../pages/consultor/Lectores_c';
import Documentos from '../pages/admin/Documentos';
import Documentos_c from '../pages/consultor/Documentos_c';
import Usuarios from '../pages/admin/Usuarios';
import Usuarios_b from '../pages/biblio/Usuarios_b';
import Categorias from '../pages/admin/Categorias';
import Categorias_c from '../pages/consultor/Categorias_c';
import Home from '../pages/admin/Home';
import Autores from '../pages/admin/Autores';
import Autores_c from '../pages/consultor/Autores_c';
import MaterialFisico from '../pages/admin/MaterialFisico';
import MaterialVirtual from '../pages/admin/MaterialVirtual';
import Reportes from '../pages/admin/Reportes';
import Dashboard from '../pages/admin/Dashboard';

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
        <Route index element={<AppIndex />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="documentos_c" element={<Documentos_c />} />
        <Route path="material-virtual" element={<MaterialVirtual />} />

        <Route path="documentos" element={
          <RoleGuard allowedRoles={['administrador', 'bibliotecario']}>
            <Documentos />
          </RoleGuard>
        } />
        <Route path="autores" element={
          <RoleGuard allowedRoles={['administrador', 'bibliotecario']}>
            <Autores />
          </RoleGuard>
        } />
        <Route path="autores_c" element={
          <RoleGuard allowedRoles={['consultor']}>
            <Autores_c />
          </RoleGuard>
        } />
        <Route path="prestamos" element={
          <RoleGuard allowedRoles={['administrador', 'bibliotecario']}>
            <Prestamos />
          </RoleGuard>
        } />
        <Route path="lectores" element={
          <RoleGuard allowedRoles={['administrador', 'bibliotecario']}>
            <Lectores />
          </RoleGuard>
        } />
        <Route path="lectores_c" element={
          <RoleGuard allowedRoles={['consultor']}>
            <Lectores_c />
          </RoleGuard>
        } />
        <Route path="material-fisico" element={
          <RoleGuard allowedRoles={['administrador', 'bibliotecario']}>
            <MaterialFisico />
          </RoleGuard>
        } />
        <Route path="usuarios" element={
          <RoleGuard allowedRoles={['administrador']}>
            <Usuarios />
          </RoleGuard>
        } />

        <Route path="configuracion/categorias" element={
          <RoleGuard allowedRoles={['administrador', 'bibliotecario']}>
            <Categorias />
          </RoleGuard>
        } />
        <Route path="configuracion/categorias_c" element={
          <RoleGuard allowedRoles={['consultor']}>
            <Categorias_c />
          </RoleGuard>
        } />
        <Route path="reportes" element={
          <RoleGuard allowedRoles={['administrador', 'bibliotecario']}>
            <Reportes />
          </RoleGuard>
        } />
        <Route path="usuarios_b" element={
          <RoleGuard allowedRoles={['bibliotecario', 'consultor']}>
            <Usuarios_b />
          </RoleGuard>
        } />
      </Route>

      {/* Legacy paths */}
      <Route path="/admin/*" element={<LegacyRedirect fromBase="/admin" />} />
      <Route path="/bibliotecario/*" element={<LegacyRedirect fromBase="/bibliotecario" />} />

      <Route path="*" element={<Navigate to="/login" />} />
    </Routes>
  );
}
