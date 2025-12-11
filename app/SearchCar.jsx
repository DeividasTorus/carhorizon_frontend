import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Image,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { useAppContext } from '../context/AppContext';
import { BASE_URL } from '../utils/api';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import LTPlates from '../assets/LTPlates.png';

const SearchCar = () => {
  const { searchCarByPlate, openChat, inboxMessages, fetchChatMessages } =
    useAppContext();

  const [searchPlate, setSearchPlate] = useState('');
  const [searching, setSearching] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isVardinis, setIsVardinis] = useState(false);

  const router = useRouter();

  const handleStandardChange = async (value) => {
    const cleaned = value.replace(/\s/g, '').toUpperCase().replace(/[^A-Z0-9]/g, '');

    let letters = '';
    let digits = '';

    for (let i = 0; i < cleaned.length; i++) {
      const ch = cleaned[i];
      if (letters.length < 3) {
        if (/[A-Z]/.test(ch)) letters += ch;
      } else if (digits.length < 3) {
        if (/[0-9]/.test(ch)) digits += ch;
      }
    }

    let formatted = letters;
    if (letters.length === 3 && digits.length > 0) {
      formatted += ' ' + digits;
    }

    setSearchPlate(formatted);

    if (formatted.match(/^([A-Z]{3})\s([0-9]{3})$/)) {
      await performSearch(formatted, false);
    } else {
      setSearchResults([]);
    }
  };

  const handleVardinisChange = async (value) => {
    const cleaned = value
      .replace(/\s/g, '')
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, '');

    setSearchPlate(cleaned);

    if (cleaned.length >= 2) {
      await performSearch(cleaned, true);
    } else {
      setSearchResults([]);
    }
  };

  const validatePlate = () => {
    if (isVardinis) {
      if (!searchPlate) {
        Alert.alert('Klaida', 'Įvesk vardinį numerį.');
        return false;
      }
      if (!/^[A-Z0-9]+$/.test(searchPlate)) {
        Alert.alert(
          'Klaida',
          'Vardinis numeris gali būti tik iš raidžių ir skaičių (be tarpų).'
        );
        return false;
      }
      return true;
    } else {
      const match = searchPlate.match(/^([A-Z]{3})\s([0-9]{3})$/);
      if (!match) {
        Alert.alert(
          'Klaida',
          'Standartinis numeris turi būti formatu: 3 raidės ir 3 skaičiai (pvz. ABC 123).'
        );
        return false;
      }
      return true;
    }
  };

  const performSearch = async (plate, isVardinisSearch) => {
    if (!plate || plate.length === 0) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const normalizedPlate = isVardinisSearch
        ? plate.replace(/\s/g, '').toUpperCase()
        : plate.toUpperCase();

      const car = await searchCarByPlate(normalizedPlate);
      if (car) {
        setSearchResults([car]);
      } else {
        setSearchResults([]);
      }
    } catch (e) {
      console.log('Search error:', e);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectResult = async (car) => {
    try {
      // add to recents
      try {
        await pushRecent(car);
      } catch (e) {
        console.log('pushRecent failed', e);
      }

      setSearchPlate('');
      setSearchResults([]);

      // Nukreipti į automobilio profilį
      router.push({
        pathname: `/CarProfile`,
        params: {
          carId: String(car.id),
        },
      });
    } catch (e) {
      Alert.alert('Klaida', e && e.message ? e.message : 'Nepavyko atidaryti profilio');
    }
  };

  const handleFindAndChat = async () => {
    if (!searchPlate.trim()) {
      Alert.alert('Klaida', 'Įvesk ieškomo automobilio numerį');
      return;
    }

    if (!validatePlate()) return;

    setSearching(true);

    try {
      const normalizedPlate = isVardinis
        ? searchPlate.replace(/\s/g, '').toUpperCase()
        : searchPlate.toUpperCase();

      const car = await searchCarByPlate(normalizedPlate);
      if (!car) {
        Alert.alert('Nerasta', 'Tokio automobilio sistemoje nėra');
        return;
      }

      const existingChat = inboxMessages?.find((msg) => {
        const relatedCarId = msg.car_id || msg.initiator_car_id;
        return String(relatedCarId) === String(car.id);
      });

      let chatId;
      if (existingChat) {
        chatId = existingChat.id;
        await fetchChatMessages(chatId);
      } else {
        chatId = await openChat(car.id);
      }

      // Get car avatar (cars have avatars, not users)
      const avatarPath = car?.avatar_url || null;
      let otherAvatarUrl = null;
      if (avatarPath) {
        if (/^https?:\/\//i.test(avatarPath)) {
          otherAvatarUrl = avatarPath;
        } else {
          otherAvatarUrl = BASE_URL.replace(/\/api\/?$/, '') + avatarPath;
        }
      }

      setSearchPlate('');
      setSearchResults([]);

      router.push({
        pathname: `/Chat/${chatId}`,
        params: {
          id: String(chatId),
          carPlate: car.plate,
          carModel: car.model,
          otherAvatar: otherAvatarUrl,
        },
      });
    } catch (e) {
      Alert.alert('Klaida', e && e.message ? e.message : 'Nepavyko rasti automobilio');
    } finally {
      setSearching(false);
    }
  };

  const onChangePlate = (value) => {
    if (isVardinis) handleVardinisChange(value);
    else handleStandardChange(value);
  };

  const showEmptyState =
    !isSearching && !searchPlate.trim() && searchResults.length === 0;

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <StatusBar style="light" />

      <LinearGradient colors={['#020617', '#020617']} style={styles.background}>
        {/* HEADER (vidinis, bet ne kortelė) */}
        <View style={styles.header}>
          <View style={styles.headerIconWrapper}>
            <Ionicons name="chatbubbles-outline" size={26} color="#38bdf8" />
          </View>
          <View style={styles.headerTextWrapper}>
            <Text style={styles.headerTitle}>Rask automobilio numerį</Text>
            {/* <Text style={styles.headerSubtitle}>
              Įvesk numerį ir iškart pradėk pokalbį su savininku.
            </Text> */}
          </View>
        </View>

        {/* TOGGLE */}
        <View style={styles.toggleContainer}>
          <TouchableOpacity
            style={[styles.toggleButton, !isVardinis && styles.toggleButtonActive]}
            onPress={() => {
              setIsVardinis(false);
              setSearchPlate('');
              setSearchResults([]);
            }}
          >
            <Ionicons
              name="grid-outline"
              size={16}
              color={!isVardinis ? '#020617' : '#9ca3af'}
              style={styles.toggleIcon}
            />
            <Text style={[styles.toggleText, !isVardinis && styles.toggleTextActive]}>
              Standartiniai
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.toggleButton, isVardinis && styles.toggleButtonActive]}
            onPress={() => {
              setIsVardinis(true);
              setSearchPlate('');
              setSearchResults([]);
            }}
          >
            <Ionicons
              name="star-outline"
              size={16}
              color={isVardinis ? '#020617' : '#9ca3af'}
              style={styles.toggleIcon}
            />
            <Text style={[styles.toggleText, isVardinis && styles.toggleTextActive]}>
              Vardiniai
            </Text>
          </TouchableOpacity>
        </View>

        {/* LABELS */}
        <View style={styles.plateLabelRow}>
          <View>
            <Text style={styles.label}>
              {isVardinis ? 'Vardinis numeris' : 'Standartinis numeris'}
            </Text>
            <Text style={styles.hint}>{isVardinis ? 'Pvz. MYC4R' : 'Pvz. ABC 123'}</Text>
          </View>
          <View style={styles.tagChip}>
            <Ionicons name="shield-checkmark-outline" size={14} color="#22c55e" />
            <Text style={styles.tagChipText}>Privatu</Text>
          </View>
        </View>

        {/* PLATE INPUT */}
        <View style={styles.plateWrapper}>
          <Image source={LTPlates} style={styles.plateImage} />
          <TextInput
            value={searchPlate}
            onChangeText={onChangePlate}
            placeholder={isVardinis ? 'MYC4R' : 'ABC 123'}
            placeholderTextColor="#9ca3af"
            autoCapitalize="characters"
            maxLength={isVardinis ? 6 : 7}
            style={styles.plateInput}
          />
        </View>

        {/* CONTENT */}
        <View style={styles.middleSection}>
          {/* EMPTY STATE */}
          {showEmptyState && (
            <View style={styles.emptyStateContainer}>
              <LinearGradient
                colors={['rgba(56,189,248,0.15)', 'rgba(37,99,235,0.1)']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.emptyIconCircle}
              >
                <Ionicons name="car-sport-outline" size={42} color="#38bdf8" />
              </LinearGradient>

              <Text style={styles.emptyTitle}>Pradėk nuo numerio</Text>
              <Text style={styles.emptySubtitle}>
                Įvesk automobilio numerį viršuje. Jei savininkas užregistruotas, galėsi
                jam parašyti žinutę.
              </Text>
            </View>
          )}

          {/* LOADING */}
          {isSearching && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" />
              <Text style={styles.loadingText}>Ieškoma automobilio...</Text>
            </View>
          )}

          {/* RESULTS */}
          {!isSearching && searchResults.length > 0 && (
            <View style={styles.resultsContainer}>
              <View style={styles.resultsHeaderRow}>
                <Text style={styles.resultsTitle}>Rastas automobilis</Text>
              </View>
              <FlatList
                data={searchResults}
                keyExtractor={(item) => String(item.id)}
                scrollEnabled={false}
                renderItem={({ item }) => {
                  // Remove /api from BASE_URL for avatar paths
                  const baseUrlWithoutApi = BASE_URL.replace(/\/api\/?$/, '');
                  const carAvatarUrl = item.avatar_url ? `${baseUrlWithoutApi}${item.avatar_url}` : null;
                  const carInitial = item.plate?.[0]?.toUpperCase() || 'C';
                  
                  return (
                  <TouchableOpacity
                    style={styles.resultItem}
                    onPress={() => handleSelectResult(item)}
                  >
                    {/* Car Avatar */}
                    {carAvatarUrl ? (
                      <Image source={{ uri: carAvatarUrl }} style={styles.resultAvatar} />
                    ) : (
                      <View style={styles.resultAvatarPlaceholder}>
                        <Text style={styles.resultAvatarInitial}>{carInitial}</Text>
                      </View>
                    )}
                    
                    <View style={styles.resultContent}>
                      <View style={styles.resultPlateRow}>
                        <Image source={LTPlates} style={styles.resultPlateImage} />
                        <Text style={styles.resultPlateText}>{item.plate}</Text>
                      </View>
                      <Text style={styles.resultModel}>
                        {item.model || 'Žinomas automobilis'}
                      </Text>
                    </View>
                    <Ionicons style={styles.paperPlaneIcon} name="paper-plane-sharp" size={25} color="#64748b" />
                  </TouchableOpacity>
                  );
                }}
              />
            </View>
          )}

          {/* NO RESULTS */}
          {!isSearching && searchPlate && searchResults.length === 0 && (
            <View style={styles.noResultsContainer}>
              <View style={styles.noResultsIconWrapper}>
                <Ionicons name="alert-circle-outline" size={22} color="#f97316" />
              </View>
              <View>
                <Text style={styles.noResultsTitle}>Tokio automobilio nėra</Text>
                <Text style={styles.noResultsSubtitle}>
                  Patikrink, ar numeris įvestas teisingai, arba pamėgink kitą.
                </Text>
              </View>
            </View>
          )}
        </View>
      </LinearGradient>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#020617',
  },

  background: {
    flex: 1,
    paddingHorizontal: 10,
    paddingTop: 20,
    paddingBottom: 24,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
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

  headerTextWrapper: {
    flex: 1,
  },

  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#e5e7eb',
  },

  headerSubtitle: {
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 4,
  },

  toggleContainer: {
    flexDirection: 'row',
    borderRadius: 999,
    backgroundColor: 'rgba(15,23,42,0.9)',
    borderWidth: 1,
    borderColor: 'rgba(30,64,175,0.6)',
    padding: 4,
    marginBottom: 16,
    marginTop: 10
  },

  toggleButton: {
    flex: 1,
    flexDirection: 'row',
    paddingVertical: 9,
    paddingHorizontal: 12,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },

  toggleButtonActive: {
    backgroundColor: '#0ea5e9',
  },

  toggleIcon: {
    marginRight: 6,
  },

  toggleText: {
    fontSize: 12,
    color: '#9ca3af',
    fontWeight: '600',
  },

  toggleTextActive: {
    color: '#020617',
  },

  plateLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 5,
    marginBottom: 10,
  },

  label: {
    color: '#e5e7eb',
    fontSize: 15,
    fontWeight: '600',
  },

  hint: {
    color: '#6b7280',
    fontSize: 13,
    marginTop: 4,
  },

  tagChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(22,163,74,0.14)',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },

  tagChipText: {
    fontSize: 11,
    color: '#4ade80',
    marginLeft: 4,
    fontWeight: '600',
  },

  plateWrapper: {
    width: '100%',
    aspectRatio: 6,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
    marginTop: 20,
    position: 'relative',
  },

  plateImage: {
    width: 261,
    height: 72,
    borderRadius: 5,
  },

  plateInput: {
    position: 'absolute',
    width: '65%',
    textAlign: 'center',
    fontSize: 32,
    fontWeight: '800',
    letterSpacing: 3,
    color: '#020617',
    marginLeft: 50,
  },

  middleSection: {
    flex: 1,
    marginTop: 20,
  },

  /* EMPTY STATE */

  emptyStateContainer: {
    borderRadius: 22,
    borderWidth: 1,
    borderColor: 'rgba(148,163,184,0.25)',
    backgroundColor: 'rgba(15,23,42,0.85)',
    paddingHorizontal: 16,
    paddingVertical: 18,
    alignItems: 'center',
    marginBottom: 12,
  },

  emptyIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },

  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#e5e7eb',
    marginBottom: 6,
    textAlign: 'center',
  },

  emptySubtitle: {
    fontSize: 13,
    color: '#9ca3af',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 14,
  },

  emptyCtaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(56,189,248,0.4)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 10,
    backgroundColor: 'rgba(56,189,248,0.12)',
  },

  emptyCtaButtonDisabled: {
    borderColor: 'rgba(75,85,99,0.7)',
    backgroundColor: 'transparent',
  },

  emptyCtaText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#020617',
  },

  emptyHintRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 2,
  },

  emptyHintText: {
    fontSize: 11,
    color: '#6b7280',
    marginLeft: 6,
    flex: 1,
    lineHeight: 16,
  },

  /* LOADING / RESULTS / NO RESULTS */

  loadingContainer: {
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },

  loadingText: {
    marginTop: 8,
    fontSize: 12,
    color: '#9ca3af',
  },

  resultsContainer: {
    backgroundColor: 'rgba(15,23,42,0.9)',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(148,163,184,0.25)',
    maxHeight: 230,
    marginTop: 12,
  },

  resultsHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },

  resultsTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#e5e7eb',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },

  resultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 11,
    paddingHorizontal: 10,
    backgroundColor: 'rgba(15,23,42,0.9)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(56,189,248,0.32)',
  },

  resultAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    marginRight: 12,
  },

  resultAvatarPlaceholder: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(56,189,248,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },

  resultAvatarInitial: {
    fontSize: 18,
    fontWeight: '700',
    color: '#38bdf8',
  },

  resultIconWrapper: {
    width: 34,
    height: 34,
    borderRadius: 999,
    backgroundColor: 'rgba(15,118,110,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },

  resultContent: {
    flex: 1,
  },

  resultPlateRow: {
    width: 91,
    height: 25,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    marginBottom: 4,
  },

  resultPlateImage: {
    width: 91,
    height: 25,
    borderRadius: 2,
  },

  resultPlateText: {
    position: 'absolute',
    textAlign: 'center',
    fontSize: 15,
    fontWeight: '800',
    color: '#020617',
    marginLeft: 20,
  },

  resultModel: {
    fontSize: 12,
    color: '#9ca3af',
  },

  paperPlaneIcon: {
    marginRight: 10
  },

  noResultsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 12,
    marginTop: 16,
    borderRadius: 14,
    backgroundColor: 'rgba(248,250,252,0.02)',
    borderWidth: 1,
    borderColor: 'rgba(248,113,113,0.28)',
  },

  noResultsIconWrapper: {
    width: 32,
    height: 32,
    borderRadius: 999,
    backgroundColor: 'rgba(248,113,113,0.13)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },

  noResultsTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#fecaca',
  },

  noResultsSubtitle: {
    fontSize: 11,
    color: '#fca5a5',
    marginTop: 2,
  },
});

export default SearchCar;

