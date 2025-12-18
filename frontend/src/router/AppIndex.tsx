import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Home from '../pages/admin/Home';

export default function AppIndex() {
  const { user } = useAuth();
  
  if (user?.UsuTip === 'administrador') {
    return <Home />;
  }

  // Bibliotecarios y Consultores van al Dashboard
  return <Navigate to="dashboard" replace />;
}
