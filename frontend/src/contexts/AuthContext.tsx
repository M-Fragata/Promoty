import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { getUserFromToken, setToken, removeToken, type UserPayload } from '../utils/auth';

interface AuthContextType {
  user: UserPayload | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (token: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<UserPayload | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Verificar token ao carregar
  useEffect(() => {
    const currentUser = getUserFromToken();
    setUser(currentUser);
    setIsLoading(false);
  }, []);

  const login = (token: string) => {
    setToken(token);
    const newUser = getUserFromToken();
    setUser(newUser);
  };

  const logout = () => {
    removeToken();
    setUser(null);
  };

  const isAuthenticated = user !== null;

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
}
