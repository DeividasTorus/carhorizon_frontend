// app/Chat/[id].jsx
import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  FlatList,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useLocalSearchParams, useNavigation } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { useAppContext } from '../../context/AppContext';
import api from '../../utils/api';
import MessageItem from '../../components/MessageItem';
import LicensePlate from '../../components/LicensePlate';
import ScreenLoader from '../../components/ScreenLoader';
import CachedAvatar from '../../components/CachedAvatar';

const ChatScreen = () => {
  const params = useLocalSearchParams();
  const navigation = useNavigation();

  const rawId = params.id ?? params.chatId ?? params.chat ?? null;
  const chatId = Array.isArray(rawId) ? rawId[0] : rawId;

  const carPlateParam = Array.isArray(params.carPlate)
    ? params.carPlate[0]
    : params.carPlate;
  const carModelParam = Array.isArray(params.carModel)
    ? params.carModel[0]
    : params.carModel;

  const otherAvatarParam = Array.isArray(params.otherAvatar)
    ? params.otherAvatar[0]
    : params.otherAvatar;
  const otherAvatarUrl = otherAvatarParam || null;

  const otherCarIdParam = Array.isArray(params.otherCarId)
    ? params.otherCarId[0]
    : params.otherCarId;
  const otherCarId = otherCarIdParam ? Number(otherCarIdParam) : null;

  const {
    user,
    token,
    chatMessages,
    fetchChatMessages,
    sendMessage,
    setActiveChat,
    markChatRead,
    otherReadTimes,
    setOtherReadTime,
    initializing,
  } = useAppContext();

  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [screenLoading, setScreenLoading] = useState(true);

  const listRef = useRef(null);

  const otherReadAt = chatId ? otherReadTimes?.[chatId] || null : null;

  const carPlate = carPlateParam || '';
  const carModel = carModelParam || '';

  useEffect(() => {
    if (!chatId || !token) return;

    let isCancelled = false;

    const initChat = async () => {
      try {
        setScreenLoading(true);

        setActiveChat(chatId);
        await fetchChatMessages(chatId);
        await markChatRead(chatId);

        try {
          const res = await api.get(`/chats/${chatId}/read-status`, token);
          const body = await res.json().catch(() => ({}));
          if (res.ok && body && body.other_last_read_at) {
            setOtherReadTime(chatId, body.other_last_read_at);
          } else {
            setOtherReadTime(chatId, null);
          }
        } catch (e) {
          console.log('read-status error', e);
        }

        if (!isCancelled) {
          setScreenLoading(false);
        }
      } catch (e) {
        console.log('initChat error', e);
        if (!isCancelled) {
          setScreenLoading(false);
        }
      }
    };

    initChat();

    return () => {
      isCancelled = true;
      setActiveChat(null);
    };
  }, [chatId, token, otherAvatarUrl]);

  const onSend = async () => {
    if (!text.trim()) return;

    if (!chatId) {
      Alert.alert('Klaida', 'Nerastas pokalbio ID');
      return;
    }

    try {
      setSending(true);
      await sendMessage(chatId, text.trim());
      setText('');
    } catch (e) {
      console.log('sendMessage error', e);
      Alert.alert('Klaida', e.message || 'Nepavyko išsiųsti žinutės');
    } finally {
      setSending(false);
    }
  };

  const messages = Array.isArray(chatMessages) ? chatMessages : [];
  const messagesSortedDesc = [...messages].sort((a, b) => {
    const da = new Date(a.created_at || a.createdAt || 0).getTime();
    const db = new Date(b.created_at || b.createdAt || 0).getTime();
    return db - da;
  });

  const myId = user?.id ? String(user.id) : null;
  const lastOwnMessage = messagesSortedDesc.find(
    (m) => myId && String(m.sender_id) === myId
  );
  const lastOwnMessageId = lastOwnMessage?.id;

  const otherReadDate = otherReadAt ? new Date(otherReadAt) : null;

  const renderItem = ({ item }) => {
    const senderId = item.sender_id ? String(item.sender_id) : null;
    const isOwn = myId && senderId && myId === senderId;

    const isLastOwn = isOwn && lastOwnMessageId && item.id === lastOwnMessageId;

    let showRead = false;
    let readAtDate = null;

    if (isLastOwn && otherReadDate) {
      const msgDate = new Date(item.created_at || item.createdAt || 0);
      if (otherReadDate >= msgDate) {
        showRead = true;
        readAtDate = otherReadDate;
      }
    }

    return (
      <MessageItem
        message={item}
        isOwn={!!isOwn}
        showRead={showRead}
        readAt={readAtDate}
        avatarUrl={!isOwn ? otherAvatarUrl : null}
      />
    );
  };

  if (!chatId) {
    return (
      <KeyboardAvoidingView
        style={{ flex: 1, backgroundColor: '#020617' }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={80}
      >
        <StatusBar style="light" />
        <View style={styles.container}>
          <Text style={styles.title}>Pokalbis nerastas</Text>
          <Text style={styles.subtitle}>
            Atidaryk pokalbį per Inbox arba per automobilio kortelę.
          </Text>
        </View>
      </KeyboardAvoidingView>
    );
  }

  if (initializing || screenLoading) {
    return <ScreenLoader />;
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: '#020617' }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={80}
    >
      <StatusBar style="light" />
      <View style={styles.container}>
        <View style={styles.backRow}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={26} color="#e5e7eb" />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => {
              if (otherCarId) {
                navigation.push('CarProfile', { carId: String(otherCarId) });
              }
            }}
            disabled={!otherCarId}
            activeOpacity={0.7}
          >
            <CachedAvatar
              remoteUrl={otherAvatarUrl}
              size={50}
              borderRadius={15}
              placeholderInitial={carPlate?.[0]?.toUpperCase() || 'U'}
            />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => {
              if (otherCarId) {
                navigation.push('CarProfile', { carId: String(otherCarId) });
              }
            }}
            disabled={!otherCarId}
            activeOpacity={0.7}
          >
            {carPlate ? (
              <View>
                <LicensePlate
                  plate={carPlate}
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
                {carModel && (
                  <Text style={styles.subtitle}>
                    {carModel}
                  </Text>
                )}
              </View>
            ) : (
              <View>
                <Text style={styles.title}>Pokalbis</Text>
              </View>
            )}
          </TouchableOpacity>

          <View style={{ flex: 1 }} />
        </View>

        <FlatList
          ref={listRef}
          data={messagesSortedDesc}
          keyExtractor={(item, index) => String(item.id ?? index)}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          inverted
        />

        <View style={styles.composer}>
          <TextInput
            style={styles.input}
            value={text}
            onChangeText={setText}
            placeholder="Rašyk žinutę..."
            placeholderTextColor="#6b7280"
            multiline
          />
          <TouchableOpacity
            style={[
              styles.sendButton,
              (!text.trim() || sending) && styles.sendDisabled,
            ]}
            onPress={onSend}
            disabled={!text.trim() || sending}
          >
            {sending ? (
              <ActivityIndicator size="small" color="#020617" />
            ) : (
              <Ionicons style={{marginLeft: 3}} name="send" size={26} color="#ffffff" />
            )}
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 12,
    paddingTop: 16
  },
  backRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  title: { fontSize: 20, fontWeight: '700', color: '#e5e7eb' },
  subtitle: { fontSize: 12, color: '#9ca3af', marginTop: 2 },
  listContent: {
    paddingTop: 80,
    paddingBottom: 30,
  },
  composer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
  },
  input: {
   flex: 1,
    backgroundColor: '#1e293b',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#e5e7eb',
    maxHeight: 100,
    marginRight: 8,
  },
  sendButton: {
    width: 50,
    height: 43,
    borderRadius: 20,
    backgroundColor: '#38bdf8',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendDisabled: {
    backgroundColor: '#334155',
    opacity: 0.5,
  },
});

export default ChatScreen;
