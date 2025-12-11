import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  Alert,
  FlatList,
  Dimensions,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useLocalSearchParams, useNavigation, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAppContext } from '../context/AppContext';
import LicensePlate from '../components/LicensePlate';
import PostCard from '../components/PostCard';
import { BASE_URL } from '../utils/api';

const SCREEN_WIDTH = Dimensions.get('window').width;

const CarProfile = () => {
  const params = useLocalSearchParams();
  const navigation = useNavigation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, token, activeCarId, openChat } = useAppContext();

  const carIdParam = Array.isArray(params.carId) ? params.carId[0] : params.carId;
  const carId = carIdParam ? Number(carIdParam) : null;

  const [loading, setLoading] = useState(true);
  const [car, setCar] = useState(null);
  const [posts, setPosts] = useState([]);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followersCount, setFollowersCount] = useState(0);

  useEffect(() => {
    if (carId) {
      fetchCarProfile();
    }
  }, [carId]);

  const fetchCarProfile = async () => {
    setLoading(true);
    try {
      // Gauti automobilio informaciją
      const carRes = await fetch(`${BASE_URL}/cars/${carId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const carData = await carRes.json().catch(() => ({}));

      if (carRes.ok && carData) {
        // Backend grąžina { success, car: {...} }
        const carInfo = carData.car || carData;
        setCar(carInfo);
        // Išsaugoti stats jei yra
        if (carInfo.stats) {
          setFollowersCount(carInfo.stats.followers_count || 0);
        }
      }

      // Gauti automobilio postus
      const postsRes = await fetch(`${BASE_URL}/posts/car/${carId}?limit=50`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const postsData = await postsRes.json().catch(() => ({}));
      const postsList = postsData.posts || (Array.isArray(postsData) ? postsData : []);
      setPosts(postsList);

      // Gauti follow statusą (tik jei turime aktyvią mašiną)
      if (activeCarId) {
        const followRes = await fetch(`${BASE_URL}/cars/${carId}/follow-status?activeCarId=${activeCarId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const followData = await followRes.json().catch(() => ({}));
        setIsFollowing(followData.isFollowing || false);
      }
    } catch (e) {
      console.log('fetchCarProfile error', e);
      Alert.alert('Klaida', 'Nepavyko užkrauti automobilio profilio');
    } finally {
      setLoading(false);
    }
  };

  const handleFollow = async () => {
    if (!token || !carId || !activeCarId) {
      Alert.alert('Klaida', 'Pasirink aktyvią mašiną');
      return;
    }

    try {
      const endpoint = isFollowing ? 'unfollow' : 'follow';
      const res = await fetch(`${BASE_URL}/cars/${carId}/${endpoint}`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ activeCarId }),
      });

      if (res.ok) {
        setIsFollowing(!isFollowing);
        setFollowersCount((prev) => (isFollowing ? prev - 1 : prev + 1));
      }
    } catch (e) {
      console.log('handleFollow error', e);
      Alert.alert('Klaida', 'Nepavyko atnaujinti sekimo');
    }
  };

  const handleMessage = async () => {
    if (!car || !activeCarId) {
      Alert.alert('Klaida', 'Pasirink aktyvią mašiną');
      return;
    }

    if (isOwnCar) {
      Alert.alert('Info', 'Tai tavo automobilis');
      return;
    }

    try {
      // Sukurti arba rasti chatą su šiuo automobiliu
      // Pass car avatar_url for chat display
      const carAvatarUrl = car.avatar_url
        ? `http://192.168.1.165:4000${car.avatar_url}`
        : null;
      await openChat(car.id, car.plate, car.model || '', carAvatarUrl);
    } catch (e) {
      console.log('handleMessage error', e);
      Alert.alert('Klaida', 'Nepavyko atidaryti pokalbio');
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <StatusBar style="light" />
        <ActivityIndicator size="large" color="#38bdf8" />
        <Text style={styles.loadingText}>Kraunama...</Text>
      </View>
    );
  }

  if (!car) {
    return (
      <View style={[styles.container, styles.centered]}>
        <StatusBar style="light" />
        <Ionicons name="car-sport-outline" size={64} color="#475569" />
        <Text style={styles.emptyText}>Automobilis nerastas</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>Grįžti</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const isOwnCar = car.owner_id === user?.id;

  const carAvatarUrl = car.avatar_url
    ? `http://192.168.1.165:4000${car.avatar_url}`
    : null;
  const carInitial = car.plate?.[0]?.toUpperCase() || 'C';

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* TOP BAR / HEADER */}
        <View style={[styles.backRow]}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={26} color="#e5e7eb" />
          </TouchableOpacity>

          <View style={styles.headerInfo}>
            <LicensePlate
              plate={car.plate}
              width={120}
              height={25}
              borderRadius={2}
              style={{ marginBottom: 4 }}
              textStyle={{
                fontSize: 18,
                letterSpacing: 0,
                marginLeft: 25,
              }}
            />
            {car.model && (
              <Text style={styles.subtitle}>{car.model}</Text>
            )}
          </View>
        </View>

        {/* CAR HEADER */}
        <View style={styles.userContainer}>
          <View style={styles.profileHeader}>
            {/* Avatar */}
            <View style={styles.avatarWrapper}>
              {carAvatarUrl ? (
                <Image source={{ uri: carAvatarUrl }} style={styles.avatar} />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <Text style={styles.avatarInitial}>{carInitial}</Text>
                </View>
              )}
            </View>

            {/* Stats Row */}
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{posts.length}</Text>
                <Text style={styles.statLabel}>Įrašai</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{followersCount}</Text>
                <Text style={styles.statLabel}>Sekėjai</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{car.stats?.following_count || 0}</Text>
                <Text style={styles.statLabel}>Seka</Text>
              </View>
            </View>
          </View>

          {/* Bio Section */}
          <View style={styles.profileInfo}>
            {car.bio && (
              <View style={styles.bioSection}>
                <Text style={styles.bioText}>{car.bio}</Text>
              </View>
            )}
          </View>

          {/* Action Buttons */}
          {!isOwnCar && (
            <View style={styles.actionsRow}>
              <TouchableOpacity
                style={[styles.actionButton, styles.followButton, isFollowing && styles.followingButton]}
                onPress={handleFollow}
              >
                <Ionicons
                  name={isFollowing ? 'heart' : 'heart-outline'}
                  size={20}
                  color={isFollowing ? '#ef4444' : '#e5e7eb'}
                />
                <Text style={styles.actionButtonText}>
                  {isFollowing ? 'Sekamas' : 'Sekti'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionButton, styles.messageButton]}
                onPress={handleMessage}
              >
                <Ionicons name="chatbubble-outline" size={20} color="#0f172a" />
                <Text style={[styles.actionButtonText, { color: '#0f172a' }]}>
                  Rašyti
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {isOwnCar && (
            <View style={styles.ownCarBadge}>
              <Ionicons name="checkmark-circle" size={18} color="#10b981" />
              <Text style={styles.ownCarText}>Tai tavo automobilis</Text>
            </View>
          )}
        </View>

        {/* Posts Section */}
        <View style={styles.postsSection}>
          <View style={styles.postsSectionHeader}>
            <Ionicons name="grid-outline" size={24} color="#38bdf8" />
          </View>
          {posts.length === 0 ? (
            <View style={styles.emptyPosts}>
              <Ionicons name="images-outline" size={48} color="#475569" />
              <Text style={styles.emptyPostsText}>
                {isOwnCar
                  ? 'Tu dar neturi jokių įrašų. Sukurk pirmą!'
                  : 'Šis automobilis dar neturi įrašų'}
              </Text>
            </View>
          ) : (
            <View style={styles.postsGrid}>
              {posts.map((post) => {
                if (!post || !post.id) return null;

                const images = Array.isArray(post.images) ? post.images : [];
                const firstImage = images[0];

                // Handle both string and object image formats
                let imageUrl = null;
                if (firstImage) {
                  const imagePath = typeof firstImage === 'string'
                    ? firstImage
                    : firstImage.image_url;

                  if (imagePath) {
                    // Remove /api from BASE_URL for image paths
                    const baseUrlWithoutApi = BASE_URL.replace('/api', '');
                    imageUrl = imagePath.startsWith('http')
                      ? imagePath
                      : `${baseUrlWithoutApi}${imagePath}`;
                  }
                }

                return (
                  <TouchableOpacity
                    key={post.id}
                    style={styles.postGridItem}
                    onPress={() => router.push({
                      pathname: '/PostDetail',
                      params: { postId: post.id, carId: carId }
                    })}
                  >
                    {imageUrl ? (
                      <Image
                        source={{ uri: imageUrl }}
                        style={styles.postGridImage}
                        resizeMode="cover"
                      />
                    ) : (
                      <View style={styles.postGridPlaceholder}>
                        <Ionicons name="image-outline" size={32} color="#475569" />
                      </View>
                    )}

                    {/* Multiple images indicator */}
                    {images.length > 1 && (
                      <View style={styles.postMultipleIndicator}>
                        <Ionicons name="copy-outline" size={16} color="#fff" />
                      </View>
                    )}
                  </TouchableOpacity>
                );
              }).filter(Boolean)}
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#020617',
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  backRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 12,
    marginBottom: 12,
    marginTop: 20,
  },
  headerAvatar: {
    width: 50,
    height: 50,
    borderRadius: 15,
    marginRight: 4,
  },
  headerAvatarPlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 15,
    backgroundColor: 'rgba(56,189,248,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 4,
  },
  headerAvatarInitial: {
    fontSize: 20,
    fontWeight: '700',
    color: '#38bdf8',
  },
  headerInfo: {
    flex: 1,
  },
  subtitle: {
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 2,
  },
  userContainer: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 24,
    backgroundColor: '#020617',
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarWrapper: {
    marginRight: 24,
  },
  avatar: {
    width: 90,
    height: 90,
    borderRadius: 45,
  },
  avatarPlaceholder: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: 'rgba(56,189,248,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    fontSize: 36,
    fontWeight: '700',
    color: '#38bdf8',
  },
  statsRow: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 20,
    fontWeight: '700',
    color: '#e5e7eb',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#9ca3af',
  },

  actionsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 5,
    borderRadius: 8,
    gap: 8,
  },
  followButton: {
    backgroundColor: 'rgba(56, 189, 248, 0.2)',
    borderWidth: 1,
    borderColor: '#38bdf8',
  },
  followingButton: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    borderColor: '#ef4444',
  },
  messageButton: {
    backgroundColor: '#38bdf8',
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#e5e7eb',
  },
  ownCarBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6,
    marginTop: 8,
  },
  ownCarText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#10b981',
  },
  profileInfo: {
    marginTop: 0,
    marginBottom: 10,
  },
  bioUsername: {
    fontSize: 14,
    fontWeight: '700',
    color: '#e5e7eb',
    marginBottom: 6,
  },
  bioSection: {
    width: '100%',
    marginBottom: 12,
  },
  bioText: {
    fontSize: 14,
    color: '#cbd5e1',
    lineHeight: 20,
  },
  carInfoCard: {
    marginHorizontal: 16,
    marginTop: 16,
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.2)',
  },
  carInfoContent: {
    alignItems: 'center',
  },
  plateWrapper: {
    marginBottom: 12,
  },
  carModelLarge: {
    fontSize: 18,
    fontWeight: '600',
    color: '#e5e7eb',
    textAlign: 'center',
  },
  postsSection: {
    marginTop: 20,
    paddingBottom: 40,
  },
  postsSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 12,
    gap: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#e5e7eb',
  },
  postsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    itemAlign: 'center',
    justifyContent: 'center',
    gap: 1,
  },
  postGridItem: {
    width: (SCREEN_WIDTH - 3) / 3.3,
    height: (SCREEN_WIDTH - 4) / 3,
    position: 'relative',
  },
  postGridImage: {
    width: '100%',
    height: '100%',
    backgroundColor: '#1e293b',
  },
  postGridPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#1e293b',
    justifyContent: 'center',
    alignItems: 'center',
  },
  postMultipleIndicator: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
  emptyPosts: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyPostsText: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
    marginTop: 12,
  },
  loadingText: {
    fontSize: 14,
    color: '#9ca3af',
    marginTop: 12,
  },
  emptyText: {
    fontSize: 16,
    color: '#9ca3af',
    marginTop: 12,
    marginBottom: 20,
  },
  backButton: {
    backgroundColor: '#38bdf8',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  backButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0f172a',
  },
});

export default CarProfile;
