import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useJaap } from '../context/JaapContext';
import { useRouter } from 'expo-router';

const DAY_NAMES_FULL = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MONTH_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

function formatDateFull(dateStr: string): { dayName: string; day: number; month: string; year: number } {
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  return {
    dayName: DAY_NAMES_FULL[date.getDay()],
    day: d,
    month: MONTH_SHORT[m - 1],
    year: y,
  };
}

function isToday(dateStr: string): boolean {
  const now = new Date();
  const key = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  return dateStr === key;
}

function isYesterday(dateStr: string): boolean {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  return dateStr === key;
}

function buildRecentDays(jaapData: Record<string, number>, count: number): { dateStr: string; count: number }[] {
  const result: { dateStr: string; count: number }[] = [];
  const now = new Date();
  for (let i = 0; i < count; i++) {
    const d = new Date(now);
    d.setDate(now.getDate() - i);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    result.push({ dateStr: key, count: jaapData[key] || 0 });
  }
  return result;
}

const PAGE_SIZE = 20;

function getActiveDays(jaapData: Record<string, number>, year: number, month: number): number {
  const prefix = `${year}-${String(month + 1).padStart(2, '0')}`;
  return Object.entries(jaapData).filter(([k, v]) => k.startsWith(prefix) && v > 0).length;
}

function getMonthTotal(jaapData: Record<string, number>, year: number, month: number): number {
  const prefix = `${year}-${String(month + 1).padStart(2, '0')}`;
  return Object.entries(jaapData)
    .filter(([k]) => k.startsWith(prefix))
    .reduce((sum, [, v]) => sum + v, 0);
}

function getLongestStreak(jaapData: Record<string, number>): number {
  const dates = Object.keys(jaapData)
    .filter((k) => jaapData[k] > 0)
    .sort();
  if (dates.length === 0) return 0;
  let max = 1, cur = 1;
  for (let i = 1; i < dates.length; i++) {
    const prev = new Date(dates[i - 1]);
    const curr = new Date(dates[i]);
    const diff = (curr.getTime() - prev.getTime()) / 86400000;
    if (diff === 1) {
      cur++;
      max = Math.max(max, cur);
    } else {
      cur = 1;
    }
  }
  return max;
}

