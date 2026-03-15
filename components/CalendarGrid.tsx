import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

interface CalendarGridProps {
  year: number;
  month: number; // 0-indexed
  jaapData: Record<string, number>;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onDayClick: (date: Date) => void;
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];
const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function getDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

const screenWidth = Dimensions.get('window').width;
const CELL_GAP = 5;
const CALENDAR_H_PADDING = 16;
const AVAILABLE_WIDTH = screenWidth - CALENDAR_H_PADDING * 2;
const CELL_SIZE = (AVAILABLE_WIDTH - CELL_GAP * 6) / 7;

export function CalendarGrid({
  year,
  month,
  jaapData,
  onPrevMonth,
  onNextMonth,
  onDayClick,
}: CalendarGridProps) {
  const today = new Date();
  const firstDay = new Date(year, month, 1);
  const startDow = firstDay.getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const cells: (number | null)[] = [];
  for (let i = 0; i < startDow; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  const rows: (number | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) {
    rows.push(cells.slice(i, i + 7));
  }

  return (
    <View style={styles.container}>
      {/* Month navigation */}
      <View style={styles.navRow}>
        <TouchableOpacity onPress={onPrevMonth} style={styles.navButton}>
          <Ionicons name="chevron-back" size={18} color="#FF6F00" />
        </TouchableOpacity>
        <Text style={styles.monthTitle}>
          {MONTH_NAMES[month]} {year}
        </Text>
        <TouchableOpacity onPress={onNextMonth} style={styles.navButton}>
          <Ionicons name="chevron-forward" size={18} color="#FF6F00" />
        </TouchableOpacity>
      </View>

      {/* Day headers */}
      <View style={styles.dayHeaderRow}>
        {DAY_NAMES.map((d) => (
          <View key={d} style={[styles.dayHeaderCell, { width: CELL_SIZE }]}>
            <Text style={styles.dayHeaderText}>{d}</Text>
          </View>
        ))}
      </View>

      {/* Calendar cells */}
      {rows.map((row, rowIdx) => (
        <View key={`row-${rowIdx}`} style={styles.calendarRow}>
          {row.map((day, colIdx) => {
            if (day === null) {
              return (
                <View
                  key={`empty-${rowIdx}-${colIdx}`}
                  style={[styles.emptyCell, { width: CELL_SIZE, height: CELL_SIZE }]}
                />
              );
            }

            const cellDate = new Date(year, month, day);
            const dateKey = getDateKey(cellDate);
            const count = jaapData[dateKey] || 0;
            const isToday = isSameDay(cellDate, today);
            const hasCount = count > 0;

            return (
              <TouchableOpacity
                key={`day-${day}`}
                activeOpacity={0.7}
                onPress={() => onDayClick(cellDate)}
                style={[
                  styles.dayCellOuter,
                  { width: CELL_SIZE, height: CELL_SIZE },
                  isToday && !hasCount && styles.todayBorder,
                  isToday && hasCount && styles.todayWithCountBorder,
                ]}
              >
                {hasCount ? (
                  <LinearGradient
                    colors={['#FF6F00', '#FF9800']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.dayCellGradient}
                  >
                    <Text style={styles.dayTextWhite}>{day}</Text>
                    {hasCount && (
                      <Text
                        style={[
                          styles.countText,
                          { fontSize: count >= 10000 ? 7 : count >= 1000 ? 8 : 9 },
                        ]}
                      >
                        {count >= 100000
                          ? (count / 100000).toFixed(1) + 'L'
                          : count.toLocaleString('en-IN')}
                      </Text>
                    )}
                  </LinearGradient>
                ) : (
                  <View style={styles.dayCellEmpty}>
                    <Text
                      style={[
                        styles.dayTextNormal,
                        isToday && styles.dayTextToday,
                      ]}
                    >
                      {day}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: CALENDAR_H_PADDING,
  },
  navRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  navButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,111,0,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthTitle: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 18,
    color: '#212121',
    letterSpacing: -0.2,
  },
  dayHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  dayHeaderCell: {
    alignItems: 'center',
    paddingVertical: 4,
  },
  dayHeaderText: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 11,
    color: '#FF6F00',
    letterSpacing: 0.3,
  },
  calendarRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: CELL_GAP,
  },
  emptyCell: {
    borderRadius: 12,
  },
  dayCellOuter: {
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  todayBorder: {
    borderWidth: 2,
    borderColor: '#FF6F00',
  },
  todayWithCountBorder: {
    borderWidth: 2,
    borderColor: '#E65100',
  },
  dayCellGradient: {
    flex: 1,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
    paddingHorizontal: 2,
    shadowColor: '#FF6F00',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  dayCellEmpty: {
    flex: 1,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.9)',
    paddingVertical: 4,
    paddingHorizontal: 2,
  },
  dayTextWhite: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 13,
    color: '#FFFFFF',
    lineHeight: 15,
  },
  dayTextNormal: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 13,
    color: '#424242',
    lineHeight: 15,
  },
  dayTextToday: {
    color: '#FF6F00',
  },
  countText: {
    fontFamily: 'Inter_600SemiBold',
    color: 'rgba(255,255,255,0.92)',
    lineHeight: 11,
    letterSpacing: -0.2,
  },
});
