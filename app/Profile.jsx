// app/MyCars.jsx
import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  ScrollView,
  Dimensions,
  FlatList,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Image,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAppContext } from '../context/AppContext';
import { useRouter } from 'expo-router';
import LicensePlate from '../components/LicensePlate';
import ScreenLoader from '../components/ScreenLoader';
import CachedAvatar from '../components/CachedAvatar';
import { useSafeAreaInsets } from 'react-native-safe-area-context'; // Importuojame insets

const SCREEN_WIDTH = Dimensions.get('window').width;
const SNAP_INTERVAL = SCREEN_WIDTH;
const CARD_WIDTH = SCREEN_WIDTH - 24;

const Profile = () => {
  const router = useRouter();
  const insets = useSafeAreaInsets(); // Naudojame insets

  const {
    user,
    uploadCarAvatar,
    cars: rawCars,
    activeCarId,
    setActiveCar,
    initializing,
    carStats,
    fetchCarFollowersList,
    fetchCarFollowingList,
    fetchCarPosts,
  } = useAppContext();

  const [screenReady, setScreenReady] = useState(false);
  const preparedRef = useRef(false);

  const [listModalVisible, setListModalVisible] = useState(false);
  const [listModalType, setListModalType] = useState('followers');
  const [listModalData, setListModalData] = useState([]);
  const [listModalLoading, setListModalLoading] = useState(false);
  
  const [carPosts, setCarPosts] = useState([]);
  const [postsLoading, setPostsLoading] = useState(false);

  const flatListRef = useRef(null);
  const [selectingCarId, setSelectingCarId] = useState(null);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const AVATAR_SIZE = 90;

  useEffect(() => {
    if (initializing) return;
    if (preparedRef.current) return;

    const prepare = async () => {
      try {
        // papildomas preload, jei reikės
      } catch (e) {
        console.log('MyCars prepare error', e);
      } finally {
        preparedRef.current = true;
        setScreenReady(true);
      }
    };

    prepare();
  }, [initializing]);

  const cars = useMemo(() => {
    if (!rawCars || rawCars.length === 0) return [];

    if (!activeCarId) return rawCars;

    const idx = rawCars.findIndex((c) => c.id === activeCarId);
    if (idx === -1) return rawCars;

    const copy = [...rawCars];
    const [activeCar] = copy.splice(idx, 1);
    return [activeCar, ...copy];
  }, [rawCars, activeCarId]);

  const carouselData = useMemo(() => {
    const base = cars || [];
    return [...base, { id: '__add_card__', isAddCard: true }];
  }, [cars]);

  useEffect(() => {
    if (!cars || cars.length === 0) return;

    const indexToScroll = 0;
    setSelectedIndex(indexToScroll);

    if (flatListRef.current) {
      try {
        flatListRef.current.scrollToIndex({
          index: indexToScroll,
          animated: false,
        });
      } catch (e) {
        console.log('scrollToIndex error', e);
      }
    }
  }, [activeCarId, cars.length]);

  // If scrolled to "Add card", keep showing the last real car (active car)
  const selectedCar = useMemo(() => {
    if (!cars || cars.length === 0) return null;

    // If we're on "Add card" (last position), show active car
    if (selectedIndex >= cars.length) {
      const activeCar = cars.find(c => c.id === activeCarId);
      return activeCar || cars[0];
    }

    // Otherwise show the car at selectedIndex
    return selectedIndex < cars.length ? cars[selectedIndex] : null;
  }, [cars, selectedIndex, activeCarId]);

  // Avatar URL for selected car
  const selectedCarAvatarUrl = selectedCar?.avatar_url
    ? `http://192.168.1.165:4000${selectedCar.avatar_url}`
    : null;

  const selectedCarInitials = selectedCar?.plate?.[0]?.toUpperCase() || '?';

  const handleSelectCar = async (carId) => {
    try {
      setSelectingCarId(carId);
      await setActiveCar(carId);
    } catch (e) {
      console.log('setActiveCar error', e);
      Alert.alert(
        'Klaida',
        e.message || 'Nepavyko nustatyti aktyvaus automobilio.'
      );
    } finally {
      setSelectingCarId(null);
    }
  };

  const onScrollEnd = (event) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(offsetX / SNAP_INTERVAL);
    setSelectedIndex(index);
  };

  const renderCarItem = ({ item }) => {
    if (item.isAddCard) {
      return (
        <View style={styles.carouselItem}>
          <TouchableOpacity
            style={styles.addCarCard}
            onPress={() => router.push('/MyGarage')}
          >
            <Ionicons
              name="add-circle"
              size={72}
              color="#0ea5e9"
              style={{ marginBottom: 10 }}
            />
            <Text style={styles.addCarTitle}>Pridėti automobilį</Text>
            <Text style={styles.addCarSubtitle}>
              Paspauskite čia, kad pridėtumėte naują automobilį į savo garažą.
            </Text>
          </TouchableOpacity>
        </View>
      );
    }

    const isActive = activeCarId && item.id === activeCarId;
    const isLoadingThisCar = selectingCarId === item.id;

    const handleToggleActive = () => {
      if (isLoadingThisCar || isActive) return;
      handleSelectCar(item.id);
    };

    return (
      <View style={styles.carouselItem}>
        <LinearGradient
          colors={['#0f172a', '#020617']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[
            styles.carCard,
            isActive && styles.carCardActive,
          ]}
        >
          {/* TOP ROW – badge + active icon (dešinėje) */}
          <View style={styles.carHeroHeaderRow}>
            <View style={{ flex: 1 }} />

            <View style={styles.heroRightGroup}>
              {isActive ? (
                <View style={styles.heroBadge}>
                  <Text style={styles.heroBadgeText}>AKTYVUS</Text>
                </View>
              ) : (
                <View style={styles.heroBadgeUnactive}>
                  <Text style={styles.heroBadgeUnactiveText}>Paspauskite, kad aktyvuotumėte</Text>
                </View>
              )}

              <TouchableOpacity
                onPress={handleToggleActive}
                style={styles.activeIconButton}
                disabled={isLoadingThisCar}
              >
                {isLoadingThisCar ? (
                  <ActivityIndicator size="small" color="#f9fafb" />
                ) : (
                  <Ionicons
                    name={
                      isActive
                        ? 'checkmark-circle'
                        : 'checkmark-circle-outline'
                    }
                    size={28}
                    color={isActive ? '#38bdf8' : '#6b7280'}
                  />
                )}
              </TouchableOpacity>
            </View>
          </View>

          {/* BIG CAR ICON */}
          <View style={styles.carHeroIconWrapper}>
            <View style={styles.carHeroIconCircle}>
              <Ionicons
                name="car-sport"
                size={80}
                color="#0ea5e9"
              />
            </View>
          </View>

          {/* INFO BLOCK */}
          <View style={styles.carInfoBlock}>
            <LicensePlate
              plate={item.plate}
              width={CARD_WIDTH * 0.32}
              height={30}
              borderRadius={3}
              style={{ marginBottom: 8 }}
              textStyle={{
                fontSize: 20,
                letterSpacing: 1,
                marginLeft: 32,
              }}
            />

            {!!item.model && (
              <Text style={styles.carModel}>{item.model}</Text>
            )}
          </View>
        </LinearGradient>
      </View>
    );
  };



  // Pasirinkto automobilio statistika
  const selectedCarStats = selectedCar ? carStats[selectedCar.id] : null;
  const followersCount = selectedCarStats?.followers ?? 0;
  const followingCount = selectedCarStats?.following ?? 0;
  const postsCount = selectedCarStats?.posts ?? 0;

  // Load car posts
  const loadPosts = React.useCallback(async () => {
    if (!selectedCar) {
      setCarPosts([]);
      return;
    }
    
    console.log('📸 Loading posts for car:', selectedCar.id);
    setPostsLoading(true);
    try {
      const posts = await fetchCarPosts(selectedCar.id);
      console.log('📸 Car posts loaded:', posts.length);
      if (posts.length > 0) {
        console.log('📸 First post likes:', {
          id: posts[0].id,
          likes: posts[0].likes,
          isLikedByMe: posts[0].isLikedByMe
        });
      }
      setCarPosts(posts);
    } catch (e) {
      console.log('fetchCarPosts error', e);
      setCarPosts([]);
    } finally {
      setPostsLoading(false);
    }
  }, [selectedCar?.id, fetchCarPosts]);

  useEffect(() => {
    loadPosts();
  }, [loadPosts]);

  // Reload posts when screen comes into focus (e.g., returning from PostDetail)
  useFocusEffect(
    React.useCallback(() => {
      console.log('👁️ Profile screen focused, reloading posts for car:', selectedCar?.id);
      if (selectedCar?.id) {
        loadPosts();
      }
    }, [selectedCar?.id, loadPosts])
  );

  // DEBUG
  useEffect(() => {
    console.log('📱 Profile re-render:', {
      selectedCar: selectedCar?.id,
      carStats,
      selectedCarStats,
      followersCount,
      followingCount,
      postsCount,
    });
  }, [selectedCar, carStats]);

  const handleOpenList = async (type) => {
    if (!selectedCar) return;
    setListModalType(type);
    setListModalVisible(true);
    setListModalLoading(true);
    try {
      const fetcher = type === 'followers' ? fetchCarFollowersList : fetchCarFollowingList;
      const data = (await fetcher?.(selectedCar.id)) || [];
      setListModalData(data);
    } catch (e) {
      console.log('openList error', e);
      Alert.alert('Klaida', 'Nepavyko gauti sąrašo.');
    } finally {
      setListModalLoading(false);
    }
  };

  const closeListModal = () => {
    setListModalVisible(false);
    setListModalData([]);
  };

  if (initializing || !screenReady) {
    return <ScreenLoader />;
  }

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <ScrollView
        showsVerticalScrollIndicator={false}
      >
        {/* NAUJAS TOP BAR / HEADERIS */}
        <View style={styles.newHeaderContainer}>
          {/* KAIRĖ: Ikona ir Antraštė */}
          <View style={styles.headerTitleGroup}>
            <View style={styles.headerIconWrapper}>
              <Ionicons name="person-circle-outline" size={26} color="#38bdf8" />
            </View>
            <Text style={styles.mainTitleSmall}>Mano Profilis</Text>
          </View>

          {/* DEŠINĖ: Meniu */}
          <TouchableOpacity onPress={() => router.push('/UserSettings')}>
            <Ionicons name="menu-outline" size={32} color="#e5e7eb" />
          </TouchableOpacity>
        </View>


        {/* SELECTED CAR HEADER */}
        {selectedCar && (
          <View style={styles.userContainer}>
            <View style={styles.profileHeader}>
              <CachedAvatar
                remoteUrl={selectedCarAvatarUrl}
                size={AVATAR_SIZE}
                borderRadius={AVATAR_SIZE / 2}
                placeholderInitial={selectedCarInitials}
              />

              <View style={styles.statsRow}>
                <View style={styles.statItem}>
                  <Text style={styles.statNumber}>{postsCount}</Text>
                  <Text style={styles.statLabel}>Įrašai</Text>
                </View>
                <TouchableOpacity style={styles.statItem} onPress={() => handleOpenList('followers')}>
                  <Text style={styles.statNumber}>{followersCount}</Text>
                  <Text style={styles.statLabel}>Sekėjai</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.statItem} onPress={() => handleOpenList('following')}>
                  <Text style={styles.statNumber}>{followingCount}</Text>
                  <Text style={styles.statLabel}>Sekama</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.profileInfo}>
              <View style={styles.bioSection}>
                {selectedCar.bio && (
                  <Text style={styles.bioText}>{selectedCar.bio}</Text>
                )}
              </View>

              <TouchableOpacity
                style={styles.editProfileButton}
                onPress={() => {
                  if (selectedCar.id !== activeCarId) {
                    Alert.alert(
                      'Automobilis neaktyvus',
                      'Norėdami redaguoti profilio informaciją, pirmiausia aktyvuokite šį automobilį'
                    );
                    return;
                  }
                  router.push('/EditProfile');
                }}
              >
                <Text style={styles.editProfileText}>Redaguoti profilį</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* CAROUSEL */}
        <FlatList
          ref={flatListRef}
          data={carouselData}
          keyExtractor={(item, index) =>
            item.isAddCard ? 'add-card' : String(item.id)
          }
          horizontal
          pagingEnabled
          snapToInterval={SNAP_INTERVAL}
          decelerationRate="fast"
          showsHorizontalScrollIndicator={false}
          renderItem={renderCarItem}
          onMomentumScrollEnd={onScrollEnd}
          getItemLayout={(_, index) => ({
            length: SNAP_INTERVAL,
            offset: SNAP_INTERVAL * index,
            index,
          })}
          contentContainerStyle={{
            paddingHorizontal: 0,
          }}
          style={{ marginTop: 16 }}
        />

        {/* DOTS */}
        <View style={styles.dotsRow}>
          {carouselData.map((_, index) => (
            <View
              key={index}
              style={[
                styles.dot,
                index === selectedIndex && styles.dotActive,
              ]}
            />
          ))}
        </View>

        {/* EMPTY GARAGE INFO */}
        {(!cars || cars.length === 0) && (
          <View style={[styles.sectionContainer, { marginTop: 16 }]}>
            <View style={styles.emptyGarageBox}>
              <Text style={styles.emptyGarageText}>
                Jūs dar nepridėjote jokių automobilių.
              </Text>
              <Text style={styles.emptyGarageSubtext}>
                Slinkite iki paskutinio skaidrės ir paspauskite "Pridėti automobilį".
              </Text>
            </View>
          </View>
        )}

        {/* Posts Grid */}
        {selectedCar && (
          <View style={styles.postsSection}>
                <View style={styles.postsSectionHeader}>
                  <Ionicons name="grid-outline" size={24} color="#38bdf8" />
                </View>
                
                {postsLoading ? (
                  <View style={styles.postsLoading}>
                    <ActivityIndicator size="small" color="#38bdf8" />
                  </View>
                ) : carPosts.length === 0 ? (
                  <View style={styles.postsEmpty}>
                    <Ionicons name="images-outline" size={48} color="#475569" />
                    <Text style={styles.postsEmptyText}>Nėra įrašų</Text>
                  </View>
                ) : (
                  <View style={styles.postsGrid}>
                    {carPosts.map((post) => {
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
                          imageUrl = imagePath.startsWith('http') 
                            ? imagePath 
                            : `http://192.168.1.165:4000${imagePath}`;
                        }
                      }
                      
                      return (
                        <TouchableOpacity
                          key={post.id}
                          style={styles.postGridItem}
                          onPress={() => router.push({ 
                            pathname: '/PostDetail', 
                            params: { postId: post.id, carId: activeCarId } 
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
                          
                          {/* Overlay icons */}
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
        )}
      </ScrollView>

      {/* Followers / Following modal */}
      <Modal
        visible={listModalVisible}
        transparent
        animationType="slide"
        onRequestClose={closeListModal}
      >
        <TouchableOpacity style={styles.listModalOverlay} activeOpacity={1} onPress={closeListModal}>
          <TouchableOpacity
            activeOpacity={1}
            style={styles.listModalCard}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={styles.listModalHeader}>
              <Text style={styles.listModalTitle}>
                {listModalType === 'followers' ? 'Kas seka' : 'Ką seku'}
              </Text>
              <TouchableOpacity style={styles.listModalClose} onPress={closeListModal}>
                <Ionicons name="close" size={22} color="#e5e7eb" />
              </TouchableOpacity>
            </View>

            {listModalLoading ? (
              <ActivityIndicator color="#38bdf8" style={{ marginVertical: 16 }} />
            ) : (
              <FlatList
                data={listModalData}
                keyExtractor={(item, index) => String(item.id || index)}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.listItemRow}
                    onPress={() => {
                      closeListModal();
                      router.push({
                        pathname: '/CarProfile',
                        params: { carId: String(item.id) }
                      });
                    }}
                  >
                    <LicensePlate
                      plate={item.plate || 'N/A'}
                      width={140}
                      height={36}
                      borderRadius={4}
                      textStyle={{ fontSize: 16, letterSpacing: 1, marginLeft: 32 }}
                    />
                    <View style={{ marginLeft: 12 }}>
                      {!!item.model && <Text style={styles.listItemModel}>{item.model}</Text>}
                    </View>
                  </TouchableOpacity>
                )}
                ListEmptyComponent={<Text style={styles.listEmptyText}>Sąrašas tuščias</Text>}
              />
            )}
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>


    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#020617',
    paddingHorizontal: 6,
    paddingTop: 20,
  },

  // NAUJI HEADERIO STILIAI (pritaikyti iš News/Inbox)
  newHeaderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
    marginBottom: 10,
  },
  headerTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerIconWrapper: {
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
  // SENAS topBar stilius pašalintas/pakeistas

  userContainer: {
    paddingHorizontal: 10, // Atskyriau nuo scrollContent horizontalus paddingas
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 15,
    gap: 20,
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
    fontSize: 18,
    fontWeight: '800',
    color: '#e5e7eb',
  },
  statLabel: {
    marginTop: 2,
    fontSize: 12,
    color: '#9ca3af',
  },
  listModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  listModalCard: {
    backgroundColor: '#0f172a',
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 24,
    maxHeight: '70%',
  },
  listModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  listModalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#e5e7eb',
  },
  listModalClose: {
    padding: 8,
  },
  listItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomColor: '#1f2937',
    borderBottomWidth: 1,
  },
  listItemPlate: {
    fontSize: 16,
    fontWeight: '700',
    color: '#e5e7eb',
  },
  listItemModel: {
    fontSize: 13,
    color: '#9ca3af',
    marginTop: 2,
  },
  listEmptyText: {
    textAlign: 'center',
    color: '#9ca3af',
    paddingVertical: 12,
  },
  profileInfo: {
    marginTop: 10,
    marginBottom: 10,
  },
  bioSection: {
    width: '100%',
    marginBottom: 12,
  },
  bioUsername: {
    fontSize: 14,
    fontWeight: '700',
    color: '#e5e7eb',
    marginBottom: 6,
  },
  bioText: {
    fontSize: 14,
    color: '#cbd5e1',
    lineHeight: 20,
  },
  editProfileButton: {
    backgroundColor: '#1e293b',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155',
  },
  editProfileText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#e5e7eb',
  },

  sectionContainer: {
    paddingHorizontal: 10, // Pridėtas horizontalus padding
  },

  // CAROUSEL + CARD (nepakeisti esminiai stiliai)
  carouselItem: {
    width: SCREEN_WIDTH,
  },
  carCard: {
    width: CARD_WIDTH,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#111827',
    overflow: 'hidden',
    marginLeft: 7,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 14,
  },
  carCardActive: {
    borderColor: '#0ea5e9',
    shadowColor: '#0ea5e9',
    shadowOpacity: 0.4,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 0 },
    elevation: 12,
  },

  carHeroHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  heroRightGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  heroBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: '#22c55e',
  },
  heroBadgeText: {
    color: '#022c22',
    fontSize: 11,
    fontWeight: '700',
  },
  heroBadgeUnactive: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#374151',
  },
  heroBadgeUnactiveText: {
    color: '#9ca3af',
    fontSize: 11,
    fontWeight: '600',
  },
  activeIconButton: {
    padding: 4,
  },

  carHeroIconWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  carHeroIconCircle: {
    width: 100,
    height: 100,
    borderRadius: 70,
    backgroundColor: 'rgba(15, 118, 210, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  carInfoBlock: {
   
  },
  carModel: {
    fontSize: 16,
    color: '#e5e7eb',
    textAlign: 'left',
    fontWeight: '600',
    marginBottom: 2,
  },

  // Add car card
  addCarCard: {
    width: CARD_WIDTH,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 55,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#0ea5e9',
    backgroundColor: '#020617',
    marginLeft: 7,
  },
  addCarTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#e5e7eb',
    marginBottom: 4,
  },
  addCarSubtitle: {
    fontSize: 13,
    color: '#9ca3af',
    textAlign: 'center',
    paddingHorizontal: 16,
  },

  // Dots
  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 10,
    marginBottom: 4,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 999,
    backgroundColor: '#374151',
    marginHorizontal: 3,
  },
  dotActive: {
    backgroundColor: '#0ea5e9',
    width: 10,
    height: 10,
  },

  // Empty garage
  emptyGarageBox: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#1f2937',
    backgroundColor: '#020617',
  },
  emptyGarageText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#e5e7eb',
  },
  emptyGarageSubtext: {
    marginTop: 4,
    fontSize: 12,
    color: '#9ca3af',
  },

  // Posts Grid
  postsSection: {
    marginTop: 20,
    paddingHorizontal: 8,
  },
  postsSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
    paddingBottom: 10,
  },
  postsSectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#e5e7eb',
  },
  postsLoading: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  postsEmpty: {
    paddingVertical: 60,
    alignItems: 'center',
  },
  postsEmptyText: {
    fontSize: 14,
    color: '#9ca3af',
    marginTop: 12,
  },
  postsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    itemAlign: 'center',  
    justifyContent: 'center',
    gap: 1
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
});

export default Profile;