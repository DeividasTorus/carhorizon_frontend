// components/MessageItem.jsx
import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';

const MessageItem = ({ message, isOwn, showRead, readAt, avatarUrl }) => {
  const time = message.created_at || message.createdAt;
  const msgTime = time ? new Date(time) : null;
  const timeLabel = msgTime
    ? msgTime.toLocaleTimeString('lt-LT', { hour: '2-digit', minute: '2-digit' })
    : '';

  const readTimeLabel =
    readAt instanceof Date
      ? readAt.toLocaleTimeString('lt-LT', {
          hour: '2-digit',
          minute: '2-digit',
        })
      : null;

  return (
    <View
      style={[
        styles.wrapper,
        isOwn ? styles.wrapperOwn : styles.wrapperOther,
      ]}
    >
      <View style={styles.row}>
        {/* Avatar tik kito žmogaus žinutėms */}
        {!isOwn && (
          <View style={styles.avatarWrapper}>
            {avatarUrl ? (
              <Image source={{ uri: avatarUrl }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatar, styles.avatarPlaceholder]}>
                <Text style={styles.avatarInitial}>
                  {(message?.sender_name?.[0] || 'U').toUpperCase()}
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Burbulas */}
        <View
          style={[
            styles.bubble,
            isOwn ? styles.bubbleOwn : styles.bubbleOther,
          ]}
        >
          <Text style={styles.text}>{message.text}</Text>

          {/* {timeLabel ? (
            <Text style={styles.time}>{timeLabel}</Text>
          ) : null} */}
        </View>
      </View>

      {/* Read indikatorius APAČIOJE, NE burbule */}
      {isOwn && showRead && readTimeLabel && (
        <Text style={styles.readLabel}>Read {readTimeLabel}</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    marginVertical: 4,
    paddingHorizontal: 4,
  },
  wrapperOwn: {
    alignItems: 'flex-end',
  },
  wrapperOther: {
    alignItems: 'flex-start',
  },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  avatarWrapper: {
    marginRight: 8,
    alignSelf: 'center',
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  avatarPlaceholder: {
    backgroundColor: '#1f2937',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitial: {
    fontSize: 13,
    fontWeight: '700',
    color: '#9ca3af',
  },

  bubble: {
    maxWidth: '75%',
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingVertical: 10,
  },
  bubbleOwn: {
    backgroundColor: '#0e9ddfff',
  },
  bubbleOther: {
    backgroundColor: '#111827',
  },
  text: {
    color: '#f9fafb',
    fontSize: 16,
  },
  time: {
    marginTop: 4,
    fontSize: 11,
    color: '#d1d5db',
    textAlign: 'right',
  },
  readLabel: {
    marginTop: 6,
    fontSize: 11,
    color: '#9ca3af',
    alignSelf: 'flex-end', 
    paddingRight: 6,
  },
});

export default MessageItem;




