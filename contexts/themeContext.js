import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ThemeContext = createContext();

export const themes = {
  light: {
    background: '#ffffff',
    cardBackground: '#f5f5f5',
    text: '#000000',
    textSecondary: '#666666',
    primary: '#ff6b6b',
    border: '#e0e0e0',
    buttonBg: '#6200ee',
    danger: '#dc3545',
    grey: '#808080',
    liked: '#15eb02',
    disliked: '#dc3545',
    tabIconActive: '#ff6b6b',
    tabIconInactive: '#666666',
  },
  dark: {
    background: '#121212',
    cardBackground: '#1e1e1e',
    text: '#ffffff',
    textSecondary: '#aaaaaa',
    primary: '#ff6b6b',
    border: '#333333',
    buttonBg: '#bb86fc',
    danger: '#cf6679',
    grey: '#a0a0a0',
    liked: '#15eb02',
    disliked: '#dc3545',
    tabIconActive: '#ffffff',
    tabIconInactive: '#aaaaaa',
  },
};

export const ThemeProvider = ({ children }) => {
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    loadTheme();
  }, []);

  const loadTheme = async () => {
    try {
      const savedTheme = await AsyncStorage.getItem('theme');
      if (savedTheme !== null) {
        setIsDarkMode(savedTheme === 'dark');
      }
    } catch (error) {
      console.error('Error loading theme:', error);
    }
  };

  const toggleTheme = async () => {
    const newTheme = !isDarkMode;
    setIsDarkMode(newTheme);
    await AsyncStorage.setItem('theme', newTheme ? 'dark' : 'light');
  };

  const theme = isDarkMode ? themes.dark : themes.light;

  return (
    <ThemeContext.Provider value={{ theme, isDarkMode, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);