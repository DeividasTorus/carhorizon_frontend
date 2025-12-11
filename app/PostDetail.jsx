import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import PostCard from '../components/PostCard';
import { useAppContext } from '../context/AppContext';
import { BASE_URL } from '../utils/api';

const PostDetail = () => {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams();
  const { followingFeed, newsPosts, token, fetchCarPosts } = useAppContext();

  const postId = Array.isArray(params.postId) ? parseInt(params.postId[0]) : parseInt(params.postId);
  const carId = params.carId ? (Array.isArray(params.carId) ? parseInt(params.carId[0]) : parseInt(params.carId)) : null;

  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const flatListRef = useRef(null);
  const [initialScrollDone, setInitialScrollDone] = useState(false);

  useEffect(() => {
    const loadPosts = async () => {
      setLoading(true);

      let postsToShow = [];

      // If carId is provided, fetch all posts from that car
      if (carId) {
        try {
          const carPosts = await fetchCarPosts(carId);
          postsToShow = carPosts || [];
        } catch (e) {
          console.log('Fetch car posts error:', e);
        }
      } else {
        // Otherwise, get posts from feeds
        postsToShow = [...followingFeed, ...newsPosts];
      }

      // Remove duplicates by id
      const uniquePosts = Array.from(
        new Map(postsToShow.map(p => [p.id, p])).values()
      );

      // Sort by creation date (newest first)
      const sortedPosts = uniquePosts.sort((a, b) => {
        const dateA = new Date(a.created_at || 0);
        const dateB = new Date(b.created_at || 0);
        return dateB - dateA;
      });

      setPosts(sortedPosts);
      setLoading(false);
    };

    loadPosts();
  }, [postId, carId]);

  // Update posts when feeds change (after edit)
  useEffect(() => {
    if (posts.length === 0) return;

    const allPosts = [...followingFeed, ...newsPosts];

    setPosts(prevPosts =>
      prevPosts.map(post => {
        const updatedPost = allPosts.find(p => p.id === post.id);
        return updatedPost || post;
      })
    );
  }, [followingFeed, newsPosts]);

  // Scroll to selected post after posts are loaded
  useEffect(() => {
    if (posts.length > 0 && !initialScrollDone) {
      const postIndex = posts.findIndex(p => p.id === postId);
      if (postIndex !== -1 && flatListRef.current) {
        setTimeout(() => {
          flatListRef.current?.scrollToIndex({
            index: postIndex,
            animated: false,
            viewPosition: 0,
          });
          setInitialScrollDone(true);
        }, 100);
      }
    }
  }, [posts, postId, initialScrollDone]);

  const handlePostDeleted = (deletedPostId) => {
    // Remove post from list
    setPosts(prev => prev.filter(p => p.id !== deletedPostId));

    // If no posts left, go back
    if (posts.length <= 1) {
      router.back();
    }
  };

  const handleLikeChange = (postId, isLiked, likesCount) => {
    console.log('💚 PostDetail handleLikeChange called:', { postId, isLiked, likesCount });
    // Update specific post in the list
    setPosts(prev =>
      prev.map(post =>
        post.id === postId
          ? { ...post, isLikedByMe: isLiked, likes: likesCount }
          : post
      )
    );
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <StatusBar style="light" />
        <View style={[styles.header, { paddingTop: insets.top }]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#e5e7eb" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Įrašas</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#38bdf8" />
        </View>
      </View>
    );
  }

  if (!loading && posts.length === 0) {
    return (
      <View style={styles.container}>
        <StatusBar style="light" />

        {/* Header */}
        <View style={[styles.header, { paddingTop: insets.top }]}>
          <View style={styles.headerTitleGroup}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <Ionicons name="arrow-back" size={24} color="#e5e7eb" />
            </TouchableOpacity>
            <View style={styles.mainIconWrapper}>
              <Ionicons name="document-text-outline" size={26} color="#38bdf8" />
            </View>
            <Text style={styles.headerTitle}>Įrašai</Text>
          </View>
          <View style={{ width: 24 }} />
        </View>

        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={64} color="#475569" />
          <Text style={styles.errorText}>Įrašų nerasta</Text>
        </View>
      </View>
    );
  }

  const renderPost = ({ item }) => (
    <PostCard
      post={item}
      onPostDeleted={() => handlePostDeleted(item.id)}
      onLikeChange={handleLikeChange}
    />
  );

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      {/* Header */}
      <View style={[styles.header]}>
        <View style={styles.headerTitleGroup}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#e5e7eb" />
          </TouchableOpacity>
          <View style={styles.mainIconWrapper}>
            <Ionicons name="document-text-outline" size={26} color="#38bdf8" />
          </View>
          <Text style={styles.headerTitle}>
            Įrašai
          </Text>
        </View>
        <View style={{ width: 24 }} />
      </View>

      {/* Posts List */}
      <FlatList
        ref={flatListRef}
        data={posts}
        renderItem={renderPost}
        keyExtractor={(item) => String(item.id)}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        onScrollToIndexFailed={(info) => {
          setTimeout(() => {
            flatListRef.current?.scrollToIndex({
              index: info.index,
              animated: false,
              viewPosition: 0,
            });
          }, 100);
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 5
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
    marginTop: 20,
  },
  headerTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  backButton: {
    marginRight: 12,
    padding: 4,
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
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#e5e7eb',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  errorText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#e5e7eb',
    marginTop: 16,
  },
  listContent: {
    paddingHorizontal: 5,
    paddingBottom: 20,
  },
});

export default PostDetail;
