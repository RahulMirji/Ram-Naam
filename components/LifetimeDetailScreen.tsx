import React, { useState, useMemo, useRef } from 'react';
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

const MILESTONES = [
  { target: 1_000, label: '1,000', title: 'First Steps' },
  { target: 10_000, label: '10,000', title: 'Dedicated Devotee' },
  { target: 100_000, label: '1 Lakh', title: 'Unwavering Faith' },
  { target: 500_000, label: '5 Lakh', title: 'Spiritual Warrior' },
  { target: 1_000_000, label: '10 Lakh', title: 'Divine Connection' },
  { target: 10_000_000, label: '1 Crore', title: 'Eternal Devotion' },
];

function formatBig(n: number): string {
  if (n >= 10_000_000) return (n / 10_000_000).toFixed(2) + ' Cr';
  if (n >= 100_000) {
    const l = n / 100_000;
    return l % 1 === 0 ? l + ' L' : l.toFixed(1) + ' L';
  }
  return n.toLocaleString('en-IN');
}

export function LifetimeDetailScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { jaapData, lifetimeBase, totalLifetime, currentStreak, setLifetimeBase } = useJaap();

  // Tap-to-edit lifetime base
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(lifetimeBase.toString());
  const scrollRef = useRef<ScrollView>(null);

  const stats = useMemo(() => {
    const entries = Object.entries(jaapData).filter(([, v]) => v > 0);
    const totalDays = entries.length;
    const sumDays = entries.reduce((s, [, v]) => s + v, 0);
    const dailyAvg = totalDays > 0 ? Math.round(sumDays / totalDays) : 0;

    // Best day
    let bestDay = '—';
    let bestCount = 0;
    entries.forEach(([k, v]) => {
      if (v > bestCount) {
        bestCount = v;
        bestDay = k;
      }
    });
    let bestDayFormatted = '—';
    if (bestDay !== '—') {
      const [y, m, d] = bestDay.split('-').map(Number);
      const dt = new Date(y, m - 1, d);
      bestDayFormatted = dt.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
    }

    // Longest streak
    const sortedDates = entries.map(([k]) => k).sort();
    let longestStreak = 0, cur = 1;
    for (let i = 1; i < sortedDates.length; i++) {
      const prev = new Date(sortedDates[i - 1]);
      const curr = new Date(sortedDates[i]);
      const diff = (curr.getTime() - prev.getTime()) / 86400000;
      if (diff === 1) { cur++; longestStreak = Math.max(longestStreak, cur); }
      else { cur = 1; }
    }
    if (sortedDates.length > 0) longestStreak = Math.max(longestStreak, cur);

    // Total malas
    const totalMalas = Math.floor(totalLifetime / 108);

    return { totalDays, dailyAvg, bestCount, bestDayFormatted, longestStreak, totalMalas };
  }, [jaapData, totalLifetime]);

  // Find next milestone
  const nextMilestone = MILESTONES.find((m) => totalLifetime < m.target);
  const nextProgress = nextMilestone ? totalLifetime / nextMilestone.target : 1;

  function handleEditTap() {
    setEditValue(lifetimeBase.toString());
    setIsEditing(true);
    // Scroll to bottom so keyboard doesn't hide the input
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
  }

  function handleSaveEdit() {
    Keyboard.dismiss();
    const val = parseInt(editValue, 10);
    const finalVal = isNaN(val) || val < 0 ? 0 : val;
    setLifetimeBase(finalVal);
    setIsEditing(false);
  }

  function handleCancelEdit() {
    Keyboard.dismiss();
    setEditValue(lifetimeBase.toString());
    setIsEditing(false);
  }

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
        <Text style={styles.appBarTitle}>Lifetime Journey</Text>
        <View style={styles.appBarRight} />
      </LinearGradient>

      <ScrollView
        ref={scrollRef}
        style={{ flex: 1, backgroundColor: '#FFF8F0' }}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Hero section */}
        <LinearGradient
          colors={['#FF6F00', '#E65100']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.heroCard}
        >
          <Text style={styles.heroLabel}>TOTAL LIFETIME JAAP</Text>
          <Text style={styles.heroCount}>{formatBig(totalLifetime)}</Text>
          <Text style={styles.heroSub}>
            {stats.totalMalas.toLocaleString('en-IN')} Malas completed
          </Text>
        </LinearGradient>

        {/* Milestones */}
        <View style={styles.sectionHeader}>
          <View style={styles.sectionBar} />
          <Text style={styles.sectionTitle}>Milestones</Text>
        </View>

        <View style={styles.milestonesCard}>
          {MILESTONES.map((m, idx) => {
            const reached = totalLifetime >= m.target;
            const isCurrent = !reached && (idx === 0 || totalLifetime >= MILESTONES[idx - 1].target);
            const progress = isCurrent ? totalLifetime / m.target : reached ? 1 : 0;

            return (
              <View key={m.target} style={styles.milestoneRow}>
                {/* Timeline line */}
                <View style={styles.timelineCol}>
                  {idx > 0 && (
                    <View style={[styles.timelineLine, reached && styles.timelineLineReached]} />
                  )}
                  <View
                    style={[
                      styles.timelineDot,
                      reached && styles.timelineDotReached,
                      isCurrent && styles.timelineDotCurrent,
                    ]}
                  >
                    {reached && <Ionicons name="checkmark" size={14} color="#FFFFFF" />}
                    {isCurrent && <Ionicons name="flag" size={12} color="#FF6F00" />}
                  </View>
                  {idx < MILESTONES.length - 1 && (
                    <View style={[styles.timelineLineBottom, reached && styles.timelineLineReached]} />
                  )}
                </View>

                {/* Content */}
                <View style={[styles.milestoneContent, isCurrent && styles.milestoneContentCurrent]}>
                  <View style={styles.milestoneTextRow}>
                    <Text style={[styles.milestoneLabel, reached && styles.milestoneLabelReached]}>
                      {m.label}
                    </Text>
                    <Text style={[styles.milestoneTitle, reached && styles.milestoneTitleReached]}>
                      {m.title}
                    </Text>
                  </View>
                  {isCurrent && (
                    <View style={styles.progressBarContainer}>
                      <View style={styles.progressBarBg}>
                        <LinearGradient
                          colors={['#FF6F00', '#FF9800']}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 0 }}
                          style={[styles.progressBarFill, { width: `${Math.min(progress * 100, 100)}%` as any }]}
                        />
                      </View>
                      <Text style={styles.progressText}>{Math.round(progress * 100)}%</Text>
                    </View>
                  )}
                </View>
              </View>
            );
          })}
        </View>

        {/* Stats Grid */}
        <View style={styles.sectionHeader}>
          <View style={styles.sectionBar} />
          <Text style={styles.sectionTitle}>All-Time Stats</Text>
        </View>

        <View style={styles.statsGrid}>
          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <View style={[styles.statIcon, { backgroundColor: 'rgba(76,175,80,0.12)' }]}>
                <Ionicons name="calendar" size={18} color="#4CAF50" />
              </View>
              <Text style={styles.statValue}>{stats.totalDays}</Text>
              <Text style={styles.statLabel}>Days Tracked</Text>
            </View>
            <View style={styles.statCard}>
              <View style={[styles.statIcon, { backgroundColor: 'rgba(33,150,243,0.12)' }]}>
                <Ionicons name="stats-chart" size={18} color="#2196F3" />
              </View>
              <Text style={styles.statValue}>{stats.dailyAvg.toLocaleString('en-IN')}</Text>
              <Text style={styles.statLabel}>Daily Average</Text>
            </View>
          </View>

          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <View style={[styles.statIcon, { backgroundColor: 'rgba(233,30,99,0.12)' }]}>
                <Ionicons name="trophy" size={18} color="#E91E63" />
              </View>
              <Text style={styles.statValue}>{formatBig(stats.bestCount)}</Text>
              <Text style={styles.statLabel}>Best Day</Text>
              <Text style={styles.statSub}>{stats.bestDayFormatted}</Text>
            </View>
            <View style={styles.statCard}>
              <View style={[styles.statIcon, { backgroundColor: 'rgba(255,152,0,0.12)' }]}>
                <Ionicons name="flame" size={18} color="#FF9800" />
              </View>
              <Text style={styles.statValue}>{currentStreak}</Text>
              <Text style={styles.statLabel}>Current Streak</Text>
            </View>
          </View>

          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <View style={[styles.statIcon, { backgroundColor: 'rgba(156,39,176,0.12)' }]}>
                <Ionicons name="flash" size={18} color="#9C27B0" />
              </View>
              <Text style={styles.statValue}>{stats.longestStreak}</Text>
              <Text style={styles.statLabel}>Longest Streak</Text>
            </View>
            <View style={styles.statCard}>
              <View style={[styles.statIcon, { backgroundColor: 'rgba(0,150,136,0.12)' }]}>
                <Text style={{ fontSize: 16 }}>🕉️</Text>
              </View>
              <Text style={styles.statValue}>{stats.totalMalas.toLocaleString('en-IN')}</Text>
              <Text style={styles.statLabel}>Total Malas</Text>
            </View>
          </View>
        </View>

        {/* Lifetime Base Editor */}
        <View style={styles.sectionHeader}>
          <View style={styles.sectionBar} />
          <Text style={styles.sectionTitle}>Lifetime Base</Text>
        </View>

        <TouchableOpacity
          activeOpacity={0.85}
          onPress={handleEditTap}
          disabled={isEditing}
          style={styles.baseCard}
        >
          {isEditing ? (
            <View style={styles.baseEditRow}>
              <TextInput
                style={styles.baseInput}
                value={editValue}
                onChangeText={setEditValue}
                keyboardType="numeric"
                autoFocus
                selectTextOnFocus
                selectionColor="#FF6F00"
              />
              <View style={styles.baseEditActions}>
                <TouchableOpacity onPress={handleSaveEdit} style={styles.baseEditBtn}>
                  <Ionicons name="checkmark-circle" size={28} color="#4CAF50" />
                </TouchableOpacity>
                <TouchableOpacity onPress={handleCancelEdit} style={styles.baseEditBtn}>
                  <Ionicons name="close-circle" size={28} color="#BDBDBD" />
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <View style={styles.baseDisplay}>
              <View>
                <Text style={styles.baseValue}>{lifetimeBase.toLocaleString('en-IN')}</Text>
                <Text style={styles.baseHint}>
                  Jaap done before using this app
                </Text>
              </View>
              <View style={styles.basePencil}>
                <Ionicons name="pencil" size={16} color="#FF6F00" />
              </View>
            </View>
          )}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FF6F00',  // matches status bar / insets area
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

  // Hero
  heroCard: {
    borderRadius: 24,
    paddingVertical: 36,
    paddingHorizontal: 24,
    alignItems: 'center',
    marginBottom: 28,
    shadowColor: '#E65100',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 24,
    elevation: 12,
  },
  heroLabel: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 12,
    color: 'rgba(255,255,255,0.75)',
    letterSpacing: 2,
    marginBottom: 8,
  },
  heroCount: {
    fontFamily: 'Poppins_800ExtraBold',
    fontSize: 44,
    color: '#FFFFFF',
    lineHeight: 52,
    letterSpacing: -1,
  },
  heroSub: {
    fontFamily: 'Inter_500Medium',
    fontSize: 13,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 6,
  },

  // Section header
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 14,
  },
  sectionBar: {
    width: 4,
    height: 20,
    borderRadius: 2,
    backgroundColor: '#FF6F00',
  },
  sectionTitle: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 16,
    color: '#212121',
  },

  // Milestones
  milestonesCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    marginBottom: 28,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
  },
  milestoneRow: {
    flexDirection: 'row',
    minHeight: 56,
  },
  timelineCol: {
    width: 32,
    alignItems: 'center',
    position: 'relative',
  },
  timelineLine: {
    width: 2,
    flex: 1,
    backgroundColor: '#E0E0E0',
  },
  timelineLineBottom: {
    width: 2,
    flex: 1,
    backgroundColor: '#E0E0E0',
  },
  timelineLineReached: {
    backgroundColor: '#FF9800',
  },
  timelineDot: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#F5F5F5',
    borderWidth: 2,
    borderColor: '#E0E0E0',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  timelineDotReached: {
    backgroundColor: '#FF6F00',
    borderColor: '#FF6F00',
  },
  timelineDotCurrent: {
    backgroundColor: '#FFF3E0',
    borderColor: '#FF6F00',
    borderWidth: 2.5,
  },
  milestoneContent: {
    flex: 1,
    paddingLeft: 12,
    paddingVertical: 4,
    justifyContent: 'center',
    marginBottom: 8,
  },
  milestoneContentCurrent: {
    backgroundColor: '#FFF8F0',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginLeft: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,111,0,0.15)',
  },
  milestoneTextRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  milestoneLabel: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 14,
    color: '#9E9E9E',
  },
  milestoneLabelReached: {
    color: '#FF6F00',
  },
  milestoneTitle: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    color: '#BDBDBD',
  },
  milestoneTitleReached: {
    color: '#757575',
  },
  progressBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
  },
  progressBarBg: {
    flex: 1,
    height: 6,
    backgroundColor: '#F0E6D6',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  progressText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 11,
    color: '#FF6F00',
    minWidth: 32,
  },

  // Stats grid
  statsGrid: {
    gap: 12,
    marginBottom: 28,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    paddingVertical: 16,
    paddingHorizontal: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.03)',
  },
  statIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  statValue: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 18,
    color: '#212121',
    lineHeight: 22,
  },
  statLabel: {
    fontFamily: 'Inter_400Regular',
    fontSize: 11,
    color: '#9E9E9E',
    marginTop: 2,
    textAlign: 'center',
  },
  statSub: {
    fontFamily: 'Inter_400Regular',
    fontSize: 10,
    color: '#BDBDBD',
    marginTop: 1,
  },

  // Lifetime base
  baseCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.03)',
  },
  baseDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  baseValue: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 28,
    color: '#FF6F00',
    lineHeight: 34,
  },
  baseHint: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    color: '#9E9E9E',
    marginTop: 2,
  },
  basePencil: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,111,0,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  baseEditRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  baseInput: {
    flex: 1,
    fontFamily: 'Poppins_700Bold',
    fontSize: 24,
    color: '#212121',
    backgroundColor: '#FFF8F0',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    textAlign: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255,111,0,0.3)',
  },
  baseEditActions: {
    flexDirection: 'row',
    gap: 8,
  },
  baseEditBtn: {
    padding: 4,
  },
});
