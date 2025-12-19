// app/_layout.jsx
import React, { useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Slot, usePathname } from 'expo-router';
import { AppProvider } from '../context/AppContext';
import Navbar from '../components/Navbar';
import * as SplashScreen from 'expo-splash-screen';
import { Asset } from 'expo-asset';
import COLORS from '../config/colors';

// labai svarbu: kviesti tai viršuje, ne viduje komponento
SplashScreen.preventAutoHideAsync().catch(() => {});

const Layout = () => {
  const pathname = usePathname();
  const lower = pathname?.toLowerCase() || '';

  const isAuth = lower.includes('/login') || lower.includes('/register');
  const isChat = lower.includes('/chat');
  const showNavbar = !isAuth && !isChat;

  const [appIsReady, setAppIsReady] = useState(false);

  useEffect(() => {
    const prepare = async () => {
      try {
        // 1) Preload’intam tavo PNG
        await Asset.loadAsync([require('../assets/LTPlates.png')]);

        // čia dar galėtum preload’inti kitus assetus ar daryti init logiką
      } catch (e) {
        console.log('Asset preload error', e);
      } finally {
        setAppIsReady(true);
        // 2) Kai viskas pasiruošę – slepiam splash
        SplashScreen.hideAsync().catch(() => {});
      }
    };

    prepare();
  }, []);

  // 3) Kol appas ruošiasi – nerenderinam UI (paliekam splash)
  if (!appIsReady) {
    return null;
  }

  return (
    <AppProvider>
      <SafeAreaView style={styles.safe}>
        <View style={styles.container}>
          <Slot />
          {showNavbar && <Navbar />}
        </View>
      </SafeAreaView>
    </AppProvider>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.dark },
  container: { flex: 1 },
});

export default Layout;
