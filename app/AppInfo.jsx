import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from 'expo-router';
import * as Application from 'expo-application';

const COLORS = {
  bg: '#020617',
  text: '#e5e7eb',
  textMuted: '#9ca3af',
  textHint: '#6b7280',
  border: '#1f2937',
  cardBg: '#02081f',
  chipBg: '#0b122a',
};

const AppInfo = () => {
  const navigation = useNavigation();

  const appName = Application.applicationName || 'App';
  const version = Application.nativeApplicationVersion || '-';
  const build = Application.nativeBuildVersion || '-';
  const bundleId = Application.applicationId || '-';

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={COLORS.text} />
        </TouchableOpacity>

        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>App info</Text>
          <Text style={styles.headerSubtitle}>Version & application details</Text>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }}>
        {/* TOP CARD */}
        <View style={styles.heroCard}>
          <View style={styles.heroIcon}>
            <Ionicons name="sparkles-outline" size={22} color={COLORS.text} />
          </View>

          <View style={{ flex: 1 }}>
            <Text style={styles.heroTitle}>{appName}</Text>
            <Text style={styles.heroSub}>
              v{version} • build {build}
            </Text>
          </View>

          <View style={styles.chip}>
            <Text style={styles.chipText}>{Platform.OS.toUpperCase()}</Text>
          </View>
        </View>

        {/* DETAILS */}
        <Text style={styles.sectionTitle}>Details</Text>
        <View style={styles.card}>
          <InfoRow label="App name" value={appName} />
          <Divider />
          <InfoRow label="Version" value={version} />
          <Divider />
          <InfoRow label="Build" value={build} />
          <Divider />
          <InfoRow label="Bundle ID" value={bundleId} />
          <Divider />
          <InfoRow label="Platform" value={`${Platform.OS} (${Platform.Version})`} />
        </View>

        {/* ABOUT */}
        <Text style={styles.sectionTitle}>About</Text>
        <View style={styles.card}>
          <Text style={styles.paragraph}>
            Thanks for using our app! We’re continuously improving performance, security, and
            user experience.
          </Text>
          <Text style={[styles.paragraph, { marginTop: 10 }]}>
            If you notice any issues or have suggestions, please contact support.
          </Text>
        </View>

        {/* ACKNOWLEDGEMENTS */}
        <Text style={styles.sectionTitle}>Acknowledgements</Text>
        <View style={styles.card}>
          <Text style={styles.paragraph}>
            This app uses open-source libraries including React Native and Expo.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
};

const InfoRow = ({ label, value }) => {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue} numberOfLines={1}>
        {value}
      </Text>
    </View>
  );
};

const Divider = () => <View style={styles.divider} />;

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

  heroCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.cardBg,
    marginBottom: 14,
  },
  heroIcon: {
    width: 40,
    height: 40,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.chipBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroTitle: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '900',
  },
  heroSub: {
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
    fontWeight: '800',
    letterSpacing: 0.2,
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
    padding: 14,
  },

  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    paddingVertical: 10,
  },
  infoLabel: {
    color: COLORS.textHint,
    fontSize: 12,
    fontWeight: '700',
  },
  infoValue: {
    color: COLORS.text,
    fontSize: 12,
    fontWeight: '800',
    maxWidth: '60%',
    textAlign: 'right',
  },

  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    opacity: 0.7,
  },

  paragraph: {
    color: COLORS.textHint,
    fontSize: 13,
    lineHeight: 20,
  },
});

export default AppInfo;
