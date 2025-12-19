import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  ScrollView,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from 'expo-router';
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

const BlockedUsers = () => {
  const navigation = useNavigation();
  const {
    blockedUsers,          // optional (jei turėsi)
    fetchBlockedUsers,     // optional
    unblockUser,           // optional
  } = useAppContext();

  // MVP fallback list (kol neturi backend)
  const [localMock, setLocalMock] = useState(
    Array.isArray(blockedUsers) ? blockedUsers : []
  );

  const [query, setQuery] = useState('');

  const data = Array.isArray(blockedUsers) ? blockedUsers : localMock;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return data;
    return data.filter((u) => {
      const name = (u.name || u.username || '').toLowerCase();
      const email = (u.email || '').toLowerCase();
      const plate = (u.plate || u.carPlate || '').toLowerCase();
      return name.includes(q) || email.includes(q) || plate.includes(q);
    });
  }, [data, query]);

  const handleRefresh = async () => {
    if (typeof fetchBlockedUsers !== 'function') {
      Alert.alert('Blocked users', 'Coming soon: connect blocked users to backend.');
      return;
    }
    try {
      await fetchBlockedUsers();
    } catch (e) {
      console.log('fetchBlockedUsers error', e);
      Alert.alert('Klaida', e?.message || 'Nepavyko gauti blocked users');
    }
  };

  const handleUnblock = async (user) => {
    Alert.alert(
      'Unblock user?',
      'This user will be able to interact with you again.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Unblock',
          style: 'destructive',
          onPress: async () => {
            try {
              if (typeof unblockUser === 'function') {
                await unblockUser(user.id);
              } else {
                // fallback: lokalus UI
                setLocalMock((prev) => prev.filter((x) => String(x.id) !== String(user.id)));
              }
            } catch (e) {
              console.log('unblockUser error', e);
              Alert.alert('Klaida', e?.message || 'Nepavyko atblokuoti vartotojo');
            }
          },
        },
      ]
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
          <Text style={styles.headerTitle}>Blocked users</Text>
          <Text style={styles.headerSubtitle}>Manage who can interact with you</Text>
        </View>

        <TouchableOpacity onPress={handleRefresh} style={styles.refreshBtn} activeOpacity={0.85}>
          <Ionicons name="refresh-outline" size={18} color={COLORS.textMuted} />
        </TouchableOpacity>
      </View>

      {/* SEARCH */}
      <View style={styles.searchWrap}>
        <Ionicons name="search-outline" size={18} color={COLORS.textHint} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search blocked users..."
          placeholderTextColor={COLORS.textHint}
          style={styles.searchInput}
          autoCapitalize="none"
          autoCorrect={false}
        />
        {!!query && (
          <TouchableOpacity onPress={() => setQuery('')} style={styles.clearBtn} activeOpacity={0.85}>
            <Ionicons name="close-circle" size={18} color={COLORS.textHint} />
          </TouchableOpacity>
        )}
      </View>

      {/* LIST */}
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }}>
        {filtered.length === 0 ? (
          <View style={styles.emptyCard}>
            <View style={styles.emptyIcon}>
              <Ionicons name="ban-outline" size={22} color={COLORS.textMuted} />
            </View>
            <Text style={styles.emptyTitle}>No blocked users</Text>
            <Text style={styles.emptySub}>
              You haven’t blocked anyone yet. When you do, they’ll appear here.
            </Text>
          </View>
        ) : (
          <View style={styles.card}>
            {filtered.map((u, idx) => {
              const title = u.name || u.username || u.email || 'User';
              const subtitle = u.email || u.plate || u.carPlate || '';
              return (
                <View key={`${u.id ?? idx}`}>
                  <View style={styles.row}>
                    <View style={styles.avatar}>
                      <Ionicons name="person-outline" size={18} color={COLORS.text} />
                    </View>

                    <View style={{ flex: 1 }}>
                      <Text style={styles.rowTitle} numberOfLines={1}>
                        {title}
                      </Text>
                      {!!subtitle && (
                        <Text style={styles.rowSub} numberOfLines={1}>
                          {subtitle}
                        </Text>
                      )}
                    </View>

                    <TouchableOpacity
                      activeOpacity={0.85}
                      onPress={() => handleUnblock(u)}
                      style={styles.unblockBtn}
                    >
                      <Text style={styles.unblockText}>Unblock</Text>
                    </TouchableOpacity>
                  </View>

                  {idx !== filtered.length - 1 && <View style={styles.divider} />}
                </View>
              );
            })}
          </View>
        )}

        <Text style={styles.footerHint}>
          Tip: Blocking prevents chats/follows/comments depending on your rules.
        </Text>
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
  refreshBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.cardBg,
  },
  headerTitle: { fontSize: 20, fontWeight: '800', color: COLORS.text },
  headerSubtitle: { fontSize: 12, color: COLORS.textHint, marginTop: 2 },

  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 14,
    backgroundColor: COLORS.cardBg,
    paddingHorizontal: 12,
    height: 48,
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    color: COLORS.text,
    fontSize: 14,
    fontWeight: '700',
  },
  clearBtn: {
    width: 34,
    height: 34,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
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
  },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 14,
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
  rowSub: {
    color: COLORS.textHint,
    fontSize: 12,
    marginTop: 2,
  },

  unblockBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: COLORS.dangerBorder,
    backgroundColor: COLORS.dangerBg,
  },
  unblockText: {
    color: COLORS.dangerText,
    fontSize: 12,
    fontWeight: '900',
  },

  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    opacity: 0.7,
    marginLeft: 12,
    marginRight: 12,
  },

  emptyCard: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.cardBg,
    padding: 16,
    alignItems: 'center',
  },
  emptyIcon: {
    width: 44,
    height: 44,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.chipBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  emptyTitle: {
    color: COLORS.text,
    fontSize: 15,
    fontWeight: '900',
  },
  emptySub: {
    color: COLORS.textHint,
    fontSize: 12,
    lineHeight: 18,
    marginTop: 6,
    textAlign: 'center',
  },

  footerHint: {
    marginTop: 14,
    color: COLORS.textHint,
    fontSize: 12,
    lineHeight: 18,
    opacity: 0.9,
  },
});

export default BlockedUsers;
