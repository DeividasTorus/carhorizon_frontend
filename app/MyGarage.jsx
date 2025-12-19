import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useAppContext } from '../context/AppContext';
import COLORS from '../config/colors';

import MAKES from '../config/cars/makes.json';

const MODELS_BY_BUCKET = {
  '0_9': require('../config/cars/models/models_0_9.json'),
  A: require('../config/cars/models/models_A.json'),
  B: require('../config/cars/models/models_B.json'),
  C: require('../config/cars/models/models_C.json'),
  D: require('../config/cars/models/models_D.json'),
  E: require('../config/cars/models/models_E.json'),
  F: require('../config/cars/models/models_F.json'),
  G: require('../config/cars/models/models_G.json'),
  H: require('../config/cars/models/models_H.json'),
  I: require('../config/cars/models/models_I.json'),
  J: require('../config/cars/models/models_J.json'),
  K: require('../config/cars/models/models_K.json'),
  L: require('../config/cars/models/models_L.json'),
  M: require('../config/cars/models/models_M.json'),
  N: require('../config/cars/models/models_N.json'),
  O: require('../config/cars/models/models_O.json'),
  P: require('../config/cars/models/models_P.json'),
  Q: require('../config/cars/models/models_Q.json'),
  R: require('../config/cars/models/models_R.json'),
  S: require('../config/cars/models/models_S.json'),
  T: require('../config/cars/models/models_T.json'),
  U: require('../config/cars/models/models_U.json'),
  V: require('../config/cars/models/models_V.json'),
  W: require('../config/cars/models/models_W.json'),
  X: require('../config/cars/models/models_X.json'),
  Y: require('../config/cars/models/models_Y.json'),
  Z: require('../config/cars/models/models_Z.json'),
};

