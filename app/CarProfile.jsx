import React, { useState, useEffect } from 'react';
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
  ScrollView,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useLocalSearchParams, useNavigation, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAppContext } from '../context/AppContext';
import LicensePlate from '../components/LicensePlate';
import { API_URL } from '../config/env';
import COLORS from '../config/colors';

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
      const carRes = await fetch(`${API_URL}/api/cars/${carId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const carData = await carRes.json().catch(() => ({}));

      if (carRes.ok && carData) {
        const carInfo = carData.car || carData;
        setCar(carInfo);
        if (carInfo.stats) {
          setFollowersCount(carInfo.stats.followers_count || 0);
        }
      }

      const postsRes = await fetch(`${API_URL}/api/posts/car/${carId}?limit=50`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const postsData = await postsRes.json().catch(() => ({}));
      const postsList = postsData.posts || (Array.isArray(postsData) ? postsData : []);
      setPosts(postsList);

      if (activeCarId) {
        const followRes = await fetch(
          `${API_URL}/api/cars/${carId}/follow-status?activeCarId=${activeCarId}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
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
      const res = await fetch(`${API_URL}/api/cars/${carId}/${endpoint}`, {
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
      const carAvatarUrl = car.avatar_url ? `${API_URL}${car.avatar_url}` : null;
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
        <ActivityIndicator size="large" color={COLORS.primary2} />
        <Text style={styles.loadingText}>Kraunama...</Text>
      </View>
    );
  }

  if (!car) {
    return (
      <View style={[styles.container, styles.centered]}>
        <StatusBar style="light" />
        <Ionicons name="car-sport-outline" size={64} color={COLORS.gray} />
        <Text style={styles.emptyText}>Automobilis nerastas</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>Grįžti</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const isOwnCar = car.owner_id === user?.id;

  const carAvatarUrl = car.avatar_url ? `${API_URL}${car.avatar_url}` : null;
  const carInitial = car.plate?.[0]?.toUpperCase() || 'C';

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* TOP BAR / HEADER */}
        <View style={[styles.backRow]}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={26} color={COLORS.text} />
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
            {car.model && <Text style={styles.subtitle}>{car.model}</Text>}
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
                style={[
                  styles.actionButton,
                  styles.followButton,
                  isFollowing && styles.followingButton,
                ]}
                onPress={handleFollow}
              >
                <Ionicons
                  name={isFollowing ? 'heart' : 'heart-outline'}
                  size={20}
                  color={isFollowing ? COLORS.rose : COLORS.text}
                />
                <Text style={styles.actionButtonText}>{isFollowing ? 'Sekamas' : 'Sekti'}</Text>
              </TouchableOpacity>

              <TouchableOpacity style={[styles.actionButton, styles.messageButton]} onPress={handleMessage}>
                <Ionicons name="chatbubble-outline" size={20} color={COLORS.dark} />
                <Text style={[styles.actionButtonText, { color: COLORS.dark }]}>Rašyti</Text>
              </TouchableOpacity>
            </View>
          )}

          {isOwnCar && (
            <View style={styles.ownCarBadge}>
              <Ionicons name="checkmark-circle" size={18} color={COLORS.emerald} />
              <Text style={styles.ownCarText}>Tai tavo automobilis</Text>
            </View>
          )}
        </View>

        {/* Posts Section */}
        <View style={styles.postsSection}>
          <View style={styles.postsSectionHeader}>
            <Ionicons name="grid-outline" size={24} color={COLORS.primary2} />
          </View>

          {posts.length === 0 ? (
            <View style={styles.emptyPosts}>
              <Ionicons name="images-outline" size={48} color={COLORS.gray} />
              <Text style={styles.emptyPostsText}>
                {isOwnCar ? 'Tu dar neturi jokių įrašų. Sukurk pirmą!' : 'Šis automobilis dar neturi įrašų'}
              </Text>
            </View>
          ) : (
            <View style={styles.postsGrid}>
              {posts
                .map((post) => {
                  if (!post || !post.id) return null;

                  const images = Array.isArray(post.images) ? post.images : [];
                  const firstImage = images[0];

                  let imageUrl = null;
                  if (firstImage) {
                    const imagePath = typeof firstImage === 'string' ? firstImage : firstImage.image_url;
                    if (imagePath) {
                      imageUrl = imagePath.startsWith('http') ? imagePath : `${API_URL}${imagePath}`;
                    }
                  }

                  return (
                    <TouchableOpacity
                      key={post.id}
                      style={styles.postGridItem}
                      onPress={() =>
                        router.push({
                          pathname: '/PostDetail',
                          params: { postId: post.id, carId: carId },
                        })
                      }
                    >
                      {imageUrl ? (
                        <Image source={{ uri: imageUrl }} style={styles.postGridImage} resizeMode="cover" />
                      ) : (
                        <View style={styles.postGridPlaceholder}>
                          <Ionicons name="image-outline" size={32} color={COLORS.gray} />
                        </View>
                      )}

                      {images.length > 1 && (
                        <View style={styles.postMultipleIndicator}>
                          <Ionicons name="copy-outline" size={16} color="#fff" />
                        </View>
                      )}
                    </TouchableOpacity>
                  );
                })
                .filter(Boolean)}
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
    backgroundColor: COLORS.dark,
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

  headerInfo: { flex: 1 },

  subtitle: {
    fontSize: 12,
    color: COLORS.muted,
    marginTop: 2,
  },

  userContainer: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 24,
    backgroundColor: COLORS.dark,
  },

  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },

  avatarWrapper: { marginRight: 24 },

  avatar: {
    width: 90,
    height: 90,
    borderRadius: 45,
  },

  avatarPlaceholder: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: 'rgba(14,165,233,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(14,165,233,0.22)',
  },

  avatarInitial: {
    fontSize: 36,
    fontWeight: '700',
    color: COLORS.primary2,
  },

  statsRow: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-around',
  },

  statItem: { alignItems: 'center' },

  statNumber: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 4,
  },

  statLabel: {
    fontSize: 12,
    color: COLORS.muted,
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
    backgroundColor: 'rgba(14,165,233,0.14)',
    borderWidth: 1,
    borderColor: COLORS.primary2,
  },

  followingButton: {
    backgroundColor: 'rgba(244,63,94,0.14)',
    borderColor: COLORS.rose,
  },

  messageButton: {
    backgroundColor: COLORS.primary2,
  },

  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },

  ownCarBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(16,185,129,0.14)',
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6,
    marginTop: 8,
    borderWidth: 1,
    borderColor: 'rgba(16,185,129,0.22)',
  },

  ownCarText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.emerald,
  },

  profileInfo: {
    marginTop: 0,
    marginBottom: 10,
  },

  bioSection: {
    width: '100%',
    marginBottom: 12,
  },

  bioText: {
    fontSize: 14,
    color: 'rgba(226,232,240,0.88)',
    lineHeight: 20,
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

  postsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
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
    backgroundColor: COLORS.dark2,
  },

  postGridPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: COLORS.dark2,
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
    color: COLORS.muted,
    textAlign: 'center',
    marginTop: 12,
  },

  loadingText: {
    fontSize: 14,
    color: COLORS.muted,
    marginTop: 12,
  },

  emptyText: {
    fontSize: 16,
    color: COLORS.muted,
    marginTop: 12,
    marginBottom: 20,
  },

  backButton: {
    backgroundColor: COLORS.primary2,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },

  backButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.dark,
  },
});

export default CarProfile;
