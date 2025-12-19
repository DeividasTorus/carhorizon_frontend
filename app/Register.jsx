import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useAppContext } from '../context/AppContext';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import CarHorizonLogo from '../assets/CarHorizonLogo.png';
import COLORS from '../config/colors';

const Register = () => {
  const { register } = useAppContext();
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showPass, setShowPass] = useState(false);

  const canSubmit = useMemo(() => {
    return email.trim().length > 0 && password.length > 0 && !submitting;
  }, [email, password, submitting]);

  const handleRegister = async () => {
    if (!email.trim() || !password) {
      Alert.alert('Klaida', 'Įvesk el. paštą ir slaptažodį');
      return;
    }

    setSubmitting(true);
    try {
      await register(email.trim(), password);
      router.replace('/MyGarage');
    } catch (e) {
      Alert.alert('Registracijos klaida', e?.message || 'Nepavyko užsiregistruoti');
    } finally {
      setSubmitting(false);
    }
  };

  const goLogin = () => router.push('/Login');

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <StatusBar style="light" />

      <LinearGradient
        colors={[
          COLORS.dark,
          COLORS.dark2,
          'rgba(14,165,233,0.28)', // sky wash
          'rgba(99,102,241,0.18)', // indigo wash
          COLORS.dark,
        ]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.screen}
      >
        {/* Glows */}
        <View style={[styles.blob, styles.blobPrimary]} />
        <View style={[styles.blob, styles.blobIndigo]} />
        <View style={[styles.blob, styles.blobTeal]} />

        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.logoRow}>
              <View style={styles.logoBadge}>
                <Image source={CarHorizonLogo} style={styles.logoImage} resizeMode="contain" />
              </View>
            </View>

            <View style={styles.trustRow}>
              <View style={styles.trustPill}>
                <Ionicons name="sparkles" size={16} color={COLORS.primary2} />
                <Text style={styles.trustText}>Greitas startas</Text>
              </View>

              <View style={styles.trustPill}>
                <Ionicons name="shield-checkmark" size={16} color={COLORS.emerald} />
                <Text style={styles.trustText}>Saugūs duomenys</Text>
              </View>
            </View>
          </View>

          {/* Card */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Registracija</Text>
            <Text style={styles.cardHint}>Įvesk el. paštą ir sugalvok slaptažodį.</Text>

            {/* Email */}
            <View style={styles.field}>
              <Text style={styles.label}>El. paštas</Text>
              <View style={styles.inputWrap}>
                <Ionicons name="mail-outline" size={18} color="rgba(226,232,240,0.85)" style={styles.leftIcon} />
                <TextInput
                  placeholder="you@example.com"
                  placeholderTextColor="rgba(148,163,184,0.70)"
                  style={styles.input}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  value={email}
                  onChangeText={setEmail}
                  returnKeyType="next"
                />
              </View>
            </View>

            {/* Password */}
            <View style={styles.field}>
              <Text style={styles.label}>Slaptažodis</Text>
              <View style={styles.inputWrap}>
                <Ionicons
                  name="lock-closed-outline"
                  size={18}
                  color="rgba(226,232,240,0.85)"
                  style={styles.leftIcon}
                />
                <TextInput
                  placeholder="Slaptažodis"
                  placeholderTextColor="rgba(148,163,184,0.70)"
                  style={styles.input}
                  secureTextEntry={!showPass}
                  value={password}
                  onChangeText={setPassword}
                  returnKeyType="done"
                  onSubmitEditing={() => canSubmit && handleRegister()}
                />

                <TouchableOpacity
                  onPress={() => setShowPass((s) => !s)}
                  hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                  style={styles.rightIconBtn}
                >
                  <Ionicons
                    name={showPass ? 'eye-off-outline' : 'eye-outline'}
                    size={18}
                    color="rgba(226,232,240,0.85)"
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Primary button */}
            <TouchableOpacity
              style={[styles.button, !canSubmit && styles.buttonDisabled]}
              onPress={handleRegister}
              disabled={!canSubmit}
              activeOpacity={0.88}
            >
              <LinearGradient
                colors={[COLORS.primary3, COLORS.primary, COLORS.primary2]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.buttonGrad}
              >
                {submitting ? (
                  <Text style={styles.buttonText}>Kuriama...</Text>
                ) : (
                  <View style={styles.buttonRow}>
                    <Text style={styles.buttonText}>Registruotis</Text>
                    <Ionicons name="arrow-forward" size={18} color="#071327" />
                  </View>
                )}
              </LinearGradient>
            </TouchableOpacity>

            {/* Divider */}
            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>arba</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Footer */}
            <View style={styles.footerRow}>
              <Text style={styles.footerText}>Jau turi paskyrą?</Text>
              <TouchableOpacity onPress={goLogin} activeOpacity={0.8}>
                <Text style={styles.footerLink}>Prisijunk</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.legal}>
              Registruodamiesi sutinkate su taisyklėmis ir privatumo politika.
            </Text>
          </View>
        </View>
      </LinearGradient>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  screen: { flex: 1 },

  container: {
    flex: 1,
    paddingHorizontal: 20,
  },

  blob: {
    position: 'absolute',
    width: 320,
    height: 320,
    borderRadius: 999,
  },
  blobPrimary: {
    backgroundColor: COLORS.primary,
    top: -120,
    left: -110,
    opacity: 0.18,
  },
  blobIndigo: {
    backgroundColor: COLORS.indigo,
    bottom: -140,
    right: -120,
    opacity: 0.14,
  },
  blobTeal: {
    backgroundColor: COLORS.teal,
    top: 140,
    right: -160,
    opacity: 0.10,
  },

  header: { marginBottom: 16 },

  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoBadge: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoImage: {
    width: 300,
    height: 200,
    marginBottom: -50,
    shadowColor: COLORS.primary,
    shadowOpacity: 0.28,
    shadowRadius: 26,
    shadowOffset: { width: 0, height: 12 },
    elevation: 10,
  },

  trustRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
    marginTop: 14,
    flexWrap: 'wrap',
  },
  trustPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 9,
    paddingHorizontal: 12,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(14,165,233,0.20)',
  },
  trustText: {
    color: 'rgba(226,232,240,0.90)',
    fontSize: 12.5,
    fontWeight: '700',
  },

  card: {
    marginTop: 10,
    borderRadius: 26,
    padding: 18,
    backgroundColor: 'rgba(2, 6, 23, 0.78)',
    borderWidth: 1,
    borderColor: 'rgba(14,165,233,0.18)',
    shadowColor: '#000',
    shadowOpacity: 0.50,
    shadowRadius: 26,
    shadowOffset: { width: 0, height: 16 },
    elevation: 14,
  },

  cardTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: COLORS.text,
    letterSpacing: 0.2,
  },
  cardHint: {
    marginTop: 6,
    color: 'rgba(148,163,184,0.95)',
    fontSize: 13.5,
    lineHeight: 18,
    marginBottom: 14,
  },

  field: { marginBottom: 12 },
  label: {
    color: 'rgba(226,232,240,0.78)',
    marginBottom: 6,
    fontSize: 13,
    fontWeight: '700',
  },

  inputWrap: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(148,163,184,0.22)',
    backgroundColor: 'rgba(15,23,42,0.62)',
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: COLORS.primary,
    shadowOpacity: 0.12,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 8 },
  },
  leftIcon: { marginLeft: 12 },
  rightIconBtn: { paddingHorizontal: 12, paddingVertical: 10 },

  input: {
    flex: 1,
    paddingHorizontal: 10,
    paddingVertical: 12,
    color: '#f8fafc',
    fontSize: 14.5,
  },

  button: {
    marginTop: 10,
    borderRadius: 999,
    overflow: 'hidden',
    shadowColor: COLORS.primary,
    shadowOpacity: 0.24,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 12 },
    elevation: 10,
  },
  buttonGrad: {
    paddingVertical: 13,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonDisabled: { opacity: 0.58 },

  buttonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  buttonText: {
    color: '#071327',
    fontSize: 15.5,
    fontWeight: '900',
    letterSpacing: 0.2,
  },

  divider: { flexDirection: 'row', alignItems: 'center', marginVertical: 16 },
  dividerLine: { flex: 1, height: 1, backgroundColor: 'rgba(14,165,233,0.18)' },
  dividerText: {
    color: 'rgba(226,232,240,0.75)',
    paddingHorizontal: 12,
    fontSize: 13,
    fontWeight: '900',
  },

  footerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  footerText: { color: 'rgba(148,163,184,0.95)', fontSize: 13.5 },

  footerLink: {
    color: COLORS.primary2,
    fontWeight: '900',
    fontSize: 13.5,
  },

  legal: {
    marginTop: 12,
    textAlign: 'center',
    color: 'rgba(100,116,139,0.95)',
    fontSize: 12,
    lineHeight: 16,
  },
});

export default Register;
