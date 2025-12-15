import { createContext, useContext, useState } from "react";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);

  const login = async ({ username, password }) => {
    // ADMINISTRADOR
    if (username === "admin" && password === "21") {
      const userData = {
        username,
        role: "admin",
      };
      setUser(userData);
      return { success: true, user: userData };
    }

    // BIBLIOTECARIO
    if (username === "bibliotecario" && password === "21") {
      const userData = {
        username,
        role: "bibliotecario",
      };
      setUser(userData);
      return { success: true, user: userData };
    }

    // ERROR
    return {
      success: false,
      message: "Usuario o contraseña incorrectos",
    };
  };

  const logout = () => {
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

