import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Platform, useWindowDimensions } from 'react-native';
import { useTheme } from 'react-native-paper';

// Screens
import DashboardScreen from '../screens/DashboardScreen';
import WorkOrdersScreen from '../screens/WorkOrdersScreen';
import WorkOrderDetailScreen from '../screens/WorkOrderDetailScreen';
import AssetsScreen from '../screens/AssetsScreen';
import AssetDetailScreen from '../screens/AssetDetailScreen';
import InventoryScreen from '../screens/InventoryScreen';
import InventoryDetailScreen from '../screens/InventoryDetailScreen';
import MaintenanceScreen from '../screens/MaintenanceScreen';
import ScannerScreen from '../screens/ScannerScreen';
import ResourcesScreen from '../screens/ResourcesScreen';
import ProfileScreen from '../screens/ProfileScreen';
import SettingsScreen from '../screens/SettingsScreen';

// Define our navigator param lists for type safety
export type MainStackParamList = {
  MainTabs: undefined;
  WorkOrderDetail: { workOrderId: number };
  AssetDetail: { assetId: number };
  InventoryDetail: { itemId: number };
  AddWorkOrder: undefined;
  AddAsset: undefined;
  AddInventoryItem: undefined;
  Profile: undefined;
  Settings: undefined;
};

export type MainTabParamList = {
  Dashboard: undefined;
  WorkOrders: undefined;
  Assets: undefined;
  Inventory: undefined;
  Maintenance: undefined;
  Scanner: undefined;
  Resources: undefined;
  More: undefined;
};

// Stack navigator for the whole app
const MainStack = createNativeStackNavigator<MainStackParamList>();

// Bottom Tab Navigator
const Tab = createBottomTabNavigator<MainTabParamList>();

/**
 * Main tab navigation that appears at the bottom (mobile) or top (web)
 */
function MainTabNavigator() {
  const theme = useTheme();
  const { width } = useWindowDimensions();
  const isLargeScreen = width >= 768;
  
  // On web with larger screens, we'll show all tabs
  // On mobile, we'll show fewer tabs and put the rest in a "More" tab
  const tabBarOptions = {
    activeTintColor: theme.colors.primary,
    inactiveTintColor: 'gray',
    labelStyle: {
      fontSize: 12,
    },
    style: Platform.OS === 'web' ? {
      // Web-specific styles
      height: 50,
    } : {
      // Mobile-specific styles
      paddingBottom: 5,
      paddingTop: 5,
    },
  };
  
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: 'gray',
        tabBarStyle: {
          paddingBottom: Platform.OS === 'ios' ? 20 : 5,
          paddingTop: 5,
          ...(Platform.OS === 'web' && {
            // Web-specific tab bar styles
            borderTopWidth: 0,
            elevation: 4,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 3,
          }),
        },
        headerTitleStyle: {
          color: theme.colors.primary,
          fontWeight: 'bold',
        },
        headerStyle: {
          backgroundColor: '#fff',
          ...(Platform.OS === 'web' && {
            // Web-specific header styles
            borderBottomWidth: 1,
            borderBottomColor: '#e2e8f0', 
          }),
        },
      })}
    >
      <Tab.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="view-dashboard" size={size} color={color} />
          ),
        }}
      />
      
      <Tab.Screen
        name="WorkOrders"
        component={WorkOrdersScreen}
        options={{
          title: 'Work Orders',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="clipboard-list" size={size} color={color} />
          ),
        }}
      />
      
      <Tab.Screen
        name="Assets"
        component={AssetsScreen}
        options={{
          title: 'Assets',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="dolly" size={size} color={color} />
          ),
        }}
      />
      
      <Tab.Screen
        name="Inventory"
        component={InventoryScreen}
        options={{
          title: 'Inventory',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="package-variant-closed" size={size} color={color} />
          ),
        }}
      />
      
      {/* Scanner is a great mobile feature - move it out of More tab on small screens */}
      <Tab.Screen
        name="Scanner"
        component={ScannerScreen}
        options={{
          title: 'Scanner',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="barcode-scan" size={size} color={color} />
          ),
        }}
      />
      
      {/* Show these tabs only on larger screens or web */}
      {(isLargeScreen || Platform.OS === 'web') && (
        <>
          <Tab.Screen
            name="Maintenance"
            component={MaintenanceScreen}
            options={{
              title: 'Maintenance',
              tabBarIcon: ({ color, size }) => (
                <MaterialCommunityIcons name="tools" size={size} color={color} />
              ),
            }}
          />
          
          <Tab.Screen
            name="Resources"
            component={ResourcesScreen}
            options={{
              title: 'Resources',
              tabBarIcon: ({ color, size }) => (
                <MaterialCommunityIcons name="account-group" size={size} color={color} />
              ),
            }}
          />
        </>
      )}
      
      {/* On small screens, add a More tab for overflow items */}
      {!isLargeScreen && Platform.OS !== 'web' && (
        <Tab.Screen
          name="More"
          component={MoreNavigator}
          options={{
            title: 'More',
            tabBarIcon: ({ color, size }) => (
              <MaterialCommunityIcons name="dots-horizontal" size={size} color={color} />
            ),
          }}
        />
      )}
    </Tab.Navigator>
  );
}

/**
 * Stack navigator for More section (only on small screens)
 */
const MoreStack = createNativeStackNavigator();

function MoreNavigator() {
  return (
    <MoreStack.Navigator>
      <MoreStack.Screen 
        name="MoreList" 
        component={MoreScreen} 
        options={{ 
          title: 'More',
          headerShown: false 
        }}
      />
      <MoreStack.Screen 
        name="Maintenance" 
        component={MaintenanceScreen} 
        options={{ title: 'Maintenance' }}
      />
      <MoreStack.Screen 
        name="Resources" 
        component={ResourcesScreen} 
        options={{ title: 'Resources' }}
      />
      <MoreStack.Screen 
        name="Profile" 
        component={ProfileScreen} 
        options={{ title: 'Profile' }}
      />
      <MoreStack.Screen 
        name="Settings" 
        component={SettingsScreen} 
        options={{ title: 'Settings' }}
      />
    </MoreStack.Navigator>
  );
}

/**
 * Component for the More menu screen (on small screens)
 */
function MoreScreen({ navigation }: any) {
  const theme = useTheme();
  
  // Will populate this later with a grid of options
  return null;
}

/**
 * Main navigator for the authenticated part of the app
 */
const MainNavigator = () => {
  const theme = useTheme();
  
  return (
    <MainStack.Navigator
      screenOptions={{
        headerTitleStyle: {
          color: theme.colors.primary,
          fontWeight: 'bold',
        },
        headerStyle: {
          backgroundColor: '#fff',
        },
        animation: Platform.OS === 'web' ? 'fade' : 'default',
      }}
    >
      <MainStack.Screen
        name="MainTabs"
        component={MainTabNavigator}
        options={{ headerShown: false }}
      />
      
      <MainStack.Screen
        name="WorkOrderDetail"
        component={WorkOrderDetailScreen}
        options={{ title: 'Work Order Details' }}
      />
      
      <MainStack.Screen
        name="AssetDetail"
        component={AssetDetailScreen}
        options={{ title: 'Asset Details' }}
      />
      
      <MainStack.Screen
        name="InventoryDetail"
        component={InventoryDetailScreen}
        options={{ title: 'Inventory Details' }}
      />
      
      <MainStack.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ title: 'My Profile' }}
      />
      
      <MainStack.Screen
        name="Settings"
        component={SettingsScreen}
        options={{ title: 'Settings' }}
      />
    </MainStack.Navigator>
  );
};

export default MainNavigator;