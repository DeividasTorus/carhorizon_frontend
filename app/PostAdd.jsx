import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  ActivityIndicator,
  Image,
  FlatList,
  Modal,
  Dimensions,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useNavigation, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAppContext } from '../context/AppContext';
import ImageCropModal from '../components/ImageCropModal';
import COLORS from '../config/colors';

const PostAdd = () => {
  const navigation = useNavigation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { token, createPost, activeCarId, fetchCarStats } = useAppContext();

  const [currentStep, setCurrentStep] = useState(1); // 1: Select, 2: Crop, 3: Write
  const [description, setDescription] = useState('');
  const [selectedImages, setSelectedImages] = useState([]);
  const [croppedImages, setCroppedImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [imagePickerVisible, setImagePickerVisible] = useState(false);
  const [currentCropIndex, setCurrentCropIndex] = useState(0);
  const [cropModalVisible, setCropModalVisible] = useState(false);
  const [descriptionModalVisible, setDescriptionModalVisible] = useState(false);
  const [tempDescription, setTempDescription] = useState('');

  const handlePickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        quality: 0.7,
      });

      if (!result.canceled) {
        const newImages = result.assets.map((asset) => asset.uri);
        setSelectedImages(newImages);
        setImagePickerVisible(false);
      }
    } catch (e) {
      Alert.alert('Klaida', 'Nepavyko pasirinkti nuotraukos');
    }
  };

  const handleNextToCrop = () => {
    if (selectedImages.length === 0) {
      Alert.alert('Klaida', 'Pasirink bent vieną nuotrauką');
      return;
    }
    setCurrentStep(2);
    setCurrentCropIndex(0);
  };

  const handleOpenCropModal = () => setCropModalVisible(true);

  const handleCropComplete = (croppedUri) => {
    const newCroppedImages = [...croppedImages];
    newCroppedImages[currentCropIndex] = croppedUri;
    setCroppedImages(newCroppedImages);

    const newSelectedImages = [...selectedImages];
    newSelectedImages[currentCropIndex] = croppedUri;
    setSelectedImages(newSelectedImages);

    setCropModalVisible(false);
  };

  const handleCropCancel = () => setCropModalVisible(false);

  const handleTakePhoto = async () => {
    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 5],
        quality: 0.6,
      });

      if (!result.canceled) {
        setSelectedImages([...selectedImages, result.assets[0].uri]);
        setImagePickerVisible(false);
      }
    } catch (e) {
      Alert.alert('Klaida', 'Nepavyko nufotografuoti');
    }
  };

  const handlePublishPost = async () => {
    if (!description.trim()) {
      Alert.alert('Klaida', 'Įvesk posto aprašymą');
      return;
    }

    setLoading(true);
    try {
      const imagesToUpload =
        croppedImages.length > 0 ? croppedImages : selectedImages;

      const compressedImages = await Promise.all(
        imagesToUpload.map(async (uri) => {
          const result = await ImageManipulator.manipulateAsync(
            uri,
            [{ resize: { width: 1080 } }],
            { compress: 0.6, format: ImageManipulator.SaveFormat.JPEG }
          );
          return result.uri;
        })
      );

      await createPost(description, compressedImages);

      if (fetchCarStats && activeCarId) {
        await fetchCarStats(activeCarId);
      }

      Alert.alert('Sėkmė', 'Postas sėkmingai publikuotas!');
      router.back();
    } catch (e) {
      console.log('Publish error:', e);
      Alert.alert('Klaida', e.message || 'Nepavyko publikuoti posto');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      {/* Header with Step Indicator */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => {
            if (currentStep === 1) router.back();
            else if (currentStep === 2) setCurrentStep(1);
            else if (currentStep === 3) setCurrentStep(2);
          }}
        >
          <Ionicons name="arrow-back" size={26} color={COLORS.text} />
        </TouchableOpacity>

        <View style={styles.stepIndicatorHeader}>
          {[1, 2, 3].map((step) => (
            <View key={step} style={styles.stepItem}>
              <View
                style={[
                  styles.stepCircle,
                  currentStep >= step && styles.stepCircleActive,
                ]}
              >
                <Text
                  style={[
                    styles.stepNumber,
                    currentStep >= step && styles.stepNumberActive,
                  ]}
                >
                  {step}
                </Text>
              </View>
              {step < 3 && (
                <View
                  style={[
                    styles.stepLine,
                    currentStep > step && styles.stepLineActive,
                  ]}
                />
              )}
            </View>
          ))}
        </View>

        <View style={{ width: 26 }} />
      </View>

      {/* STEP 2: Crop */}
      {currentStep === 2 ? (
        <View style={styles.stepContent}>
          <View>
            <FlatList
              data={selectedImages}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              snapToInterval={Dimensions.get('window').width}
              snapToAlignment="start"
              decelerationRate="fast"
              keyExtractor={(_, index) => index.toString()}
              onMomentumScrollEnd={(event) => {
                const index = Math.round(
                  event.nativeEvent.contentOffset.x /
                    Dimensions.get('window').width
                );
                setCurrentCropIndex(index);
              }}
              renderItem={({ item }) => (
                <View style={styles.carouselImageContainer}>
                  <Image source={{ uri: item }} style={styles.carouselImage} resizeMode="cover" />

                  <View style={styles.cropPreviewOverlay}>
                    <View style={styles.cropPreviewFrame}>
                      <View style={styles.cropFrameCorner} />
                      <View style={[styles.cropFrameCorner, styles.topRight]} />
                      <View style={[styles.cropFrameCorner, styles.bottomLeft]} />
                      <View style={[styles.cropFrameCorner, styles.bottomRight]} />
                    </View>
                  </View>
                </View>
              )}
            />
          </View>

          <View style={styles.imageCounter}>
            <Text style={styles.imageCounterText}>
              {currentCropIndex + 1} / {selectedImages.length}
            </Text>
          </View>

          <View style={styles.cropActions}>
            <TouchableOpacity
              style={styles.cropButtonIcon}
              onPress={handleOpenCropModal}
            >
              <Ionicons name="crop" size={28} color={COLORS.primary} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.nextButtonCompact}
              onPress={() => setCurrentStep(3)}
            >
              <Text style={styles.nextButtonText}>Toliau</Text>
              <Ionicons name="arrow-forward" size={18} color={COLORS.dark} />
            </TouchableOpacity>
          </View>

          <ImageCropModal
            visible={cropModalVisible}
            imageUri={selectedImages[currentCropIndex]}
            aspectRatio={null}
            onCropComplete={handleCropComplete}
            onCancel={handleCropCancel}
          />
        </View>
      ) : (
        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* STEP 1 */}
          {currentStep === 1 && (
            <View style={styles.stepContent}>
              <Text style={styles.stepDescription}>
                Pasirink nuotraukas, kurias nori pridėti prie įrašo
              </Text>

              {selectedImages.length > 0 && (
                <FlatList
                  data={selectedImages}
                  keyExtractor={(_, index) => index.toString()}
                  renderItem={({ item, index }) => (
                    <View style={styles.imageWrapper}>
                      <Image source={{ uri: item }} style={styles.selectedImage} />
                      <TouchableOpacity
                        style={styles.removeImageButton}
                        onPress={() =>
                          setSelectedImages(
                            selectedImages.filter((_, i) => i !== index)
                          )
                        }
                      >
                        <Ionicons name="close-circle" size={28} color={COLORS.danger || '#ef4444'} />
                      </TouchableOpacity>
                    </View>
                  )}
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.imageList}
                />
              )}

              <TouchableOpacity
                style={styles.addImageButton}
                onPress={() => setImagePickerVisible(true)}
              >
                <Ionicons name="image-outline" size={32} color={COLORS.primary} />
                <Text style={styles.addImageText}>
                  {selectedImages.length === 0
                    ? 'Pridėti nuotraukas'
                    : `Pasirinkta: ${selectedImages.length}`}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.nextButton,
                  selectedImages.length === 0 && styles.nextButtonDisabled,
                ]}
                onPress={handleNextToCrop}
                disabled={selectedImages.length === 0}
              >
                <Text style={styles.nextButtonText}>Toliau</Text>
                <Ionicons name="arrow-forward" size={20} color={COLORS.dark} />
              </TouchableOpacity>
            </View>
          )}

          {/* STEP 3 */}
          {currentStep === 3 && (
            <View style={styles.stepContent}>
              <View style={styles.sectionImages}>
                <FlatList
                  data={selectedImages}
                  keyExtractor={(_, index) => index.toString()}
                  renderItem={({ item }) => (
                    <Image source={{ uri: item }} style={styles.previewImage} />
                  )}
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.imageList}
                />
              </View>

              <View style={styles.section}>
                <Text style={styles.sectionLabel}>Aprašymas</Text>
                <TouchableOpacity
                  style={styles.descriptionInput}
                  onPress={() => {
                    setTempDescription(description);
                    setDescriptionModalVisible(true);
                  }}
                >
                  <Text
                    style={[
                      styles.descriptionPlaceholder,
                      description && styles.descriptionText,
                    ]}
                  >
                    {description ||
                      'Papasakok daugiau apie savo projektą arba nuomonę...'}
                  </Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                style={[styles.publishButton, loading && styles.publishButtonDisabled]}
                onPress={handlePublishPost}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color={COLORS.dark} />
                ) : (
                  <>
                    <Ionicons name="checkmark-circle" size={22} color={COLORS.dark} />
                    <Text style={styles.publishButtonText}>Paskelbti Įrašą</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      )}

      {/* Image Picker Modal */}
      <Modal
        visible={imagePickerVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setImagePickerVisible(false)}
      >
        <View style={styles.modal}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Pasirink nuotrauką</Text>
              <TouchableOpacity onPress={() => setImagePickerVisible(false)}>
                <Ionicons name="close" size={26} color={COLORS.text} />
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.modalButton} onPress={handlePickImage}>
              <Ionicons name="folder-outline" size={24} color={COLORS.primary} />
              <Text style={styles.modalButtonText}>Pasirinkti iš galerijos</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.modalButton} onPress={handleTakePhoto}>
              <Ionicons name="camera-outline" size={24} color={COLORS.primary} />
              <Text style={styles.modalButtonText}>Nufotografuoti</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.modalButton, styles.cancelButton]}
              onPress={() => setImagePickerVisible(false)}
            >
              <Text style={styles.cancelButtonText}>Atšaukti</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Description Modal */}
      <Modal
        visible={descriptionModalVisible}
        animationType="slide"
        onRequestClose={() => setDescriptionModalVisible(false)}
      >
        <View style={styles.descriptionModalContainer}>
          <StatusBar style="light" />
          <View style={[styles.descriptionModalHeader, { paddingTop: insets.top + 12 }]}>
            <TouchableOpacity onPress={() => setDescriptionModalVisible(false)}>
              <Ionicons name="close" size={28} color={COLORS.text} />
            </TouchableOpacity>
            <Text style={styles.descriptionModalTitle}>Aprašymas</Text>
            <TouchableOpacity
              onPress={() => {
                setDescription(tempDescription);
                setDescriptionModalVisible(false);
              }}
            >
              <Ionicons name="checkmark" size={28} color={COLORS.primary} />
            </TouchableOpacity>
          </View>

          <TextInput
            style={styles.descriptionModalInput}
            placeholder="Papasakok daugiau apie savo projektą arba nuomonę..."
            placeholderTextColor={COLORS.muted}
            value={tempDescription}
            onChangeText={setTempDescription}
            multiline
            autoFocus
          />
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.dark },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: COLORS.dark,
  },

  stepIndicatorHeader: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  stepItem: { flexDirection: 'row', alignItems: 'center' },

  stepCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.surface || '#1e293b',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.border || '#334155',
  },
  stepCircleActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  stepNumber: { fontSize: 12, fontWeight: '700', color: COLORS.muted || '#64748b' },
  stepNumberActive: { color: COLORS.dark },

  stepLine: { width: 30, height: 2, backgroundColor: COLORS.border || '#334155', marginHorizontal: 4 },
  stepLineActive: { backgroundColor: COLORS.primary },

  stepContent: { flex: 1, marginTop: 30 },
  stepDescription: { fontSize: 14, color: COLORS.muted, marginBottom: 24, textAlign: 'center' },

  nextButton: {
    flexDirection: 'row',
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
    marginHorizontal: 20,
    gap: 8,
  },
  nextButtonDisabled: { backgroundColor: COLORS.border || '#334155', opacity: 0.5 },
  nextButtonText: { fontSize: 16, fontWeight: '700', color: COLORS.dark },

  previewImage: { width: 200, height: 220, borderRadius: 8, marginRight: 8 },

  content: { flex: 1, backgroundColor: COLORS.dark },
  contentContainer: { paddingHorizontal: 4, paddingVertical: 20 },

  sectionImages: { marginBottom: 24, marginLeft: -40 },
  section: { marginBottom: 5, marginHorizontal: 12 },
  sectionLabel: { fontSize: 12, fontWeight: '600', color: COLORS.text, marginBottom: 8 },

  descriptionInput: {
    backgroundColor: COLORS.surface || '#1e293b',
    borderRadius: 5,
    paddingHorizontal: 14,
    paddingVertical: 10,
    minHeight: 120,
    borderWidth: 1,
    borderColor: COLORS.borderSoft || 'rgba(148, 163, 184, 0.2)',
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
  },
  descriptionPlaceholder: { color: COLORS.muted, fontSize: 14 },
  descriptionText: { color: COLORS.text },

  descriptionModalContainer: { flex: 1, backgroundColor: COLORS.dark },
  descriptionModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderSoft || 'rgba(148, 163, 184, 0.2)',
  },
  descriptionModalTitle: { fontSize: 18, fontWeight: '700', color: COLORS.text },
  descriptionModalInput: {
    flex: 1,
    backgroundColor: COLORS.dark,
    paddingHorizontal: 16,
    paddingVertical: 16,
    color: COLORS.text,
    fontSize: 16,
    textAlignVertical: 'top',
  },

  addImageButton: {
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primarySoft || 'rgba(14,165,233,0.08)',
    marginHorizontal: 20,
  },
  addImageText: { fontSize: 14, color: COLORS.primary, fontWeight: '600', marginTop: 8 },

  imageList: { marginBottom: 30, marginTop: 5, paddingHorizontal: 52 },
  imageWrapper: { position: 'relative', marginRight: 10 },
  selectedImage: { width: 330, height: 330, borderRadius: 8, backgroundColor: COLORS.surface || '#1e293b' },

  removeImageButton: {
    position: 'absolute',
    top: 2,
    right: 10,
    backgroundColor: COLORS.dark,
    borderRadius: 14,
  },

  modal: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.7)', justifyContent: 'flex-end' },
  modalContent: {
    backgroundColor: COLORS.surface || '#1e293b',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 32,
  },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 18, fontWeight: '700', color: COLORS.text },

  modalButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: COLORS.ink || '#0b1120',
    borderRadius: 12,
    marginBottom: 10,
  },
  modalButtonText: { fontSize: 16, color: COLORS.text, fontWeight: '600', marginLeft: 12 },

  cancelButton: {
    backgroundColor: COLORS.dangerSoft || 'rgba(239, 68, 68, 0.2)',
    borderWidth: 1,
    borderColor: COLORS.danger || '#ef4444',
  },
  cancelButtonText: { color: COLORS.danger || '#ef4444', fontSize: 16, fontWeight: '600' },

  publishButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginHorizontal: 100,
    marginTop: 20,
  },
  publishButtonDisabled: { opacity: 0.6 },
  publishButtonText: { fontSize: 16, fontWeight: '700', color: COLORS.dark },

  carouselImageContainer: {
    width: Dimensions.get('window').width,
    height: Dimensions.get('window').width * 1.25,
    backgroundColor: COLORS.dark,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  carouselImage: { width: '100%', height: '100%', backgroundColor: COLORS.dark },

  cropPreviewOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    pointerEvents: 'none',
  },
  cropPreviewFrame: {
    width: Dimensions.get('window').width,
    height: Dimensions.get('window').width * 1.25,
    borderWidth: 0,
    position: 'relative',
  },
  cropFrameCorner: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderColor: COLORS.primary,
    top: -2,
    left: -2,
    borderTopWidth: 5,
    borderLeftWidth: 5,
  },
  topRight: { left: 'auto', right: -2, borderLeftWidth: 0, borderRightWidth: 4 },
  bottomLeft: { top: 'auto', bottom: -2, borderTopWidth: 0, borderBottomWidth: 4 },
  bottomRight: {
    top: 'auto',
    left: 'auto',
    bottom: -2,
    right: -2,
    borderTopWidth: 0,
    borderLeftWidth: 0,
    borderBottomWidth: 4,
    borderRightWidth: 4,
  },

  imageCounter: { alignItems: 'center', paddingVertical: 8 },
  imageCounterText: { fontSize: 14, fontWeight: '700', color: COLORS.primary },

  cropActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  cropButtonIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: COLORS.primarySoft || 'rgba(14,165,233,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  nextButtonCompact: {
    flexDirection: 'row',
    backgroundColor: COLORS.primary,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
});

export default PostAdd;
