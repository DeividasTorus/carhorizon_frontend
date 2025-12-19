import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRouter } from 'expo-router';
import { useAppContext } from '../context/AppContext';

const COLORS = {
  bg: '#020617',
  text: '#e5e7eb',
  textMuted: '#9ca3af',
  textHint: '#6b7280',
  border: '#1f2937',
  cardBg: '#02081f',

  chipBg: '#0b122a',

  dangerBg: '#12070a',
  dangerBorder: '#3f1d1d',
  dangerText: '#fecaca',
};

const Row = ({ icon, title, subtitle, right, onPress, danger }) => {
  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      style={[
        styles.row,
        danger && {
          backgroundColor: COLORS.dangerBg,
          borderColor: COLORS.dangerBorder,
        },
      ]}
    >
      <View style={[styles.rowIcon, danger && { borderColor: COLORS.dangerBorder }]}>
        <Ionicons
          name={icon}
          size={18}
          color={danger ? COLORS.dangerText : COLORS.text}
        />
      </View>

      <View style={{ flex: 1 }}>
        <Text style={[styles.rowTitle, danger && { color: COLORS.dangerText }]}>
          {title}
        </Text>
        {!!subtitle && (
          <Text style={[styles.rowSubtitle, danger && { color: COLORS.dangerText, opacity: 0.85 }]}>
            {subtitle}
          </Text>
        )}
      </View>

      {right ? (
        <View style={styles.rightPill}>
          <Text style={styles.rightPillText}>{right}</Text>
        </View>
      ) : (
        <Ionicons name="chevron-forward" size={18} color={COLORS.textHint} />
      )}
    </TouchableOpacity>
  );
};

const SecurityScreen = () => {
  const navigation = useNavigation();
  const router = useRouter();
  const { logout } = useAppContext();

  const [busy, setBusy] = useState(false);

  const handleLogoutAllDevices = async () => {
    Alert.alert(
      'Log out from all devices?',
      'MVP version: this will log you out from this device. For real “all devices” we need token/session revoke on backend.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Log out',
          style: 'destructive',
          onPress: async () => {
            try {
              setBusy(true);
              await logout();
              router.replace('/Login');
            } catch (e) {
              console.log('logout all devices error', e);
              Alert.alert('Klaida', e?.message || 'Nepavyko atsijungti');
            } finally {
              setBusy(false);
            }
          },
        },
      ]
    );
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete account',
      'Coming soon. This requires a backend endpoint to permanently delete your data.',
      [{ text: 'OK' }]
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={COLORS.text} />
        </TouchableOpacity>

        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Security</Text>
          <Text style={styles.headerSubtitle}>Account protection & access</Text>
        </View>
      </View>

      {/* SECURITY */}
      <Text style={styles.sectionTitle}>Security</Text>
      <View style={styles.card}>
        <Row
          icon="key-outline"
          title="Change password"
          subtitle="Update your password regularly"
          onPress={() => router.push('/ChangePassword')}
        />

        <View style={styles.divider} />

        <Row
          icon="phone-portrait-outline"
          title="Active sessions"
          subtitle="See devices where you’re signed in"
          right="Coming soon"
          onPress={() =>
            Alert.alert('Active sessions', 'Coming soon. We can add sessions tracking on backend.')
          }
        />
      </View>

      {/* ACCESS */}
      <Text style={styles.sectionTitle}>Access</Text>
      <View style={styles.card}>
        <Row
          icon="log-out-outline"
          title={busy ? 'Working...' : 'Log out from all devices'}
          subtitle="Sign out everywhere (requires backend support)"
          onPress={busy ? () => {} : handleLogoutAllDevices}
        />
      </View>

      {/* DANGER ZONE */}
      <Text style={styles.sectionTitle}>Danger zone</Text>
      <View style={styles.card}>
        <Row
          icon="trash-outline"
          title="Delete account"
          subtitle="Permanently delete your account and data"
          danger
          onPress={handleDeleteAccount}
        />
      </View>

      <Text style={styles.footerHint}>
        Tip: For true “log out all devices” and “active sessions”, add a sessions table and revoke tokens server-side.
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
    paddingHorizontal: 16,
    paddingTop: 18,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 14,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.cardBg,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.text,
  },
  headerSubtitle: {
    fontSize: 12,
    color: COLORS.textHint,
    marginTop: 2,
  },

  sectionTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.textMuted,
    marginBottom: 10,
    marginTop: 10,
    letterSpacing: 0.2,
  },

  card: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.cardBg,
    overflow: 'hidden',
  },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: 'transparent',
    backgroundColor: COLORS.cardBg,
  },
  rowIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.chipBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowTitle: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: '900',
  },
  rowSubtitle: {
    color: COLORS.textHint,
    fontSize: 12,
    marginTop: 2,
    lineHeight: 16,
  },

  rightPill: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: COLORS.chipBg,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  rightPillText: {
    color: COLORS.textMuted,
    fontSize: 11,
    fontWeight: '800',
  },

  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    opacity: 0.7,
    marginLeft: 12,
    marginRight: 12,
  },

  footerHint: {
    marginTop: 14,
    color: COLORS.textHint,
    fontSize: 12,
    lineHeight: 18,
    opacity: 0.9,
  },
});

export default SecurityScreen;
