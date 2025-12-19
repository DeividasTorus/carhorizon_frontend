import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView } from 'react-native';
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

  dangerIcon: '#fecaca',
  dangerText: '#fee2e2',

  chipBg: '#0b122a',
};

const UserSettings = () => {
  const navigation = useNavigation();
  const router = useRouter();
  const { logout, user } = useAppContext();

  const handleLogout = async () => {
    try {
      await logout();
      router.replace('/Login');
    } catch (e) {
      console.log('logout error', e);
      Alert.alert('Klaida', e?.message || 'Nepavyko atsijungti');
    }
  };

  const Row = ({ icon, title, subtitle, onPress, danger }) => {
    return (
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={onPress}
        style={[
          styles.row,
          danger && { borderColor: '#3f1d1d', backgroundColor: '#070a16' },
        ]}
      >
        <View style={[styles.rowIconWrap, danger && { backgroundColor: '#200b0b' }]}>
          <Ionicons name={icon} size={18} color={danger ? COLORS.dangerIcon : COLORS.text} />
        </View>

        <View style={styles.rowTextWrap}>
          <Text style={[styles.rowTitle, danger && { color: COLORS.dangerText }]}>{title}</Text>
          {!!subtitle && <Text style={styles.rowSubtitle}>{subtitle}</Text>}
        </View>

        <Ionicons
          name="chevron-forward"
          size={18}
          color={danger ? COLORS.dangerIcon : COLORS.textHint}
        />
      </TouchableOpacity>
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
          <Text style={styles.headerTitle}>Settings</Text>
          <Text style={styles.headerSubtitle}>Manage your account & preferences</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* ACCOUNT */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>

          <View style={styles.card}>
            <View style={styles.accountTop}>
              <View style={styles.avatar}>
                <Ionicons name="person" size={18} color={COLORS.text} />
              </View>

              <View style={{ flex: 1 }}>
                <Text style={styles.accountName}>{user?.email ? 'Signed in' : 'Guest'}</Text>
                <Text style={styles.accountEmail}>{user?.email || '-'}</Text>
              </View>

              <View style={styles.chip}>
                <Text style={styles.chipText}>Active</Text>
              </View>
            </View>

            <View style={styles.divider} />

            <Row
              icon="key-outline"
              title="Change password"
              subtitle="Update your account password"
              onPress={() => router.push('/ChangePassword')}
            />
          </View>
        </View>

        {/* PRIVACY & SAFETY */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Privacy & safety</Text>

          <View style={styles.card}>
            <Row
              icon="ban-outline"
              title="Blocked users"
              subtitle="Manage who can interact with you"
              onPress={() => router.push('/BlockedUsers')}
            />
            <View style={styles.divider} />
            <Row
              icon="shield-checkmark-outline"
              title="Security"
              subtitle="Sessions, devices, and protection"
              onPress={() => router.push('/Security')}
            />
          </View>
        </View>

        {/* ABOUT */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About</Text>

          <View style={styles.card}>
            <Row
              icon="document-text-outline"
              title="Privacy Policy"
              subtitle="How we handle your data"
              onPress={() => router.push('/PrivacyPolicy')}
            />
            <View style={styles.divider} />
            <Row
              icon="reader-outline"
              title="Terms of Use"
              subtitle="Rules for using the app"
              onPress={() => router.push('/TermsOfUse')}
            />
            <View style={styles.divider} />
            <Row
              icon="information-circle-outline"
              title="App info"
              subtitle="Version, acknowledgements"
              onPress={() => router.push('/AppInfo')}
            />
          </View>
        </View>

        {/* DANGER ZONE */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Danger zone</Text>

          {/* mažesnis, modernus logout */}
          <TouchableOpacity activeOpacity={0.85} onPress={handleLogout} style={styles.logoutBtn}>
            <Ionicons name="log-out-outline" size={16} color={COLORS.dangerIcon} />
            <Text style={styles.logoutBtnText}>Log out</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
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

  content: {
    paddingBottom: 28,
  },

  section: {
    marginTop: 14,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.textMuted,
    marginBottom: 10,
    letterSpacing: 0.2,
  },

  card: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.cardBg,
    overflow: 'hidden',
  },

  accountTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: '#0b122a',
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  accountName: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: '800',
  },
  accountEmail: {
    color: COLORS.textHint,
    fontSize: 12,
    marginTop: 2,
  },
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: COLORS.chipBg,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  chipText: {
    color: COLORS.textMuted,
    fontSize: 11,
    fontWeight: '700',
  },

  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    opacity: 0.7,
  },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  rowIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 12,
    backgroundColor: '#0b122a',
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowTextWrap: {
    flex: 1,
  },
  rowTitle: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: '700',
  },
  rowSubtitle: {
    marginTop: 2,
    color: COLORS.textHint,
    fontSize: 12,
  },

  logoutBtn: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#3f1d1d',
    backgroundColor: '#070a16',
  },
  logoutBtnText: {
    color: COLORS.dangerText,
    fontSize: 13,
    fontWeight: '800',
  },
  dangerHint: {
    marginTop: 8,
    color: COLORS.textHint,
    fontSize: 12,
  },
});

export default UserSettings;

