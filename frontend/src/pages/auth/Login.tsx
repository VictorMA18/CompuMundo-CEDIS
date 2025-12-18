import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useAuthLogin } from '../../hooks/useAuthLogin';
import logo from '../../assets/logo-escuela.png';
import './Login.css';

type LoginForm = {
  username: string;
  password: string;
};

export default function Login() {
  const navigate = useNavigate();
  const { saveSession } = useAuth();
  const { handleLogin, loading, error: loginBackendError } = useAuthLogin();
  const [showPassword, setShowPassword] = useState(false);

  const [form, setForm] = useState<LoginForm>({ username: '', password: '' });
  // El error ahora maneja tanto la validación de campos vacíos como los errores del backend
  const [error, setError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    if (error) setError('');
  };

  const validateForm = (): boolean => {
    if (!form.username.trim()) {
      setError('El correo electrónico es obligatorio.');
      return false;
    }
    if (!form.password.trim()) {
      setError('La contraseña es obligatoria.');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // 2. Ejecutar la validación de frontend primero
    if (!validateForm()) {
      return;
    }

    // Si la validación pasa, intentamos el login
    const result = await handleLogin(form.username, form.password);

    if (result.success) {
      if ('token' in result && 'user' in result) {
        saveSession(result.token, result.user);
        navigate('/app');
        return;
      }

      setError('Respuesta de inicio de sesión inválida');
      return;
    }
    setError(loginBackendError || 'Error al iniciar sesión');
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <div className="logo-placeholder">
            <img src={logo} alt="Logo Escuela" className="login-logo" />
          </div>
          <h2>Centro de Documentación</h2>
          <p>Ingeniería de Sistemas</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <span className="icon">👤</span>
            <input
              type="email"
              name="username"
              placeholder="Correo electrónico"
              value={form.username}
              onChange={handleChange}
              disabled={loading}
              autoComplete="email"
            />
          </div>
          <div className="input-group">
            <span className="icon">🔒</span>
            <input
              type={showPassword ? 'text' : 'password'} // 2. Tipo dinámico
              name="password"
              placeholder="Contraseña"
              value={form.password}
              onChange={handleChange}
              disabled={loading}
              autoComplete="current-password"
            />
            {/* 3. Botón del ojo */}
            <button
              type="button"
              className="password-toggle"
              onClick={() => setShowPassword(!showPassword)}
              tabIndex={-1} 
            >
              {showPassword ? '👁️‍🗨️' : '👁️'}
            </button>
          </div>
          

          {/* Este elemento mostrará tanto los errores de campo vacío como los errores de login, con el mismo estilo. */}
          {error && <p className="login-error">{error}</p>}

          <button type="submit" className="btn primary" disabled={loading}>
            {loading ? 'Iniciando sesión...' : 'Iniciar sesión'}
          </button>
        </form>
      </div>
    </div>
  );
}
