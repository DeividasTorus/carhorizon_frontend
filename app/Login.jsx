import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useAppContext } from '../context/AppContext';

const Login = () => {
  const { login } = useAppContext();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Klaida', 'Įvesk el. paštą ir slaptažodį');
      return;
    }
    setSubmitting(true);
    try {
      await login(email.trim(), password);
      router.replace('/News');
    } catch (e) {
      Alert.alert('Prisijungimo klaida', e.message || 'Nepavyko prisijungti');
    } finally {
      setSubmitting(false);
    }
  };

  const goRegister = () => {
    router.push('/Register');
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: '#020617' }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <StatusBar style="light" />
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.logo}>CarHorizon</Text>
          <Text style={styles.subtitle}>Prisijunk ir rašyk vairuotojams pagal jų numerius</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Prisijungimas</Text>

          <View style={styles.field}>
            <Text style={styles.label}>El. paštas</Text>
            <TextInput
              placeholder="you@example.com"
              placeholderTextColor="#6b7280"
              style={styles.input}
              autoCapitalize="none"
              keyboardType="email-address"
              value={email}
              onChangeText={setEmail}
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Slaptažodis</Text>
            <TextInput
              placeholder="Slaptažodis"
              placeholderTextColor="#6b7280"
              style={styles.input}
              secureTextEntry
              value={password}
              onChangeText={setPassword}
            />
          </View>

          <TouchableOpacity style={[styles.button, submitting && styles.buttonDisabled]} onPress={handleLogin} disabled={submitting}>
            <Text style={styles.buttonText}>{submitting ? 'Jungiama...' : 'Prisijungti'}</Text>
          </TouchableOpacity>

          <View style={styles.footerRow}>
            <Text style={styles.footerText}>Neturi paskyros?</Text>
            <TouchableOpacity onPress={goRegister}>
              <Text style={styles.footerLink}>Registruokis</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 80,
  },
  header: {
    marginBottom: 32,
  },
  logo: {
    fontSize: 32,
    fontWeight: '800',
    color: '#e5e7eb',
    letterSpacing: 0.5,
  },
  subtitle: {
    marginTop: 8,
    color: '#9ca3af',
    fontSize: 14,
  },
  card: {
    backgroundColor: '#020617',
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: '#1f2937',
    shadowColor: '#000',
    shadowOpacity: 0.4,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
    elevation: 10,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#e5e7eb',
    marginBottom: 16,
  },
  field: {
    marginBottom: 14,
  },
  label: {
    color: '#9ca3af',
    marginBottom: 6,
    fontSize: 13,
  },
  input: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#374151',
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: '#f9fafb',
    backgroundColor: '#020617',
    fontSize: 14,
  },
  button: {
    marginTop: 12,
    backgroundColor: '#0ea5e9',
    paddingVertical: 12,
    borderRadius: 999,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#0b1120',
    fontSize: 15,
    fontWeight: '700',
  },
  footerRow: {
    marginTop: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 4,
  },
  footerText: {
    color: '#6b7280',
  },
  footerLink: {
    color: '#38bdf8',
    fontWeight: '600',
  },
});

export default Login;
