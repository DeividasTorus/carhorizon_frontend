import React, { useState, useEffect, useMemo } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    TextInput,
    Alert,
    ActivityIndicator,
    ScrollView,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { useAppContext } from '../context/AppContext';
import { useRouter } from 'expo-router';
import CachedAvatar from '../components/CachedAvatar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { API_URL } from '../config/env';
import COLORS from '../config/colors';

const AVATAR_SIZE = 100;

const EditProfile = () => {
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const { cars, activeCarId, uploadCarAvatar, updateCarBio, deleteCar } = useAppContext();

    const activeCar = cars?.find((c) => c.id === activeCarId);

    const [bio, setBio] = useState('');
    const [newImageUri, setNewImageUri] = useState(null);
    const [saving, setSaving] = useState(false);
    const [deleting, setDeleting] = useState(false);

    useEffect(() => {
        if (activeCar) setBio(activeCar.bio || '');
    }, [activeCar]);

    const isDirty = useMemo(() => {
        const original = activeCar?.bio || '';
        return bio !== original || !!newImageUri;
    }, [bio, newImageUri, activeCar]);

    const pickImage = async () => {
        if (!activeCar) {
            Alert.alert('Klaida', 'Aktyvus automobilis nerastas');
            return;
        }

        const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!permissionResult.granted) {
            Alert.alert('Klaida', 'Reikalingas leidimas pasiekti galerijos nuotraukas');
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.8,
        });

        if (!result.canceled && result.assets?.[0]?.uri) {
            setNewImageUri(result.assets[0].uri);
        }
    };

    const handleSave = async () => {
        if (!activeCar) {
            Alert.alert('Klaida', 'Aktyvus automobilis nerastas');
            return;
        }

        setSaving(true);
        try {
            if (newImageUri) {
                await uploadCarAvatar(activeCar.id, newImageUri);
            }

            await updateCarBio(activeCar.id, bio);
            router.back();
        } catch (error) {
            console.error('Save error:', error);
            Alert.alert('Klaida', error.message || 'Nepavyko išsaugoti pakeitimų');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = () => {
        if (!activeCar) return;

        Alert.alert(
            'Ištrinti automobilį',
            `Ar tikrai norite ištrinti automobilį "${activeCar.plate}"? Šis veiksmas negrįžtamas.`,
            [
                { text: 'Atšaukti', style: 'cancel' },
                {
                    text: 'Ištrinti',
                    style: 'destructive',
                    onPress: async () => {
                        setDeleting(true);
                        try {
                            await deleteCar(activeCar.id);
                            router.back();
                        } catch (error) {
                            console.error('Delete error:', error);
                            Alert.alert('Klaida', error.message || 'Nepavyko ištrinti automobilio');
                            setDeleting(false);
                        }
                    },
                },
            ]
        );
    };

    const carAvatarUrl = newImageUri
        ? newImageUri
        : activeCar?.avatar_url
            ? `${API_URL}${activeCar.avatar_url}`
            : null;

    const carInitials = activeCar?.plate?.[0]?.toUpperCase() || '?';

    if (!activeCar) {
        return (
            <View style={[styles.container]}>
                <StatusBar style="light" />
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.iconBtn} activeOpacity={0.8}>
                        <Ionicons name="arrow-back" size={26} color={COLORS.text} />
                    </TouchableOpacity>

                    <View style={styles.headerTitleGroup}>
                        <View style={styles.headerIconWrapper}>
                            <Ionicons name="create-outline" size={20} color={COLORS.primary2} />
                        </View>
                        <Text style={styles.headerTitle}>Redaguoti profilį</Text>
                    </View>

                    <View style={{ width: 40 }} />
                </View>

                <View style={styles.emptyContainer}>
                    <Ionicons name="alert-circle-outline" size={44} color={COLORS.gray} />
                    <Text style={styles.emptyText}>Aktyvus automobilis nerastas</Text>
                </View>
            </View>
        );
    }

    return (
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
            <View style={[styles.container,]}>
                <StatusBar style="light" />

                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.iconBtn} activeOpacity={0.8}>
                        <Ionicons name="arrow-back" size={26} color={COLORS.text} />
                    </TouchableOpacity>

                    <View style={styles.headerTitleGroup}>
                        <View style={styles.headerIconWrapper}>
                            <Ionicons name="create-outline" size={24} color={COLORS.primary2} />
                        </View>
                        <Text style={styles.headerTitle}>Redaguoti profilį</Text>

                        {isDirty && !saving && !deleting && (
                            <View style={styles.dirtyPill}>
                                <Text style={styles.dirtyPillText}>Neišsaugota</Text>
                            </View>
                        )}
                    </View>

                    <View style={{ width: 40 }} />
                </View>

                <ScrollView
                    style={styles.scrollView}
                    contentContainerStyle={styles.scrollContent}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                >
                    {/* Avatar Card */}
                    <View style={styles.card}>
                        <Text style={styles.cardTitle}>Nuotrauka</Text>

                        <View style={styles.avatarSection}>
                            <View style={styles.avatarWrapper}>
                                <CachedAvatar
                                    remoteUrl={carAvatarUrl}
                                    size={AVATAR_SIZE}
                                    borderRadius={AVATAR_SIZE / 2}
                                    placeholderInitial={carInitials}
                                />
                                <TouchableOpacity style={styles.changePhotoButton} onPress={pickImage} activeOpacity={0.85}>
                                    <Ionicons name="camera" size={18} color={COLORS.dark} />
                                </TouchableOpacity>
                            </View>

                            <Text style={styles.avatarHint}>Pakeisti automobilio nuotrauką</Text>
                        </View>
                    </View>

                    {/* Bio Card */}
                    <View style={[styles.card, { marginTop: 14 }]}>
                        <View style={styles.cardHeaderRow}>
                            <Text style={styles.cardTitle}>Bio</Text>
                            <Text style={styles.charCount}>{bio.length}/150</Text>
                        </View>

                        <TextInput
                            style={[styles.input, styles.textArea]}
                            value={bio}
                            onChangeText={setBio}
                            placeholder="Aprašyk save ar savo automobilį..."
                            placeholderTextColor={COLORS.gray}
                            multiline
                            maxLength={150}
                            textAlignVertical="top"
                        />
                    </View>

                    {/* Save Button */}
                    <TouchableOpacity
                        style={[styles.saveButton, (!isDirty || saving) && styles.saveButtonDisabled]}
                        onPress={handleSave}
                        disabled={!isDirty || saving}
                        activeOpacity={0.88}
                    >
                        {saving ? (
                            <ActivityIndicator size="small" color={COLORS.dark} />
                        ) : (
                            <View style={styles.saveRow}>
                                <Ionicons name="checkmark-circle-outline" size={18} color={COLORS.dark} />
                                <Text style={styles.saveButtonText}>Išsaugoti</Text>
                            </View>
                        )}
                    </TouchableOpacity>

                    {/* Danger zone (small + clean) */}
                    <View style={styles.dangerZone}>
                        <TouchableOpacity
                            onPress={handleDelete}
                            disabled={deleting || saving}
                            activeOpacity={0.7}
                            style={styles.dangerBtn}
                        >
                            {deleting ? (
                                <ActivityIndicator size="small" color={COLORS.rose} />
                            ) : (
                                <View style={styles.dangerRow}>
                                    <Ionicons name="trash-outline" size={18} color={COLORS.rose} />
                                    <Text style={styles.dangerText}>Ištrinti automobilį</Text>
                                </View>
                            )}
                        </TouchableOpacity>
                    </View>

                    <View style={{ height: 28 }} />
                </ScrollView>
            </View>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.dark, // #020617
    },

    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.dark2,
        marginTop: 10
    },

    iconBtn: {
        width: 30,
        height: 30,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },

    headerTitleGroup: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        marginLeft: 10,
        gap: 10,
    },

    headerIconWrapper: {
        width: 44,
        height: 44,
        borderRadius: 999,
        backgroundColor: 'rgba(56,189,248,0.18)',
        alignItems: 'center',
        justifyContent: 'center',
  
    },

    headerTitle: {
        fontSize: 20,
        fontWeight: '800',
        color: COLORS.text,
    },

    dirtyPill: {
        marginLeft: 8,
        paddingVertical: 5,
        paddingHorizontal: 10,
        borderRadius: 999,
        backgroundColor: 'rgba(245,158,11,0.14)',
        borderWidth: 1,
        borderColor: 'rgba(245,158,11,0.22)',
    },
    dirtyPillText: {
        color: 'rgba(245,158,11,0.95)',
        fontSize: 12,
        fontWeight: '800',
    },

    scrollView: { flex: 1 },
    scrollContent: { padding: 16 },

    card: {
        borderRadius: 16,
        padding: 14,
        borderWidth: 1,
        borderColor: 'rgba(148,163,184,0.16)',
    },

    cardTitle: {
        fontSize: 14,
        fontWeight: '800',
        color: COLORS.text,
    },

    cardHeaderRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 10,
    },

    avatarSection: {
        alignItems: 'center',
        marginTop: 12,
    },

    avatarWrapper: {
        position: 'relative',
        marginBottom: 10,
    },

    changePhotoButton: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        backgroundColor: COLORS.primary2,
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 3,
        borderColor: COLORS.dark,
    },

    avatarHint: {
        fontSize: 12.5,
        color: COLORS.muted,
    },

    input: {
        backgroundColor: COLORS.panel,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: 'rgba(148,163,184,0.18)',
        paddingHorizontal: 14,
        paddingVertical: 12,
        fontSize: 14.5,
        color: COLORS.text,
    },

    textArea: {
        minHeight: 110,
        textAlignVertical: 'top',
    },

    charCount: {
        fontSize: 12,
        color: COLORS.muted,
        fontWeight: '700',
    },

    saveButton: {
        marginTop: 16,
        backgroundColor: COLORS.primary2,
        paddingVertical: 14,
        borderRadius: 14,
        alignItems: 'center',
    },

    saveButtonDisabled: {
        opacity: 0.45,
    },

    saveRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },

    saveButtonText: {
        fontSize: 15,
        fontWeight: '900',
        color: COLORS.dark,
    },

    dangerZone: {
        marginTop: 28,
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: COLORS.dark2,
        alignItems: 'center',
    },

    dangerBtn: {
        paddingVertical: 10,
        paddingHorizontal: 12,
        borderRadius: 12,
    },

    dangerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },

    dangerText: {
        fontSize: 14,
        fontWeight: '800',
        color: COLORS.rose,
    },

    dangerHint: {
        marginTop: 6,
        fontSize: 12,
        color: 'rgba(148,163,184,0.85)',
    },

    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 20,
        gap: 10,
    },

    emptyText: {
        fontSize: 15,
        color: COLORS.muted,
        textAlign: 'center',
    },
});

export default EditProfile;
