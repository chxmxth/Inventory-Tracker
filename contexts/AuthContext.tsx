import AsyncStorage from '@react-native-async-storage/async-storage';
import createContextHook from '@nkzw/create-context-hook';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { router } from 'expo-router';

const AUTH_KEY = '@inventory_auth';

interface User {
  username: string;
  password: string;
}

export const [AuthProvider, useAuth] = createContextHook(() => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadAuth = async () => {
      try {
        const stored = await AsyncStorage.getItem(AUTH_KEY);
        if (stored) {
          setUser(JSON.parse(stored));
        }
      } catch (error) {
        console.error('Error loading auth:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadAuth();
  }, []);

  const login = useCallback(async (username: string, password: string) => {
    if (username === 'admin' && password === 'admin123') {
      const userData = { username, password };
      await AsyncStorage.setItem(AUTH_KEY, JSON.stringify(userData));
      setUser(userData);
      return true;
    }
    return false;
  }, []);

  const logout = useCallback(async () => {
    await AsyncStorage.removeItem(AUTH_KEY);
    setUser(null);
    router.replace('/login');
  }, []);

  const changePassword = useCallback(async (currentPassword: string, newPassword: string) => {
    if (!user) return false;
    if (user.password !== currentPassword) return false;
    
    const updatedUser = { ...user, password: newPassword };
    await AsyncStorage.setItem(AUTH_KEY, JSON.stringify(updatedUser));
    setUser(updatedUser);
    return true;
  }, [user]);

  const changeUsername = useCallback(async (newUsername: string) => {
    if (!user) return false;
    
    const updatedUser = { ...user, username: newUsername };
    await AsyncStorage.setItem(AUTH_KEY, JSON.stringify(updatedUser));
    setUser(updatedUser);
    return true;
  }, [user]);

  return useMemo(() => ({
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    logout,
    changePassword,
    changeUsername,
  }), [user, isLoading, login, logout, changePassword, changeUsername]);
});
