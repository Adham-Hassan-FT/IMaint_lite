import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

// Define the User type
interface User {
  id: number;
  username: string;
  fullName: string;
  email: string;
  role: string;
}

// Define what our authentication context will contain
interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: User | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

// Create the context with a default value
const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  isLoading: true,
  user: null,
  login: async () => {},
  logout: async () => {},
});

// Hook to use the auth context
export const useAuth = () => useContext(AuthContext);

// AuthProvider component to wrap app and provide authentication state
interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);

  // Check authentication status on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Check if user data exists in AsyncStorage (mobile)
        const userData = await AsyncStorage.getItem('user');
        
        if (userData) {
          // If we have user data stored, set it and authenticate the user
          setUser(JSON.parse(userData));
          setIsAuthenticated(true);
          
          // Configure axios to include credentials
          axios.defaults.withCredentials = true;
        } else {
          // Try to get user from session if in browser
          try {
            const response = await axios.get('/api/auth/me');
            if (response.data) {
              setUser(response.data);
              setIsAuthenticated(true);
              // Store user data in AsyncStorage for mobile
              await AsyncStorage.setItem('user', JSON.stringify(response.data));
            }
          } catch (error) {
            // Not authenticated
            setIsAuthenticated(false);
            setUser(null);
          }
        }
      } catch (error) {
        console.error('Error checking authentication:', error);
        setIsAuthenticated(false);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  // Login function
  const login = async (username: string, password: string) => {
    try {
      setIsLoading(true);
      const response = await axios.post('/api/auth/login', { username, password });
      const userData = response.data;
      
      setUser(userData);
      setIsAuthenticated(true);
      
      // Store user data in AsyncStorage for mobile
      await AsyncStorage.setItem('user', JSON.stringify(userData));
      
      return userData;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Logout function
  const logout = async () => {
    try {
      setIsLoading(true);
      // Call logout API endpoint
      await axios.post('/api/auth/logout');
      
      // Remove user data from AsyncStorage
      await AsyncStorage.removeItem('user');
      
      setUser(null);
      setIsAuthenticated(false);
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Value object to provide to consumers
  const authContextValue: AuthContextType = {
    isAuthenticated,
    isLoading,
    user,
    login,
    logout,
  };

  return (
    <AuthContext.Provider value={authContextValue}>
      {children}
    </AuthContext.Provider>
  );
};