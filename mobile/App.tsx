import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { Provider as PaperProvider, DefaultTheme } from 'react-native-paper';
import MainNavigator from './src/navigation/MainNavigator';
import AuthNavigator from './src/navigation/AuthNavigator';
import { AuthProvider, useAuth } from './src/hooks/useAuth';
import { LogBox, Platform } from 'react-native';

// Ignore specific warnings that might be irrelevant
LogBox.ignoreLogs([
  'ViewPropTypes will be removed',
  'ColorPropType will be removed',
]);

// Define themes for consistency across app
const theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: '#3b82f6',
    accent: '#10b981',
    error: '#ef4444',
    warning: '#f59e0b',
    success: '#22c55e',
    background: '#f5f5f5',
    surface: '#ffffff',
    text: '#333333'
  },
  roundness: 8,
};

// Choose which navigator to show based on authentication state
function Navigation() {
  const { isAuthenticated, isLoading } = useAuth();
  
  if (isLoading) {
    return null; // Return null or a loading screen while checking auth
  }
  
  return (
    <NavigationContainer
      theme={{
        dark: false,
        colors: {
          primary: theme.colors.primary,
          background: theme.colors.background,
          card: theme.colors.surface,
          text: theme.colors.text,
          border: '#e2e8f0',
          notification: theme.colors.primary,
        },
      }}
    >
      {isAuthenticated ? <MainNavigator /> : <AuthNavigator />}
    </NavigationContainer>
  );
}

export default function App() {
  // Set up for web platform
  if (Platform.OS === 'web') {
    // Apply some web-specific styles if needed
    const style = document.createElement('style');
    style.textContent = `
      body, html {
        height: 100%;
        width: 100%;
        margin: 0;
        padding: 0;
        background-color: ${theme.colors.background};
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      }
      #root {
        display: flex;
        flex-direction: column;
        height: 100%;
      }
    `;
    document.head.append(style);
  }

  return (
    <SafeAreaProvider>
      <PaperProvider theme={theme}>
        <AuthProvider>
          <Navigation />
          <StatusBar style="auto" />
        </AuthProvider>
      </PaperProvider>
    </SafeAreaProvider>
  );
}