import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import "./Login.css";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({ username: "", password: "" });
  const [error, setError] = useState("");

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();

    const { success, user, message } = await login(form);

    if (success) {
      if (user.role === "admin") navigate("/admin");
      if (user.role === "bibliotecario") navigate("/bibliotecario");
    } else {
      setError(message);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">

        {/* LOGO */}
        <div className="login-header">
          <div className="logo-placeholder">
            {/* AQUÍ VA TU IMAGEN */}
          </div>
          <h2>Centro de Documentación</h2>
          <p>Ingeniería de Sistemas</p>
        </div>

        <form onSubmit={handleSubmit}>
          {/* USUARIO */}
          <div className="input-group">
            <span className="icon">👤</span>
            <input
              type="text"
              name="username"
              placeholder="Nombre de usuario"
              value={form.username}
              onChange={handleChange}
              required
            />
          </div>

          {/* CONTRASEÑA */}
          <div className="input-group">
            <span className="icon">🔒</span>
            <input
              type="password"
              name="password"
              placeholder="Contraseña"
              value={form.password}
              onChange={handleChange}
              required
            />
          </div>

          {error && <p className="login-error">{error}</p>}

          <button type="submit" className="btn primary">
            Iniciar sesión
          </button>

          <button
            type="button"
            className="btn secondary"
            onClick={() => navigate("/catalogo")}
          >
            Ver catálogo
          </button>
        </form>
      </div>
    </div>
  );
}

