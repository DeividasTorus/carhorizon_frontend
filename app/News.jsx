import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';

import { useAppContext } from '../context/AppContext'; // jei nenaudoji – gali ištrinti
import PostCard from '../components/PostCard';

const MOCK_NEWS_POSTS = [
  {
    id: 1,
    title: 'Naujas Elektrinis „Volt X“ Modelis Jau Čia!',
    body: 'Šiandien pristatomas visiškai naujas „Volt X“ elektromobilis...',
    author: 'AutoReview LT',
    date: 'Prieš 3 val.',
    imageUrls: [
      'https://images.pexels.com/photos/1149831/pexels-photo-1149831.jpeg',
      'https://images.pexels.com/photos/120049/pexels-photo-120049.jpeg',
      'https://images.pexels.com/photos/3311574/pexels-photo-3311574.jpeg',
    ],
    likes: 214,
    comments: 36,
    shares: 18,
    isFollowing: false,
    type: 'official',
  },
  {
    id: 2,
    title:
      'TOP 5 Modifikacijos, Kurios Tikrai Pagerina Automobilio Dinamiką',
    body: 'Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry\'s standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing software like Aldus PageMaker including versions of Lorem Ipsum..',
    author: 'Garage Dev',
    date: 'Vakar',
    imageUrls: [
      'https://images.pexels.com/photos/1149137/pexels-photo-1149137.jpeg',
      'https://images.pexels.com/photos/1031355/pexels-photo-1031355.jpeg',
      'https://images.pexels.com/photos/1402787/pexels-photo-1402787.jpeg',
      'https://images.pexels.com/photos/112460/pexels-photo-112460.jpeg',
    ],
    likes: 389,
    comments: 52,
    shares: 41,
    isFollowing: true,
    type: 'community',
  },
  {
    id: 4,
    title: 'Mano 3 Serijos BMW Projektas: Nuo Stok iki Stance',
    body: 'Pagaliau baigiau montuoti naujus coiloverius ir ratlankius! Pridedu nuotraukas.',
    author: 'BMW_Fan_LT',
    date: 'Šiandien',
    imageUrls: [
      'https://images.pexels.com/photos/1149831/pexels-photo-1149831.jpeg',
    ],
    likes: 450,
    comments: 78,
    shares: 63,
    isFollowing: true,
    type: 'community',
  },
  {
    id: 5,
    title: 'Drift Sezono Atidarymas — Nauji Reikalavimai Dalyviams',
    body: '2025 metų drift sezono taisyklės keičiasi: įvesti griežtesni saugos narvelių standartai.',
    author: 'Racing Hub',
    date: 'Šiandien',
    imageUrls: [
      'https://images.pexels.com/photos/1149831/pexels-photo-1149831.jpeg',
    ],
    likes: 450,
    comments: 78,
    shares: 63,
    isFollowing: false,
    type: 'official',
  },
];

const FILTERS = {
  OFFICIAL: 'official',
  FOLLOWING: 'following',
};

