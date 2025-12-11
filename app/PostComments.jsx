import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Image,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppContext } from '../context/AppContext';

const PostComments = () => {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams();
  const { fetchComments, addComment, likeComment, deleteComment, editComment, activeCarId } = useAppContext();

  const postId = Array.isArray(params.postId) ? params.postId[0] : params.postId;
  const postAuthorCarId = Array.isArray(params.postAuthorCarId) ? params.postAuthorCarId[0] : params.postAuthorCarId;

  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [commentText, setCommentText] = useState('');
  const [sending, setSending] = useState(false);
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editingText, setEditingText] = useState('');
  const flatListRef = useRef(null);

  const BASE_URL = 'http://192.168.1.165:4000';

  useEffect(() => {
    if (postId) {
      loadComments();
    }
  }, [postId]);

  const loadComments = async () => {
    setLoading(true);
    try {
      const data = await fetchComments(postId);
      setComments(data.comments || []);
    } catch (error) {
      console.error('Load comments error:', error);
      Alert.alert('Klaida', 'Nepavyko užkrauti komentarų');
    } finally {
      setLoading(false);
    }
  };

  const handleSendComment = async () => {
    if (!commentText.trim()) return;
    if (sending) return;

    setSending(true);
    try {
      const newComment = await addComment(postId, commentText.trim());
      setComments([newComment, ...comments]);
      setCommentText('');

      // Scroll to top to show new comment
      setTimeout(() => {
        flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
      }, 100);
    } catch (error) {
      console.error('Send comment error:', error);
      Alert.alert('Klaida', error.message || 'Nepavyko išsiųsti komentaro');
    } finally {
      setSending(false);
    }
  };

  const handleLikeComment = async (commentId, index) => {
    const comment = comments[index];
    const wasLiked = comment.is_liked_by_me;

    // Optimistic update
    const updatedComments = [...comments];
    updatedComments[index] = {
      ...comment,
      is_liked_by_me: !wasLiked,
      likes_count: wasLiked ? comment.likes_count - 1 : comment.likes_count + 1,
    };
    setComments(updatedComments);

    try {
      await likeComment(commentId);
    } catch (error) {
      // Revert on error
      const revertedComments = [...comments];
      revertedComments[index] = comment;
      setComments(revertedComments);
      console.error('Like comment error:', error);
    }
  };

  const handleDeleteComment = (commentId, commentCarId) => {
    // Check if user can delete: either post author or comment author
    const isPostAuthor = postAuthorCarId && String(activeCarId) === String(postAuthorCarId);
    const isCommentAuthor = String(activeCarId) === String(commentCarId);

    if (!isPostAuthor && !isCommentAuthor) {
      Alert.alert('Klaida', 'Negalite ištrinti šio komentaro');
      return;
    }

    Alert.alert(
      'Ištrinti komentarą',
      'Ar tikrai norite ištrinti šį komentarą?',
      [
        { text: 'Atšaukti', style: 'cancel' },
        {
          text: 'Ištrinti',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteComment(commentId, postId);
              setComments((prev) => prev.filter((c) => c.id !== commentId));
            } catch (error) {
              console.error('Delete comment error:', error);
              Alert.alert('Klaida', error.message || 'Nepavyko ištrinti komentaro');
            }
          },
        },
      ]
    );
  };

  const handleEditComment = (comment) => {
    setEditingCommentId(comment.id);
    setEditingText(comment.comment_text);
  };

  const handleSaveEdit = async (commentId) => {
    if (!editingText.trim()) {
      Alert.alert('Klaida', 'Komentaras negali būti tuščias');
      return;
    }

    try {
      const updatedComment = await editComment(commentId, editingText.trim());
      setComments((prev) =>
        prev.map((c) =>
          c.id === commentId ? { ...c, comment_text: editingText.trim() } : c
        )
      );
      setEditingCommentId(null);
      setEditingText('');
    } catch (error) {
      console.error('Edit comment error:', error);
      Alert.alert('Klaida', error.message || 'Nepavyko redaguoti komentaro');
    }
  };

  const handleCancelEdit = () => {
    setEditingCommentId(null);
    setEditingText('');
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'Ką tik';
    if (diffMins < 60) return `${diffMins} min`;

    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours} val`;

    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays} d`;

    return date.toLocaleDateString('lt-LT');
  };

  const renderComment = ({ item, index }) => {
    const carAvatarUrl = item.car?.avatar_url
      ? `${BASE_URL}${item.car.avatar_url}`
      : null;
    const carInitial = item.car?.plate?.[0]?.toUpperCase() || '?';

    // Check if user can delete/edit this comment
    const isPostAuthor = postAuthorCarId && String(activeCarId) === String(postAuthorCarId);
    const isCommentAuthor = activeCarId && item.car_id && String(activeCarId) === String(item.car_id);
    const canDelete = isPostAuthor || isCommentAuthor;

    console.log('💬 Comment check:', {
      commentId: item.id,
      activeCarId,
      itemCarId: item.car_id,
      isCommentAuthor,
      canDelete
    });

    return (
      <View style={styles.commentItem}>
        <View style={styles.commentHeader}>
          {carAvatarUrl ? (
            <Image source={{ uri: carAvatarUrl }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarText}>{carInitial}</Text>
            </View>
          )}

          <View style={styles.commentContent}>
            <View style={styles.commentMeta}>
              <Text style={styles.carPlate}>{item.car?.plate}</Text>
              <Text style={styles.timestamp}>{formatTime(item.created_at)}</Text>
            </View>

            {editingCommentId === item.id ? (
              <View style={styles.editContainer}>
                <TextInput
                  style={styles.editInput}
                  value={editingText}
                  onChangeText={setEditingText}
                  multiline
                  maxLength={500}
                  autoFocus
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
                    onPress={() => handleSaveEdit(item.id)}
                  >
                    <Text style={styles.editSaveText}>Išsaugoti</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <>
                <Text style={styles.commentText}>{item.comment_text}</Text>

                <View style={styles.commentActions}>
                  <TouchableOpacity
                    style={styles.likeButton}
                    onPress={() => handleLikeComment(item.id, index)}
                  >
                    <Ionicons
                      name={item.is_liked_by_me ? "heart" : "heart-outline"}
                      size={18}
                      color={item.is_liked_by_me ? "#ef4444" : "#9ca3af"}
                    />
                    {item.likes_count > 0 && (
                      <Text style={[styles.likeCount, item.is_liked_by_me && styles.likeCountActive]}>
                        {item.likes_count}
                      </Text>
                    )}
                  </TouchableOpacity>

                  {isCommentAuthor && (
                    <TouchableOpacity
                      style={styles.editButton}
                      onPress={() => handleEditComment(item)}
                    >
                      <Ionicons name="create-outline" size={18} color="#38bdf8" />
                    </TouchableOpacity>
                  )}

                  {canDelete && (
                    <TouchableOpacity
                      style={styles.deleteButton}
                      onPress={() => handleDeleteComment(item.id, item.car_id)}
                    >
                      <Ionicons name="trash-outline" size={18} color="#ef4444" />
                    </TouchableOpacity>
                  )}
                </View>
              </>
            )}
          </View>
        </View>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? insets.top : 0}
    >
      <View style={[styles.container]}>
        <StatusBar style="light" />

        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#e5e7eb" />
          </TouchableOpacity>

          <View style={styles.headerTitleGroup}>
            <View style={styles.headerIconWrapper}>
              <Ionicons name="chatbubbles-outline" size={22} color="#38bdf8" />
            </View>
            <Text style={styles.headerTitle}>Komentarai</Text>
          </View>

          <View style={{ width: 24 }} />
        </View>

        {/* Comments List */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#38bdf8" />
          </View>
        ) : comments.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="chatbubbles-outline" size={64} color="#475569" />
            <Text style={styles.emptyText}>Dar nėra komentarų</Text>
            <Text style={styles.emptySubtext}>Būk pirmas, kuris pakomentavo!</Text>
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={comments}
            renderItem={renderComment}
            keyExtractor={(item) => String(item.id)}
            contentContainerStyle={styles.commentsList}
            showsVerticalScrollIndicator={false}
          />
        )}

        {/* Input Area */}
        <View style={[styles.inputContainer]}>
          <TextInput
            style={styles.input}
            placeholder="Parašyk komentarą..."
            placeholderTextColor="#6b7280"
            value={commentText}
            onChangeText={setCommentText}
            multiline
            maxLength={500}
          />
          <TouchableOpacity
            style={[styles.sendButton, (!commentText.trim() || sending) && styles.sendButtonDisabled]}
            onPress={handleSendComment}
            disabled={!commentText.trim() || sending}
          >
            {sending ? (
              <Ionicons name="hourglass" size={26} color="#ffffff" />
            ) : (
              <Ionicons style={{ marginLeft: 3 }} name="send" size={26} color="#ffffff" />
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
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
  },
  backButton: {
    padding: 4,
  },
  headerTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginLeft: 12,
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
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#e5e7eb',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#9ca3af',
    marginTop: 8,
  },
  commentsList: {
    padding: 16,
  },
  commentItem: {
    marginBottom: 20,
  },
  commentHeader: {
    flexDirection: 'row',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  avatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1e293b',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#38bdf8',
  },
  commentContent: {
    flex: 1,
    marginLeft: 12,
  },
  commentMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  carPlate: {
    fontSize: 14,
    fontWeight: '700',
    color: '#e5e7eb',
    marginRight: 8,
  },
  timestamp: {
    fontSize: 12,
    color: '#6b7280',
  },
  commentText: {
    fontSize: 14,
    color: '#cbd5e1',
    lineHeight: 20,
    marginBottom: 8,
  },
  commentActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  likeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
  },
  likeCount: {
    fontSize: 12,
    color: '#9ca3af',
    marginLeft: 4,
  },
  likeCountActive: {
    color: '#ef4444',
  },
  editButton: {
    padding: 4,
  },
  deleteButton: {
    padding: 4,
  },
  editContainer: {
    marginTop: 4,
  },
  editInput: {
    backgroundColor: '#1e293b',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: '#e5e7eb',
    minHeight: 60,
    maxHeight: 120,
    textAlignVertical: 'top',
  },
  editActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    marginTop: 8,
  },
  editCancelButton: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 6,
  },
  editCancelText: {
    fontSize: 14,
    color: '#9ca3af',
    fontWeight: '600',
  },
  editSaveButton: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    backgroundColor: '#38bdf8',
    borderRadius: 6,
  },
  editSaveText: {
    fontSize: 14,
    color: '#020617',
    fontWeight: '600',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingTop: 12,
    marginBottom: 10,
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
  sendButtonDisabled: {
    backgroundColor: '#334155',
    opacity: 0.5,
  },
});

export default PostComments;
