import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Documentos_c from '../pages/consultor/Documentos_c';

export default function AppIndex() {
  const { user } = useAuth();
  
  if (user?.UsuTip === 'consultor') {
    return <Documentos_c />;
  }

  return <Navigate to="dashboard" replace />;
}
