import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  ScrollView,
  Keyboard,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useJaap } from '../context/JaapContext';

interface DayDetailScreenProps {
  dateObj: Date;
}

function getDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function DayDetailScreen({ dateObj }: DayDetailScreenProps) {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { jaapData, setDayCount } = useJaap();

  const dateKey = getDateKey(dateObj);
  const currentCount = jaapData[dateKey] || 0;

  // Tap-to-edit state
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(currentCount.toString());

  // Formatted date strings
  const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'long' });
  const dateNum = dateObj.getDate();
  const monthName = dateObj.toLocaleDateString('en-US', { month: 'long' });
  const year = dateObj.getFullYear();

  // Computed stats
  const stats = useMemo(() => {
    const entries = Object.entries(jaapData).filter(([, v]) => v > 0);
    const allCounts = entries.map(([, v]) => v).sort((a, b) => b - a);

    // Day Rank
    let dayRank = 0;
    if (currentCount > 0) {
      dayRank = allCounts.findIndex((c) => c <= currentCount) + 1;
    }
    const totalDays = entries.length;

    // vs Previous Day
    const prevDate = new Date(dateObj);
    prevDate.setDate(prevDate.getDate() - 1);
    const prevKey = getDateKey(prevDate);
    const prevCount = jaapData[prevKey] || 0;
    let vsPrevPct = 0;
    if (prevCount > 0) {
      vsPrevPct = Math.round(((currentCount - prevCount) / prevCount) * 100);
    }

    // Day-of-week average
    const dow = dateObj.getDay();
    const sameDowEntries = entries.filter(([k]) => {
      const [y, m, d] = k.split('-').map(Number);
      return new Date(y, m - 1, d).getDay() === dow;
    });
    const dowAvg =
      sameDowEntries.length > 0
        ? Math.round(sameDowEntries.reduce((s, [, v]) => s + v, 0) / sameDowEntries.length)
        : 0;

    // Streak status for this day
    let streakNum = 0;
    if (currentCount > 0) {
      streakNum = 1;
      const tempDate = new Date(dateObj);
      tempDate.setDate(tempDate.getDate() - 1);
      while (jaapData[getDateKey(tempDate)] > 0) {
        streakNum++;
        tempDate.setDate(tempDate.getDate() - 1);
      }
    }

    // Malas
    const malas = Math.floor(currentCount / 108);
    const remainder = currentCount % 108;

    return { dayRank, totalDays, prevCount, vsPrevPct, dowAvg, streakNum, malas, remainder };
  }, [jaapData, dateObj, currentCount]);

  function handleCountTap() {
    setEditValue(currentCount.toString());
    setIsEditing(true);
  }

  function handleSaveEdit() {
    Keyboard.dismiss();
    const val = parseInt(editValue, 10);
    const finalVal = isNaN(val) || val < 0 ? 0 : val;
    setDayCount(dateObj, finalVal);
    setIsEditing(false);
  }

  function handleCancelEdit() {
    Keyboard.dismiss();
    setEditValue(currentCount.toString());
    setIsEditing(false);
  }

  // Motivational message
  function getMotivation(): { emoji: string; text: string } {
    if (currentCount === 0) return { emoji: '🙏', text: 'Every Naam counts. Start any time!' };
    if (currentCount < 108) return { emoji: '✨', text: 'Beautiful beginning!' };
    if (currentCount < 540) return { emoji: '🕉️', text: 'Stay devoted, keep going!' };
    if (currentCount < 1080) return { emoji: '🔥', text: 'Wonderful dedication!' };
    if (currentCount < 5400) return { emoji: '⭐', text: 'Outstanding effort!' };
    return { emoji: '🏆', text: 'Extraordinary devotion!' };
  }
  const motivation = getMotivation();

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#FF6F00" />

      {/* App Bar */}
      <LinearGradient
        colors={['#FF6F00', '#FF9800']}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        style={[styles.appBar, { paddingTop: insets.top, height: 60 + insets.top }]}
      >
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.appBarTitle}>Day Detail</Text>
        <View style={styles.appBarRight} />
      </LinearGradient>

      <ScrollView style={{ flex: 1, backgroundColor: '#FFF8F0' }} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Date Header */}
        <View style={styles.dateHeader}>
          <Text style={styles.dayNameText}>{dayName}</Text>
          <Text style={styles.fullDateText}>
            {dateNum} {monthName} {year}
          </Text>
        </View>

        {/* Hero Count Card — Tap to Edit */}
        <TouchableOpacity activeOpacity={0.85} onPress={handleCountTap} disabled={isEditing}>
          <View style={styles.heroCard}>
            {isEditing ? (
              <View style={styles.editRow}>
                <TextInput
                  style={styles.heroInput}
                  value={editValue}
                  onChangeText={setEditValue}
                  keyboardType="numeric"
                  autoFocus
                  selectTextOnFocus
                  selectionColor="rgba(255,111,0,0.5)"
                />
                <View style={styles.editActions}>
                  <TouchableOpacity onPress={handleSaveEdit} style={styles.editActionBtn}>
                    <Ionicons name="checkmark-circle" size={36} color="#4CAF50" />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={handleCancelEdit} style={styles.editActionBtn}>
                    <Ionicons name="close-circle" size={36} color="#BDBDBD" />
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <>
                <Text style={styles.heroLabel}>Naam Jaap</Text>
                <Text style={styles.heroCount}>
                  {currentCount.toLocaleString('en-IN')}
                </Text>
                <View style={styles.tapHintRow}>
                  <Ionicons name="pencil" size={12} color="#BDBDBD" />
                  <Text style={styles.tapHintText}>Tap to edit</Text>
                </View>
              </>
            )}
          </View>
        </TouchableOpacity>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          {/* Row 1 */}
          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <View style={[styles.statIconCircle, { backgroundColor: 'rgba(76,175,80,0.12)' }]}>
                <Ionicons name="trophy" size={18} color="#4CAF50" />
              </View>
              <Text style={styles.statCardValue}>
                {stats.dayRank > 0 ? `#${stats.dayRank}` : '—'}
              </Text>
              <Text style={styles.statCardLabel}>
                {stats.dayRank > 0 ? `of ${stats.totalDays} days` : 'Day Rank'}
              </Text>
            </View>

            <View style={styles.statCard}>
              <View style={[styles.statIconCircle, { backgroundColor: 'rgba(33,150,243,0.12)' }]}>
                <Ionicons
                  name={stats.vsPrevPct >= 0 ? 'trending-up' : 'trending-down'}
                  size={18}
                  color="#2196F3"
                />
              </View>
              <Text style={[styles.statCardValue, stats.vsPrevPct < 0 && { color: '#F44336' }]}>
                {stats.prevCount > 0
                  ? `${stats.vsPrevPct >= 0 ? '+' : ''}${stats.vsPrevPct}%`
                  : '—'}
              </Text>
              <Text style={styles.statCardLabel}>vs Previous Day</Text>
            </View>
          </View>

          {/* Row 2 */}
          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <View style={[styles.statIconCircle, { backgroundColor: 'rgba(156,39,176,0.12)' }]}>
                <Ionicons name="calendar" size={18} color="#9C27B0" />
              </View>
              <Text style={styles.statCardValue}>
                {stats.dowAvg > 0 ? stats.dowAvg.toLocaleString('en-IN') : '—'}
              </Text>
              <Text style={styles.statCardLabel}>Avg {dayName}</Text>
            </View>

            <View style={styles.statCard}>
              <View style={[styles.statIconCircle, { backgroundColor: 'rgba(255,152,0,0.12)' }]}>
                <Ionicons name="flame" size={18} color="#FF9800" />
              </View>
              <Text style={styles.statCardValue}>
                {stats.streakNum > 0 ? `${stats.streakNum} day${stats.streakNum > 1 ? 's' : ''}` : '—'}
              </Text>
              <Text style={styles.statCardLabel}>Streak</Text>
            </View>
          </View>

          {/* Row 3 */}
          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <View style={[styles.statIconCircle, { backgroundColor: 'rgba(233,30,99,0.12)' }]}>
                <Text style={{ fontSize: 16 }}>🕉️</Text>
              </View>
              <Text style={styles.statCardValue}>
                {stats.malas > 0 ? stats.malas : '0'}
              </Text>
              <Text style={styles.statCardLabel}>
                Malas{stats.remainder > 0 ? ` + ${stats.remainder}` : ''}
              </Text>
            </View>

            <View style={styles.statCard}>
              <View style={[styles.statIconCircle, { backgroundColor: 'rgba(0,150,136,0.12)' }]}>
                <Ionicons name="time" size={18} color="#009688" />
              </View>
              <Text style={styles.statCardValue}>
                {currentCount > 0
                  ? `${Math.ceil(currentCount / 108 * 5)}m`
                  : '—'}
              </Text>
              <Text style={styles.statCardLabel}>Est. Time</Text>
            </View>
          </View>
        </View>

        {/* Motivation */}
        <View style={styles.motivationCard}>
          <Text style={styles.motivationEmoji}>{motivation.emoji}</Text>
          <Text style={styles.motivationText}>{motivation.text}</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FF6F00', // Status bar gap color
  },
  appBar: {
    height: 60,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    shadowColor: '#FF6F00',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  appBarTitle: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 18,
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },
  appBarRight: { width: 40 },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },

  // Date header
  dateHeader: {
    alignItems: 'center',
    marginBottom: 20,
    marginTop: 8,
  },
  dayNameText: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 26,
    color: '#FF6F00',
    letterSpacing: -0.5,
  },
  fullDateText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 15,
    color: '#757575',
    marginTop: 2,
  },

  // Hero card
  heroCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    paddingVertical: 32,
    paddingHorizontal: 24,
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#FF6F00',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,111,0,0.1)',
  },
  heroLabel: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 13,
    color: '#9E9E9E',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  heroCount: {
    fontFamily: 'Poppins_800ExtraBold',
    fontSize: 56,
    color: '#FF6F00',
    lineHeight: 64,
    letterSpacing: -1,
  },
  tapHintRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 10,
  },
  tapHintText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 11,
    color: '#BDBDBD',
  },

  // Edit mode
  editRow: {
    alignItems: 'center',
    width: '100%',
  },
  heroInput: {
    fontFamily: 'Poppins_800ExtraBold',
    fontSize: 48,
    color: '#FF6F00',
    textAlign: 'center',
    borderBottomWidth: 2,
    borderBottomColor: '#FF6F00',
    paddingVertical: 8,
    minWidth: 180,
  },
  editActions: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 16,
  },
  editActionBtn: {
    padding: 4,
  },

  // Stats grid
  statsGrid: {
    gap: 12,
    marginBottom: 20,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    paddingVertical: 18,
    paddingHorizontal: 14,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 2,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.03)',
  },
  statIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  statCardValue: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 18,
    color: '#212121',
    lineHeight: 22,
  },
  statCardLabel: {
    fontFamily: 'Inter_400Regular',
    fontSize: 11,
    color: '#9E9E9E',
    marginTop: 2,
    textAlign: 'center',
  },

  // Motivation
  motivationCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    paddingVertical: 20,
    paddingHorizontal: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,111,0,0.08)',
    shadowColor: '#FF6F00',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 2,
  },
  motivationEmoji: {
    fontSize: 32,
    marginBottom: 8,
  },
  motivationText: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 15,
    color: '#424242',
    textAlign: 'center',
  },
});
