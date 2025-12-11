import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRouter } from 'expo-router';
import { useAppContext } from '../context/AppContext';

const UserSettings = () => {
  const navigation = useNavigation();
  const router = useRouter();
  const { logout, user } = useAppContext();

  const handleLogout = async () => {
    try {
      await logout();
      // 👇 ČIA permesk į TIKRĄ login maršrutą
      // jei tavo login failas yra app/login.jsx => '/login'
      // jei app/(auth)/login.jsx => '/(auth)/login'
      router.replace('/Login');
    } catch (e) {
      console.log('logout error', e);
      Alert.alert('Klaida', e.message || 'Nepavyko atsijungti');
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={26} color="#e5e7eb" />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>User settings</Text>
      </View>

      {/* ACCOUNT SECTION */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Account</Text>

        <View style={styles.accountBox}>
          <Text style={styles.accountLabel}>Email</Text>
          <Text style={styles.accountValue}>{user?.email || '-'}</Text>
        </View>
      </View>

      {/* PRIVACY PLACEHOLDER */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Privacy & safety</Text>

        <TouchableOpacity style={styles.listItem}>
          <Ionicons name="ban-outline" size={18} color="#e5e7eb" />
          <Text style={styles.listItemText}>Blocked users</Text>
        </TouchableOpacity>
      </View>

      {/* LOG OUT */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Danger zone</Text>

        <TouchableOpacity
          style={styles.logoutButton}
          onPress={handleLogout}
        >
          <Ionicons name="log-out-outline" size={20} color="#fecaca" />
          <Text style={styles.logoutText}>Log out</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#020617',
    paddingHorizontal: 16,
    paddingTop: 24,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 18,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#e5e7eb',
  },
  section: {
    marginTop: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#9ca3af',
    marginBottom: 10,
  },
  accountBox: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#1f2937',
    backgroundColor: '#02081f',
  },
  accountLabel: {
    fontSize: 11,
    color: '#6b7280',
    marginBottom: 2,
  },
  accountValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#e5e7eb',
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: '#02081f',
    borderWidth: 1,
    borderColor: '#1f2937',
  },
  listItemText: {
    fontSize: 14,
    color: '#e5e7eb',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
    backgroundColor: '#7f1d1d',
    marginTop: 4,
  },
  logoutText: {
    color: '#fee2e2',
    fontSize: 15,
    fontWeight: '700',
  },
});

export default UserSettings;

