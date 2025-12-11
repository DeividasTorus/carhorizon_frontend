import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, KeyboardAvoidingView, Platform, FlatList, TextInput, TouchableOpacity } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useLocalSearchParams } from 'expo-router';
import { useAppContext } from '../../context/AppContext';
import MessageItem from '../../components/MessageItem';

const ChatScreen = () => {
  const { id } = useLocalSearchParams();
  const chatId = Array.isArray(id) ? id[0] : id;
  const { user, chatMessages, fetchChatMessages, sendMessage } = useAppContext();
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const listRef = useRef(null);

  useEffect(() => {
    if (chatId) {
      fetchChatMessages(chatId);
    }
  }, [chatId]);

  useEffect(() => {
    if (listRef.current && chatMessages.length > 0) {
      setTimeout(() => {
        listRef.current.scrollToEnd({ animated: true });
      }, 50);
    }
  }, [chatMessages]);

  const onSend = async () => {
    if (!text.trim()) return;
    setSending(true);
    try {
      await sendMessage(chatId, text.trim());
      setText('');
    } catch (e) {
      console.log('send error', e);
    } finally {
      setSending(false);
    }
  };

  const renderItem = ({ item }) => {
    const ownId = user?.id?.toString();
    const senderId = item.sender_id?.toString();
    const isOwn = ownId && senderId && ownId === senderId;
    return <MessageItem message={item} isOwn={!!isOwn} />;
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: '#020617' }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={80}
    >
      <StatusBar style="light" />
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Pokalbis</Text>
          <Text style={styles.subtitle}>Susirašinėjimas pagal pasirinktą numerį</Text>
        </View>

        <FlatList
          ref={listRef}
          data={chatMessages}
          keyExtractor={(item, index) => String(item.id || index)}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
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
          <TouchableOpacity style={[styles.sendButton, (!text.trim() || sending) && styles.sendDisabled]} onPress={onSend} disabled={!text.trim() || sending}>
            <Text style={styles.sendText}>{sending ? '...' : 'Siųsti'}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 12, paddingTop: 16 },
  header: { marginBottom: 8 },
  title: { fontSize: 20, fontWeight: '700', color: '#e5e7eb' },
  subtitle: { fontSize: 12, color: '#9ca3af', marginTop: 2 },
  listContent: { paddingVertical: 8, paddingBottom: 80 },
  composer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    paddingHorizontal: 10,
    paddingVertical: 8,
    backgroundColor: '#020617',
    borderTopWidth: 1,
    borderTopColor: '#111827',
    gap: 8,
  },
  input: {
    flex: 1,
    minHeight: 40,
    maxHeight: 100,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#374151',
    paddingHorizontal: 12,
    paddingVertical: 8,
    color: '#f9fafb',
    backgroundColor: '#020617',
    fontSize: 14,
  },
  sendButton: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: '#0ea5e9',
    alignSelf: 'flex-end',
  },
  sendDisabled: {
    opacity: 0.6,
  },
  sendText: {
    color: '#0b1120',
    fontSize: 13,
    fontWeight: '700',
  },
});

export default ChatScreen;
