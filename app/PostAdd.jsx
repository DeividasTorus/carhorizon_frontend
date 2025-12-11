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
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useNavigation, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAppContext } from '../context/AppContext';
import ImageCropModal from '../components/ImageCropModal';

const PostAdd = () => {
  const navigation = useNavigation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, token, createPost, cars, activeCarId, fetchCarStats } = useAppContext();

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
        quality: 0.7, // Compressed to reduce file size
      });

      if (!result.canceled) {
        const newImages = result.assets.map(asset => asset.uri);
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

  const handleOpenCropModal = () => {
    setCropModalVisible(true);
  };

  const handleCropComplete = (croppedUri) => {
    const newCroppedImages = [...croppedImages];
    newCroppedImages[currentCropIndex] = croppedUri;
    setCroppedImages(newCroppedImages);

    // Update the selected image with cropped version
    const newSelectedImages = [...selectedImages];
    newSelectedImages[currentCropIndex] = croppedUri;
    setSelectedImages(newSelectedImages);

    setCropModalVisible(false);
    // Stay on step 2 to allow selecting other images
  };

  const handleCropCancel = () => {
    setCropModalVisible(false);
  };

  const handleSkipCrop = () => {
    // Use original images without cropping
    setCroppedImages(selectedImages);
    setCurrentStep(3);
  };

  const handleBackToSelection = () => {
    setCurrentStep(1);
    setCurrentCropIndex(0);
    setCroppedImages([]);
  };

  const handleBackToCrop = () => {
    setCurrentStep(2);
    setCurrentCropIndex(0);
  };

  const handleRemoveImage = (index) => {
    setSelectedImages(selectedImages.filter((_, i) => i !== index));
  };

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
      // Use cropped images if available, otherwise original
      const imagesToUpload = croppedImages.length > 0 ? croppedImages : selectedImages;

      // Compress all images before upload to reduce file size
      const compressedImages = await Promise.all(
        imagesToUpload.map(async (uri) => {
          const result = await ImageManipulator.manipulateAsync(
            uri,
            [{ resize: { width: 1080 } }], // Max width 1080px
            { compress: 0.6, format: ImageManipulator.SaveFormat.JPEG }
          );
          return result.uri;
        })
      );

      await createPost(description, compressedImages);

      // Atnaujinti aktyvios mašinos statistiką (pakilo posts_count)
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

  const getStepTitle = () => {
    switch (currentStep) {
      case 1: return 'Pasirink Nuotraukas';
      case 2: return `Apkirpk (${currentCropIndex + 1}/${selectedImages.length})`;
      case 3: return 'Parašyk Tekstą';
      default: return 'Naujas Įrašas';
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      {/* Header with Step Indicator */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => {
          if (currentStep === 1) {
            router.back();
          } else if (currentStep === 2) {
            setCurrentStep(1);
          } else if (currentStep === 3) {
            setCurrentStep(2);
          }
        }}>
          <Ionicons name="arrow-back" size={26} color="#e5e7eb" />
        </TouchableOpacity>

        {/* Step Indicator in Header */}
        <View style={styles.stepIndicatorHeader}>
          {[1, 2, 3].map((step) => (
            <View key={step} style={styles.stepItem}>
              <View style={[styles.stepCircle, currentStep >= step && styles.stepCircleActive]}>
                <Text style={[styles.stepNumber, currentStep >= step && styles.stepNumberActive]}>
                  {step}
                </Text>
              </View>
              {step < 3 && <View style={[styles.stepLine, currentStep > step && styles.stepLineActive]} />}
            </View>
          ))}
        </View>

        <View style={{ width: 26 }} />
      </View>

      {/* STEP 2: Crop Images - No scroll needed */}
      {currentStep === 2 ? (
        <View style={styles.stepContent}>
          {/* Image Carousel */}
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
                const index = Math.round(event.nativeEvent.contentOffset.x / Dimensions.get('window').width);
                setCurrentCropIndex(index);
              }}
              renderItem={({ item, index }) => (
                <View style={styles.carouselImageContainer}>
                  <Image
                    source={{ uri: item }}
                    style={styles.carouselImage}
                    resizeMode="cover"
                  />
                  {/* Crop Preview Frame */}
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

          {/* Image Counter */}
          <View style={styles.imageCounter}>
            <Text style={styles.imageCounterText}>
              {currentCropIndex + 1} / {selectedImages.length}
            </Text>
          </View>

          {/* Action Buttons */}
          <View style={styles.cropActions}>
            <TouchableOpacity
              style={styles.cropButtonIcon}
              onPress={handleOpenCropModal}
            >
              <Ionicons name="crop" size={28} color="#38bdf8" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.nextButtonCompact}
              onPress={() => setCurrentStep(3)}
            >
              <Text style={styles.nextButtonText}>Toliau</Text>
              <Ionicons name="arrow-forward" size={18} color="#020617" />
            </TouchableOpacity>
          </View>

          {/* Crop Modal */}
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
          {/* STEP 1: Select Images */}
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
                        onPress={() => setSelectedImages(selectedImages.filter((_, i) => i !== index))}
                      >
                        <Ionicons name="close-circle" size={28} color="#ef4444" />
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
                <Ionicons name="image-outline" size={32} color="#38bdf8" />
                <Text style={styles.addImageText}>
                  {selectedImages.length === 0 ? 'Pridėti nuotraukas' : `Pasirinkta: ${selectedImages.length}`}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.nextButton, selectedImages.length === 0 && styles.nextButtonDisabled]}
                onPress={handleNextToCrop}
                disabled={selectedImages.length === 0}
              >
                <Text style={styles.nextButtonText}>Toliau</Text>
                <Ionicons name="arrow-forward" size={20} color="#020617" />
              </TouchableOpacity>
            </View>
          )}

          {/* STEP 3: Write Content */}
          {currentStep === 3 && (
            <View style={styles.stepContent}>
              {/* Selected Images Preview */}
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

              {/* Description Input */}
              <View style={styles.section}>
                <Text style={styles.sectionLabel}>Aprašymas</Text>
                <TouchableOpacity
                  style={styles.descriptionInput}
                  onPress={() => {
                    setTempDescription(description);
                    setDescriptionModalVisible(true);
                  }}
                >
                  <Text style={[styles.descriptionPlaceholder, description && styles.descriptionText]}>
                    {description || 'Papasakok daugiau apie savo projektą arba nuomonę...'}
                  </Text>
                </TouchableOpacity>
              </View>
              {/* Publish Button */}
              <TouchableOpacity
                style={[styles.publishButton, loading && styles.publishButtonDisabled]}
                onPress={handlePublishPost}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#020617" />
                ) : (
                  <>
                    <Ionicons name="checkmark-circle" size={22} color="#020617" />
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
                <Ionicons name="close" size={26} color="#e5e7eb" />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.modalButton}
              onPress={handlePickImage}
            >
              <Ionicons name="folder-outline" size={24} color="#38bdf8" />
              <Text style={styles.modalButtonText}>Pasirinkti iš galerijos</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.modalButton}
              onPress={handleTakePhoto}
            >
              <Ionicons name="camera-outline" size={24} color="#38bdf8" />
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
              <Ionicons name="close" size={28} color="#e5e7eb" />
            </TouchableOpacity>
            <Text style={styles.descriptionModalTitle}>Aprašymas</Text>
            <TouchableOpacity onPress={() => {
              setDescription(tempDescription);
              setDescriptionModalVisible(false);
            }}>
              <Ionicons name="checkmark" size={28} color="#38bdf8" />
            </TouchableOpacity>
          </View>
          
          <TextInput
            style={styles.descriptionModalInput}
            placeholder="Papasakok daugiau apie savo projektą arba nuomonę..."
            placeholderTextColor="#6b7280"
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
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  stepIndicatorHeader: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepIndicator: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 40,
    backgroundColor: '#020617',
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stepCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#1e293b',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#334155',
  },
  stepCircleActive: {
    backgroundColor: '#38bdf8',
    borderColor: '#38bdf8',
  },
  stepNumber: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748b',
  },
  stepNumberActive: {
    color: '#020617',
  },
  stepLine: {
    width: 30,
    height: 2,
    backgroundColor: '#334155',
    marginHorizontal: 4,
  },
  stepLineActive: {
    backgroundColor: '#38bdf8',
  },
  stepContent: {
    flex: 1,
    marginTop: 30,
  },
  stepDescription: {
    fontSize: 14,
    color: '#94a3b8',
    marginBottom: 24,
    textAlign: 'center',
  },
  nextButton: {
    flexDirection: 'row',
    backgroundColor: '#38bdf8',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
    marginHorizontal: 20,
    gap: 8,
  },
  nextButtonDisabled: {
    backgroundColor: '#334155',
    opacity: 0.5,
  },
  nextButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#020617',
  },
  previewImage: {
    width: 200,
    height: 220, // 4:5 aspect ratio
    borderRadius: 8,
    marginRight: 8,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 4,
    paddingVertical: 20,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(148, 163, 184, 0.2)',
  },
  userAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    marginRight: 12,
  },
  userAvatarPlaceholder: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(56,189,248,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  userAvatarInitial: {
    fontSize: 22,
    fontWeight: '700',
    color: '#38bdf8',
  },
  userIcon: {
    marginRight: 12,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#e5e7eb',
  },
  userRole: {
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 2,
  },
  sectionImages: {
    marginBottom: 24,
    marginLeft: -40
  },
  section: {
    marginBottom: 5,
    marginHorizontal: 12,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#cbd5e1',
    marginBottom: 8,
  },
  titleInput: {
    backgroundColor: '#1e293b',
    borderRadius: 5,
    paddingHorizontal: 14,
    paddingVertical: 10,
    color: '#e5e7eb',
    fontSize: 14,
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.2)',
  },
  descriptionInput: {
    backgroundColor: '#1e293b',
    borderRadius: 5,
    paddingHorizontal: 14,
    paddingVertical: 10,
    minHeight: 120,
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.2)',
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
  },
  descriptionPlaceholder: {
    color: '#6b7280',
    fontSize: 14,
  },
  descriptionText: {
    color: '#e5e7eb',
  },
  descriptionModalContainer: {
    flex: 1,
    backgroundColor: '#020617',
  },
  descriptionModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(148, 163, 184, 0.2)',
  },
  descriptionModalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#e5e7eb',
  },
  descriptionModalInput: {
    flex: 1,
    backgroundColor: '#020617',
    paddingHorizontal: 16,
    paddingVertical: 16,
    color: '#e5e7eb',
    fontSize: 16,
    textAlignVertical: 'top',
  },
  charCount: {
    fontSize: 11,
    color: '#6b7280',
    marginTop: 6,
    textAlign: 'right',
  },
  addImageButton: {
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#38bdf8',
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(56, 189, 248, 0.08)',
    marginHorizontal: 20,
  },
  addImageText: {
    fontSize: 14,
    color: '#38bdf8',
    fontWeight: '600',
    marginTop: 8,
  },
  imageList: {
    marginBottom: 30,
    marginTop: 5,
    paddingHorizontal: 52,
  },
  imageWrapper: {
    position: 'relative',
    marginRight: 10,
  },
  selectedImage: {
    width: 330,
    height: 330,
    borderRadius: 8,
    backgroundColor: '#1e293b',
  },
  removeImageButton: {
    position: 'absolute',
    top: 2,
    right: 10,
    backgroundColor: '#020617',
    borderRadius: 14,
  },
  modal: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#1e293b',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 32,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#e5e7eb',
  },
  modalButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: '#0f172a',
    borderRadius: 12,
    marginBottom: 10,
  },
  modalButtonText: {
    fontSize: 16,
    color: '#e5e7eb',
    fontWeight: '600',
    marginLeft: 12,
  },
  cancelButton: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    borderWidth: 1,
    borderColor: '#ef4444',
  },
  cancelButtonText: {
    color: '#ef4444',
    fontSize: 16,
    fontWeight: '600',
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: 'rgba(56, 189, 248, 0.1)',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginVertical: 20,
    borderLeftWidth: 3,
    borderLeftColor: '#38bdf8',
  },
  infoText: {
    fontSize: 12,
    color: '#cbd5e1',
    marginLeft: 10,
    flex: 1,
    lineHeight: 16,
  },
  footer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(148, 163, 184, 0.2)',
    backgroundColor: '#020617',
  },
  publishButton: {
    backgroundColor: '#38bdf8',
    paddingVertical: 14,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginHorizontal: 100,
    marginTop: 20,
  },
  publishButtonDisabled: {
    opacity: 0.6,
  },
  publishButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
  },
  // Crop Screen Styles
  carouselImageContainer: {
    width: Dimensions.get('window').width,
    height: Dimensions.get('window').width * 1.25, // 4:5 portrait aspect ratio
    backgroundColor: '#020617',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  carouselImage: {
    width: '100%',
    height: '100%',
    backgroundColor: '#020617',
  },
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
    borderColor: '#38bdf8',
    top: -2,
    left: -2,
    borderTopWidth: 5,
    borderLeftWidth: 5,
  },
  topRight: {
    left: 'auto',
    right: -2,
    borderLeftWidth: 0,
    borderRightWidth: 4,
  },
  bottomLeft: {
    top: 'auto',
    bottom: -2,
    borderTopWidth: 0,
    borderBottomWidth: 4,
  },
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
  croppedBadge: {
    position: 'absolute',
    top: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(34, 197, 94, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
    borderWidth: 1,
    borderColor: '#22c55e',
  },
  croppedBadgeText: {
    color: '#22c55e',
    fontSize: 12,
    fontWeight: '600',
  },
  imageCounter: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  imageCounterText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#38bdf8',
  },
  aspectRatioContainer: {
    marginBottom: 24,
  },
  aspectRatioButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  aspectRatioButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    backgroundColor: '#1e293b',
    borderRadius: 12,
    marginHorizontal: 4,
    borderWidth: 2,
    borderColor: '#334155',
  },
  aspectRatioButtonActive: {
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    borderColor: '#38bdf8',
  },
  aspectRatioButtonText: {
    fontSize: 12,
    color: '#9ca3af',
    fontWeight: '600',
    marginTop: 4,
  },
  aspectRatioButtonTextActive: {
    color: '#38bdf8',
  },
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
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#38bdf8',
  },
  nextButtonCompact: {
    flexDirection: 'row',
    backgroundColor: '#38bdf8',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  skipButton: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: '#334155',
  },
  skipButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#94a3b8',
  },
  cropButton: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#38bdf8',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  cropButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#020617',
  },
});

export default PostAdd;
