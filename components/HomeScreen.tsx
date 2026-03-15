import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useJaap } from '../context/JaapContext';
import { StatsCards } from './StatsCards';
import { CalendarGrid } from './CalendarGrid';
import { BackupRestoreSheet } from './BackupRestoreSheet';

export function HomeScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const {
    jaapData,
    totalLifetime,
    todayCount,
    yesterdayCount,
    twoDaysAgoCount,
    currentStreak,
  } = useJaap();

  const now = new Date();
  const [calYear, setCalYear] = useState(now.getFullYear());
  const [calMonth, setCalMonth] = useState(now.getMonth());
  const [backupSheetOpen, setBackupSheetOpen] = useState(false);

  function handleDayClick(date: Date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    router.push(`/day/${y}-${m}-${d}`);
  }

  function handlePrevMonth() {
    if (calMonth === 0) {
      setCalMonth(11);
      setCalYear((y) => y - 1);
    } else {
      setCalMonth((m) => m - 1);
    }
  }

  function handleNextMonth() {
    if (calMonth === 11) {
      setCalMonth(0);
      setCalYear((y) => y + 1);
    } else {
      setCalMonth((m) => m + 1);
    }
  }

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
        <View style={styles.titleRow}>
          <Image 
            source={require('../assets/logo.jpeg')} 
            style={styles.logoImg} 
          />
          <Text style={styles.appBarTitle}>Ram Naam Tracker</Text>
        </View>
        <TouchableOpacity
          onPress={() => setBackupSheetOpen(true)}
          style={styles.gearBtn}
          activeOpacity={0.7}
        >
          <Ionicons name="settings-outline" size={22} color="#FFFFFF" />
        </TouchableOpacity>
      </LinearGradient>

      {/* Scrollable Content */}
      <ScrollView
        style={{ flex: 1, zIndex: 1 }}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Section label */}
        <View style={styles.sectionLabelWrap}>
          <Text style={styles.sectionLabel}>YOUR JOURNEY</Text>
        </View>

        {/* Stats Cards row */}
        <View style={{ paddingTop: 10, paddingBottom: 8 }}>
          <StatsCards
            lifetime={totalLifetime}
            streak={currentStreak}
            today={todayCount}
            yesterday={yesterdayCount}
            twoDaysAgo={twoDaysAgoCount}
            onEditLifetime={() => router.push('/lifetime')}
          />
        </View>

        {/* Divider */}
        <View style={styles.divider} />

        {/* Calendar Section */}
        <CalendarGrid
          year={calYear}
          month={calMonth}
          jaapData={jaapData}
          onPrevMonth={handlePrevMonth}
          onNextMonth={handleNextMonth}
          onDayClick={handleDayClick}
        />

        {/* Bottom hint */}
        <Text style={styles.bottomHint}>
          Tap any day to add or edit your Naam Jaap count
        </Text>
      </ScrollView>

      {/* Backup & Restore Bottom Sheet */}
      <BackupRestoreSheet
        open={backupSheetOpen}
        onClose={() => setBackupSheetOpen(false)}
      />
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
    justifyContent: 'space-between',
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
    letterSpacing: 0.2,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  logoImg: {
    width: 32,
    height: 32,
    borderRadius: 8, // 25% of 32
  },
  gearBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    paddingBottom: 100,
  },
  sectionLabelWrap: {
    paddingTop: 20,
    paddingBottom: 4,
    paddingLeft: 16,
  },
  sectionLabel: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 11,
    color: '#9E9E9E',
    letterSpacing: 1,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255,111,0,0.12)',
    marginHorizontal: 16,
    marginTop: 14,
    marginBottom: 20,
  },
  bottomHint: {
    fontFamily: 'Inter_400Regular',
    fontSize: 11,
    color: '#BDBDBD',
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 4,
  },
});
