import React, { useEffect } from 'react';
import { ActivityIndicator, View, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useAppContext } from '../context/AppContext';
import COLORS from '../config/colors';

export default function Index() {
  const router = useRouter();
  const { user, initializing } = useAppContext();

  useEffect(() => {
    if (initializing) return;

    if (user) {
      router.replace('/News');
    } else {
      router.replace('/Login');
    }
  }, [initializing, user]);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={COLORS.primary2} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.dark, // #020617
  },
});
