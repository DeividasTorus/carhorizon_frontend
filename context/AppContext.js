// context/AppContext.jsx
import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import io from 'socket.io-client';
import api from '../utils/api';
import * as FileSystem from 'expo-file-system/legacy';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { API_URL } from '../config/env';

const AppContext = createContext(null);
export const useAppContext = () => useContext(AppContext);

// WebSocket URL (same as API_URL)
const SOCKET_URL = API_URL;

// Avatarų cache direktorija (privati app'o cache vieta)
const AVATAR_CACHE_DIR = FileSystem.cacheDirectory + 'avatars';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export const AppProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [initializing, setInitializing] = useState(true);

  const [newsPosts, setNewsPosts] = useState([]);
  const [followingFeed, setFollowingFeed] = useState([]);
  const [cars, setCars] = useState([]);
  const [activeCarId, setActiveCarId] = useState(null);
  const [carStats, setCarStats] = useState({}); // { carId: { followers: 0, following: 0, posts: 0 } }
  const [newsFilter, setNewsFilter] = useState('following'); // 'official' or 'following'

  const [inboxMessages, setInboxMessages] = useState([]);
  const [chatMessages, setChatMessages] = useState([]);
  const [currentChatId, setCurrentChatId] = useState(null);
  const [otherReadTimes, setOtherReadTimes] = useState({});
  const [socket, setSocket] = useState(null);

  // Notifications state
  const [notifications, setNotifications] = useState([]);
  const [unreadNotificationsCount, setUnreadNotificationsCount] = useState(0);
  const [notificationsLoading, setNotificationsLoading] = useState(false);
  const [expoPushToken, setExpoPushToken] = useState(null);
  const [pushPermissionStatus, setPushPermissionStatus] = useState(null);

  // --- AVATAR CACHE (url -> local file uri) ---
  const [avatarCache, setAvatarCache] = useState({});


  const ensureAvatarDirExists = async () => {
    try {
      const info = await FileSystem.getInfoAsync(AVATAR_CACHE_DIR);
      if (!info.exists) {
        await FileSystem.makeDirectoryAsync(AVATAR_CACHE_DIR, { intermediates: true });
      }
    } catch (e) {
      console.log('ensureAvatarDirExists error', e);
    }
  };

  const getAvatarLocalPath = (url) => {
    // pasidarom "saugų" failo pavadinimą iš URL
    const safeName = url.replace(/[^a-zA-Z0-9._-]/g, '_');
    return `${AVATAR_CACHE_DIR}/${safeName}`;
  };

  // 👇 pagrindinė funkcija: paduodi remote URL, grąžina local file uri (arba tą patį url kaip fallback)
  const getCachedAvatarUri = async (url) => {
    if (!url) return null;

    // jei jau turim atmintyje – grąžinam
    if (avatarCache[url]) {
      return avatarCache[url];
    }

    const fileUri = getAvatarLocalPath(url);

    try {
      // jei failas jau egzistuoja – naudojam jį
      const info = await FileSystem.getInfoAsync(fileUri);
      if (info.exists) {
        setAvatarCache((prev) => ({ ...prev, [url]: fileUri }));
        return fileUri;
      }

      // jei dar nėra – susikuriam folderį ir parsiunčiam
      await ensureAvatarDirExists();
      await FileSystem.downloadAsync(url, fileUri);

      setAvatarCache((prev) => ({ ...prev, [url]: fileUri }));
      return fileUri;
    } catch (e) {
      console.log('getCachedAvatarUri error', e);
      // jei kažkas nepavyko – bent jau grąžinam originalų URL
      return url;
    }
  };

  const clearAvatarCache = async () => {
    try {
      await FileSystem.deleteAsync(AVATAR_CACHE_DIR, { idempotent: true });
    } catch (e) {
      console.log('clearAvatarCache error', e);
    }
    setAvatarCache({});
  };

  const syncPushToken = async (newToken) => {
    if (!token || !newToken) return;

    try {
      const cachedToken = await AsyncStorage.getItem('expoPushToken');
      if (cachedToken === newToken) {
        return;
      }

      const res = await api.post(
        '/notifications/push-token',
        { expoPushToken: newToken },
        token
      );

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        console.log('🔔 push-token sync failed', res.status, body);
        return;
      }

      await AsyncStorage.setItem('expoPushToken', newToken);
      console.log('🔔 Expo push token synced with backend');
    } catch (e) {
      console.log('🔔 syncPushToken error', e);
    }
  };

  const registerForPushNotifications = async () => {
    if (!token) {
      console.log('🔔 Skipping push registration - missing auth token');
      return null;
    }

    try {
      if (!Device.isDevice) {
        console.log('🔔 Push notifications require a physical device');
        return null;
      }

      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      setPushPermissionStatus(finalStatus);

      if (finalStatus !== 'granted') {
        console.log('🔔 Push notification permission not granted');
        return null;
      }

      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'default',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#FF231F7C',
          bypassDnd: true,
          lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
        });
      }

      const projectId =
        Constants?.expoConfig?.extra?.eas?.projectId || Constants?.easConfig?.projectId;

      if (!projectId) {
        console.log('⚠️ Missing EAS projectId; set extra.eas.projectId in app.json to issue push tokens');
      }

      const tokenResponse = await Notifications.getExpoPushTokenAsync(
        projectId ? { projectId } : undefined
      );

      const pushToken = tokenResponse?.data;

      if (pushToken) {
        setExpoPushToken(pushToken);
        await syncPushToken(pushToken);
      }

      return pushToken || null;
    } catch (e) {
      console.log('🔔 registerForPushNotifications error', e);
      return null;
    }
  };

  useEffect(() => {
    if (!token) return;
    registerForPushNotifications();
  }, [token]);

  // --- AUTH RESTORE ---
  useEffect(() => {
    const restore = async () => {
      try {
        const storedToken = await AsyncStorage.getItem('token');
        const storedUser = await AsyncStorage.getItem('user');

        if (storedToken && storedUser) {
          const parsedUser = JSON.parse(storedUser);
          setToken(storedToken);
          setUser(parsedUser);

          await Promise.all([
            fetchNewsPosts(storedToken),
            fetchMyCars(storedToken),
            fetchInbox(storedToken),
          ]);
        }
      } catch (e) {
        console.log('restore error', e);
      } finally {
        setInitializing(false);
      }
    };
    restore();
  }, []);

  const persistAuth = async (userObj, tokenStr) => {
    setUser(userObj);
    setToken(tokenStr);
    await AsyncStorage.setItem('user', JSON.stringify(userObj));
    await AsyncStorage.setItem('token', tokenStr);
  };

  const clearAuth = async () => {
    setUser(null);
    setToken(null);
    setActiveCarId(null);
    setExpoPushToken(null);
    setPushPermissionStatus(null);
    await AsyncStorage.removeItem('user');
    await AsyncStorage.removeItem('token');
    await AsyncStorage.removeItem('expoPushToken');
  };

  // --- AUTH FUNKCIJOS ---

  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(body.error || body.message || 'Login failed');
    }
    const userObj = body.user || { id: body.id, email: body.email };
    const tokenStr = body.token;
    await persistAuth(userObj, tokenStr);

    await Promise.all([
      fetchNewsPosts(tokenStr),
      fetchMyCars(tokenStr),
      fetchInbox(tokenStr),
    ]);
  };

  const register = async (email, password) => {
    const res = await api.post('/auth/register', { email, password });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(body.error || body.message || 'Register failed');
    }
    const userObj = body.user || { id: body.id, email: body.email };
    const tokenStr = body.token;
    await persistAuth(userObj, tokenStr);
    await Promise.all([
      fetchNewsPosts(tokenStr),
      fetchMyCars(tokenStr),
      fetchInbox(tokenStr),
    ]);
  };


  const changePassword = async (currentPassword, newPassword) => {
    if (!token) throw new Error('Not authenticated');

    // Paprastos validacijos (gali išmesti, jei screen'e jau turi)
    if (!currentPassword || !newPassword) {
      throw new Error('Missing password fields');
    }

    // ✅ PASIKEISK ENDPOINT JEI REIKIA
    // pvz: '/users/change-password' arba '/auth/password' ir pan.
    const res = await api.put(
      '/auth/change-password',
      { currentPassword, newPassword },
      token
    );

    const body = await res.json().catch(() => ({}));

    if (!res.ok) {
      // jei tokenas nebegalioja – galima automatiškai išloginti
      if (res.status === 401) {
        try { await logout(); } catch { }
      }

      throw new Error(body.error || body.message || 'Failed to change password');
    }

    return body;
  };


  // Google OAuth login logika pašalinta pagal vartotojo prašymą

  const logout = async () => {
    await clearAuth();
    setNewsPosts([]);
    setCars([]);
    setInboxMessages([]);
    setChatMessages([]);
    setCurrentChatId(null);
    setOtherReadTimes({});

    // 🔥 išvalom avatarų cache katalogą
    clearAvatarCache().catch(() => { });

    if (socket) {
      socket.disconnect();
      setSocket(null);
    }
  };

  // --- DATA FETCH HELPERS ---

  const fetchNewsPosts = async (overrideToken) => {
    try {
      const res = await api.get('/news', overrideToken);
      if (!res.ok) return;
      const body = await res.json();

      // Debug: Check what backend returns
      if (body && body.length > 0) {
        console.log('🔍 Backend /news first post fields:', Object.keys(body[0]));
        console.log('🔍 Backend /news has like data:', {
          is_liked_by_me: body[0].is_liked_by_me,
          likes_count: body[0].likes_count,
          likes: body[0].likes
        });
      }

      // Normalize backend fields to frontend expected format
      const normalizedPosts = (Array.isArray(body) ? body : []).map(post => ({
        ...post,
        // Map backend fields - backend uses is_liked_by_user, not is_liked_by_me
        isLikedByMe: post.is_liked_by_user ?? post.is_liked_by_me ?? post.isLikedByMe ?? false,
        likes: post.likes_count ?? post.likes ?? 0,
        comments: post.comments_count ?? post.comments ?? 0
      }));

      setNewsPosts(normalizedPosts);
    } catch (e) {
      console.log('fetchNewsPosts error', e);
    }
  };

  const fetchFollowingFeed = async (overrideToken) => {
    const t = overrideToken || token;
    if (!t || !activeCarId) {
      setFollowingFeed([]);
      return;
    }
    try {
      // Siųsti activeCarId backend'ui
      const res = await api.get(`/posts/feed?limit=50&offset=0&carId=${activeCarId}`, t);
      if (!res.ok) {
        setFollowingFeed([]);
        return;
      }
      const body = await res.json().catch(() => ({}));

      // Priimam paprastą masyvą arba { posts, ... } struktūrą
      const posts = body.posts || (Array.isArray(body) ? body : []);

      // Debug: Check what backend returns
      if (posts && posts.length > 0) {
        console.log('🔍 Backend /posts/feed first post fields:', Object.keys(posts[0]));
        console.log('🔍 Backend /posts/feed has like data:', {
          is_liked_by_me: posts[0].is_liked_by_me,
          likes_count: posts[0].likes_count,
          likes: posts[0].likes
        });
      }

      // Normalize backend fields to frontend expected format
      const normalizedPosts = (Array.isArray(posts) ? posts : []).map(post => ({
        ...post,
        // Map backend fields - backend uses is_liked_by_user, not is_liked_by_me
        isLikedByMe: post.is_liked_by_user ?? post.is_liked_by_me ?? post.isLikedByMe ?? false,
        likes: post.likes_count ?? post.likes ?? 0,
        comments: post.comments_count ?? post.comments ?? 0
      }));

      setFollowingFeed(normalizedPosts);
    } catch (e) {
      console.log('fetchFollowingFeed error', e);
      setFollowingFeed([]);
    }
  };

  const fetchCarPosts = async (carId) => {
    if (!carId) return [];

    try {
      console.log('🔍 Fetching posts for car:', carId);
      const res = await api.get(`/posts/car/${carId}`);
      console.log('🔍 Response status:', res.status);

      if (!res.ok) {
        console.log('🔍 Response not OK, returning empty');
        return [];
      }

      const body = await res.json();
      console.log('🔍 Response body:', body);

      const posts = Array.isArray(body) ? body : (body.posts || []);
      console.log('🔍 Parsed posts count:', posts.length);

      // Normalize fields
      const normalizedPosts = posts.map(post => ({
        ...post,
        isLikedByMe: post.is_liked_by_user ?? post.is_liked_by_me ?? post.isLikedByMe ?? false,
        likes: post.likes_count ?? post.likes ?? 0,
        comments: post.comments_count ?? post.comments ?? 0
      }));

      return normalizedPosts;
    } catch (e) {
      console.log('fetchCarPosts error', e);
      return [];
    }
  };

  const fetchMyCars = async (overrideToken) => {
    const t = overrideToken || token;
    if (!t) return;
    try {
      const res = await api.get('/cars/my', t);
      if (!res.ok) return;
      const body = await res.json();
      const list = Array.isArray(body) ? body : [];
      setCars(list);

      setActiveCarId((prev) => {
        if (prev && list.some((c) => c.id === prev)) {
          return prev;
        }

        const activeFromDb = list.find((c) => c.is_active);
        if (activeFromDb) return activeFromDb.id;

        return prev || (list[0]?.id ?? null);
      });

      // Gauti kiekvieno automobilio statistiką
      list.forEach((car) => {
        fetchCarStats(car.id, t);
      });
    } catch (e) {
      console.log('fetchMyCars error', e);
    }
  };

  const fetchCarStats = async (carId, overrideToken) => {
    const t = overrideToken || token;
    if (!t || !carId) {
      console.log('⚠️ fetchCarStats: missing token or carId', { carId, hasToken: !!t });
      return;
    }
    try {
      console.log('📊 fetchCarStats starting for carId:', carId);
      const res = await api.get(`/cars/${carId}/stats`, t);

      if (!res.ok) {
        const errorBody = await res.text();
        console.error('❌ fetchCarStats HTTP error:', res.status, errorBody);

        // FALLBACK: Jei backend negrąžina, naudok mock data iš localStorage
        console.log('💾 Trying fallback mock data from localStorage...');
        const mockStats = JSON.parse(localStorage.getItem(`car_stats_${carId}`) || '{}');

        if (mockStats.followers_count !== undefined) {
          console.log('✅ Using mock data:', mockStats);
          setCarStats((prev) => ({
            ...prev,
            [carId]: {
              followers: mockStats.followers_count || 0,
              following: mockStats.following_count || 0,
              posts: mockStats.posts_count || 0,
            },
          }));
        }
        return;
      }

      const body = await res.json();
      console.log('✅ fetchCarStats response:', body);

      setCarStats((prev) => ({
        ...prev,
        [carId]: {
          followers: body.followers_count || 0,
          following: body.following_count || 0,
          posts: body.posts_count || 0,
        },
      }));

      console.log('✅ carStats updated for', carId, {
        followers: body.followers_count,
        following: body.following_count,
        posts: body.posts_count
      });
    } catch (e) {
      console.error('❌ fetchCarStats error:', e);
    }
  };

  // Followers / Following lists
  const fetchCarFollowersList = async (carId, overrideToken) => {
    const t = overrideToken || token;
    if (!t || !carId) {
      console.log('⚠️ fetchCarFollowersList: missing token or carId', { carId, hasToken: !!t });
      return [];
    }
    try {
      const res = await api.get(`/cars/${carId}/followers`, t);
      if (!res.ok) {
        const bodyText = await res.text();
        console.error('❌ fetchCarFollowersList HTTP error', res.status, bodyText);
        return [];
      }
      const body = await res.json();
      if (Array.isArray(body)) return body;
      if (Array.isArray(body.followers)) return body.followers;
      return [];
    } catch (e) {
      console.error('❌ fetchCarFollowersList error:', e);
      return [];
    }
  };

  const fetchCarFollowingList = async (carId, overrideToken) => {
    const t = overrideToken || token;
    if (!t || !carId) {
      console.log('⚠️ fetchCarFollowingList: missing token or carId', { carId, hasToken: !!t });
      return [];
    }
    try {
      const res = await api.get(`/cars/${carId}/following`, t);
      if (!res.ok) {
        const bodyText = await res.text();
        console.error('❌ fetchCarFollowingList HTTP error', res.status, bodyText);
        return [];
      }
      const body = await res.json();
      if (Array.isArray(body)) return body;
      if (Array.isArray(body.following)) return body.following;
      return [];
    } catch (e) {
      console.error('❌ fetchCarFollowingList error:', e);
      return [];
    }
  };

  const fetchInbox = async (overrideToken) => {
    const t = overrideToken || token;
    if (!t) return;
    try {
      const res = await api.get('/chats/inbox', t);
      if (!res.ok) return;
      const body = await res.json();

      if (!Array.isArray(body)) {
        setInboxMessages([]);
        return;
      }

      setInboxMessages(body);
    } catch (e) {
      console.log('fetchInbox error', e);
    }
  };

  const addCar = async (plate, model) => {
    if (!token) throw new Error('Not authenticated');
    const res = await api.post('/cars', { plate, model }, token);
    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(body.error || body.message || 'Failed to add car');
    }

    const newCar = body;
    setCars((prev) => [...prev, newCar]);

    // If this is the first car (user has no active car), automatically activate it
    if (!activeCarId && newCar.id) {
      setActiveCarId(newCar.id);
      console.log('🚗 First car automatically activated:', newCar.id);
    }
  };

  const searchCarByPlate = async (plate) => {
    if (!token) throw new Error('Not authenticated');

    const res = await api.get(
      `/cars/search?plate=${encodeURIComponent(plate)}`,
      token
    );
    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(body.error || body.message || 'Car not found');
    }
    return body;
  };

  const openChat = async (carId, carPlate, carModel, otherAvatar) => {
    if (!token) throw new Error('Not authenticated');
    if (!activeCarId) throw new Error('No active car selected');

    // Patikrink ar jau egzistuoja pokalbis tarp šių dviejų automobilių
    const existingChat = inboxMessages?.find((msg) => {
      const msgCarId = msg.car_id || msg.initiator_car_id;
      const otherCarId = msg.other_car_id || msg.other_initiator_car_id;

      return (
        (String(msgCarId) === String(carId) && String(otherCarId) === String(activeCarId)) ||
        (String(msgCarId) === String(activeCarId) && String(otherCarId) === String(carId))
      );
    });

    // Jei egzistuoja - nukreipk į chat su visais parametrais
    if (existingChat) {
      setCurrentChatId(existingChat.id);
      await fetchChatMessages(existingChat.id);

      // Naudok router'į iš expo-router
      const router = require('expo-router').router;
      router.push({
        pathname: `/Chat/${existingChat.id}`,
        params: {
          carPlate: carPlate || existingChat.other_plate || '',
          carModel: carModel || existingChat.other_model || '',
          otherAvatar: otherAvatar || existingChat.other_avatar || null,
          otherCarId: String(carId),
        },
      });

      return existingChat.id;
    }

    // Jei ne - kurii naują ir nukreipk
    const res = await api.post(
      '/chats/open',
      { carId, fromCarId: activeCarId },
      token
    );
    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(body.error || body.message || 'Failed to open chat');
    }
    const chatId = body.chatId || body.id;
    setCurrentChatId(chatId);
    await fetchChatMessages(chatId);

    // Nukreipk į naują chat'ą
    const router = require('expo-router').router;
    router.push({
      pathname: `/Chat/${chatId}`,
      params: {
        carPlate: carPlate || '',
        carModel: carModel || '',
        otherAvatar: otherAvatar || null,
        otherCarId: String(carId),
      },
    });

    // Neiškvies fetchInbox() čia - jis bus iškviestas tik kai parašys žinutę
    return chatId;
  };

  const fetchChatMessages = async (chatIdParam) => {
    const chatId = chatIdParam || currentChatId;
    if (!chatId || !token) return;
    try {
      const res = await api.get(`/chats/${chatId}/messages`, token);
      if (!res.ok) return;
      const body = await res.json();
      setCurrentChatId(chatId);
      setChatMessages(Array.isArray(body) ? body : []);
    } catch (e) {
      console.log('fetchChatMessages error', e);
    }
  };

  const sendMessage = async (chatIdParam, text) => {
    const chatId = chatIdParam || currentChatId;
    if (!chatId || !token)
      throw new Error('No chat selected or not authenticated');

    const res = await api.post(
      `/chats/${chatId}/messages`,
      { text },
      token
    );

    let body = {};
    try {
      body = await res.json();
    } catch (e) {
      console.log('sendMessage parse error', e);
    }

    if (!res.ok) {
      console.log('sendMessage error response', res.status, body);
      throw new Error(body.error || body.message || 'Failed to send message');
    }

    try {
      await fetchChatMessages(chatId);
      await fetchInbox();
    } catch (e) {
      console.log('after sendMessage refresh error', e);
    }
  };

  const setActiveChat = (chatId) => {
    setCurrentChatId(chatId);
  };

  const setActiveCar = async (carId) => {
    if (!token) throw new Error('Not authenticated');

    const res = await api.put('/cars/active', { carId }, token);
    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(
        body.error || body.message || 'Failed to set active car'
      );
    }

    setCars((prev) =>
      (prev || []).map((car) =>
        car.id === carId
          ? { ...car, is_active: true }
          : { ...car, is_active: false }
      )
    );

    setActiveCarId(carId);
  };

  const updateCarBio = async (carId, bio) => {
    if (!token) throw new Error('Not authenticated');

    const res = await api.put(`/cars/${carId}/bio`, { bio }, token);
    const body = await res.json().catch(() => ({}));

    if (!res.ok) {
      throw new Error(body.message || 'Failed to update bio');
    }

    // Update local state
    setCars((prev) =>
      (prev || []).map((car) =>
        car.id === carId ? { ...car, bio: body.car.bio } : car
      )
    );

    return body.car;
  };

  const deleteCar = async (carId) => {
    if (!token) throw new Error('Not authenticated');

    const res = await api.del(`/cars/${carId}`, token);
    const body = await res.json().catch(() => ({}));

    if (!res.ok) {
      throw new Error(body.message || 'Failed to delete car');
    }

    // Update local state - remove the deleted car
    setCars((prev) => (prev || []).filter((car) => car.id !== carId));

    // Fetch updated cars list to get the new active car
    await fetchMyCars();

    return body;
  };

  const likePost = async (postId) => {
    if (!token) throw new Error('Not authenticated');

    console.log('❤️ Sending like request for post:', postId);
    const res = await api.post(`/posts/${postId}/like`, {}, token);
    console.log('❤️ Like response status:', res.status);

    const body = await res.json().catch(() => ({}));
    console.log('❤️ Like response body:', JSON.stringify(body));

    if (!res.ok) {
      throw new Error(body.message || 'Failed to like post');
    }

    // Handle different backend response formats
    const isLiked = body.liked ?? body.is_liked ?? body.isLiked ?? false;
    const likesCount = body.likesCount ?? body.likes_count ?? body.likes ?? 0;

    console.log('❤️ Parsed like data:', { postId, isLiked, likesCount });

    // Update local state
    const updatePosts = (posts) =>
      (posts || []).map((post) =>
        post.id === postId
          ? {
            ...post,
            likes: likesCount,
            isLikedByMe: isLiked,
          }
          : post
      );

    console.log('❤️ Updating newsPosts and followingFeed...');
    setNewsPosts((prev) => updatePosts(prev));
    setFollowingFeed((prev) => updatePosts(prev));

    return { liked: isLiked, likesCount };
  };

  const addComment = async (postId, commentText) => {
    if (!token) throw new Error('Not authenticated');

    const res = await api.post(`/posts/${postId}/comments`, { commentText }, token);
    const body = await res.json().catch(() => ({}));

    if (!res.ok) {
      throw new Error(body.message || 'Failed to add comment');
    }

    // Update comments count in local state
    const updatePosts = (posts) =>
      (posts || []).map((post) =>
        post.id === postId ? { ...post, comments: (post.comments || 0) + 1 } : post
      );

    setNewsPosts((prev) => updatePosts(prev));
    setFollowingFeed((prev) => updatePosts(prev));

    return body.comment;
  };

  const fetchComments = async (postId, limit = 20, offset = 0) => {
    if (!token) throw new Error('Not authenticated');

    const res = await api.get(`/posts/${postId}/comments?limit=${limit}&offset=${offset}`, token);
    const body = await res.json().catch(() => ({}));

    if (!res.ok) {
      throw new Error(body.message || 'Failed to fetch comments');
    }

    return body;
  };

  const likeComment = async (commentId) => {
    if (!token) throw new Error('Not authenticated');

    const res = await api.post(`/comments/${commentId}/like`, {}, token);
    const body = await res.json().catch(() => ({}));

    if (!res.ok) {
      throw new Error(body.message || 'Failed to like comment');
    }

    return body;
  };

  const deleteComment = async (commentId, postId) => {
    if (!token) throw new Error('Not authenticated');

    const res = await api.del(`/comments/${commentId}`, token);
    const body = await res.json().catch(() => ({}));

    if (!res.ok) {
      throw new Error(body.message || 'Failed to delete comment');
    }

    // Update comments count in local state
    const updatePosts = (posts) =>
      (posts || []).map((post) =>
        post.id === postId ? { ...post, comments: Math.max(0, (post.comments || 0) - 1) } : post
      );

    setNewsPosts((prev) => updatePosts(prev));
    setFollowingFeed((prev) => updatePosts(prev));

    return body;
  };

  const editComment = async (commentId, newText) => {
    if (!token) throw new Error('Not authenticated');

    const res = await api.put(`/comments/${commentId}`, { commentText: newText }, token);
    const body = await res.json().catch(() => ({}));

    console.log('✏️ Edit comment response:', { status: res.status, body });

    if (!res.ok) {
      throw new Error(body.message || `Failed to edit comment (status: ${res.status})`);
    }

    return body.comment || body;
  };

  const uploadCarAvatar = async (carId, uri) => {
    if (!token) throw new Error('Not authenticated');
    if (!carId) throw new Error('Car ID required');

    const formData = new FormData();
    formData.append('avatar', {
      uri,
      type: 'image/jpeg',
      name: 'car-avatar.jpg',
    });

    const res = await fetch(`${SOCKET_URL}/api/cars/${carId}/avatar`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(body.error || body.message || 'Failed to upload car avatar');
    }

    // Update local cars state with new avatar
    setCars((prev) =>
      prev.map((car) =>
        car.id === carId
          ? { ...car, avatar_url: body.avatar_url }
          : car
      )
    );

    return body;
  };

  // --- SOCKET.IO ---

  useEffect(() => {
    if (!token) {
      if (socket) {
        socket.disconnect();
        setSocket(null);
      }
      return;
    }

    const s = io(SOCKET_URL, {
      auth: { token },
    });

    setSocket(s);

    s.on('chat_read', (payload) => {
      console.log('Socket chat_read', payload);
      const { chatId, reader_id, last_read_at } = payload;

      const myId = user?.id ? String(user.id) : null;
      if (!myId) return;

      if (String(reader_id) === myId) {
        return;
      }

      if (currentChatId && String(currentChatId) === String(chatId)) {
        setOtherReadTimes((prev) => ({
          ...prev,
          [chatId]: last_read_at,
        }));
      }
    });

    // Listen for post like events
    s.on('post_liked', (payload) => {
      console.log('🔔 Socket post_liked event:', payload);
      const { post_id, liked, likes_count } = payload;

      // Update posts in all feeds
      const updatePosts = (posts) =>
        (posts || []).map((post) =>
          post.id === post_id
            ? {
              ...post,
              likes: likes_count,
              isLikedByMe: liked ?? post.isLikedByMe, // Only update if provided
            }
            : post
        );

      setNewsPosts((prev) => updatePosts(prev));
      setFollowingFeed((prev) => updatePosts(prev));
    });

    // Listen for post comment events (add/delete)
    s.on('post_commented', (payload) => {
      console.log('💬 Socket post_commented event:', payload);
      const { post_id, comments_count } = payload;

      // Update comments count in all feeds
      const updatePosts = (posts) =>
        (posts || []).map((post) =>
          post.id === post_id
            ? { ...post, comments: comments_count }
            : post
        );

      setNewsPosts((prev) => updatePosts(prev));
      setFollowingFeed((prev) => updatePosts(prev));
    });

    // Listen for comment delete events (same handler as add)
    s.on('comment_deleted', (payload) => {
      console.log('🗑️ Socket comment_deleted event:', payload);
      const { post_id, comments_count } = payload;

      // Update comments count in all feeds
      const updatePosts = (posts) =>
        (posts || []).map((post) =>
          post.id === post_id
            ? { ...post, comments: comments_count }
            : post
        );

      setNewsPosts((prev) => updatePosts(prev));
      setFollowingFeed((prev) => updatePosts(prev));
    });

    // Listen for new notification events
    s.on('new_notification', (payload) => {
      console.log('🔔 Socket new_notification event:', payload);

      // Only add notification if it's for this user (not for the actor)
      // recipient_car_id should match activeCarId
      if (payload.recipient_car_id === activeCarId) {
        console.log('✅ Notification is for me, adding...');

        // Add new notification to the list
        setNotifications((prev) => [payload, ...prev]);

        // Increment unread count if notification is unread
        if (!payload.is_read) {
          setUnreadNotificationsCount((prev) => prev + 1);
        }
      } else {
        console.log('❌ Notification not for me, ignoring. recipient_car_id:', payload.recipient_car_id, 'my activeCarId:', activeCarId);
      }
    });

    s.on('connect', () => {
      console.log('Socket connected');
    });

    s.on('disconnect', () => {
      console.log('Socket disconnected');
    });

    s.on('message', (msg) => {
      console.log('Socket message', msg);

      setChatMessages((prev) => {
        if (!prev || prev.length === 0) {
          if (!currentChatId || String(msg.chat_id) !== String(currentChatId)) {
            return prev;
          }
          return [msg];
        }

        const currentId = prev[0].chat_id;
        if (String(currentId) !== String(msg.chat_id)) {
          return prev;
        }

        const alreadyExists = prev.some((m) => m.id === msg.id);
        if (alreadyExists) {
          return prev;
        }

        return [...prev, msg];
      });

      fetchInbox();
    });

    s.on('inbox_update', (thread) => {
      console.log('Socket inbox_update', thread);
      const chatId = thread.chatId || thread.id;

      setInboxMessages((prev) => {
        const others = (prev || []).filter(
          (t) => String(t.chatId || t.id) !== String(chatId)
        );
        const existing = (prev || []).find(
          (t) => String(t.chatId || t.id) === String(chatId)
        );

        if (!existing) {
          return [thread, ...others];
        }

        return [
          {
            ...existing,
            ...thread,
            has_unread: existing.has_unread,
          },
          ...others,
        ];
      });
    });

    return () => {
      s.removeAllListeners();
      s.disconnect();
    };
  }, [token, currentChatId, user]);

  const markChatRead = async (chatId) => {
    if (!token || !chatId) return;
    try {
      const res = await api.post(`/chats/${chatId}/read`, {}, token);
      await res.json().catch(() => ({}));

      setInboxMessages((prev) =>
        (prev || []).map((t) => {
          const id = t.id || t.chatId;
          if (String(id) === String(chatId)) {
            return { ...t, has_unread: false };
          }
          return t;
        })
      );
    } catch (e) {
      console.log('markChatRead error', e);
    }
  };

  const setOtherReadTime = (chatId, isoStringOrNull) => {
    setOtherReadTimes((prev) => ({
      ...prev,
      [chatId]: isoStringOrNull || null,
    }));
  };

  const createPost = async (description, imageUris) => {
    if (!token) throw new Error('Not authenticated');
    if (!activeCarId) throw new Error('No active car selected');

    try {
      const formData = new FormData();
      formData.append('description', description);
      formData.append('carId', String(activeCarId)); // Susieti su aktyviu automobiliu

      // Pridėti nuotraukas
      imageUris.forEach((uri, index) => {
        formData.append('images', {
          uri,
          type: 'image/jpeg',
          name: `post_image_${index}.jpg`,
        });
      });

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 60000); // 60 second timeout

      const response = await fetch(`${SOCKET_URL}/api/posts/create`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(result.error || result.message || 'Failed to create post');
      }

      // Atnaujinti feed'ą iš karto pridedant naują postą
      if (result.post) {
        setFollowingFeed((prev) => [result.post, ...prev]);
      }

      return result.post;
    } catch (e) {
      console.log('createPost error', e);
      throw e;
    }
  };

  const deletePost = async (postId) => {
    if (!token) throw new Error('Not authenticated');

    try {
      console.log('deletePost request:', postId);
      const response = await api.del(`/posts/${postId}`, token);

      console.log('deletePost response:', response);

      // Check if response has success property - if undefined, assume success
      if (response.success === false) {
        throw new Error(response.error || 'Failed to delete post');
      }

      // Remove from feeds
      setNewsPosts((prev) => prev.filter((p) => p.id !== postId));
      setFollowingFeed((prev) => prev.filter((p) => p.id !== postId));

      return response;
    } catch (e) {
      console.log('deletePost error', e);
      throw e;
    }
  };

  const editPost = async (postId, description) => {
    if (!token) throw new Error('Not authenticated');

    try {
      console.log('editPost request:', { postId, description });
      const response = await api.put(
        `/posts/${postId}`,
        { description },
        token
      );

      console.log('editPost response:', response);

      // Check if response has success property or just post data
      if (response.success === false) {
        throw new Error(response.error || 'Failed to edit post');
      }

      // Handle both formats: { success: true, post: {...} } or just { id, title, ... }
      const updatedPost = response.post || response;

      // Update in feeds
      const updatePosts = (posts) =>
        posts.map((p) =>
          p.id === postId
            ? {
              ...p,
              description: updatedPost.description || description,
              body: updatedPost.description || description
            }
            : p
        );

      setNewsPosts((prev) => updatePosts(prev));
      setFollowingFeed((prev) => updatePosts(prev));

      return updatedPost;
    } catch (e) {
      console.log('editPost error', e);
      throw e;
    }
  };

  const fetchNotifications = async () => {
    if (!token) {
      console.log('🔔 Skipping fetchNotifications - no token');
      return;
    }

    console.log('🔔 Fetching notifications...');
    setNotificationsLoading(true);
    try {
      const res = await api.get('/notifications', token);
      console.log('🔔 Notifications response status:', res.status);

      if (!res.ok) {
        console.log('🔔 Response not OK:', res.status);
        setNotifications([]);
        setUnreadNotificationsCount(0);
        return;
      }

      const response = await res.json().catch(() => ({}));
      console.log('🔔 Notifications response body:', JSON.stringify(response));

      // Flexible response handling - backend might return different formats
      const notificationsData = response.notifications || response.data || (Array.isArray(response) ? response : []);
      const unreadCount = response.unread_count ?? response.unreadCount ?? 0;

      console.log('🔔 Parsed notifications:', notificationsData.length, 'items');
      console.log('🔔 Unread count:', unreadCount);

      setNotifications(Array.isArray(notificationsData) ? notificationsData : []);
      setUnreadNotificationsCount(unreadCount);
    } catch (e) {
      console.log('🔔 fetchNotifications error:', e);
      setNotifications([]);
      setUnreadNotificationsCount(0);
    } finally {
      setNotificationsLoading(false);
    }
  };

  const markNotificationAsRead = async (notificationId) => {
    if (!token) return;

    try {
      await api.put(`/notifications/${notificationId}/read`, {}, token);

      // Update local state
      setNotifications(prev =>
        prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n)
      );
      setUnreadNotificationsCount(prev => Math.max(0, prev - 1));
    } catch (e) {
      console.log('markNotificationAsRead error', e);
    }
  };

  const markAllNotificationsAsRead = async () => {
    if (!token) return;

    try {
      await api.put('/notifications/read-all', {}, token);

      // Update local state
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setUnreadNotificationsCount(0);
    } catch (e) {
      console.log('markAllNotificationsAsRead error', e);
    }
  };

  useEffect(() => {
    if (!token) return;

    const receivedSub = Notifications.addNotificationReceivedListener(() => {
      // Keep server-side state in sync when a push arrives in foreground
      fetchNotifications();
    });

    const responseSub = Notifications.addNotificationResponseReceivedListener((response) => {
      console.log('🔔 Notification response', response);
    });

    return () => {
      receivedSub.remove();
      responseSub.remove();
    };
  }, [token]);

  // Fetch notifications on initial load only
  // Real-time updates handled by WebSocket 'new_notification' event
  useEffect(() => {
    if (!token) return;
    fetchNotifications(); // One-time fetch on login
  }, [token]);

  // Calculate unread messages count
  const unreadMessagesCount = inboxMessages.filter(msg => msg.has_unread).length;

  const value = {
    user,
    token,
    initializing,
    newsPosts,
    followingFeed,
    cars,
    activeCarId,
    newsFilter,
    setNewsFilter,

    inboxMessages,
    chatMessages,
    currentChatId,
    otherReadTimes,
    unreadMessagesCount,

    login,
    register,
    changePassword,
    logout,

    fetchNewsPosts,
    fetchFollowingFeed,
    fetchCarPosts,
    fetchMyCars,
    fetchCarStats,
    fetchInbox,
    addCar,
    searchCarByPlate,
    openChat,
    fetchChatMessages,
    sendMessage,
    setActiveChat,
    markChatRead,
    setOtherReadTime,
    createPost,

    setActiveCar,
    uploadCarAvatar,
    carStats,

    // 👇 NAUJAS helperis komponentams
    getCachedAvatarUri,

    // 👇 Mock data helpers (jei backend neveikia)
    setMockCarStats: (carId, stats) => {
      localStorage.setItem(`car_stats_${carId}`, JSON.stringify(stats));
      setCarStats((prev) => ({
        ...prev,
        [carId]: {
          followers: stats.followers_count || 0,
          following: stats.following_count || 0,
          posts: stats.posts_count || 0,
        },
      }));
    },

    // Followers / Following lists
    fetchCarFollowersList,
    fetchCarFollowingList,

    // Edit Profile functions
    updateCarBio,
    deleteCar,

    // Posts likes & comments
    likePost,
    addComment,
    fetchComments,
    likeComment,
    deleteComment,
    editComment,

    // Post management
    deletePost,
    editPost,

    // Push notifications
    expoPushToken,
    pushPermissionStatus,
    registerForPushNotifications,

    // Notifications
    notifications,
    unreadNotificationsCount,
    notificationsLoading,
    fetchNotifications,
    markNotificationAsRead,
    markAllNotificationsAsRead,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export default AppContext;