const MyGarage = () => {
  const { addCar } = useAppContext();

  const [plate, setPlate] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // false = įprasti (ABC 123), true = vardiniai (MANOAUTO)
  const [isCustomPlate, setIsCustomPlate] = useState(false);

  // Markė + modelis (dropdown’ai)
  const [selectedBrand, setSelectedBrand] = useState(null);
  const [selectedModel, setSelectedModel] = useState('');
  const [showBrandDropdown, setShowBrandDropdown] = useState(false);
  const [showModelDropdown, setShowModelDropdown] = useState(false);

  // UI (tik dizainui) — focus būsenos, logikos nekeičia
  const [focusField, setFocusField] = useState(null);

  const handlePlateChange = (text) => {
    if (isCustomPlate) {
      const cleaned = text.replace(/\s/g, '').toUpperCase();
      setPlate(cleaned);
    } else {
      let cleaned = text.toUpperCase();
      cleaned = cleaned.replace(/\s/g, '');
      cleaned = cleaned.replace(/[^A-Z0-9]/g, '');
      cleaned = cleaned.slice(0, 6);

      let letters = cleaned.slice(0, 3).replace(/[^A-Z]/g, '');
      let digits = cleaned.slice(3).replace(/[^0-9]/g, '');

      let value = letters;
      if (digits.length > 0) value += ' ' + digits;

      setPlate(value);
    }
  };

  const handleAdd = async () => {
    // ✅ VISI LAUKAI PRIVALOMI
    if (!plate.trim()) {
      Alert.alert('Klaida', 'Įvesk automobilio numerį');
      return;
    }
    if (!selectedBrand) {
      Alert.alert('Klaida', 'Pasirink automobilio markę');
      return;
    }
    if (!selectedModel) {
      Alert.alert('Klaida', 'Pasirink automobilio modelį');
      return;
    }

    const modelValue = `${selectedBrand} ${selectedModel}`;

    if (isCustomPlate) {
      const normalized = plate.replace(/\s/g, '').toUpperCase();
      if (!normalized) {
        Alert.alert('Klaida', 'Įvesk vardinius numerius');
        return;
      }

      setSubmitting(true);
      try {
        await addCar(normalized, modelValue);
        setPlate('');
        setSelectedBrand(null);
        setSelectedModel('');
        Alert.alert('OK', 'Automobilis pridėtas į tavo garažą');
      } catch (e) {
        Alert.alert('Klaida', e.message || 'Nepavyko pridėti automobilio');
      } finally {
        setSubmitting(false);
      }
    } else {
      const formatted = plate.toUpperCase().trim();
      const pattern = /^[A-Z]{3}\s[0-9]{3}$/;

      if (!pattern.test(formatted)) {
        Alert.alert(
          'Klaida',
          'Įprasti numeriai turi būti formato ABC 123 (3 raidės, tarpas, 3 skaičiai).'
        );
        return;
      }

      setSubmitting(true);
      try {
        await addCar(formatted, modelValue);
        setPlate('');
        setSelectedBrand(null);
        setSelectedModel('');
        Alert.alert('OK', 'Automobilis pridėtas į tavo garažą');
      } catch (e) {
        Alert.alert('Klaida', e.message || 'Nepavyko pridėti automobilio');
      } finally {
        setSubmitting(false);
      }
    }
  };

  const toggleBrandDropdown = () => {
    setShowBrandDropdown((prev) => !prev);
    setShowModelDropdown(false);
  };

  const toggleModelDropdown = () => {
    if (!selectedBrand) {
      Alert.alert('Info', 'Pirmiausia pasirink automobilio markę');
      return;
    }
    setShowModelDropdown((prev) => !prev);
  };

  const handleSelectBrand = (brandName) => {
    setSelectedBrand(brandName);
    setSelectedModel('');
    setShowBrandDropdown(false);
  };

  const handleSelectModel = (modelName) => {
    setSelectedModel(modelName);
    setShowModelDropdown(false);
  };

  // ✅ markės iš makes.json
  const brandNames = useMemo(() => {
    return Array.isArray(MAKES) ? MAKES : [];
  }, []);

  // ✅ modeliai iš bucket failų (pagal pasirinktą markę)
  const modelsForSelectedBrand = useMemo(() => {
    if (!selectedBrand) return [];

    const first = String(selectedBrand).trim().charAt(0).toUpperCase();
    const bucketKey =
      first >= 'A' && first <= 'Z' ? first : '0_9';

    const bucketData = MODELS_BY_BUCKET[bucketKey] || {};
    const arr = bucketData[selectedBrand] || [];

    return Array.isArray(arr) ? arr : [];
  }, [selectedBrand]);

  // helpers UI
  const borderFor = (fieldKey) => {
    const focused = focusField === fieldKey;
    return {
      borderColor: focused ? COLORS.primary : COLORS.borderStrong,
    };
  };

  const iconColorFor = (fieldKey) => {
    return focusField === fieldKey ? COLORS.primary : COLORS.muted;
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: COLORS.dark }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <StatusBar style="light" />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* HEADER */}
        <View style={styles.headerRow}>
          <View style={styles.headerIcon}>
            <Ionicons name="add-circle-outline" size={22} color={COLORS.ink} />
          </View>

          <View style={{ flex: 1 }}>
            <Text style={styles.headerTitle}>Pridėti naują automobilį</Text>
            <Text style={styles.headerSubtitle}>
              Užpildyk numerį, pasirink markę ir modelį, tada išsaugok.
            </Text>
          </View>
        </View>

        {/* CARD */}
        <View style={styles.card}>
          {/* Plate type (segmented) */}
          <View style={styles.segmentedWrap}>
            <TouchableOpacity
              style={[
                styles.segmentedBtn,
                !isCustomPlate && styles.segmentedBtnActive,
              ]}
              onPress={() => setIsCustomPlate(false)}
              activeOpacity={0.9}
            >
              <Ionicons
                name="pricetag-outline"
                size={16}
                color={!isCustomPlate ? COLORS.ink : COLORS.text}
              />
              <Text
                style={[
                  styles.segmentedText,
                  !isCustomPlate && styles.segmentedTextActive,
                ]}
              >
                Įprasti
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.segmentedBtn,
                isCustomPlate && styles.segmentedBtnActive,
              ]}
              onPress={() => setIsCustomPlate(true)}
              activeOpacity={0.9}
            >
              <Ionicons
                name="sparkles-outline"
                size={16}
                color={isCustomPlate ? COLORS.ink : COLORS.text}
              />
              <Text
                style={[
                  styles.segmentedText,
                  isCustomPlate && styles.segmentedTextActive,
                ]}
              >
                Vardiniai
              </Text>
            </TouchableOpacity>
          </View>

          {/* PLATE */}
          <View style={styles.field}>
            <Text style={styles.label}>Valstybinis numeris</Text>

            <View style={[styles.control, borderFor('plate')]}>
              <View style={styles.leadingIcon}>
                <Ionicons
                  name="key-outline"
                  size={18}
                  color={iconColorFor('plate')}
                />
              </View>

              <TextInput
                placeholder={isCustomPlate ? 'MANOAUTO' : 'ABC 123'}
                placeholderTextColor="rgba(255,255,255,0.55)"
                style={styles.textInput}
                value={plate}
                onChangeText={handlePlateChange}
                autoCapitalize="characters"
                onFocus={() => setFocusField('plate')}
                onBlur={() => setFocusField(null)}
              />
            </View>

            <View style={styles.hintRow}>
              <Ionicons
                name="information-circle-outline"
                size={14}
                color="rgba(255,255,255,0.7)"
              />
              <Text style={styles.hintText}>
                {isCustomPlate
                  ? 'Vardiniai numeriai – vienas žodis be tarpų (pvz. MANOAUTO).'
                  : 'Įprasti numeriai – 3 raidės + 3 skaičiai (pvz. ABC 123).'}
              </Text>
            </View>
          </View>

          {/* BRAND */}
          <View style={styles.field}>
            <Text style={styles.label}>Automobilio markė</Text>

            <TouchableOpacity
              style={[styles.control, borderFor('brand')]}
              onPress={toggleBrandDropdown}
              activeOpacity={0.9}
              onPressIn={() => setFocusField('brand')}
              onPressOut={() => setFocusField(null)}
            >
              <View style={styles.leadingIcon}>
                <Ionicons
                  name="car-outline"
                  size={18}
                  color={iconColorFor('brand')}
                />
              </View>

              <Text
                style={selectedBrand ? styles.valueText : styles.placeholderText}
                numberOfLines={1}
              >
                {selectedBrand || 'Pasirink markę'}
              </Text>

              <View style={styles.trailingIcon}>
                <Ionicons
                  name={showBrandDropdown ? 'chevron-up' : 'chevron-down'}
                  size={18}
                  color="rgba(255,255,255,0.75)"
                />
              </View>
            </TouchableOpacity>

            {showBrandDropdown && (
              <View style={styles.dropdown}>
                {brandNames.map((brandName) => {
                  const active = selectedBrand === brandName;
                  return (
                    <TouchableOpacity
                      key={brandName}
                      style={[
                        styles.dropdownItem,
                        active && styles.dropdownItemActive,
                      ]}
                      onPress={() => handleSelectBrand(brandName)}
                      activeOpacity={0.85}
                    >
                      <View style={styles.dropdownItemLeft}>
                        <View style={[styles.dot, active && styles.dotActive]} />
                        <Text style={styles.dropdownItemText}>{brandName}</Text>
                      </View>

                      {active ? (
                        <Ionicons
                          name="checkmark-circle"
                          size={18}
                          color={COLORS.primary}
                        />
                      ) : (
                        <Ionicons
                          name="chevron-forward"
                          size={16}
                          color="rgba(255,255,255,0.55)"
                        />
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
          </View>

          {/* MODEL */}
          <View style={styles.field}>
            <Text style={styles.label}>Automobilio modelis</Text>

            <TouchableOpacity
              style={[
                styles.control,
                borderFor('model'),
                !selectedBrand && { opacity: 0.6 },
              ]}
              onPress={toggleModelDropdown}
              activeOpacity={0.9}
              onPressIn={() => setFocusField('model')}
              onPressOut={() => setFocusField(null)}
            >
              <View style={styles.leadingIcon}>
                <Ionicons
                  name="speedometer-outline"
                  size={18}
                  color={iconColorFor('model')}
                />
              </View>

              <Text
                style={selectedModel ? styles.valueText : styles.placeholderText}
                numberOfLines={1}
              >
                {selectedModel
                  ? selectedModel
                  : selectedBrand
                  ? 'Pasirink modelį'
                  : 'Pirmiausia pasirink markę'}
              </Text>

              <View style={styles.trailingIcon}>
                <Ionicons
                  name={showModelDropdown ? 'chevron-up' : 'chevron-down'}
                  size={18}
                  color="rgba(255,255,255,0.75)"
                />
              </View>
            </TouchableOpacity>

            {showModelDropdown && selectedBrand && (
              <View style={styles.dropdown}>
                {modelsForSelectedBrand.map((model) => {
                  const active = selectedModel === model;
                  return (
                    <TouchableOpacity
                      key={model}
                      style={[
                        styles.dropdownItem,
                        active && styles.dropdownItemActive,
                      ]}
                      onPress={() => handleSelectModel(model)}
                      activeOpacity={0.85}
                    >
                      <View style={styles.dropdownItemLeft}>
                        <View style={[styles.dot, active && styles.dotActive]} />
                        <Text style={styles.dropdownItemText}>{model}</Text>
                      </View>

                      {active ? (
                        <Ionicons
                          name="checkmark-circle"
                          size={18}
                          color={COLORS.primary}
                        />
                      ) : (
                        <Ionicons
                          name="chevron-forward"
                          size={16}
                          color="rgba(255,255,255,0.55)"
                        />
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
          </View>

          {/* CTA */}
          <TouchableOpacity
            style={[styles.cta, submitting && styles.ctaDisabled]}
            onPress={handleAdd}
            disabled={submitting}
            activeOpacity={0.92}
          >
            <View style={styles.ctaIcon}>
              <Ionicons
                name={submitting ? 'time-outline' : 'checkmark'}
                size={18}
                color={COLORS.ink}
              />
            </View>

            <Text style={styles.ctaText}>
              {submitting ? 'Saugoma...' : 'Pridėti automobilį'}
            </Text>
          </TouchableOpacity>

          <View style={styles.note}>
            <Ionicons
              name="shield-checkmark-outline"
              size={16}
              color="rgba(255,255,255,0.7)"
            />
            <Text style={styles.noteText}>
              Numeris naudojamas tik funkcionalumui (pvz. žinutėms tarp vairuotojų).
            </Text>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  scrollContent: {
    paddingTop: 18,
    paddingBottom: 28,
    paddingHorizontal: 16,
  },

  /* HEADER */
  headerRow: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
    marginBottom: 12,
    padding: 14,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  headerIcon: {
    width: 46,
    height: 46,
    borderRadius: 16,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  headerSubtitle: {
    marginTop: 4,
    fontSize: 13,
    lineHeight: 18,
    color: 'rgba(255,255,255,0.85)',
  },

  /* CARD */
  card: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
    backgroundColor: 'rgba(255,255,255,0.02)',
    padding: 14,
  },

  /* Segmented */
  segmentedWrap: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 2,
  },
  segmentedBtn: {
    flex: 1,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    backgroundColor: 'rgba(255,255,255,0.03)',
    paddingVertical: 11,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  segmentedBtnActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  segmentedText: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.78)',
    fontWeight: '900',
  },
  segmentedTextActive: {
    color: 'rgba(255,255,255,0.78)',
  },

  field: {
    marginTop: 25,
  },
  label: {
    marginBottom: 8,
    fontSize: 13,
    fontWeight: '800',
    color: 'rgba(255,255,255,0.88)',
  },

  /* Controls */
  control: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    backgroundColor: 'rgba(255,255,255,0.03)',
    paddingVertical: 12,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  leadingIcon: {
    width: 34,
    height: 34,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
    backgroundColor: 'rgba(0,0,0,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  trailingIcon: {
    width: 34,
    height: 34,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },

  textInput: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '900',
    paddingVertical: 0,
  },
  valueText: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '900',
  },
  placeholderText: {
    flex: 1,
    color: 'rgba(255,255,255,0.60)',
    fontSize: 15,
    fontWeight: '800',
  },

  /* Dropdown */
  dropdown: {
    marginTop: 10,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
    backgroundColor: 'rgba(20,20,20,0.9)',
    overflow: 'hidden',
  },
  dropdownItem: {
    paddingVertical: 12,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dropdownItemActive: {
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  dropdownItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  dropdownItemText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 99,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.55)',
  },
  dotActive: {
    borderColor: COLORS.primary,
  },

  /* hints */
  hintRow: {
    marginTop: 9,
    flexDirection: 'row',
    gap: 6,
    alignItems: 'flex-start',
  },
  hintText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 16,
    color: 'rgba(255,255,255,0.78)',
  },

  /* CTA */
  cta: {
    marginTop: 25,
    backgroundColor: COLORS.primary,
    borderRadius: 18,
    paddingVertical: 13,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  ctaDisabled: {
    opacity: 0.75,
  },
  ctaIcon: {
    width: 32,
    height: 32,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaText: {
    color: COLORS.ink,
    fontSize: 15,
    fontWeight: '900',
  },

  /* Note */
  note: {
    marginTop: 12,
    flexDirection: 'row',
    gap: 8,
    alignItems: 'flex-start',
  },
  noteText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 16,
    color: 'rgba(255,255,255,0.78)',
  },
});

export default MyGarage;

