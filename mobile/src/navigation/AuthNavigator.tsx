import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import LoginScreen from '../screens/LoginScreen';
import { Platform } from 'react-native';

export type AuthStackParamList = {
  Login: undefined;
  ForgotPassword: undefined;
};

const Stack = createNativeStackNavigator<AuthStackParamList>();

/**
 * AuthNavigator handles unauthenticated state navigation
 * It's optimized for both mobile and web environments
 */
const AuthNavigator = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: '#f5f5f5' },
        // Different animations for native vs web
        animation: Platform.OS === 'web' ? 'fade' : 'default',
        // Only show fullscreen modal on mobile
        presentation: Platform.OS !== 'web' ? 'card' : undefined,
      }}
    >
      <Stack.Screen 
        name="Login" 
        component={LoginScreen} 
        options={{
          // Title is visible in browser tab on web
          title: 'IMaint - Login',
        }}
      />
    </Stack.Navigator>
  );
};

export default AuthNavigator;