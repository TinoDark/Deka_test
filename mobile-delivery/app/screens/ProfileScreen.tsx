import { useState } from 'react';
import { Button, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useDeliveryStore } from '../../lib/store';

export default function ProfileScreen() {
  const walletBalance = useDeliveryStore((state) => state.walletBalance);
  const kycStatus = useDeliveryStore((state) => state.kycStatus);
  const kycInfo = useDeliveryStore((state) => state.kycInfo);
  const submitKyc = useDeliveryStore((state) => state.submitKyc);
  const approveKyc = useDeliveryStore((state) => state.approveKyc);

  const [firstName, setFirstName] = useState(kycInfo.firstName ?? '');
  const [lastName, setLastName] = useState(kycInfo.lastName ?? '');
  const [nationalId, setNationalId] = useState(kycInfo.nationalId ?? '');

  const onSubmitKyc = () => {
    submitKyc({ firstName, lastName, nationalId });
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.header}>Profil livreur</Text>
      <View style={styles.card}>
        <Text style={styles.label}>Solde du portefeuille</Text>
        <Text style={styles.balance}>{walletBalance.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ' ')} FCFA</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>KYC</Text>
        <Text style={styles.status}>{kycStatus}</Text>
        <Text style={styles.description}>Le livreur peut soumettre ses informations KYC depuis l’application.</Text>

        <TextInput
          value={firstName}
          onChangeText={setFirstName}
          placeholder="Prénom"
          style={styles.input}
        />
        <TextInput
          value={lastName}
          onChangeText={setLastName}
          placeholder="Nom"
          style={styles.input}
        />
        <TextInput
          value={nationalId}
          onChangeText={setNationalId}
          placeholder="N° d'identité"
          style={styles.input}
        />
        <Button title="Soumettre KYC" onPress={onSubmitKyc} />
        {kycStatus === 'PENDING' && <Text style={styles.pendingText}>KYC en attente de validation.</Text>}
        {kycStatus === 'APPROVED' && (
          <Text style={styles.approvedText}>KYC approuvé ✅</Text>
        )}
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>Optimisation livraison</Text>
        <Text style={styles.description}>Interface simplifiée pour une utilisation à une main : onglets clairs, gros boutons et actions rapides.</Text>
      </View>

      {kycStatus === 'PENDING' && (
        <View style={styles.card}>
          <Text style={styles.label}>Administration</Text>
          <Button title="Simuler approbation KYC" onPress={approveKyc} />
        </View>
      )}
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
    marginBottom: 20,
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
  label: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  balance: {
    marginTop: 10,
    fontSize: 32,
    fontWeight: '800',
    color: '#2563EB',
  },
  status: {
    marginTop: 10,
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  description: {
    marginTop: 10,
    color: '#475569',
    lineHeight: 22,
  },
  input: {
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 16,
    padding: 14,
    backgroundColor: '#F8FAFC',
  },
  pendingText: {
    marginTop: 12,
    color: '#92400E',
    fontWeight: '600',
  },
  approvedText: {
    marginTop: 12,
    color: '#166534',
    fontWeight: '600',
  },
});
