import React from 'react';
import * as WebBrowser from 'expo-web-browser';
// Užtikrina, kad Google OAuth redirect veiktų visur
WebBrowser.maybeCompleteAuthSession();
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, Button } from 'react-native';

export default function App() {
  const handlePress = () => alert('Hello from Expo!');

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome to Expo</Text>
      <Text style={styles.paragraph}>This is the CarHorizon Expo app scaffold.</Text>
      <Button title="Press me" onPress={handlePress} />
      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16
  },
  title: {
    fontSize: 28,
    fontWeight: '600',
    marginBottom: 8
  },
  paragraph: {
    fontSize: 16,
    marginBottom: 16
  }
});
