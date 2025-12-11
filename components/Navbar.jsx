import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { usePathname, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAppContext } from '../context/AppContext';

const tabs = [
  { label: 'News', path: '/News', icon: 'home-outline', iconActive: 'home-sharp' },
  { label: 'Add Car', path: '/SearchCar', icon: 'car-sport-outline', iconActive: 'car-sport' },
  { label: 'Inbox', path: '/Inbox', icon: 'paper-plane-outline', iconActive: 'paper-plane' },
  { label: 'Profile', path: '/Profile', icon: 'person-outline', iconActive: 'person-sharp' },
];

const Navbar = () => {
  const router = useRouter();
  const pathname = usePathname();
  const { unreadMessagesCount } = useAppContext();

  const go = (path) => {
    if (pathname === path) return;
    router.push(path);
  };

  return (
    <View style={styles.wrapper}>
      <View style={styles.navbar}>
        {tabs.map((tab) => {
          const active = pathname === tab.path;
          const showBadge = tab.path === '/Inbox' && unreadMessagesCount > 0;
          
          return (
            <TouchableOpacity
              key={tab.path}
              onPress={() => go(tab.path)}
              style={[styles.tab, active && styles.tabActive]}
            >
              <View style={{ position: 'relative' }}>
                <Ionicons
                  name={active ? tab.iconActive : tab.icon}
                  size={28}
                  color={active ? '#0b1120' : '#e5e7eb'}
                />
                {showBadge && (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>
                      {unreadMessagesCount > 9 ? '9+' : unreadMessagesCount}
                    </Text>
                  </View>
                )}
              </View>
              {active && <View style={styles.indicator} />}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    paddingHorizontal: 20,
    paddingBottom: 10,
    paddingTop: 8,
    backgroundColor: 'transparent',
  },
  navbar: {
    flexDirection: 'row',
    backgroundColor: '#020617',
    borderRadius: 24,
    paddingHorizontal: 8,
    paddingVertical: 6,
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  tab: {
    flex: 1,
    paddingVertical: 6,
    paddingHorizontal: 8,
    alignItems: 'center',
    borderRadius: 20,
    gap: 2,
  },
  tabActive: {
    backgroundColor: '#0ea5e9',
  },
  indicator: {
    marginTop: 2,
    width: 18,
    height: 3,
    borderRadius: 999,
    backgroundColor: '#0b1120',
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -18,
    minWidth: 22,
    height: 22,
    borderRadius: 9,
    backgroundColor: '#ef4444',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
    borderWidth: 2,
    borderColor: '#020617',
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#fff',
  },
});

export default Navbar;

