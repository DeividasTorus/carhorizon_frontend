import React, { useState, useEffect } from 'react';
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

const AVATAR_SIZE = 100;

const EditProfile = () => {
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const { cars, activeCarId, uploadCarAvatar, updateCarBio, deleteCar } = useAppContext();

    const activeCar = cars?.find(c => c.id === activeCarId);

    const [bio, setBio] = useState('');
    const [newImageUri, setNewImageUri] = useState(null);
    const [saving, setSaving] = useState(false);
    const [deleting, setDeleting] = useState(false);

    useEffect(() => {
        if (activeCar) {
            setBio(activeCar.bio || '');
        }
    }, [activeCar]);

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
            // Upload avatar if new image was selected
            if (newImageUri) {
                await uploadCarAvatar(activeCar.id, newImageUri);
            }

            // Update bio
            await updateCarBio(activeCar.id, bio);

            // Just go back without alert
            router.back();
        } catch (error) {
            console.error('Save error:', error);
            Alert.alert('Klaida', error.message || 'Nepavyko išsaugoti pakeitimų');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = () => {
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
                    }
                }
            ]
        );
    };

    if (!activeCar) {
        return (
            <View style={[styles.container]}>
                <StatusBar style="light" />
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                        <Ionicons name="arrow-back" size={24} color="#e5e7eb" />
                    </TouchableOpacity>

                    <View style={styles.headerTitleGroup}>
                        <View style={styles.headerIconWrapper}>
                            <Ionicons name="create-outline" size={22} color="#38bdf8" />
                        </View>
                        <Text style={styles.headerTitle}>Redaguoti profilį</Text>
                    </View>

                    <View style={{ width: 24 }} />
                </View>
                <View style={styles.emptyContainer}>
                    <Text style={styles.emptyText}>Aktyvus automobilis nerastas</Text>
                </View>
            </View>
        );
    }

    // Show new image if selected, otherwise show current avatar
    const carAvatarUrl = newImageUri
        ? newImageUri
        : (activeCar.avatar_url ? `http://192.168.1.165:4000${activeCar.avatar_url}` : null);
    const carInitials = activeCar.plate?.[0]?.toUpperCase() || '?';

    return (
        <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <View style={[styles.container, { paddingTop: insets.top }]}>
                <StatusBar style="light" />

                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                        <Ionicons name="arrow-back" size={24} color="#e5e7eb" />
                    </TouchableOpacity>

                    <View style={styles.headerTitleGroup}>
                        <View style={styles.headerIconWrapper}>
                            <Ionicons name="create-outline" size={26} color="#38bdf8" />
                        </View>
                        <Text style={styles.headerTitle}>Redaguoti profilį</Text>
                    </View>

                    <View style={{ width: 24 }} />
                </View>

                <ScrollView
                    style={styles.scrollView}
                    contentContainerStyle={styles.scrollContent}
                    keyboardShouldPersistTaps="handled"
                >
                    {/* Avatar Section */}
                    <View style={styles.avatarSection}>
                        <View style={styles.avatarWrapper}>
                            <CachedAvatar
                                remoteUrl={carAvatarUrl}
                                size={AVATAR_SIZE}
                                borderRadius={AVATAR_SIZE / 2}
                                placeholderInitial={carInitials}
                            />
                            <TouchableOpacity
                                style={styles.changePhotoButton}
                                onPress={pickImage}
                            >
                                <Ionicons name="camera" size={20} color="#0b1120" />
                            </TouchableOpacity>
                        </View>
                        <Text style={styles.avatarHint}>Pakeisti automobilio nuotrauką</Text>
                    </View>

                    {/* Bio */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Bio</Text>
                        <TextInput
                            style={[styles.input, styles.textArea]}
                            value={bio}
                            onChangeText={setBio}
                            placeholder="Aprašyk save ar savo automobilį..."
                            placeholderTextColor="#6b7280"
                            multiline
                            maxLength={150}
                            textAlignVertical="top"
                        />
                        <Text style={styles.charCount}>{bio.length}/150</Text>
                    </View>

                    {/* Save Button */}
                    <TouchableOpacity
                        style={[styles.saveButton, saving && styles.saveButtonDisabled]}
                        onPress={handleSave}
                        disabled={saving}
                    >
                        {saving ? (
                            <ActivityIndicator size="small" color="#020617" />
                        ) : (
                            <Text style={styles.saveButtonText}>Išsaugoti pakeitimus</Text>
                        )}
                    </TouchableOpacity>

                    {/* Delete Button */}
                    <TouchableOpacity
                        style={[styles.deleteButton, deleting && styles.deleteButtonDisabled]}
                        onPress={handleDelete}
                        disabled={deleting || saving}
                    >
                        {deleting ? (
                            <ActivityIndicator size="small" color="#ef4444" />
                        ) : (
                            <Text style={styles.deleteButtonText}>Ištrinti automobilį</Text>
                        )}
                    </TouchableOpacity>
                </ScrollView>
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
        marginTop: -50,
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
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        padding: 20,
    },
    avatarSection: {
        alignItems: 'center',
        marginBottom: 32,
        marginTop: 16,
    },
    avatarWrapper: {
        position: 'relative',
        marginBottom: 12,
    },
    changePhotoButton: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        backgroundColor: '#38bdf8',
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 3,
        borderColor: '#0b1120',
    },
    avatarHint: {
        fontSize: 13,
        color: '#9ca3af',
    },
    inputGroup: {
        marginBottom: 24,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: '#e5e7eb',
        marginBottom: 8,
    },
    input: {
        backgroundColor: '#1e293b',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#334155',
        paddingHorizontal: 16,
        paddingVertical: 14,
        fontSize: 15,
        color: '#e5e7eb',
    },
    inputDisabled: {
        backgroundColor: '#0f172a',
        borderColor: '#1e293b',
    },
    inputTextDisabled: {
        fontSize: 15,
        color: '#6b7280',
    },
    textArea: {
        minHeight: 100,
        textAlignVertical: 'top',
    },
    charCount: {
        fontSize: 12,
        color: '#6b7280',
        textAlign: 'right',
        marginTop: 6,
    },
    saveButton: {
        backgroundColor: '#38bdf8',
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: 'center',
        marginTop: 8,
        marginBottom: 32,
    },
    saveButtonDisabled: {
        opacity: 0.6,
    },
    saveButtonText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#020617',
    },
    deleteButton: {
        backgroundColor: 'transparent',
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: 'center',
        marginTop: 12,
        marginBottom: 32,
        borderWidth: 1,
        borderColor: '#ef4444',
    },
    deleteButtonDisabled: {
        opacity: 0.5,
    },
    deleteButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#ef4444',
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyText: {
        fontSize: 15,
        color: '#6b7280',
    },
});

export default EditProfile;
