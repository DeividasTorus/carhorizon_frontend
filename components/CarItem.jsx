import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

const CarItem = ({ car, onMessage }) => {
  return (
    <View style={styles.card}>
      <View>
        <Text style={styles.plate}>{car.plate}</Text>
        {!!car.model && <Text style={styles.model}>{car.model}</Text>}
      </View>
      <TouchableOpacity style={styles.button} onPress={onMessage}>
        <Text style={styles.buttonText}>Rašyti</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#020617',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#111827',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  plate: {
    fontSize: 16,
    fontWeight: '700',
    color: '#e5e7eb',
  },
  model: {
    marginTop: 4,
    fontSize: 13,
    color: '#9ca3af',
  },
  button: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: '#0ea5e9',
    borderRadius: 999,
  },
  buttonText: {
    color: '#0b1120',
    fontSize: 13,
    fontWeight: '600',
  },
});

export default CarItem;
