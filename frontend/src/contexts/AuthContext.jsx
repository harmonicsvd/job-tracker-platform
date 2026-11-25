
import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef
} from 'react';

import { jobsApi } from '../api/jobs';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const authRequest = useRef(0);

  // Check whether a previously authenticated session exists
  useEffect(() => {
    const requestId = ++authRequest.current;
    const token = localStorage.getItem('token');

    if (!token) {
      setLoading(false);
      return;
    }

    const restoreSession = async () => {
      try {
        const userData = await jobsApi.getMe();

        if (requestId === authRequest.current) {
          setUser(userData);
        }
      } catch (error) {
        if (requestId === authRequest.current) {
          localStorage.removeItem('token');
          setUser(null);
        }
      } finally {
        if (requestId === authRequest.current) {
          setLoading(false);
        }
      }
    };

    restoreSession();

    return () => {
      authRequest.current++;
    };
  }, []);

  // Authenticate a newly logged-in user
  const login = useCallback(async (token) => {
    const requestId = ++authRequest.current;

    setLoading(true);
    setUser(null);
    localStorage.setItem('token', token);

    try {
      const userData = await jobsApi.getMe();

      if (requestId === authRequest.current) {
        setUser(userData);
      }

      return userData;
    } catch (error) {
      if (requestId === authRequest.current) {
        localStorage.removeItem('token');
        setUser(null);
      }

      throw error;
    } finally {
      if (requestId === authRequest.current) {
        setLoading(false);
      }
    }
  }, []);

  const logout = useCallback(() => {
    authRequest.current++;
    localStorage.removeItem('token');
    setUser(null);
    setLoading(false);
  }, []);

  return (
    <AuthContext.Provider
      value={{ user, loading, login, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
