import React from 'react';
import { Tabs } from 'expo-router';
import { View, StyleSheet, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function TabLayout() {
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: [
          styles.tabBar,
          { height: 64 + insets.bottom, paddingBottom: 8 + insets.bottom }
        ],
        tabBarActiveTintColor: '#FF6F00',
        tabBarInactiveTintColor: '#9E9E9E',
        tabBarLabelStyle: styles.tabLabel,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, focused }) => (
            <View style={[styles.iconPill, focused && styles.iconPillActive]}>
              <Ionicons
                name={focused ? 'grid' : 'grid-outline'}
                size={20}
                color={color}
              />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="jaap"
        options={{
          title: '',
          tabBarShowLabel: false,
          tabBarIcon: ({ focused, color }) => (
            <View style={[styles.jaapBtnCircle, focused && styles.jaapBtnCircleFocused]}>
              <Ionicons name={focused ? "flame" : "flame-outline"} size={24} color="#FFFFFF" />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: 'History',
          tabBarIcon: ({ color, focused }) => (
            <View style={[styles.iconPill, focused && styles.iconPillActive]}>
              <Ionicons
                name={focused ? 'calendar' : 'calendar-outline'}
                size={20}
                color={color}
              />
            </View>
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.07)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 8,
    paddingTop: 8,
  },
  tabLabel: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 10,
    letterSpacing: 0.2,
  },
  iconPill: {
    width: 40,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconPillActive: {
    backgroundColor: 'rgba(255,111,0,0.12)',
  },

  // Jaap button circle
  jaapBtnCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#FF9800',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#FF6F00',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 4,
  },
  jaapBtnCircleFocused: {
    backgroundColor: '#FF6F00',
    shadowOpacity: 0.55,
  },
});
