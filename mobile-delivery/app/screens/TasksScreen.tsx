import { Linking, ScrollView, StyleSheet, Text, View, Pressable } from 'react-native';
import { useDeliveryStore, DeliveryTask } from '../../lib/store';
import { updateDeliveryTask } from '../../lib/database';

function formatCurrency(value: number) {
  return `${value.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ' ')} FCFA`;
}

function buildGoogleMapsRoute(task: DeliveryTask, currentLocation: { lat: number; lng: number } | null) {
  const origin = currentLocation
    ? `${currentLocation.lat},${currentLocation.lng}`
    : task.pickups.length > 0
    ? `${task.pickups[0].lat},${task.pickups[0].lng}`
    : `${task.deliveryLat},${task.deliveryLng}`;
  const destination = `${task.deliveryLat},${task.deliveryLng}`;
  const waypoints = task.pickups.length > 1
    ? task.pickups.map((pickup) => `${pickup.lat},${pickup.lng}`).join('|')
    : '';

  let url = `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(destination)}&travelmode=driving`;
  if (waypoints) {
    url += `&waypoints=${encodeURIComponent(waypoints)}`;
  }

  return url;
}

export default function TasksScreen() {
  const tasks = useDeliveryStore((state) => state.tasks);
  const currentLocation = useDeliveryStore((state) => state.currentLocation);
  const updateTaskStatus = useDeliveryStore((state) => state.updateTaskStatus);
  const depositCodPayment = useDeliveryStore((state) => state.depositCodPayment);

  const openRoute = (task: DeliveryTask) => {
    const url = buildGoogleMapsRoute(task, currentLocation);
    Linking.openURL(url);
  };

  const handleCollect = async (task: DeliveryTask) => {
    if (task.status === 'PENDING') {
      updateTaskStatus(task.packageCode, 'COLLECTED');
      await updateDeliveryTask(task.packageCode, 'COLLECTED');
    } else if (task.status === 'COLLECTED') {
      updateTaskStatus(task.packageCode, 'IN_TRANSIT');
      await updateDeliveryTask(task.packageCode, 'IN_TRANSIT');
    }
  };

  const handleDeliver = async (task: DeliveryTask) => {
    updateTaskStatus(task.packageCode, 'DELIVERED');
    await updateDeliveryTask(task.packageCode, 'DELIVERED');
    if (task.cod && task.amountDue > 0) {
      depositCodPayment(task.amountDue);
    }
  };

  const activeTasks = tasks.filter((task) => task.status !== 'DELIVERED');
  const completedTasks = tasks.filter((task) => task.status === 'DELIVERED');

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Livraisons</Text>
      <Text style={styles.subheader}>Suivi clair du départ, des arrêts et de l’arrivée.</Text>

      <ScrollView contentContainerStyle={styles.content}>
        {activeTasks.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>Toutes les livraisons sont terminées.</Text>
          </View>
        ) : (
          activeTasks.map((task) => (
            <View key={task.id} style={styles.card}>
              <Text style={styles.taskTitle}>{task.customerName}</Text>
              <Text style={styles.taskText}>Code colis : {task.packageCode}</Text>
              <Text style={styles.taskText}>Statut : {task.status}</Text>
              <Text style={styles.taskText}>Montant à encaisser : {formatCurrency(task.amountDue)}</Text>
              <Text style={styles.taskText}>Adresse client : {task.deliveryAddress}</Text>
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Magasins à visiter</Text>
                {task.pickups.map((pickup) => (
                  <View key={pickup.address} style={styles.pickupItem}>
                    <Text style={styles.pickupName}>{pickup.storeName}</Text>
                    <Text style={styles.pickupAddress}>{pickup.address}</Text>
                  </View>
                ))}
              </View>

              <View style={styles.buttonRow}>
                <Pressable style={[styles.primaryButton, styles.buttonSpacer]} onPress={() => openRoute(task)}>
                  <Text style={styles.buttonText}>Ouvrir l’itinéraire</Text>
                </Pressable>
              </View>

              <View style={styles.buttonRow}>
                <Pressable style={[styles.secondaryButton, styles.buttonSpacerRight]} onPress={() => handleCollect(task)}>
                  <Text style={styles.buttonText}>{task.status === 'PENDING' ? 'Marquer collecté' : 'En route'}</Text>
                </Pressable>
                <Pressable style={[styles.primaryButton, styles.buttonSpacer]} onPress={() => handleDeliver(task)}>
                  <Text style={styles.buttonText}>Livrer</Text>
                </Pressable>
              </View>
            </View>
          ))
        )}

        {completedTasks.length > 0 && (
          <View style={styles.completedSection}>
            <Text style={styles.sectionTitle}>Livraisons terminées</Text>
            {completedTasks.map((task) => (
              <View key={task.id} style={styles.completedCard}>
                <Text style={styles.taskTitle}>{task.customerName}</Text>
                <Text style={styles.taskText}>Code colis : {task.packageCode}</Text>
                <Text style={styles.taskText}>Montant encaissé : {formatCurrency(task.amountDue)}</Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    paddingTop: 50,
  },
  header: {
    fontSize: 28,
    fontWeight: '700',
    color: '#0F172A',
    paddingHorizontal: 20,
  },
  subheader: {
    color: '#475569',
    paddingHorizontal: 20,
    marginTop: 8,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  card: {
    marginBottom: 20,
    borderRadius: 24,
    backgroundColor: '#fff',
    padding: 20,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 15,
    elevation: 3,
  },
  taskTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0F172A',
  },
  taskText: {
    marginTop: 8,
    color: '#475569',
    lineHeight: 22,
  },
  section: {
    marginTop: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  pickupItem: {
    marginTop: 10,
    padding: 12,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
  },
  pickupName: {
    fontWeight: '600',
    color: '#0F172A',
  },
  pickupAddress: {
    marginTop: 4,
    color: '#475569',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  buttonSpacer: {
    flex: 1,
  },
  buttonSpacerRight: {
    flex: 1,
    marginRight: 10,
  },
  primaryButton: {
    flex: 1,
    backgroundColor: '#2563EB',
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
  },
  secondaryButton: {
    flex: 1,
    backgroundColor: '#E2E8F0',
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontWeight: '700',
  },
  completedSection: {
    marginTop: 10,
  },
  completedCard: {
    marginTop: 12,
    borderRadius: 20,
    backgroundColor: '#E2F0CB',
    padding: 16,
  },
  emptyCard: {
    marginTop: 24,
    borderRadius: 24,
    padding: 24,
    backgroundColor: '#E2E8F0',
    alignItems: 'center',
  },
  emptyText: {
    color: '#475569',
    fontSize: 16,
  },
});
