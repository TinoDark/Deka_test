import { useEffect, useState } from 'react';
import { Alert, Button, StyleSheet, Text, TextInput, View } from 'react-native';
import { BarCodeScanner } from 'expo-barcode-scanner';
import { useDeliveryStore } from '../../lib/store';
import { updateDeliveryTask } from '../../lib/database';

export default function ScannerScreen() {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [scanned, setScanned] = useState(false);
  const [manualCode, setManualCode] = useState('');
  const [message, setMessage] = useState('Placez le code-barres de votre colis devant la caméra.');
  const tasks = useDeliveryStore((state) => state.tasks);
  const updateTaskStatus = useDeliveryStore((state) => state.updateTaskStatus);
  const depositCodPayment = useDeliveryStore((state) => state.depositCodPayment);

  useEffect(() => {
    (async () => {
      const { status } = await BarCodeScanner.requestPermissionsAsync();
      setHasPermission(status === 'granted');
    })();
  }, []);

  const handleBarCodeScanned = ({ data }: { data: string }) => {
    setScanned(true);
    processScan(data);
  };

  const processScan = async (code: string) => {
    const task = tasks.find((task) => task.packageCode === code.trim());
    if (!task) {
      setMessage('Aucun colis trouvé pour ce code. Vérifiez et réessayez.');
      return;
    }

    if (task.status === 'PENDING') {
      updateTaskStatus(task.packageCode, 'COLLECTED');
      await updateDeliveryTask(task.packageCode, 'COLLECTED');
      setMessage(`Colis ${task.packageCode} collecté. Continuez vers le client.`);
      return;
    }

    if (task.status === 'COLLECTED' || task.status === 'IN_TRANSIT') {
      updateTaskStatus(task.packageCode, 'DELIVERED');
      await updateDeliveryTask(task.packageCode, 'DELIVERED');
      if (task.cod) {
        depositCodPayment(task.amountDue);
      }
      setMessage(`Livraison ${task.packageCode} terminée. ${task.cod ? 'Montant versé au portefeuille.' : ''}`);
      return;
    }

    setMessage('Ce colis a déjà été livré.');
  };

  const handleManualSubmit = () => {
    if (!manualCode.trim()) {
      Alert.alert('Erreur', 'Veuillez saisir un code colis valide.');
      return;
    }
    processScan(manualCode);
  };

  if (hasPermission === null) {
    return (
      <View style={styles.permissionContainer}>
        <Text style={styles.permissionText}>Demande d’accès à la caméra...</Text>
      </View>
    );
  }

  if (hasPermission === false) {
    return (
      <View style={styles.permissionContainer}>
        <Text style={styles.permissionText}>L’accès à la caméra est refusé. Autorisez-le dans les paramètres.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Scanner de livraison</Text>
      <Text style={styles.subheader}>{message}</Text>
      <View style={styles.scannerContainer}>
        <BarCodeScanner
          onBarCodeScanned={scanned ? undefined : handleBarCodeScanned}
          style={StyleSheet.absoluteFillObject}
        />
      </View>
      {scanned && (
        <Button title="Scanner un autre colis" onPress={() => setScanned(false)} />
      )}
      <View style={styles.manualContainer}>
        <Text style={styles.manualLabel}>Saisir le code colis manuellement</Text>
        <TextInput
          value={manualCode}
          onChangeText={setManualCode}
          placeholder="240424-0001"
          style={styles.input}
        />
        <Button title="Valider le code" onPress={handleManualSubmit} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    paddingTop: 50,
    paddingHorizontal: 20,
  },
  header: {
    fontSize: 28,
    fontWeight: '700',
    color: '#0F172A',
  },
  subheader: {
    marginTop: 10,
    color: '#475569',
  },
  scannerContainer: {
    flex: 1,
    marginTop: 24,
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: '#0F172A',
  },
  manualContainer: {
    marginTop: 24,
  },
  manualLabel: {
    marginBottom: 8,
    color: '#0F172A',
    fontWeight: '600',
  },
  input: {
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 16,
    padding: 14,
    marginBottom: 14,
    backgroundColor: '#fff',
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    backgroundColor: '#F8FAFC',
  },
  permissionText: {
    color: '#475569',
    textAlign: 'center',
    fontSize: 16,
  },
});
