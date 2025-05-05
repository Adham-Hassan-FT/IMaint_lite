import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { MaterialCommunityIcons } from '@expo/vector-icons';

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

// Stack navigators for each tab
const WorkOrderStack = createNativeStackNavigator();
const AssetStack = createNativeStackNavigator();
const InventoryStack = createNativeStackNavigator();
const MaintenanceStack = createNativeStackNavigator();

// Work Orders stack
function WorkOrderStackNavigator() {
  return (
    <WorkOrderStack.Navigator>
      <WorkOrderStack.Screen 
        name="WorkOrdersList" 
        component={WorkOrdersScreen} 
        options={{ title: 'Work Orders' }}
      />
      <WorkOrderStack.Screen 
        name="WorkOrderDetail" 
        component={WorkOrderDetailScreen} 
        options={{ title: 'Work Order Details' }}
      />
    </WorkOrderStack.Navigator>
  );
}

// Assets stack
function AssetStackNavigator() {
  return (
    <AssetStack.Navigator>
      <AssetStack.Screen 
        name="AssetsList" 
        component={AssetsScreen} 
        options={{ title: 'Assets' }}
      />
      <AssetStack.Screen 
        name="AssetDetail" 
        component={AssetDetailScreen} 
        options={{ title: 'Asset Details' }}
      />
    </AssetStack.Navigator>
  );
}

// Inventory stack
function InventoryStackNavigator() {
  return (
    <InventoryStack.Navigator>
      <InventoryStack.Screen 
        name="InventoryList" 
        component={InventoryScreen} 
        options={{ title: 'Inventory' }}
      />
      <InventoryStack.Screen 
        name="InventoryDetail" 
        component={InventoryDetailScreen} 
        options={{ title: 'Inventory Details' }}
      />
    </InventoryStack.Navigator>
  );
}

// Maintenance stack
function MaintenanceStackNavigator() {
  return (
    <MaintenanceStack.Navigator>
      <MaintenanceStack.Screen 
        name="MaintenanceList" 
        component={MaintenanceScreen} 
        options={{ title: 'Preventive Maintenance' }}
      />
    </MaintenanceStack.Navigator>
  );
}

// Bottom Tab Navigator
const Tab = createBottomTabNavigator();

const MainNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: '#3b82f6',
        tabBarInactiveTintColor: 'gray',
        tabBarStyle: {
          paddingBottom: 5,
          paddingTop: 5,
        },
      }}
    >
      <Tab.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="view-dashboard" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="WorkOrders"
        component={WorkOrderStackNavigator}
        options={{
          headerShown: false,
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="clipboard-list" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Assets"
        component={AssetStackNavigator}
        options={{
          headerShown: false,
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="dolly" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Inventory"
        component={InventoryStackNavigator}
        options={{
          headerShown: false,
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="package-variant-closed" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Maintenance"
        component={MaintenanceStackNavigator}
        options={{
          headerShown: false,
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="tools" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Scanner"
        component={ScannerScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="barcode-scan" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Resources"
        component={ResourcesScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="account-group" size={size} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
};

export default MainNavigator;