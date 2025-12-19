import React, { useState, useEffect } from 'react';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
dayjs.extend(relativeTime);
import LicensePlate from './LicensePlate';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  FlatList,
  Dimensions,
  Alert,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAppContext } from '../context/AppContext';
import { API_URL } from '../config/env';

const SCREEN_WIDTH = Dimensions.get('window').width;
const MAX_BODY_PREVIEW_LENGTH = 140;

const PostCard = ({ post, isMenuVisible: externalMenuVisible, onToggleMenu, onCloseMenu, onPostDeleted, onLikeChange }) => {
  const router = useRouter();
  const { likePost, deletePost, editPost, activeCarId } = useAppContext();

  const [activeIndex, setActiveIndex] = useState(0);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isLiked, setIsLiked] = useState(post.isLikedByMe || false);
  const [likesCount, setLikesCount] = useState(post.likes || 0);
  const [isLiking, setIsLiking] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editDescription, setEditDescription] = useState(post.description || post.body || '');
  const [internalMenuVisible, setInternalMenuVisible] = useState(false);

  // Use external control if provided, otherwise use internal state
  const isMenuVisible = externalMenuVisible !== undefined ? externalMenuVisible : internalMenuVisible;
  const handleToggleMenu = onToggleMenu || (() => setInternalMenuVisible(!internalMenuVisible));
  const handleCloseMenuInternal = onCloseMenu || (() => setInternalMenuVisible(false));

  // Check if this post belongs to the active car
  const isMyPost = post.car_id === activeCarId || post.car?.id === activeCarId;

  // Update state when post data changes (including from WebSocket updates)
  // This allows real-time updates from other users
  useEffect(() => {
    setIsLiked(post.isLikedByMe || false);
    setLikesCount(post.likes || 0);
  }, [post.id, post.likes, post.isLikedByMe]); // Include likes to catch WebSocket updates

  // Handle author - show car info, never user email (confidential)
  const authorName = typeof post.author === 'string'
    ? post.author
    : post.car?.model || 'Automobilis';

  // Naudoti date, createdAt, created_at arba timestamp lauką
  const postDateRaw = post.date || post.createdAt || post.created_at || post.timestamp;
  console.log('POST DATE:', postDateRaw);
  let timeAgo = '0 min.';
  if (postDateRaw) {
    const dateObj = typeof postDateRaw === 'string' || typeof postDateRaw === 'number' ? dayjs(postDateRaw) : null;
    if (dateObj && dateObj.isValid()) {
      timeAgo = dayjs(dateObj).fromNow();
    }
  }
  const likes = post.likes || 0;
  const comments = post.comments || 0;
  const shares = post.shares || 0;

  const isCommunityPost = post.type !== 'official';
  const isFollowing = post.isFollowing || false;

  // Handle images - can be imageUrls array or images array with image_url
  // Car avatar (cars now have avatars, not users)
  const carAvatarUrl = post.car?.avatar_url
    ? `${API_URL}${post.car.avatar_url}`
    : null;
  const imageUrls = post.imageUrls ||
    (post.images ? post.images.map(img => {
      const url = typeof img === 'string' ? img : img.image_url;
      // Add base URL if it's a relative path
      return url && url.startsWith('/') ? `${API_URL}${url}` : url;
    }) : []);
  const hasImages = imageUrls.length > 0;

  const fullBodyText =
    post.body ||
    post.description ||
    'Čia matote trumpą įrašo apžvalgą. Spustelėkite, kad pamatytumėte pilną tekstą ir detales.';

  const isLongText = fullBodyText.length > MAX_BODY_PREVIEW_LENGTH;

  const handleScroll = (event) => {
    // scrollinant nuotraukų karuselę – uždarom meniu
    if (isMenuVisible) {
      handleCloseMenuInternal();
    }

    const contentOffsetX = event.nativeEvent.contentOffset.x;
    const newIndex = Math.round(contentOffsetX / SCREEN_WIDTH);
    if (newIndex !== activeIndex) {
      setActiveIndex(newIndex);
    }
  };

  const renderDots = () => {
    if (imageUrls.length <= 1) return null;

    return (
      <View style={styles.dotsContainer}>
        {imageUrls.map((_, index) => (
          <View
            key={index}
            style={[
              styles.dot,
              index === activeIndex ? styles.activeDot : styles.inactiveDot,
            ]}
          />
        ))}
      </View>
    );
  };

  const renderImageItem = ({ item }) => (
    <View style={styles.carouselItem}>
      <Image source={{ uri: item }} style={styles.postImage} resizeMode="cover" />
    </View>
  );

  const handleLike = async () => {
    if (isLiking) return;

    console.log('💙 PostCard handleLike called for post:', post.id);
    setIsLiking(true);
    const previousLiked = isLiked;
    const previousCount = likesCount;

    // Optimistic update
    const newLikedState = !isLiked;
    const newLikesCount = isLiked ? likesCount - 1 : likesCount + 1;
    setIsLiked(newLikedState);
    setLikesCount(newLikesCount);
    console.log('💙 Optimistic update:', { newLikedState, newLikesCount });

    try {
      const result = await likePost(post.id);
      console.log('💙 Like result from context:', result);

      // Update liked status from backend, but keep optimistic likesCount
      // Backend sometimes returns incorrect likesCount (only current user's like count)
      if (result && typeof result.liked !== 'undefined') {
        console.log('💙 Updating liked status from backend, keeping optimistic count');
        setIsLiked(result.liked);
        // Don't update likesCount from backend - keep optimistic update
      }

      // Call onLikeChange callback if provided (for parent components to update their state)
      if (onLikeChange) {
        console.log('💙 Calling onLikeChange callback');
        onLikeChange(post.id, result.liked, newLikesCount); // Use optimistic count
      } else {
        console.log('💙 No onLikeChange callback provided');
      }
    } catch (error) {
      // Revert on error
      console.log('💙 Like error, reverting:', error);
      setIsLiked(previousLiked);
      setLikesCount(previousCount);
      console.error('Like error:', error);
      Alert.alert('Klaida', 'Nepavyko pažymėti įrašo');
    } finally {
      setIsLiking(false);
    }
  };

  const handleDeletePost = async () => {
    Alert.alert(
      'Ištrinti įrašą?',
      'Ar tikrai norite ištrinti šį įrašą? Šis veiksmas neatstatomas.',
      [
        { text: 'Atšaukti', style: 'cancel' },
        {
          text: 'Ištrinti',
          style: 'destructive',
          onPress: async () => {
            handleCloseMenuInternal();
            try {
              await deletePost(post.id);

              // Call callback if provided (for PostDetail to navigate back)
              if (onPostDeleted) {
                onPostDeleted();
              } else {
                Alert.alert('Sėkmingai', 'Įrašas ištrintas');
              }
            } catch (error) {
              Alert.alert('Klaida', 'Nepavyko ištrinti įrašo');
            }
          },
        },
      ]
    );
  };

  const handleEditPost = () => {
    handleCloseMenuInternal();
    setIsEditing(true);
  };

  const handleSaveEdit = async () => {
    if (!editDescription.trim()) {
      Alert.alert('Klaida', 'Įvesk aprašymą');
      return;
    }

    try {
      await editPost(post.id, editDescription);
      setIsEditing(false);
      Alert.alert('Sėkmingai', 'Įrašas atnaujintas');
    } catch (error) {
      Alert.alert('Klaida', 'Nepavyko atnaujinti įrašo');
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditDescription(post.description || post.body || '');
  };

  const renderDropdownMenu = () => {
    if (!isMenuVisible) return null;

    return (
      <View style={styles.dropdownMenu}>
        {isMyPost ? (
          <>
            <TouchableOpacity
              style={styles.menuItem}
              onPress={handleEditPost}
            >
              <Ionicons name="create-outline" size={18} color="#38bdf8" />
              <Text style={styles.menuItemTextBlue}>Redaguoti įrašą</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.menuItem}
              onPress={handleDeletePost}
            >
              <Ionicons name="trash-outline" size={18} color="#ef4444" />
              <Text style={styles.menuItemTextRed}>Ištrinti įrašą</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            {isFollowing && (
              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => {
                  handleCloseMenuInternal();
                  Alert.alert(
                    'Atsekta!',
                    `Nuo šiol nematysite ${authorName} įrašų Sekamų sraute.`
                  );
                }}
              >
                <Ionicons name="person-remove-outline" size={18} color="#ef4444" />
                <Text style={styles.menuItemTextRed}>Atsekti {authorName}</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => {
                handleCloseMenuInternal();
                Alert.alert('Pranešta', 'Dėkojame, mes peržiūrėsime šį įrašą.');
              }}
            >
              <Ionicons name="flag-outline" size={18} color="#f97316" />
              <Text style={styles.menuItemTextOrange}>Pranešti apie įrašą</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => {
                handleCloseMenuInternal();
                Alert.alert('Paslėpta', 'Šis įrašas bus paslėptas iš Jūsų srauto.');
              }}
            >
              <Ionicons name="eye-off-outline" size={18} color="#94a3b8" />
              <Text style={styles.menuItemText}>Slėpti įrašą</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    );
  };

  const renderOutsidePressOverlay = () => {
    if (!isMenuVisible) return null;

    return (
      <TouchableOpacity
        activeOpacity={1}
        style={styles.overlay}
        onPress={handleCloseMenuInternal}
      />
    );
  };

  return (
    <View style={styles.cardContainer}>
      {renderOutsidePressOverlay()}

      {/* HEADER */}
      <View style={styles.headerWrapper}>
        <View style={styles.cardHeader}>
          <View style={styles.authorRow}>
            {carAvatarUrl ? (
              <TouchableOpacity
                onPress={() => {
                  if (post.car && post.car.id) {
                    router.push({ pathname: '/CarProfile', params: { carId: post.car.id } });
                  }
                }}
              >
                <Image source={{ uri: carAvatarUrl }} style={styles.avatar} />
              </TouchableOpacity>
            ) : (
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{authorName[0]}</Text>
              </View>
            )}
            <View>
              {post.car && (
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 2 }}>
                  <TouchableOpacity
                    onPress={() => {
                      if (post.car && post.car.id) {
                        router.push({ pathname: '/CarProfile', params: { carId: post.car.id } });
                      }
                    }}
                  >
                    <LicensePlate plate={post.car.plate} width={100} height={25} borderRadius={2} style={{ marginRight: 8, }} textStyle={{ fontSize: 14, marginLeft: 19, letterSpacing: 1, }} />
                  </TouchableOpacity>
                  
                </View>
              )}
              <View style={styles.infoRow}>
                <Ionicons
                  name="time-outline"
                  size={12}
                  color="#94a3b8"
                  style={{ marginRight: 4 }}
                />
                <Text style={styles.timestamp}>{timeAgo}</Text>
              </View>
            </View>
          </View>

          {isCommunityPost && (
            <TouchableOpacity
              onPress={handleToggleMenu}
              style={styles.menuIconContainer}
            >
              <Ionicons name="ellipsis-horizontal" size={24} color="#fff" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {renderDropdownMenu()}

      {/* CONTENT */}
      <View style={styles.content}>
        {isEditing ? (
          <>
            <TextInput
              style={[styles.editInput, styles.editInputMultiline]}
              value={editDescription}
              onChangeText={setEditDescription}
              placeholder="Aprašymas"
              placeholderTextColor="#94a3b8"
              multiline
              numberOfLines={4}
            />
            <View style={styles.editActions}>
              <TouchableOpacity
                style={styles.editCancelButton}
                onPress={handleCancelEdit}
              >
                <Text style={styles.editCancelText}>Atšaukti</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.editSaveButton}
                onPress={handleSaveEdit}
              >
                <Text style={styles.editSaveText}>Išsaugoti</Text>
              </TouchableOpacity>
            </View>
          </>
        ) : (
          <>
            <Text style={styles.body} numberOfLines={isExpanded ? undefined : 3}>
              {isExpanded || !isLongText
                ? fullBodyText
                : fullBodyText.slice(0, MAX_BODY_PREVIEW_LENGTH) + '...'}
            </Text>

            {isLongText && (
              <TouchableOpacity
                onPress={() => setIsExpanded((prev) => !prev)}
                style={styles.readMoreButton}
              >
                <Text style={styles.readMoreText}>
                  {isExpanded ? 'Rodyti mažiau' : 'Skaityti daugiau'}
                </Text>
              </TouchableOpacity>
            )}
          </>
        )}
      </View>

      {/* IMAGES */}
      {hasImages && (
        <View>
          <View style={styles.carouselWrapper}>
            <FlatList
              data={imageUrls}
              keyExtractor={(item, index) => index.toString()}
              renderItem={renderImageItem}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              snapToInterval={SCREEN_WIDTH}
              disableIntervalMomentum
              decelerationRate="fast"
              contentContainerStyle={styles.carouselContent}
              onScroll={handleScroll}
              scrollEventThrottle={16}
            />
          </View>

          {renderDots()}
        </View>
      )}

      {/* ACTIONS */}
      <View style={styles.actionWrapper}>
        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => {
              console.log('💗 Like button pressed for post:', post.id, 'isLiking:', isLiking);
              handleLike();
            }}
            disabled={isLiking}
          >
            <Ionicons
              name={isLiked ? "heart" : "heart-outline"}
              size={26}
              color={isLiked ? "#ef4444" : "#fff"}
            />
            <Text style={styles.actionText}>{likesCount}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => router.push({
              pathname: '/PostComments',
              params: {
                postId: post.id,
                postAuthorCarId: post.car_id || post.car?.id
              }
            })}
          >
            <Ionicons name="chatbubble-outline" size={26} color="#fff" />
            <Text style={styles.actionText}>{comments}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton}>
            <Ionicons name="arrow-redo-outline" size={26} color="#fff" />
            <Text style={styles.actionText}>{shares}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    marginBottom: 8,
    overflow: 'visible',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    borderBottomWidth: 1,
    borderColor: 'rgba(148,163,184,0.25)',
    marginHorizontal: -10,
    backgroundColor: '#020617',
    position: 'relative',
  },

  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 10,
  },

  headerWrapper: {
    paddingHorizontal: 15,
    padding: 16,
    paddingBottom: 0,
    zIndex: 5,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 0,
  },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 45,
    height: 45,
    borderRadius: 20,
    backgroundColor: '#3b82f6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 18,
  },
  authorName: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
  carInfo: {
    color: '#94a3b8',
    fontSize: 13,
    marginTop: 2,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  timestamp: {
    color: '#94a3b8',
    fontSize: 12,
  },
  menuIconContainer: {
    padding: 8,
  },

  dropdownMenu: {
    position: 'absolute',
    top: 55,
    right: 20,
    backgroundColor: '#1e293b',
    borderRadius: 8,
    minWidth: 200,
    zIndex: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5.46,
    elevation: 8,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  menuItemText: {
    marginLeft: 10,
    color: '#cbd5e1',
    fontSize: 15,
    fontWeight: '500',
  },
  menuItemTextRed: {
    marginLeft: 10,
    color: '#ef4444',
    fontSize: 15,
    fontWeight: '500',
  },
  menuItemTextOrange: {
    marginLeft: 10,
    color: '#f97316',
    fontSize: 15,
    fontWeight: '500',
  },
  menuItemTextBlue: {
    marginLeft: 10,
    color: '#38bdf8',
    fontSize: 15,
    fontWeight: '500',
  },

  content: {
    paddingHorizontal: 15,
    paddingBottom: 16,
    marginTop: 15,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  body: {
    fontSize: 14,
    color: '#cbd5e1',
    lineHeight: 20,
  },
  readMoreButton: {
    marginTop: 4,
  },
  readMoreText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#38bdf8',
  },

  editInput: {
    backgroundColor: '#1e293b',
    color: '#e5e7eb',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  editInputMultiline: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  editActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 8,
  },
  editCancelButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    backgroundColor: '#334155',
  },
  editCancelText: {
    color: '#94a3b8',
    fontSize: 14,
    fontWeight: '600',
  },
  editSaveButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    backgroundColor: '#38bdf8',
  },
  editSaveText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },

  carouselWrapper: {
    marginHorizontal: 0,
    marginBottom: 0,
    position: 'relative',
    overflow: 'hidden',
    borderRadius: 0,
  },
  carouselContent: {
    paddingHorizontal: 0,
  },
  carouselItem: {
    width: SCREEN_WIDTH,
    height: SCREEN_WIDTH * 1.25, // 4:5 portrait aspect ratio
  },
  postImage: {
    width: '100%',
    height: '100%',
    borderRadius: 0,
    backgroundColor: '#0f172a',
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 26,
    marginTop: 12,
    marginBottom: 8,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 4,
    marginHorizontal: 4,
  },
  activeDot: {
    backgroundColor: '#38bdf8',
    transform: [{ scale: 1.2 }],
  },
  inactiveDot: {
    backgroundColor: '#94a3b8',
  },

  actionWrapper: {
    paddingHorizontal: 10,
    paddingBottom: 16,
    marginTop: 8,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 6,
    padding: 4,
  },
  actionText: {
    color: '#fff',
    marginLeft: 3,
    fontSize: 14,
    fontWeight: '600',
  },
});

export default PostCard;
