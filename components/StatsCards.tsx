import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface StatCardData {
  label: string;
  value: number;
}

interface StatsCardsProps {
  lifetime: number;
  streak: number;
  today: number;
  yesterday: number;
  twoDaysAgo: number;
  onEditLifetime?: () => void;
}

function formatCount(n: number): string {
  if (n >= 10000000) return (n / 10000000).toFixed(2) + 'Cr';
  if (n >= 100000) {
    const lakh = n / 100000;
    return lakh % 1 === 0 ? lakh + 'L' : lakh.toFixed(1) + 'L';
  }
  return n.toLocaleString('en-IN');
}

function StatCard({ label, value, onPress }: StatCardData & { onPress?: () => void }) {
  const fontSize = value > 999999 ? 14 : value > 99999 ? 15 : 18;

  return (
    <TouchableOpacity 
      style={styles.card} 
      activeOpacity={onPress ? 0.7 : 1}
      onPress={onPress}
    >
      <View style={styles.iconCircle}>
        <Ionicons name={label === 'Streak' ? "flash" : "flame"} size={16} color="#FF6F00" />
      </View>
      <Text style={[styles.cardValue, { fontSize }]}>
        {formatCount(value)}
      </Text>
      <Text style={styles.cardLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

export function StatsCards({ lifetime, streak, today, yesterday, twoDaysAgo, onEditLifetime }: StatsCardsProps) {
  const cards: StatCardData[] = [
    { label: 'Lifetime', value: lifetime },
    { label: 'Streak', value: streak },
    { label: 'Today', value: today },
    { label: 'Yesterday', value: yesterday },
    { label: '2 Days Ago', value: twoDaysAgo },
  ];

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.scrollContent}
    >
      {cards.map((c) => (
        <StatCard 
          key={c.label} 
          label={c.label} 
          value={c.value}
          onPress={c.label === 'Lifetime' ? onEditLifetime : undefined}
        />
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingHorizontal: 16,
    paddingVertical: 4,
    gap: 12,
    flexDirection: 'row',
  },
  card: {
    minWidth: 90,
    maxWidth: 110,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 111, 0, 0.2)',
    paddingTop: 16,
    paddingBottom: 12,
    paddingHorizontal: 10,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    shadowColor: '#FF6F00',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  iconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,111,0,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  cardValue: {
    fontFamily: 'Poppins_700Bold',
    color: '#FF6F00',
    lineHeight: 22,
    letterSpacing: -0.3,
  },
  cardLabel: {
    fontFamily: 'Inter_500Medium',
    fontSize: 10,
    color: '#757575',
    textAlign: 'center',
    lineHeight: 12,
    letterSpacing: 0.1,
  },
});
