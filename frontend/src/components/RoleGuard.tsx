import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface Props {
  children: JSX.Element;
  allowedRoles: string[];
}

export default function RoleGuard({ children, allowedRoles }: Props) {
  const { user } = useAuth();
  if (!user || !allowedRoles.includes(user.UsuTip)) {
    return <Navigate replace to="/app" />;
  }

  return children;
}