export function HistoryScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { jaapData } = useJaap();
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const monthTotal = getMonthTotal(jaapData, currentYear, currentMonth);
  const activeDays = getActiveDays(jaapData, currentYear, currentMonth);
  const streak = getLongestStreak(jaapData);

  const allRecentDays = buildRecentDays(jaapData, visibleCount + PAGE_SIZE);
  const visibleDays = allRecentDays.slice(0, visibleCount);

  function handleCardClick(dateStr: string) {
    router.push(`/day/${dateStr}`);
  }

  const summaryStats = [
    {
      icon: 'flame' as const,
      value: monthTotal >= 100000 ? (monthTotal / 100000).toFixed(1) + 'L' : monthTotal.toLocaleString('en-IN'),
      label: 'This Month',
    },
    {
      icon: 'calendar' as const,
      value: String(activeDays),
      label: 'Active Days',
    },
    {
      icon: 'trending-up' as const,
      value: String(streak),
      label: 'Best Streak',
    },
  ];

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#FF6F00" />

      {/* Om watermark */}
      <Text style={styles.watermark}>🕉️</Text>

      {/* App Bar */}
      <LinearGradient
        colors={['#FF6F00', '#FF9800']}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        style={[styles.appBar, { paddingTop: insets.top, height: 60 + insets.top }]}
      >
        <Text style={styles.appBarTitle}>📅 History</Text>
      </LinearGradient>

      {/* Scrollable Content */}
      <ScrollView
        style={{ flex: 1, zIndex: 1 }}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Month summary card */}
        <LinearGradient
          colors={['#FF6F00', '#FF9800']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.summaryCard}
        >
          <Text style={styles.summaryTitle}>
            {MONTH_NAMES[currentMonth]} {currentYear} Summary
          </Text>
          <View style={styles.summaryRow}>
            {summaryStats.map((item, idx) => (
              <React.Fragment key={item.label}>
                {idx > 0 && <View style={styles.summaryDivider} />}
                <View style={styles.summaryItem}>
                  <View style={styles.summaryIconCircle}>
                    <Ionicons name={item.icon} size={18} color="#FFFFFF" />
                  </View>
                  <Text style={styles.summaryValue}>{item.value}</Text>
                  <Text style={styles.summaryLabel}>{item.label}</Text>
                </View>
              </React.Fragment>
            ))}
          </View>
        </LinearGradient>

        {/* Daily History Stack */}
        <View style={styles.dailySection}>
          {/* Section header */}
          <View style={styles.dailySectionHeader}>
            <View style={styles.dailySectionLeft}>
              <LinearGradient
                colors={['#FF6F00', '#FF9800']}
                style={styles.sectionBar}
              />
              <Text style={styles.dailySectionTitle}>Daily Log</Text>
            </View>
            <Text style={styles.tapHint}>Tap a card to edit</Text>
          </View>

          {/* Cards */}
          {visibleDays.map(({ dateStr, count: dayCount }) => {
            const { dayName, day, month, year } = formatDateFull(dateStr);
            const today = isToday(dateStr);
            const yesterday = isYesterday(dateStr);
            const hasCount = dayCount > 0;

            return (
              <TouchableOpacity
                key={dateStr}
                activeOpacity={0.8}
                onPress={() => handleCardClick(dateStr)}
                style={[
                  styles.dayCard,
                  today && styles.dayCardToday,
                  !today && hasCount && styles.dayCardHasCount,
                ]}
              >
                {/* Left: date info */}
                <View style={styles.dayCardLeft}>
                  {/* Date badge */}
                  {hasCount ? (
                    <LinearGradient
                      colors={['#FF6F00', '#FF9800']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.dateBadge}
                    >
                      <Text style={styles.dateBadgeDayWhite}>{day}</Text>
                      <Text style={styles.dateBadgeMonthWhite}>{month}</Text>
                    </LinearGradient>
                  ) : (
                    <View style={[styles.dateBadge, today ? styles.dateBadgeToday : styles.dateBadgeEmpty]}>
                      <Text style={[styles.dateBadgeDay, today ? { color: '#FF6F00' } : { color: '#BDBDBD' }]}>{day}</Text>
                      <Text style={[styles.dateBadgeMonth, today ? { color: '#FF9800' } : { color: '#BDBDBD' }]}>{month}</Text>
                    </View>
                  )}

                  {/* Text info */}
                  <View>
                    <View style={styles.dayNameRow}>
                      <Text style={styles.dayNameText}>{dayName}</Text>
                      {today && (
                        <View style={styles.todayBadge}>
                          <Text style={styles.todayBadgeText}>TODAY</Text>
                        </View>
                      )}
                      {yesterday && !today && (
                        <View style={styles.yesterdayBadge}>
                          <Text style={styles.yesterdayBadgeText}>YESTERDAY</Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.dateSubtext}>
                      {month} {day}, {year}
                    </Text>
                  </View>
                </View>

                {/* Right: count + edit icon */}
                <View style={styles.dayCardRight}>
                  <View style={{ alignItems: 'flex-end' }}>
                    {hasCount ? (
                      <>
                        <Text style={styles.countValueText}>
                          {dayCount >= 100000
                            ? (dayCount / 100000).toFixed(1) + 'L'
                            : dayCount.toLocaleString('en-IN')}
                        </Text>
                        <Text style={styles.countLabel}>Naam Jaap</Text>
                      </>
                    ) : (
                      <Text style={styles.noEntryText}>No entry</Text>
                    )}
                  </View>
                  <View style={styles.editIcon}>
                    <Ionicons name="pencil" size={13} color="#FF6F00" />
                  </View>
                </View>
              </TouchableOpacity>
            );
          })}

          {/* See More button */}
          <TouchableOpacity
            onPress={() => setVisibleCount((c) => c + PAGE_SIZE)}
            style={styles.loadMoreButton}
            activeOpacity={0.7}
          >
            <Ionicons name="chevron-down" size={16} color="#FF6F00" />
            <Text style={styles.loadMoreText}>Load {PAGE_SIZE} More Days</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF8F0',
  },
  watermark: {
    position: 'absolute',
    top: '40%',
    alignSelf: 'center',
    fontSize: 200,
    opacity: 0.045,
    zIndex: 0,
    lineHeight: 240,
  },
  appBar: {
    height: 60,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    shadowColor: '#FF6F00',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.45,
    shadowRadius: 14,
    elevation: 8,
    zIndex: 10,
  },
  appBarTitle: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 18,
    color: '#FFFFFF',
  },
  scrollContent: {
    padding: 16,
    paddingTop: 20,
    paddingBottom: 100,
  },
  // Month summary card
  summaryCard: {
    borderRadius: 20,
    paddingTop: 18,
    paddingBottom: 20,
    paddingHorizontal: 20,
    marginBottom: 20,
    shadowColor: '#FF6F00',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 20,
    elevation: 8,
  },
  summaryTitle: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
    marginBottom: 14,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  summaryDivider: {
    width: 1,
    height: 48,
    backgroundColor: 'rgba(255,255,255,0.25)',
    borderRadius: 1,
  },
  summaryItem: {
    alignItems: 'center',
  },
  summaryIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  summaryValue: {
    fontFamily: 'Poppins_800ExtraBold',
    fontSize: 20,
    color: '#FFFFFF',
    lineHeight: 22,
  },
  summaryLabel: {
    fontFamily: 'Inter_400Regular',
    fontSize: 10,
    color: 'rgba(255,255,255,0.78)',
    marginTop: 4,
    letterSpacing: 0.2,
  },
  // Calendar card
  calendarCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingTop: 20,
    paddingBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 16,
    elevation: 3,
  },
  // Legend
  legendRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 18,
    marginTop: 14,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendBox: {
    width: 14,
    height: 14,
    borderRadius: 4,
  },
  legendText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 11,
    color: '#757575',
  },
  // Daily section
  dailySection: {
    marginTop: 28,
  },
  dailySectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  dailySectionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionBar: {
    width: 4,
    height: 20,
    borderRadius: 2,
  },
  dailySectionTitle: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 16,
    color: '#212121',
  },
  tapHint: {
    fontFamily: 'Inter_400Regular',
    fontSize: 11,
    color: '#9E9E9E',
  },
  // Day cards
  dayCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#F0F0F0',
    paddingVertical: 14,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.055,
    shadowRadius: 6,
    elevation: 2,
  },
  dayCardToday: {
    backgroundColor: '#FFF3E0',
    borderColor: 'rgba(255,111,0,0.4)',
    shadowColor: '#FF6F00',
    shadowOpacity: 0.14,
    shadowRadius: 16,
    elevation: 4,
  },
  dayCardHasCount: {
    borderColor: 'rgba(255,111,0,0.15)',
  },
  dayCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  dateBadge: {
    width: 48,
    height: 52,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateBadgeToday: {
    backgroundColor: 'rgba(255,111,0,0.1)',
  },
  dateBadgeEmpty: {
    backgroundColor: '#F5F5F5',
  },
  dateBadgeDayWhite: {
    fontFamily: 'Poppins_800ExtraBold',
    fontSize: 18,
    color: '#FFFFFF',
    lineHeight: 20,
  },
  dateBadgeMonthWhite: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 10,
    color: 'rgba(255,255,255,0.85)',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
    lineHeight: 12,
    marginTop: 2,
  },
  dateBadgeDay: {
    fontFamily: 'Poppins_800ExtraBold',
    fontSize: 18,
    lineHeight: 20,
  },
  dateBadgeMonth: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 10,
    letterSpacing: 0.3,
    textTransform: 'uppercase',
    lineHeight: 12,
    marginTop: 2,
  },
  dayNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dayNameText: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 14,
    color: '#212121',
    lineHeight: 18,
  },
  todayBadge: {
    backgroundColor: 'rgba(255,111,0,0.12)',
    borderRadius: 4,
    paddingHorizontal: 5,
    paddingVertical: 1,
  },
  todayBadgeText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 9,
    color: '#FF6F00',
    letterSpacing: 0.4,
  },
  yesterdayBadge: {
    backgroundColor: '#F0F0F0',
    borderRadius: 4,
    paddingHorizontal: 5,
    paddingVertical: 1,
  },
  yesterdayBadgeText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 9,
    color: '#757575',
    letterSpacing: 0.4,
  },
  dateSubtext: {
    fontFamily: 'Inter_400Regular',
    fontSize: 11,
    color: '#9E9E9E',
    lineHeight: 16,
    marginTop: 2,
  },
  dayCardRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  countValueText: {
    fontFamily: 'Poppins_800ExtraBold',
    fontSize: 22,
    color: '#FF6F00',
    lineHeight: 24,
    letterSpacing: -0.5,
  },
  countLabel: {
    fontFamily: 'Inter_400Regular',
    fontSize: 10,
    color: '#9E9E9E',
    letterSpacing: 0.2,
  },
  noEntryText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    color: '#BDBDBD',
    fontStyle: 'italic',
  },
  editIcon: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(255,111,0,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Load more
  loadMoreButton: {
    marginTop: 14,
    paddingVertical: 15,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: 'rgba(255,111,0,0.4)',
    borderStyle: 'dashed',
    backgroundColor: 'rgba(255,111,0,0.04)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  loadMoreText: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 13,
    color: '#FF6F00',
    letterSpacing: 0.2,
  },
});
