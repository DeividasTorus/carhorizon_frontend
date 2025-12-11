import React, { useState } from 'react';
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
import { useAppContext } from '../context/AppContext';

const CAR_BRANDS = [
  {
    name: 'BMW',
    models: ['E60', 'F30', 'F10'],
  },
  {
    name: 'Mercedes Benz',
    models: ['CLS 350', 'E350', 'C220'],
  },
];

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

  const handlePlateChange = (text) => {
    if (isCustomPlate) {
      // Vardiniai numeriai: vienas žodis, be tarpų
      const cleaned = text.replace(/\s/g, '').toUpperCase();
      setPlate(cleaned);
    } else {
      // Įprasti numeriai: 3 raidės + tarpas + 3 skaičiai, automatinis formatas
      let cleaned = text.toUpperCase();

      // Pašalinam tarpus ir visus ne A-Z/0-9
      cleaned = cleaned.replace(/\s/g, '');
      cleaned = cleaned.replace(/[^A-Z0-9]/g, '');
      cleaned = cleaned.slice(0, 6); // max 6 simboliai be tarpo

      // Pirmi 3 – raidės, likę – skaičiai
      let letters = cleaned.slice(0, 3).replace(/[^A-Z]/g, '');
      let digits = cleaned.slice(3).replace(/[^0-9]/g, '');

      let value = letters;
      if (digits.length > 0) {
        value += ' ' + digits;
      }

      setPlate(value);
    }
  };

  const handleAdd = async () => {
    if (!plate.trim()) {
      Alert.alert('Klaida', 'Įvesk automobilio numerį');
      return;
    }

    // Suformuojam modelio tekstą (jeigu pasirinkta markė ir modelis)
    const modelValue =
      selectedBrand && selectedModel
        ? `${selectedBrand} ${selectedModel}`
        : '';

    if (isCustomPlate) {
      // Vardiniai numeriai
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
      // Įprasti numeriai: privalomai ABC 123
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
        // Siunčiame su tarpu: ABC 123
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
    // jei atidarom markes, uždarom modelius
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

  const modelsForSelectedBrand =
    CAR_BRANDS.find((b) => b.name === selectedBrand)?.models || [];

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: '#020617' }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <StatusBar style="light" />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.sectionContainer}>
          <Text style={styles.title}>Pridėti naują automobilį</Text>
          <Text style={styles.subtitle}>
            Pridėjęs savo numerį galėsi gauti žinutes iš kitų vairuotojų ir naudoti šį auto
            kaip aktyvų.
          </Text>

          {/* Toggle tarp įprastų ir vardinių numerių */}
          <View style={styles.plateTypeRow}>
            <TouchableOpacity
              style={[
                styles.plateTypeButton,
                !isCustomPlate && styles.plateTypeButtonActive,
              ]}
              onPress={() => setIsCustomPlate(false)}
            >
              <Text
                style={[
                  styles.plateTypeButtonText,
                  !isCustomPlate && styles.plateTypeButtonTextActive,
                ]}
              >
                Įprasti numeriai
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.plateTypeButton,
                isCustomPlate && styles.plateTypeButtonActive,
              ]}
              onPress={() => setIsCustomPlate(true)}
            >
              <Text
                style={[
                  styles.plateTypeButtonText,
                  isCustomPlate && styles.plateTypeButtonTextActive,
                ]}
              >
                Vardiniai numeriai
              </Text>
            </TouchableOpacity>
          </View>

          {/* Numerio įvedimas */}
          <View style={styles.field}>
            <Text style={styles.label}>Valstybinis numeris</Text>
            <TextInput
              placeholder={isCustomPlate ? 'MANOAUTO' : 'ABC 123'}
              placeholderTextColor="#6b7280"
              style={styles.input}
              value={plate}
              onChangeText={handlePlateChange}
              autoCapitalize="characters"
            />
            <Text style={styles.helperText}>
              {isCustomPlate
                ? 'Vardiniai numeriai – vienas žodis be tarpų (pvz. MANOAUTO).'
                : 'Įprasti numeriai – 3 raidės ir 3 skaičiai. Tarpas tarp jų pridedamas automatiškai (ABC 123).'}
            </Text>
          </View>

          {/* MARKĖ + MODELIS (dropdown’ai) */}
          <View style={styles.field}>
            <Text style={styles.label}>Automobilio markė</Text>

            <TouchableOpacity
              style={styles.dropdownInput}
              onPress={toggleBrandDropdown}
            >
              <Text
                style={
                  selectedBrand ? styles.dropdownText : styles.dropdownPlaceholder
                }
              >
                {selectedBrand || 'Pasirink markę (pvz. BMW, Mercedes Benz)'}
              </Text>
            </TouchableOpacity>

            {showBrandDropdown && (
              <View style={styles.dropdownList}>
                {CAR_BRANDS.map((brand) => (
                  <TouchableOpacity
                    key={brand.name}
                    style={styles.dropdownItem}
                    onPress={() => handleSelectBrand(brand.name)}
                  >
                    <Text style={styles.dropdownItemText}>{brand.name}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Automobilio modelis (nebūtina)</Text>

            <TouchableOpacity
              style={[
                styles.dropdownInput,
                !selectedBrand && { opacity: 0.6 },
              ]}
              onPress={toggleModelDropdown}
            >
              <Text
                style={
                  selectedModel ? styles.dropdownText : styles.dropdownPlaceholder
                }
              >
                {selectedModel
                  ? selectedModel
                  : selectedBrand
                  ? 'Pasirink modelį'
                  : 'Pirmiausia pasirink markę'}
              </Text>
            </TouchableOpacity>

            {showModelDropdown && selectedBrand && (
              <View style={styles.dropdownList}>
                {modelsForSelectedBrand.map((model) => (
                  <TouchableOpacity
                    key={model}
                    style={styles.dropdownItem}
                    onPress={() => handleSelectModel(model)}
                  >
                    <Text style={styles.dropdownItemText}>{model}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            <Text style={styles.helperText}>
              Modelis yra neprivalomas, tačiau padeda tiksliau identifikuoti auto.
            </Text>
          </View>

          <TouchableOpacity
            style={[styles.addButton, submitting && styles.buttonDisabled]}
            onPress={handleAdd}
            disabled={submitting}
          >
            <Text style={styles.addButtonText}>
              {submitting ? 'Saugoma...' : 'Pridėti automobilį'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  scrollContent: {
    paddingTop: 24,
    paddingBottom: 24,
    paddingHorizontal: 16,
  },
  sectionContainer: {
    marginTop: 8,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#e5e7eb',
  },
  subtitle: {
    marginTop: 4,
    color: '#9ca3af',
    fontSize: 13,
    marginBottom: 16,
  },

  plateTypeRow: {
    flexDirection: 'row',
    marginBottom: 12,
    marginTop: 4,
    backgroundColor: '#020617',
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#374151',
    padding: 2,
  },
  plateTypeButton: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  plateTypeButtonActive: {
    backgroundColor: '#0ea5e9',
  },
  plateTypeButtonText: {
    fontSize: 13,
    color: '#9ca3af',
    fontWeight: '600',
  },
  plateTypeButtonTextActive: {
    color: '#0b1120',
    fontWeight: '700',
  },

  field: {
    marginBottom: 12,
    marginTop: 4,
  },
  label: {
    color: '#9ca3af',
    marginBottom: 6,
    fontSize: 13,
  },
  input: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#374151',
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: '#f9fafb',
    backgroundColor: '#020617',
    fontSize: 14,
  },
  helperText: {
    marginTop: 4,
    fontSize: 11,
    color: '#6b7280',
  },

  dropdownInput: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#374151',
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#020617',
    justifyContent: 'center',
  },
  dropdownText: {
    fontSize: 14,
    color: '#f9fafb',
  },
  dropdownPlaceholder: {
    fontSize: 14,
    color: '#6b7280',
  },
  dropdownList: {
    marginTop: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#374151',
    backgroundColor: '#020617',
    overflow: 'hidden',
  },
  dropdownItem: {
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  dropdownItemText: {
    color: '#e5e7eb',
    fontSize: 14,
  },
  addButton: {
    marginTop: 8,
    backgroundColor: '#0ea5e9',
    paddingVertical: 12,
    borderRadius: 999,
    alignItems: 'center',
  },
  addButtonText: {
    color: '#0b1120',
    fontSize: 15,
    fontWeight: '700',
  },
  buttonDisabled: {
    opacity: 0.7,
  },
});

export default MyGarage;
