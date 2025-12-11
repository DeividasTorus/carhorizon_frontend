import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Image,
  TouchableOpacity,
  Dimensions,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImageManipulator from 'expo-image-manipulator';
import { GestureHandlerRootView, PinchGestureHandler, PanGestureHandler, State } from 'react-native-gesture-handler';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const ImageCropModal = ({ visible, imageUri, aspectRatio, onCropComplete, onCancel }) => {
  const [scale, setScale] = useState(1);
  const baseScale = useRef(new Animated.Value(1)).current;
  const pinchScale = useRef(new Animated.Value(1)).current;
  const translateX = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(0)).current;
  const lastScale = useRef(1);
  const minScale = useRef(1);
  const lastTranslate = useRef({ x: 0, y: 0 });
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 });
  const imageDimensions = useRef({ baseWidth: 0, baseHeight: 0 });

  // Calculate crop area dimensions - use portrait format (4:5 aspect ratio)
  const getCropDimensions = () => {
    const width = SCREEN_WIDTH;
    const height = width * 1.25; // 4:5 aspect ratio (portrait)
    return { width, height };
  };

  const cropDimensions = getCropDimensions();
  const animatedScale = Animated.multiply(baseScale, pinchScale);

  // Reset when modal opens
  useEffect(() => {
    if (visible) {
      const initialScale = minScale.current;
      setScale(initialScale);
      baseScale.setValue(initialScale);
      pinchScale.setValue(1);
      translateX.setValue(0);
      translateY.setValue(0);
      lastScale.current = initialScale;
      lastTranslate.current = { x: 0, y: 0 };
    }
  }, [visible, imageUri]);

  // Pinch gesture handler
  const onPinchEvent = Animated.event(
    [{ nativeEvent: { scale: pinchScale } }],
    { useNativeDriver: true }
  );

  const onPinchStateChange = (event) => {
    if (event.nativeEvent.oldState === State.ACTIVE) {
      const newScale = Math.max(
        Math.min(lastScale.current * event.nativeEvent.scale, 3),
        minScale.current
      );
      lastScale.current = newScale;
      baseScale.setValue(newScale);
      pinchScale.setValue(1);
      setScale(newScale);
    }
  };

  // Pan gesture handler
  const onPanEvent = Animated.event(
    [{ nativeEvent: { translationX: translateX, translationY: translateY } }],
    { useNativeDriver: true }
  );

  const onPanStateChange = (event) => {
    if (event.nativeEvent.oldState === State.ACTIVE) {
      const newX = lastTranslate.current.x + event.nativeEvent.translationX;
      const newY = lastTranslate.current.y + event.nativeEvent.translationY;
      
      // Calculate pan limits to prevent gaps
      const frameWidth = cropDimensions.width;
      const frameHeight = cropDimensions.height;
      const currentScale = lastScale.current;
      const baseWidth = imageDimensions.current.baseWidth;
      const baseHeight = imageDimensions.current.baseHeight;
      
      if (baseWidth > 0 && baseHeight > 0) {
        const scaledWidth = baseWidth * currentScale;
        const scaledHeight = baseHeight * currentScale;
        
        // Maximum allowed pan (when image edge reaches frame edge)
        const maxPanX = Math.max(0, (scaledWidth - frameWidth) / 2);
        const maxPanY = Math.max(0, (scaledHeight - frameHeight) / 2);
        
        // Clamp pan values
        const clampedX = Math.max(-maxPanX, Math.min(maxPanX, newX));
        const clampedY = Math.max(-maxPanY, Math.min(maxPanY, newY));
        
        lastTranslate.current = { x: clampedX, y: clampedY };
        translateX.setOffset(clampedX);
        translateY.setOffset(clampedY);
      } else {
        lastTranslate.current = { x: newX, y: newY };
        translateX.setOffset(newX);
        translateY.setOffset(newY);
      }
      
      translateX.setValue(0);
      translateY.setValue(0);
    }
  };

  // Zoom controls
  const handleZoomIn = () => {
    const newScale = Math.min(lastScale.current * 1.2, 3);
    lastScale.current = newScale;
    baseScale.setValue(newScale);
    setScale(newScale);
  };

  const handleZoomOut = () => {
    const newScale = Math.max(lastScale.current * 0.8, minScale.current);
    lastScale.current = newScale;
    baseScale.setValue(newScale);
    setScale(newScale);
  };

  const handleReset = () => {
    const initialScale = minScale.current;
    lastScale.current = initialScale;
    baseScale.setValue(initialScale);
    pinchScale.setValue(1);
    lastTranslate.current = { x: 0, y: 0 };
    translateX.setValue(0);
    translateY.setValue(0);
    setScale(initialScale);
  };

  // Perform the actual crop
  const handleCrop = async () => {
    try {
      if (!imageUri) return;

      // Get actual image dimensions
      Image.getSize(imageUri, async (imgWidth, imgHeight) => {
        const frameWidth = cropDimensions.width;
        const frameHeight = cropDimensions.height;
        const currentScale = lastScale.current;
        
        // How the image is scaled to fit in the frame
        const imageAspect = imgWidth / imgHeight;
        const frameAspect = frameWidth / frameHeight;
        let baseDisplayWidth, baseDisplayHeight;
        
        // Image is displayed with resizeMode="contain" within the frame
        if (imageAspect > frameAspect) {
          // Image is wider relative to frame - width fits, height has padding
          baseDisplayWidth = frameWidth;
          baseDisplayHeight = frameWidth / imageAspect;
        } else {
          // Image is taller relative to frame - height fits, width has padding
          baseDisplayHeight = frameHeight;
          baseDisplayWidth = frameHeight * imageAspect;
        }
        
        // After zoom, the displayed size
        const displayedWidth = baseDisplayWidth * currentScale;
        const displayedHeight = baseDisplayHeight * currentScale;
        
        // Pixel ratio: display to actual image
        const pixelRatio = imgWidth / baseDisplayWidth;
        
        // What portion of the frame is visible (the crop window in display coords)
        const visibleWidth = frameWidth;
        const visibleHeight = frameHeight;
        
        // Convert pan values to actual offset on the scaled image
        const panX = lastTranslate.current.x;
        const panY = lastTranslate.current.y;
        
        // Where the top-left of the frame intersects the scaled image (display coords)
        const frameLeft = (displayedWidth - frameWidth) / 2 - panX;
        const frameTop = (displayedHeight - frameHeight) / 2 - panY;
        
        // Convert to actual image coordinates
        const cropX = (frameLeft / currentScale) * pixelRatio;
        const cropY = (frameTop / currentScale) * pixelRatio;
        const cropW = (visibleWidth / currentScale) * pixelRatio;
        const cropH = (visibleHeight / currentScale) * pixelRatio;
        
        // Clamp to image bounds
        const finalX = Math.max(0, Math.min(cropX, imgWidth - cropW));
        const finalY = Math.max(0, Math.min(cropY, imgHeight - cropH));
        const finalW = Math.min(cropW, imgWidth - finalX);
        const finalH = Math.min(cropH, imgHeight - finalY);

        const cropData = {
          originX: Math.round(finalX),
          originY: Math.round(finalY),
          width: Math.round(finalW),
          height: Math.round(finalH),
        };

        console.log('Crop:', cropData, 'from', imgWidth, 'x', imgHeight, 'scale:', currentScale);

        const manipResult = await ImageManipulator.manipulateAsync(
          imageUri,
          [{ crop: cropData }],
          { compress: 0.6, format: ImageManipulator.SaveFormat.JPEG }
        );

        onCropComplete(manipResult.uri);
      });
    } catch (error) {
      console.error('Crop error:', error);
      onCancel();
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={false}>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={onCancel}>
              <Ionicons name="close" size={28} color="#e5e7eb" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Apkirpk nuotrauką</Text>
            <TouchableOpacity onPress={handleCrop}>
              <Ionicons name="checkmark" size={28} color="#38bdf8" />
            </TouchableOpacity>
          </View>

          {/* Crop Area */}
          <View style={styles.cropContainer}>
            {/* Crop frame */}
            <View
              style={[
                styles.cropFrame,
                {
                  width: cropDimensions.width,
                  height: cropDimensions.height,
                },
              ]}
            >
              <PanGestureHandler
                onGestureEvent={onPanEvent}
                onHandlerStateChange={onPanStateChange}
                minPointers={1}
                maxPointers={1}
              >
                <Animated.View style={{ flex: 1 }}>
                  <PinchGestureHandler
                    onGestureEvent={onPinchEvent}
                    onHandlerStateChange={onPinchStateChange}
                  >
                    <Animated.View
                      style={[
                        styles.imageContainer,
                        {
                          transform: [
                            { translateX: translateX },
                            { translateY: translateY },
                            { scale: animatedScale },
                          ],
                        },
                      ]}
                    >
                      <Image
                        source={{ uri: imageUri }}
                        style={[
                          styles.image,
                          {
                            width: cropDimensions.width,
                            height: cropDimensions.height,
                          },
                        ]}
                        resizeMode="contain"
                        onLoad={(e) => {
                          const { width, height } = e.nativeEvent.source;
                          setImageSize({ width, height });
                          
                          // Calculate minimum scale to ensure image fills entire crop frame
                          const frameWidth = cropDimensions.width;
                          const frameHeight = cropDimensions.height;
                          const imageAspect = width / height;
                          const frameAspect = frameWidth / frameHeight;
                          
                          let baseDisplayWidth, baseDisplayHeight;
                          
                          // Image is displayed with resizeMode="contain" within the frame
                          if (imageAspect > frameAspect) {
                            // Image is wider relative to frame - width fits, height has padding
                            baseDisplayWidth = frameWidth;
                            baseDisplayHeight = frameWidth / imageAspect;
                          } else {
                            // Image is taller relative to frame - height fits, width has padding
                            baseDisplayHeight = frameHeight;
                            baseDisplayWidth = frameHeight * imageAspect;
                          }
                          
                          // Store base dimensions for pan limit calculations
                          imageDimensions.current = {
                            baseWidth: baseDisplayWidth,
                            baseHeight: baseDisplayHeight
                          };
                          
                          // Calculate minimum scale needed to cover entire frame
                          const minScaleX = frameWidth / baseDisplayWidth;
                          const minScaleY = frameHeight / baseDisplayHeight;
                          const calculatedMinScale = Math.max(minScaleX, minScaleY);
                          
                          minScale.current = calculatedMinScale;
                          
                          // Start at minimum scale (just enough to fill frame)
                          lastScale.current = calculatedMinScale;
                          baseScale.setValue(calculatedMinScale);
                          setScale(calculatedMinScale);
                        }}
                      />
                    </Animated.View>
                  </PinchGestureHandler>
                </Animated.View>
              </PanGestureHandler>

              {/* Crop frame border */}
              <View style={styles.frameBorder}>
                <View style={[styles.corner, styles.topLeft]} />
                <View style={[styles.corner, styles.topRight]} />
                <View style={[styles.corner, styles.bottomLeft]} />
                <View style={[styles.corner, styles.bottomRight]} />
              </View>
            </View>
          </View>

          {/* Instructions */}
          <View style={styles.instructions}>
            <View style={styles.instructionRow}>
              <Ionicons name="hand-left" size={20} color="#38bdf8" />
              <Text style={styles.instructionText}>
                Temk pirštu kad pastatytum nuotrauką
              </Text>
            </View>
            <View style={styles.instructionRow}>
              <Ionicons name="expand" size={20} color="#38bdf8" />
              <Text style={styles.instructionText}>
                Spausti dviem pirštais priartinti
              </Text>
            </View>
          </View>
        </View>
      </GestureHandlerRootView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#020617',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    paddingTop: 80,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(148, 163, 184, 0.2)',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#e5e7eb',
  },
  cropContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    backgroundColor: '#020617',
  },
  cropFrame: {
    overflow: 'hidden',
    backgroundColor: 'transparent',
    position: 'relative',
    zIndex: 10,
  },
  imageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  frameBorder: {
    ...StyleSheet.absoluteFillObject,
    borderWidth: 2,
    borderColor: '#38bdf8',
    pointerEvents: 'none',
  },
  corner: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderColor: '#38bdf8',
  },
  topLeft: {
    top: -2,
    left: -2,
    borderTopWidth: 4,
    borderLeftWidth: 4,
  },
  topRight: {
    top: -2,
    right: -2,
    borderTopWidth: 4,
    borderRightWidth: 4,
  },
  bottomLeft: {
    bottom: -2,
    left: -2,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
  },
  bottomRight: {
    bottom: -2,
    right: -2,
    borderBottomWidth: 4,
    borderRightWidth: 4,
  },
  controls: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    alignItems: 'center',
  },
  zoomControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 20,
    marginBottom: 16,
  },
  controlButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#1e293b',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155',
  },
  scaleIndicator: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    backgroundColor: '#1e293b',
    borderRadius: 8,
    minWidth: 80,
    alignItems: 'center',
  },
  scaleText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#38bdf8',
  },
  resetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#1e293b',
    borderRadius: 8,
    gap: 8,
    borderWidth: 1,
    borderColor: '#334155',
  },
  resetButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#94a3b8',
  },
  instructions: {
    paddingHorizontal: 20,
    paddingBottom: 30,
    gap: 12,
  },
  instructionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  instructionText: {
    fontSize: 14,
    color: '#94a3b8',
  },
});

export default ImageCropModal;
