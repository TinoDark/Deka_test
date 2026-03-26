import 'react-native-gesture-handler';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { initDatabase } from './lib/database';
import { useDeliveryStore } from './lib/store';

const Tab = createBottomTabNavigator();

// Placeholder screens - à développer
function TasksScreen() {
  return null;
}

function ScannerScreen() {
  return null;
}

function MapScreen() {
  return null;
}

function ProfileScreen() {
  return null;
}

export default function App() {
  const { setOnline } = useDeliveryStore();

  useEffect(() => {
    // Initialize database and sync on startup
    initDatabase();
    
    // Check network connectivity
    checkNetworkStatus();
  }, []);

  const checkNetworkStatus = async () => {
    // TODO: Implement network status check
    setOnline(true);
  };

  return (
    <>
      <StatusBar barStyle="light-content" />
      <NavigationContainer>
        <Tab.Navigator
          screenOptions={{ headerShown: false }}
        >
          <Tab.Screen name="Tasks" component={TasksScreen} />
          <Tab.Screen name="Scanner" component={ScannerScreen} />
          <Tab.Screen name="Map" component={MapScreen} />
          <Tab.Screen name="Profile" component={ProfileScreen} />
        </Tab.Navigator>
      </NavigationContainer>
    </>
  );
}
