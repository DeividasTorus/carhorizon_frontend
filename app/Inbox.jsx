// app/InboxScreen.jsx
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { useAppContext } from '../context/AppContext';
import LicensePlate from '../components/LicensePlate';
import CachedAvatar from '../components/CachedAvatar';
import { Ionicons } from '@expo/vector-icons';
import { API_URL } from '../config/env';
import COLORS from '../config/colors';

const InboxScreen = () => {
  const { inboxMessages, user, activeCarId, cars } = useAppContext();
  const router = useRouter();

  const myId = user?.id ? String(user.id) : null;
  const [showOnlyUnread, setShowOnlyUnread] = useState(false);

  const allThreads = Array.isArray(inboxMessages) ? inboxMessages : [];

  const filteredByCar = allThreads.filter((t) => {
    if (!myId) return false;

    const isOwner = String(t.owner_id) === myId;
    let myCarInThisChat = null;

    if (isOwner) {
      myCarInThisChat = t.car_id;
    } else if (String(t.other_user_id) === myId) {
      myCarInThisChat = t.initiator_car_id || null;
    }

    if (activeCarId == null) {
      return true;
    }

    if (!myCarInThisChat) {
      return true;
    }

    return String(myCarInThisChat) === String(activeCarId);
  });

  const filteredInbox = showOnlyUnread
    ? filteredByCar.filter((t) => !!t.has_unread)
    : filteredByCar;

  const unreadCount = filteredByCar.filter((t) => !!t.has_unread).length;

  const activeCar =
    activeCarId && Array.isArray(cars)
      ? cars.find((c) => String(c.id) === String(activeCarId))
      : null;

  const activeCarLabel = activeCar
    ? `${activeCar.plate}${activeCar.model ? ' · ' + activeCar.model : ''}`
    : 'Pasirinktas automobilis: Visi';

  const renderItem = ({ item }) => {
    const isOwner = myId && String(item.owner_id) === myId;

    const otherUserObj = item.other_user || null;
    const ownerObj = item.owner || null;

    const ownerId = item.owner_id ? String(item.owner_id) : null;
    const otherUserIdField = item.other_user_id ? String(item.other_user_id) : null;
    const otherParticipantId = myId && ownerId && otherUserIdField
      ? (String(ownerId) === myId ? otherUserIdField : ownerId)
      : otherUserIdField ||
        ownerId ||
        (otherUserObj?.id && String(otherUserObj.id)) ||
        (ownerObj?.id && String(ownerObj.id)) ||
        null;

    let otherAvatarPath = null;

    if (item.display_car_avatar_url) {
      otherAvatarPath = item.display_car_avatar_url;
    } else if (item.car?.avatar_url) {
      otherAvatarPath = item.car.avatar_url;
    } else if (item.other_car?.avatar_url) {
      otherAvatarPath = item.other_car.avatar_url;
    }

    if (!otherAvatarPath && otherUserObj?.car?.avatar_url) {
      otherAvatarPath = otherUserObj.car.avatar_url;
    }
    if (!otherAvatarPath && ownerObj?.car?.avatar_url) {
      otherAvatarPath = ownerObj.car.avatar_url;
    }

    let avatarUrl = null;
    if (otherAvatarPath) {
      if (/^https?:\/\//i.test(otherAvatarPath)) {
        avatarUrl = otherAvatarPath;
      } else {
        avatarUrl = `${API_URL}${otherAvatarPath}`;
      }
    }

    const carPlate = item.display_car_plate || '';
    const carModel = item.display_car_model || '';

    let otherCarId = null;
    if (item.other_car_id) {
      otherCarId = item.other_car_id;
    } else if (item.car_id && !isOwner) {
      otherCarId = item.car_id;
    } else if (item.initiator_car_id && isOwner) {
      otherCarId = item.initiator_car_id;
    } else if (item.car?.id) {
      otherCarId = item.car.id;
    } else if (item.other_car?.id) {
      otherCarId = item.other_car.id;
    }

    const hasUnread = !!item.has_unread;

    const title = carPlate || 'Kitas vairuotojas';

    const handlePress = () => {
      const chatId = item.id || item.chatId;
      if (!chatId) return;

      console.log('Inbox -> open chat', { chatId, isOwner, avatarUrl, otherCarId, item });

      router.push({
        pathname: `/Chat/${chatId}`,
        params: {
          id: String(chatId),
          carPlate,
          carModel,
          otherAvatar: avatarUrl,
          otherCarId: otherCarId ? String(otherCarId) : undefined,
        },
      });
    };

    return (
      <TouchableOpacity style={styles.card} onPress={handlePress}>
        <View style={styles.row}>
          <View style={styles.avatarWrapper}>
            <CachedAvatar
              remoteUrl={avatarUrl}
              size={60}
              borderRadius={15}
              placeholderInitial={carPlate?.[0]?.toUpperCase() || 'A'}
            />
            {hasUnread && <View style={styles.unreadDot} />}
          </View>

          <View style={styles.cardContent}>
            {carPlate ? (
              <View style={styles.plateRow}>
                <LicensePlate
                  plate={carPlate}
                  width={120}
                  height={25}
                  borderRadius={2}
                  style={{ marginBottom: 4 }}
                  textStyle={{
                    fontSize: 18,
                    letterSpacing: 1,
                    marginTop: 0,
                    marginLeft: 25,
                  }}
                />
                {!!carModel && (
                  <Text
                    style={[
                      styles.cardMeta,
                      hasUnread && styles.cardMetaUnread,
                    ]}
                    numberOfLines={1}
                  >
                    · {carModel}
                  </Text>
                )}
              </View>
            ) : (
              <Text
                style={[
                  styles.cardTitle,
                  hasUnread && styles.cardTitleUnread,
                ]}
                numberOfLines={1}
              >
                {title}
              </Text>
            )}

            <Text
              style={[
                styles.lastMessage,
                hasUnread && styles.lastMessageUnread,
              ]}
              numberOfLines={1}
            >
              {item.last_text || 'Kol kas nėra žinučių'}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.screen}>
      <StatusBar style="light" />

      <View style={styles.header}>
        <View style={styles.headerTitleRow}>
          <View style={styles.headerIconWrapper}>
            <Ionicons name="reader-outline" size={26} color={COLORS.primary2} />
          </View>
          <Text style={styles.headerTitle}>Pokalbiai</Text>
        </View>

        <View style={styles.headerControlsRow}>
          <View style={styles.activeCarPill}>
            <Text style={styles.activeCarLabel} numberOfLines={1}>
              {activeCarLabel}
            </Text>
          </View>

          <View style={styles.filterGroup}>
            <TouchableOpacity
              style={[
                styles.filterButton,
                !showOnlyUnread && styles.filterButtonActive,
              ]}
              onPress={() => setShowOnlyUnread(false)}
            >
              <Text
                style={[
                  styles.filterButtonText,
                  !showOnlyUnread && styles.filterButtonTextActive,
                ]}
              >
                Visi
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.filterButton,
                showOnlyUnread && styles.filterButtonActive,
              ]}
              onPress={() => setShowOnlyUnread(true)}
            >
              <Text
                style={[
                  styles.filterButtonText,
                  showOnlyUnread && styles.filterButtonTextActive,
                ]}
              >
                Neskaityti
              </Text>

              <View
                style={[
                  styles.filterBadge,
                  showOnlyUnread && styles.filterBadgeActive,
                ]}
              >
                <Text
                  style={[
                    styles.filterBadgeText,
                    showOnlyUnread && styles.filterBadgeTextActive,
                  ]}
                >
                  {unreadCount}
                </Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <FlatList
        data={filteredInbox}
        keyExtractor={(item, index) =>
          String(item.id ?? item.chatId ?? `${item.car_id}-${index}`)
        }
        renderItem={renderItem}
        contentContainerStyle={
          filteredInbox?.length ? styles.listContent : styles.emptyContainer
        }
        ListEmptyComponent={
          <Text style={styles.emptyText}>
            Kol kas nėra žinučių. Pradėkite pokalbį su kitu vairuotoju arba palaukite, kol kas nors Jums parašys.
          </Text>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.dark,          // '#020617'
    paddingHorizontal: 10,
    paddingTop: 20,
  },
  header: {
    marginBottom: 12,
  },

  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  headerIconWrapper: {
    width: 44,
    height: 44,
    borderRadius: 999,
    backgroundColor: 'rgba(56,189,248,0.18)', // original rgba kept
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.text,                    // '#e5e7eb'
  },

  headerControlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 10,
  },
  activeCarPill: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,            // '#1f2937'
    backgroundColor: COLORS.panel,         // '#02081f'
    justifyContent: 'center',
  },
  activeCarLabel: {
    color: COLORS.text,                    // '#e5e7eb'
    fontSize: 13,
    fontWeight: '600',
  },
  filterGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: COLORS.border,            // '#1f2937'
    backgroundColor: COLORS.dark,          // '#020617'
  },
  filterButtonActive: {
    backgroundColor: COLORS.primary,       // '#0ea5e9'
    borderColor: COLORS.primary,           // '#0ea5e9'
  },
  filterButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.muted,                   // '#9ca3af'
  },
  filterButtonTextActive: {
    color: COLORS.ink,                     // '#0b1120'
  },
  filterBadge: {
    marginLeft: 6,
    minWidth: 18,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: COLORS.border,            // '#1f2937'
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterBadgeActive: {
    borderColor: COLORS.ink,               // '#0b1120'
    backgroundColor: COLORS.ink,           // '#0b1120'
  },
  filterBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textStrong,              // '#f9fafb'
  },
  filterBadgeTextActive: {
    color: COLORS.textStrong,              // '#f9fafb'
  },
  listContent: {
    paddingBottom: 24,
  },
  emptyContainer: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  emptyText: {
    textAlign: 'center',
    color: COLORS.gray,                    // '#6b7280'
    fontSize: 14,
  },
  card: {
    padding: 5,
    marginBottom: 10,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  avatarWrapper: {
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  unreadDot: {
    position: 'absolute',
    right: -2,
    top: -2,
    width: 15,
    height: 15,
    borderRadius: 5,
    backgroundColor: COLORS.rose,          // '#ef4444'
    borderWidth: 1,
    borderColor: COLORS.dark,              // '#020617'
  },
  cardContent: {
    flex: 1,
  },
  plateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '400',
    color: COLORS.textStrong,              // '#f9fafb'
  },
  cardTitleUnread: {
    fontWeight: '800',
    color: COLORS.white,                   // '#ffffff'
  },
  cardMeta: {
    fontSize: 12,
    color: COLORS.muted,                   // '#9ca3af'
  },
  cardMetaUnread: {
    fontWeight: '600',
    color: COLORS.text,                    // '#e5e7eb'
  },
  lastMessage: {
    marginTop: 4,
    fontSize: 13,
    color: COLORS.muted,                   // '#9ca3af'
  },
  lastMessageUnread: {
    fontWeight: '700',
    color: COLORS.slate100,                // '#f1f5f9'
  },
});

export default InboxScreen;
