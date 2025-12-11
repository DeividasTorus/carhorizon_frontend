import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { useAppContext } from '../../context/AppContext';
import ScreenLoader from '../../components/ScreenLoader';

const PendingChat = () => {
  const params = useLocalSearchParams();
  const router = useRouter();
  const { openChat } = useAppContext();

  const [creating, setCreating] = useState(true);

  const carIdParam = Array.isArray(params.carId) ? params.carId[0] : params.carId;
  const carPlateParam = Array.isArray(params.carPlate) ? params.carPlate[0] : params.carPlate;
  const carModelParam = Array.isArray(params.carModel) ? params.carModel[0] : params.carModel;

  const carId = carIdParam ? Number(carIdParam) : null;
  const carPlate = carPlateParam || '';
  const carModel = carModelParam || '';

  useEffect(() => {
    if (!carId) {
      Alert.alert('Klaida', 'Nerastas automobilio ID');
      router.back();
      return;
    }

    const initChat = async () => {
      try {
        setCreating(true);
        await openChat(carId, carPlate, carModel, null);
      } catch (e) {
        console.log('pending chat error', e);
        Alert.alert('Klaida', 'Nepavyko atidaryti pokalbio');
        router.back();
      } finally {
        setCreating(false);
      }
    };

    initChat();
  }, [carId]);

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <ActivityIndicator size="large" color="#38bdf8" />
      <Text style={styles.text}>Atidaroma...</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#020617',
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    marginTop: 16,
    fontSize: 16,
    color: '#94a3b8',
  },
});

export default PendingChat;
