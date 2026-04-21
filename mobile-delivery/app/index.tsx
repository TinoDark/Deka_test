import 'react-native-gesture-handler';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import * as Location from 'expo-location';
import { initDatabase, getDeliveryTasks, saveDeliveryTask } from '../lib/database';
import { useDeliveryStore } from '../lib/store';
import TasksScreen from './screens/TasksScreen';
import ScannerScreen from './screens/ScannerScreen';
import MapScreen from './screens/MapScreen';
import ProfileScreen from './screens/ProfileScreen';

const Tab = createBottomTabNavigator();

const sampleTasks = [
  {
    id: 'task-1',
    packageCode: '240424-0001',
    status: 'PENDING',
    customerName: 'M. Nguimdo',
    customerPhone: '+237 650 123 456',
    deliveryAddress: 'Avenue Kennedy, Douala',
    deliveryLat: 4.0511,
    deliveryLng: 9.7679,
    pickups: [
      {
        storeName: 'Magasin Bonado',
        address: 'Rue de la Révolution, Akwa',
        lat: 4.0435,
        lng: 9.7047,
      },
      {
        storeName: 'Boutique Marché Central',
        address: 'Marché Central de Douala',
        lat: 4.0513,
        lng: 9.7674,
      },
    ],
    totalAmount: 42000,
    amountDue: 42000,
    cod: true,
  },
  {
    id: 'task-2',
    packageCode: '240424-0002',
    status: 'PENDING',
    customerName: 'Mme Thérèse',
    customerPhone: '+237 699 888 000',
    deliveryAddress: 'Bonanjo, Douala',
    deliveryLat: 4.0480,
    deliveryLng: 9.7065,
    pickups: [
      {
        storeName: 'Shop Express Bonanjo',
        address: 'Boulevard de la République',
        lat: 4.0472,
        lng: 9.7081,
      },
    ],
    totalAmount: 18500,
    amountDue: 18500,
    cod: false,
  },
];

export default function App() {
  const { setOnline, setTasks, setCurrentLocation } = useDeliveryStore();

  useEffect(() => {
    const initialize = async () => {
      await initDatabase();
      const savedTasks = await getDeliveryTasks();
      if (savedTasks.length > 0) {
        setTasks(savedTasks);
      } else {
        setTasks(sampleTasks);
        await Promise.all(sampleTasks.map((task) => saveDeliveryTask(task)));
      }

      setOnline(true);
      updateLocation();
    };

    initialize();
  }, []);

  const updateLocation = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      return;
    }

    const location = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Highest,
    });

    setCurrentLocation({
      lat: location.coords.latitude,
      lng: location.coords.longitude,
    });
  };

  return (
    <>
      <StatusBar style="light" />
      <NavigationContainer>
        <Tab.Navigator screenOptions={{ headerShown: false }}>
          <Tab.Screen name="Tasks" component={TasksScreen} />
          <Tab.Screen name="Scanner" component={ScannerScreen} />
          <Tab.Screen name="Map" component={MapScreen} />
          <Tab.Screen name="Profile" component={ProfileScreen} />
        </Tab.Navigator>
      </NavigationContainer>
    </>
  );
}