const News = () => {
  const [mockPosts, setMockPosts] = useState(MOCK_NEWS_POSTS);
  const [refreshing, setRefreshing] = useState(false);
  const [openMenuPostId, setOpenMenuPostId] = useState(null);
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { followingFeed, fetchFollowingFeed, activeCarId, newsFilter, setNewsFilter, unreadNotificationsCount } = useAppContext();

  console.log('📰 News component render, unreadNotificationsCount:', unreadNotificationsCount);

  const selectedFilter = newsFilter;

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchFollowingFeed();
    await new Promise((resolve) => setTimeout(resolve, 500));
    setRefreshing(false);
  };

  useEffect(() => {
    fetchFollowingFeed();
  }, [activeCarId]); // Refetch kai pasikeičia aktyvi mašina

  // Refetch when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      fetchFollowingFeed();
    }, [activeCarId])
  );

  const postsToRender = selectedFilter === FILTERS.OFFICIAL
    ? mockPosts
    : followingFeed;

  const handleAddPost = () => {
    router.push('/PostAdd');
  };

  const handleToggleMenu = (postId) => {
    setOpenMenuPostId((prev) => (prev === postId ? null : postId));
  };

  const handleCloseMenu = () => {
    setOpenMenuPostId(null);
  };

  const renderFilterAndAddButton = () => (
    <View style={styles.filterAndAddContainer}>
      <TouchableOpacity style={styles.addButton} onPress={handleAddPost}>
        <Ionicons name="add-circle" size={60} color="#38bdf8" />
      </TouchableOpacity>

      <View style={styles.filterGroup}>
        <TouchableOpacity
          style={[
            styles.filterButton,
            selectedFilter === FILTERS.OFFICIAL && styles.filterButtonActive,
          ]}
          onPress={() => setNewsFilter(FILTERS.OFFICIAL)}
        >
          <Ionicons
            name={
              selectedFilter === FILTERS.OFFICIAL
                ? 'document-text'
                : 'document-text-outline'
            }
            size={20}
            color={selectedFilter === FILTERS.OFFICIAL ? '#0f172a' : '#94a3b8'}
            style={styles.iconMargin}
          />
          <Text
            style={[
              styles.filterText,
              selectedFilter === FILTERS.OFFICIAL && styles.filterTextActive,
            ]}
          >
            Naujienos
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.filterButton,
            selectedFilter === FILTERS.FOLLOWING && styles.filterButtonActive,
            styles.filterButtonMargin,
          ]}
          onPress={() => setNewsFilter(FILTERS.FOLLOWING)}
        >
          <Ionicons
            name={
              selectedFilter === FILTERS.FOLLOWING ? 'heart' : 'heart-outline'
            }
            size={20}
            color={selectedFilter === FILTERS.FOLLOWING ? '#0f172a' : '#94a3b8'}
            style={styles.iconMargin}
          />
          <Text
            style={[
              styles.filterText,
              selectedFilter === FILTERS.FOLLOWING && styles.filterTextActive,
            ]}
          >
            Sekami
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderHeader = () => (
    <View style={styles.headerContainer}>
      <View style={styles.topBar}>
        <View style={styles.headerTitleGroup}>
          <View style={styles.mainIconWrapper}>
            <Ionicons name="newspaper-outline" size={26} color="#38bdf8" />
          </View>
          <Text style={styles.mainTitleSmall}>Naujienų Srautas</Text>
        </View>
        <View style={styles.iconGroup}>
          <TouchableOpacity
            style={styles.topBarIcon}
            onPress={() => router.push('/Notifications')}
          >
            <Ionicons name="notifications-outline" size={27} color="#f8fafc" />
            {unreadNotificationsCount > 0 && (
              <View style={styles.notificationBadge}>
                <Text style={styles.notificationBadgeText}>
                  {unreadNotificationsCount > 9 ? '9+' : unreadNotificationsCount}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>
      {renderFilterAndAddButton()}
    </View>
  );

  const renderEmptyComponent = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="cloud-offline-outline" size={64} color="#475569" />
      <Text style={styles.emptyText}>
        {selectedFilter === FILTERS.OFFICIAL
          ? 'Šiuo metu nėra jokių naujų oficialių naujienų.'
          : 'Jūs dar nieko nesekate. Sekite draugus, kad matytumėte jų projektus, įrašus ar prašytumėte pagalbos!'}
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <FlatList
        data={postsToRender}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <PostCard
            post={item}
            isMenuVisible={openMenuPostId === item.id}
            onToggleMenu={() => handleToggleMenu(item.id)}
            onCloseMenu={handleCloseMenu}
          />
        )}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmptyComponent}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        onScrollBeginDrag={handleCloseMenu}   // <- scroll pradžia uždaro dropdown
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#38bdf8"
            progressViewOffset={insets.top + 50}
          />
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#020617',
    paddingTop: 20,
  },
  listContent: {
    paddingHorizontal: 10,
    paddingBottom: 40,
  },
  headerContainer: {
    marginBottom: 16,
    backgroundColor: '#020617',
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  mainIconWrapper: {
    width: 44,
    height: 44,
    borderRadius: 999,
    backgroundColor: 'rgba(56,189,248,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  mainTitleSmall: {
    fontSize: 20,
    fontWeight: '800',
    color: '#e5e7eb',
  },
  iconGroup: {
    flexDirection: 'row',
  },
  topBarIcon: {
    marginLeft: 20,
    position: 'relative',
  },
  notificationBadge: {
    position: 'absolute',
    top: -2,
    right: -4,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ef4444',
    borderWidth: 1,
    borderColor: '#020617',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 80,
    paddingHorizontal: 40,
    opacity: 0.9,
  },
  emptyText: {
    marginTop: 16,
    color: '#cbd5e1',
    fontSize: 15,
    textAlign: 'center',
  },

  filterAndAddContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    marginTop: 8,
  },
  filterGroup: {
    flexDirection: 'row',
    flexShrink: 1,
  },
  filterButton: {
    flexDirection: 'row',
    paddingHorizontal: 15,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 999,
    backgroundColor: '#1e293b',
  },
  filterButtonMargin: {
    marginLeft: 10,
  },
  filterButtonActive: {
    backgroundColor: '#38bdf8',
    shadowColor: '#38bdf8',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 5,
    elevation: 5,
  },
  iconMargin: {
    marginRight: 4,
  },
  filterText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#94a3b8',
  },
  filterTextActive: {
    color: '#0f172a',
    fontWeight: '700',
  },
  addButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 15,
  },
  notificationBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#ef4444',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 5,
  },
  notificationBadgeText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700',
  },
});

export default News;

