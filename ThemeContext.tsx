import React, { createContext, useContext, useState, useEffect } from 'react';

export type Theme = 'dark' | 'light' | 'cosmic';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

const THEME_CONFIG = {
  dark: {
    backgroundImage: "url('https://i.pinimg.com/736x/c3/28/e8/c328e8cd93acc362efd2f7a1d9f2b1f3.jpg')",
    textColor: 'text-white',
    bodyClass: 'text-white'
  },
  light: {
    backgroundImage: "url('https://i.pinimg.com/736x/44/0e/87/440e87c0de9f24af9a1ada420eda0f80.jpg')",
    textColor: 'text-black',
    bodyClass: 'text-black'
  },
  cosmic: {
    backgroundImage: "url('https://i.pinimg.com/736x/8b/5c/4f/8b5c4f2e3d1a9b7c6e8f0a2b4d6e8f0a.jpg')",
    textColor: 'text-purple-100',
    bodyClass: 'text-purple-100'
  }
};

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<Theme>('dark');

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as Theme;
    if (savedTheme && THEME_CONFIG[savedTheme]) {
      setThemeState(savedTheme);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('theme', theme);
    
    const body = document.body;
    const config = THEME_CONFIG[theme];
    
    body.style.backgroundImage = config.backgroundImage;
    body.style.backgroundSize = 'cover';
    body.style.backgroundPosition = 'center';
    body.style.backgroundRepeat = 'no-repeat';
    body.style.backgroundAttachment = 'fixed';
    body.className = config.bodyClass;
  }, [theme]);

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};