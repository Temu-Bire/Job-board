import { createContext, useContext, useState, useEffect } from 'react';
import { withResolvedMediaUser } from '../utils/mediaUrl';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        setUser(withResolvedMediaUser(JSON.parse(storedUser)));
      } catch {
        setUser(null);
      }
    }
    setLoading(false);
  }, []);

  const login = (userData) => {
    const hydrated = withResolvedMediaUser(userData);
    setUser(hydrated);
    localStorage.setItem('user', JSON.stringify(hydrated));
    localStorage.setItem('token', userData.token);
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
    localStorage.removeItem('token');
  };

  const updateUser = (userData) => {
    const updatedUser = withResolvedMediaUser({ ...user, ...userData });
    setUser(updatedUser);
    localStorage.setItem('user', JSON.stringify(updatedUser));
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, updateUser, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
