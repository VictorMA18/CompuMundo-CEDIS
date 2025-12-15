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
  const { handleLogin, loading, error: loginError } = useAuthLogin();

  const [form, setForm] = useState<LoginForm>({ username: '', password: '' });
  const [error, setError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

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

    setError(loginError || 'Error al iniciar sesión');
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
              required
              disabled={loading}
              autoComplete="email"
            />
          </div>

          <div className="input-group">
            <span className="icon">🔒</span>
            <input
              type="password"
              name="password"
              placeholder="Contraseña"
              value={form.password}
              onChange={handleChange}
              required
              disabled={loading}
              autoComplete="current-password"
            />
          </div>

          {error && <p className="login-error">{error}</p>}

          <button type="submit" className="btn primary" disabled={loading}>
            {loading ? 'Iniciando sesión...' : 'Iniciar sesión'}
          </button>
        </form>
      </div>
    </div>
  );
}
