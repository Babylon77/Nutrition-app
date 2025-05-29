import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, AuthContextType, RegisterData } from '../types';
import { apiService } from '../services/api';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Helper function to transform backend user to frontend user
  const transformUser = (backendUser: any): User => {
    // Parse name into firstName and lastName
    const nameParts = backendUser.name?.split(' ') || ['', ''];
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';
    
    return {
      _id: backendUser.id || backendUser._id,
      email: backendUser.email,
      firstName,
      lastName,
      dateOfBirth: backendUser.dateOfBirth,
      gender: backendUser.gender,
      height: backendUser.height,
      weight: backendUser.weight,
      weightGoal: backendUser.weightGoal,
      weightGoalTimeframe: backendUser.weightGoalTimeframe,
      activityLevel: backendUser.activityLevel,
      healthGoals: backendUser.healthGoals,
      allergies: backendUser.allergies,
      dietaryRestrictions: backendUser.dietaryRestrictions,
      createdAt: backendUser.createdAt,
      updatedAt: backendUser.updatedAt,
    };
  };

  useEffect(() => {
    const initializeAuth = async () => {
      const storedToken = localStorage.getItem('token');
      const storedUser = localStorage.getItem('user');

      if (storedToken && storedUser) {
        try {
          setToken(storedToken);
          setUser(JSON.parse(storedUser));
          
          // Verify token is still valid by fetching profile
          const profile = await apiService.getProfile();
          const transformedUser = transformUser(profile);
          setUser(transformedUser);
          localStorage.setItem('user', JSON.stringify(transformedUser));
        } catch (error) {
          console.error('Token validation failed:', error);
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          setToken(null);
          setUser(null);
        }
      }
      setLoading(false);
    };

    initializeAuth();
  }, []);

  const login = async (email: string, password: string): Promise<void> => {
    try {
      const response = await apiService.login({ email, password });
      const { user: userData, token: userToken } = response;

      const transformedUser = transformUser(userData);
      setUser(transformedUser);
      setToken(userToken);
      localStorage.setItem('token', userToken);
      localStorage.setItem('user', JSON.stringify(transformedUser));
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Login failed');
    }
  };

  const register = async (userData: RegisterData): Promise<void> => {
    try {
      // Transform firstName/lastName to name for backend
      const { firstName, lastName, confirmPassword, ...rest } = userData;
      const backendData = {
        ...rest,
        name: `${firstName} ${lastName}`,
      };
      
      console.log('Registration data being sent:', backendData); // Debug log
      const response = await apiService.register(backendData as any);
      const { user: newUser, token: userToken } = response;

      const transformedUser = transformUser(newUser);
      setUser(transformedUser);
      setToken(userToken);
      localStorage.setItem('token', userToken);
      localStorage.setItem('user', JSON.stringify(transformedUser));
    } catch (error: any) {
      console.error('Registration error:', error.response?.data); // Debug log
      throw new Error(error.response?.data?.message || 'Registration failed');
    }
  };

  const logout = (): void => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  };

  const updateUser = (updatedUser: User): void => {
    setUser(updatedUser);
    localStorage.setItem('user', JSON.stringify(updatedUser));
  };

  const value: AuthContextType = {
    user,
    token,
    login,
    register,
    logout,
    updateUser,
    loading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}; 