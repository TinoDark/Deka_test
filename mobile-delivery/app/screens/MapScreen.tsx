import { useMemo } from 'react';
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useDeliveryStore, DeliveryTask } from '../../lib/store';

const buildRouteUrl = (task: DeliveryTask, currentLocation: { lat: number; lng: number } | null) => {
  const origin = currentLocation
    ? `${currentLocation.lat},${currentLocation.lng}`
    : task.pickups.length > 0
    ? `${task.pickups[0].lat},${task.pickups[0].lng}`
    : `${task.deliveryLat},${task.deliveryLng}`;
  const destination = `${task.deliveryLat},${task.deliveryLng}`;
  const waypoints = task.pickups.length > 1
    ? task.pickups.map((pickup) => `${pickup.lat},${pickup.lng}`).join('%7C')
    : '';

  let url = `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(destination)}&travelmode=driving`;
  if (waypoints) {
    url += `&waypoints=${waypoints}`;
  }

  return url;
};

export default function MapScreen() {
  const tasks = useDeliveryStore((state) => state.tasks);
  const currentLocation = useDeliveryStore((state) => state.currentLocation);

  const activeTask = useMemo(
    () => tasks.find((task) => task.status !== 'DELIVERED') || tasks[0],
    [tasks]
  );

  if (!activeTask) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyHeader}>Aucune livraison active</Text>
        <Text style={styles.emptyText}>Les tâches de livraison apparaîtront ici dès qu’elles seront planifiées.</Text>
      </View>
    );
  }

  const routeUrl = buildRouteUrl(activeTask, currentLocation);
  const departure = currentLocation
    ? 'Position actuelle'
    : activeTask.pickups.length > 0
    ? activeTask.pickups[0].address
    : 'Point de départ inconnu';
  const arrival = activeTask.deliveryAddress;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.header}>Carte de livraison</Text>
      <Text style={styles.subheader}>Départ et arrivée, parcours multi-magasins et export vers Maps.</Text>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Code colis</Text>
        <Text style={styles.cardValue}>{activeTask.packageCode}</Text>

        <Text style={styles.cardTitle}>Départ</Text>
        <Text style={styles.cardValue}>{departure}</Text>

        <Text style={styles.cardTitle}>Arrivée</Text>
        <Text style={styles.cardValue}>{arrival}</Text>

        <Text style={styles.cardTitle}>Étapes</Text>
        {activeTask.pickups.map((pickup) => (
          <View key={pickup.address} style={styles.stepRow}>
            <Text style={styles.stepTitle}>{pickup.storeName}</Text>
            <Text style={styles.stepLabel}>{pickup.address}</Text>
          </View>
        ))}
      </View>

      <Pressable style={styles.primaryButton} onPress={() => Linking.openURL(routeUrl)}>
        <Text style={styles.buttonText}>Ouvrir le trajet dans Maps</Text>
      </Pressable>

      <View style={styles.infoCard}>
        <Text style={styles.infoTitle}>Navigation une main</Text>
        <Text style={styles.infoText}>Les boutons sont larges et le flux est simplifié pour une utilisation mobile rapide en livraison.</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#F8FAFC',
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    fontSize: 28,
    fontWeight: '700',
    color: '#0F172A',
  },
  subheader: {
    marginTop: 8,
    color: '#475569',
  },
  card: {
    marginTop: 20,
    borderRadius: 24,
    backgroundColor: '#fff',
    padding: 20,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 15,
    elevation: 3,
  },
  cardTitle: {
    fontWeight: '700',
    color: '#0F172A',
    marginTop: 16,
  },
  cardValue: {
    marginTop: 6,
    color: '#475569',
    lineHeight: 22,
  },
  stepRow: {
    marginTop: 12,
    padding: 14,
    borderRadius: 18,
    backgroundColor: '#F1F5F9',
  },
  stepTitle: {
    fontWeight: '700',
    color: '#0F172A',
  },
  stepLabel: {
    marginTop: 4,
    color: '#475569',
  },
  primaryButton: {
    marginTop: 24,
    backgroundColor: '#2563EB',
    paddingVertical: 16,
    borderRadius: 18,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontWeight: '700',
  },
  infoCard: {
    marginTop: 24,
    borderRadius: 24,
    padding: 20,
    backgroundColor: '#E2F0CB',
  },
  infoTitle: {
    fontWeight: '700',
    color: '#0F172A',
  },
  infoText: {
    marginTop: 8,
    color: '#475569',
    lineHeight: 22,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#F8FAFC',
  },
  emptyHeader: {
    fontSize: 22,
    fontWeight: '700',
    color: '#0F172A',
  },
  emptyText: {
    marginTop: 12,
    color: '#475569',
    textAlign: 'center',
  },
});
