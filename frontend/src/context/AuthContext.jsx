import { createContext, useContext, useState } from "react";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);

  const login = async ({ email, password }) => {
    if (email === "admin@unsa.edu.pe" && password === "21") {
      const userData = { email, role: "admin" };
      setUser(userData);
      return { success: true, user: userData };
    }

    if (email === "biblio@unsa.edu.pe" && password === "21") {
      const userData = { email, role: "bibliotecario" };
      setUser(userData);
      return { success: true, user: userData };
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

