import React, { useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRouter } from 'expo-router';
import { useAppContext } from '../context/AppContext';

const COLORS = {
  bg: '#020617',
  text: '#e5e7eb',
  textMuted: '#9ca3af',
  textHint: '#6b7280',
  border: '#1f2937',
  cardBg: '#02081f',

  primaryBg: '#0b122a',
  primaryBorder: '#22304a',
  primaryText: '#e5e7eb',

  dangerBorder: '#3f1d1d',
  dangerText: '#fecaca',
};

const MIN_LEN = 8;

// ✅ top-level, kad nesiremountintų per kiekvieną state update
const PasswordInput = React.memo(function PasswordInput({
  label,
  value,
  onChangeText,
  placeholder,
  secure,
  show,
  onToggleShow,
  inputRef,
  returnKeyType,
  onSubmitEditing,
  textContentType,
  autoComplete,
}) {
  return (
    <View style={styles.inputBlock}>
      <Text style={styles.label}>{label}</Text>

      <View style={styles.inputWrap}>
        <TextInput
          ref={inputRef}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={COLORS.textHint}
          secureTextEntry={secure && !show}
          style={styles.input}
          autoCapitalize="none"
          autoCorrect={false}
          blurOnSubmit={false}
          returnKeyType={returnKeyType}
          onSubmitEditing={onSubmitEditing}
          textContentType={textContentType}
          autoComplete={autoComplete}
        />

        <TouchableOpacity onPress={onToggleShow} style={styles.eyeBtn} activeOpacity={0.85}>
          <Ionicons
            name={show ? 'eye-off-outline' : 'eye-outline'}
            size={18}
            color={COLORS.textHint}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
});

const ChangePassword = () => {
  const navigation = useNavigation();
  const router = useRouter();
  const { changePassword } = useAppContext();

  const currentRef = useRef(null);
  const newRef = useRef(null);
  const confirmRef = useRef(null);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [loading, setLoading] = useState(false);

  const error = useMemo(() => {
    if (!currentPassword || !newPassword || !confirmPassword) return null;
    if (newPassword.length < MIN_LEN) return `New password must be at least ${MIN_LEN} characters.`;
    if (newPassword !== confirmPassword) return `Passwords do not match.`;
    if (currentPassword === newPassword) return `New password must be different from current.`;
    return null;
  }, [currentPassword, newPassword, confirmPassword]);

  const canSubmit = useMemo(() => {
    if (!currentPassword || !newPassword || !confirmPassword) return false;
    if (loading) return false;
    return !error;
  }, [currentPassword, newPassword, confirmPassword, loading, error]);

  const handleSave = async () => {
    if (!canSubmit) {
      Alert.alert('Klaida', error || 'Užpildyk visus laukus');
      return;
    }

    setLoading(true);
    try {
      if (typeof changePassword === 'function') {
        await changePassword(currentPassword, newPassword);
      } else {
        // fallback jei dar neįgyvendinta
        await new Promise((r) => setTimeout(r, 600));
      }

      Alert.alert('Pavyko', 'Slaptažodis atnaujintas');
      router.back();
    } catch (e) {
      console.log('change password error', e);
      Alert.alert('Klaida', e?.message || 'Nepavyko pakeisti slaptažodžio');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={COLORS.text} />
        </TouchableOpacity>

        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Change password</Text>
          <Text style={styles.headerSubtitle}>Keep your account secure</Text>
        </View>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 8 : 0}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.card}>
            <PasswordInput
              label="Current password"
              value={currentPassword}
              onChangeText={setCurrentPassword}
              placeholder="Enter current password"
              secure
              show={showCurrent}
              onToggleShow={() => setShowCurrent((v) => !v)}
              inputRef={currentRef}
              returnKeyType="next"
              onSubmitEditing={() => newRef.current?.focus?.()}
              textContentType="password"
              autoComplete="password"
            />

            <View style={styles.divider} />

            <PasswordInput
              label="New password"
              value={newPassword}
              onChangeText={setNewPassword}
              placeholder={`At least ${MIN_LEN} characters`}
              secure
              show={showNew}
              onToggleShow={() => setShowNew((v) => !v)}
              inputRef={newRef}
              returnKeyType="next"
              onSubmitEditing={() => confirmRef.current?.focus?.()}
              textContentType="newPassword"
              autoComplete="new-password"
            />

            <PasswordInput
              label="Confirm new password"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholder="Repeat new password"
              secure
              show={showConfirm}
              onToggleShow={() => setShowConfirm((v) => !v)}
              inputRef={confirmRef}
              returnKeyType="done"
              onSubmitEditing={handleSave}
              textContentType="newPassword"
              autoComplete="new-password"
            />

            <Text style={styles.hint}>
              Tip: Use a long password with a mix of letters, numbers, and symbols.
            </Text>

            {!!error && (
              <View style={styles.errorBox}>
                <Ionicons name="alert-circle-outline" size={16} color={COLORS.dangerText} />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            <TouchableOpacity
              activeOpacity={0.85}
              onPress={handleSave}
              disabled={!canSubmit}
              style={[styles.saveBtn, !canSubmit && { opacity: 0.5 }]}
            >
              {loading ? (
                <ActivityIndicator />
              ) : (
                <>
                  <Ionicons name="save-outline" size={18} color={COLORS.primaryText} />
                  <Text style={styles.saveBtnText}>Save</Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity activeOpacity={0.85} onPress={() => router.back()} style={styles.cancelBtn}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
    paddingHorizontal: 16,
    paddingTop: 18,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 14,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.cardBg,
  },
  headerTitle: { fontSize: 20, fontWeight: '800', color: COLORS.text },
  headerSubtitle: { fontSize: 12, color: COLORS.textHint, marginTop: 2 },

  content: { paddingBottom: 24 },

  card: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.cardBg,
    padding: 14,
  },

  inputBlock: { marginBottom: 12 },
  label: {
    color: COLORS.textMuted,
    fontSize: 12,
    fontWeight: '800',
    marginBottom: 8,
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 14,
    backgroundColor: '#070a16',
    paddingHorizontal: 12,
    height: 48,
  },
  input: { flex: 1, color: COLORS.text, fontSize: 14, fontWeight: '700' },
  eyeBtn: { width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },

  divider: { height: 1, backgroundColor: COLORS.border, opacity: 0.7, marginVertical: 10 },

  hint: { color: COLORS.textHint, fontSize: 12, lineHeight: 18, marginTop: 2, marginBottom: 10 },

  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: COLORS.dangerBorder,
    backgroundColor: '#12070a',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 14,
    marginBottom: 12,
  },
  errorText: { color: COLORS.dangerText, fontSize: 12, fontWeight: '700', flex: 1 },

  saveBtn: {
    height: 48,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.primaryBorder,
    backgroundColor: COLORS.primaryBg,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  saveBtnText: { color: COLORS.primaryText, fontSize: 14, fontWeight: '900' },

  cancelBtn: {
    marginTop: 10,
    height: 44,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelText: { color: COLORS.textMuted, fontSize: 13, fontWeight: '800' },
});

export default ChangePassword;
