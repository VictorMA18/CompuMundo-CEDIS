import { createContext, useState, useContext } from "react";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);

  const login = async ({ email, password }) => {
    // Simulación de login (luego lo conectamos a API)
    if (email === "admin@gmail.com" && password === "123456") {
      const userData = { email, role: "admin" };
      setUser(userData);
      return { success: true };
    }
    return { success: false, message: "Credenciales incorrectas" };
  };

  const logout = () => setUser(null);

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

