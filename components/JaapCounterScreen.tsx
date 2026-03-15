import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TextInput,
  Animated,
  Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useJaap } from '../context/JaapContext';

const MALA_SIZE = 108; // one mala = 108 naam jaaps

export function JaapCounterScreen() {
  const insets = useSafeAreaInsets();
  const { setDayCount, getDayCount, totalLifetime } = useJaap();

  // Stable today date ref
  const todayDate = useRef(new Date()).current;

  // Capture the saved count ONCE at mount — never let it drift from live jaapData
  const initialSavedRef = useRef<number | null>(null);
  if (initialSavedRef.current === null) {
    initialSavedRef.current = getDayCount(todayDate);
  }
  const initialSaved = initialSavedRef.current;

  // Session counters
  // currentBead: 0–107 position within current mala
  const [currentBead, setCurrentBead] = useState(0);
  // completedMalas: number of full malas completed this session
  const [completedMalas, setCompletedMalas] = useState(0);
  // raamWords: words shown in the scroll area (cleared on each mala completion)
  const [raamWords, setRaamWords] = useState<string[]>([]);
  // todayExtra: taps added this session (on top of initialSaved)
  const [todayExtra, setTodayExtra] = useState(0);

  // Target = number of malas the user wants to complete today
  const [dailyTargetMalas, setDailyTargetMalas] = useState(1);
  const [showTargetModal, setShowTargetModal] = useState(false);
  const [targetInput, setTargetInput] = useState('1');

  // Toast
  const [toastMsg, setToastMsg] = useState('');
  const [toastVisible, setToastVisible] = useState(false);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  // Ripple animation
  const rippleScale = useRef(new Animated.Value(0)).current;
  const rippleOpacity = useRef(new Animated.Value(0)).current;

  // Scroll ref for राम words
  const raamScrollRef = useRef<ScrollView>(null);

  // Derived values — use initialSaved (stable) + todayExtra (increments by 1)
  const todayTotal = initialSaved + todayExtra;
  // totalLifetime already sums all jaapData including today's auto-saved value
  const lifetimeDisplay = totalLifetime;

  // Progress within current mala (0.0 → 1.0)
  const malaProgress = currentBead / MALA_SIZE;
  // Total malas progress toward daily target
  const targetProgress = Math.min(completedMalas / dailyTargetMalas, 1);

  const showToast = useCallback((msg: string) => {
    setToastMsg(msg);
    setToastVisible(true);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToastVisible(false), 2500);
  }, []);

  const triggerRipple = useCallback(() => {
    rippleScale.setValue(0);
    rippleOpacity.setValue(0.5);
    Animated.parallel([
      Animated.timing(rippleScale, { toValue: 1, duration: 650, useNativeDriver: true }),
      Animated.timing(rippleOpacity, { toValue: 0, duration: 650, useNativeDriver: true }),
    ]).start();
  }, [rippleScale, rippleOpacity]);

  const handleTap = useCallback(() => {
    triggerRipple();

    const nextBead = currentBead + 1;
    const newExtra = todayExtra + 1;

    // Auto-save every single tap
    setDayCount(todayDate, initialSaved + newExtra);
    setTodayExtra(newExtra);

    if (nextBead >= MALA_SIZE) {
      // Mala completed
      const newMalas = completedMalas + 1;
      setCompletedMalas(newMalas);
      setCurrentBead(0);
      setRaamWords([]);
      showToast(`🙏 माला ${newMalas} पूर्ण!`);
    } else {
      setCurrentBead(nextBead);
      setRaamWords(prev => [...prev, 'राम']);
      setTimeout(() => raamScrollRef.current?.scrollToEnd({ animated: true }), 50);
    }
  }, [currentBead, todayExtra, completedMalas, triggerRipple, showToast, setDayCount, todayDate, initialSaved]);

  const raamText = raamWords.join(' ');

  return (
    <View style={styles.container}>
      {/* ── App Bar ── */}
      <LinearGradient
        colors={['#FF6F00', '#FF9800']}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        style={[styles.appBar, { paddingTop: insets.top, height: 64 + insets.top }]}
      >
        <View style={styles.titleRow}>
          <Image
            source={require('../assets/logo.jpeg')}
            style={styles.logoImg}
          />
          <Text style={styles.appBarTitle}>जय श्री राम</Text>
        </View>
      </LinearGradient>

      {/* ── Stats Strip (improved) ── */}
      <View style={styles.statsStrip}>
        {/* Lifetime */}
        <View style={styles.statCell}>
          <Text style={styles.statEmoji}>🔥</Text>
          <Text style={styles.statLabel}>जीवनकाल</Text>
          <Text style={styles.statValue}>{lifetimeDisplay.toLocaleString()}</Text>
        </View>

        <View style={styles.stripDivider} />

        {/* Target (tappable to set) */}
        <TouchableOpacity
          style={styles.statCell}
          onPress={() => { setTargetInput(String(dailyTargetMalas)); setShowTargetModal(true); }}
          activeOpacity={0.7}
        >
          <Text style={styles.statEmoji}>🎯</Text>
          <Text style={styles.statLabel}>लक्ष्य माला</Text>
          <Text style={styles.statValueTarget}>{completedMalas}/{dailyTargetMalas}</Text>
          {/* mini progress bar */}
          <View style={styles.miniBar}>
            <View style={[styles.miniBarFill, { width: `${targetProgress * 100}%` as any }]} />
          </View>
        </TouchableOpacity>

        <View style={styles.stripDivider} />

        {/* Today */}
        <View style={styles.statCell}>
          <Text style={styles.statEmoji}>☀️</Text>
          <Text style={styles.statLabel}>आज</Text>
          <Text style={styles.statValue}>{todayTotal.toLocaleString()}</Text>
        </View>
      </View>

      {/* ── Main Tap Area ── */}
      <TouchableOpacity
        style={styles.tapArea}
        onPress={handleTap}
        activeOpacity={1}
      >
        {/* OM watermark */}
        <Text style={styles.omWatermark}>🕉️</Text>

        {/* Scrolling राम words */}
        <View style={styles.raamContainer} pointerEvents="none">
          <ScrollView
            ref={raamScrollRef}
            showsVerticalScrollIndicator={false}
            style={styles.raamScroll}
          >
            <Text style={styles.raamText}>{raamText || ' '}</Text>
          </ScrollView>
        </View>

        {/* Ripple */}
        <Animated.View
          pointerEvents="none"
          style={[
            styles.ripple,
            {
              opacity: rippleOpacity,
              transform: [{
                scale: rippleScale.interpolate({ inputRange: [0, 1], outputRange: [0.2, 6] }),
              }],
            },
          ]}
        />

        {/* Mala progress bar at bottom of tap area */}
        <View style={styles.malaBarTrack} pointerEvents="none">
          <View style={[styles.malaBarFill, { width: `${malaProgress * 100}%` as any }]} />
        </View>
      </TouchableOpacity>

      {/* ── Bottom HUD ── */}
      <LinearGradient
        colors={['#FF6F00', '#FF9800']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={[styles.bottomHud, { paddingBottom: insets.bottom + 8 }]}
      >
        {/* Malas completed */}
        <View style={styles.hudCell}>
          <Text style={styles.hudLabel}>माला</Text>
          <Text style={styles.hudValue}>{completedMalas}</Text>
        </View>

        <View style={styles.hudDivider} />

        {/* Current bead within mala */}
        <View style={styles.hudCell}>
          <Text style={styles.hudLabel}>राम</Text>
          <Text style={styles.hudValue}>{currentBead}</Text>
        </View>
      </LinearGradient>

      {/* ── Toast ── */}
      {toastVisible && (
        <View style={styles.toast} pointerEvents="none">
          <Text style={styles.toastText}>{toastMsg}</Text>
        </View>
      )}

      {/* ── Target Modal ── */}
      <Modal visible={showTargetModal} transparent animationType="fade">
        <TouchableOpacity
          style={styles.modalBg}
          onPress={() => setShowTargetModal(false)}
          activeOpacity={1}
        >
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>🎯 दैनिक माला लक्ष्य</Text>
            <Text style={styles.modalSubtitle}>कितनी माला? (1 माला = 108 नाम जाप)</Text>
            <TextInput
              style={styles.modalInput}
              value={targetInput}
              onChangeText={setTargetInput}
              keyboardType="number-pad"
              placeholder="जैसे: 5"
              selectTextOnFocus
              autoFocus
            />
            <TouchableOpacity
              style={styles.modalSaveBtn}
              onPress={() => {
                const n = parseInt(targetInput);
                if (!isNaN(n) && n > 0) setDailyTargetMalas(n);
                setShowTargetModal(false);
              }}
            >
              <LinearGradient
                colors={['#FF6F00', '#FF9800']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.modalSaveBtnGrad}
              >
                <Text style={styles.modalSaveBtnText}>लक्ष्य सेट करें</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF8F0',
  },

  // ── App Bar ──
  appBar: {
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingBottom: 12,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  logoImg: {
    width: 34,
    height: 34,
    borderRadius: 8.5,
  },
  appBarTitle: {
    fontSize: 22,
    fontFamily: 'Poppins_700Bold',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },

  // ── Stats Strip ──
  statsStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginTop: 14,
    borderRadius: 16,
    paddingVertical: 12,
    shadowColor: '#FF6F00',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 4,
  },
  statCell: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  statEmoji: {
    fontSize: 18,
  },
  statLabel: {
    fontSize: 10,
    fontFamily: 'Inter_500Medium',
    color: '#BDBDBD',
    letterSpacing: 0.4,
  },
  statValue: {
    fontSize: 16,
    fontFamily: 'Poppins_700Bold',
    color: '#FF6F00',
  },
  statValueTarget: {
    fontSize: 14,
    fontFamily: 'Poppins_700Bold',
    color: '#757575',
  },
  stripDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#F3E5D0',
  },
  miniBar: {
    height: 3,
    width: 44,
    backgroundColor: '#F0E6D6',
    borderRadius: 2,
    marginTop: 3,
    overflow: 'hidden',
  },
  miniBarFill: {
    height: '100%',
    backgroundColor: '#FF9800',
    borderRadius: 2,
  },

  // ── Tap Area ──
  tapArea: {
    flex: 1,
    marginHorizontal: 16,
    marginTop: 14,
    marginBottom: 12,
    borderRadius: 22,
    backgroundColor: '#FFF3E0',
    overflow: 'hidden',
    alignItems: 'center',
    position: 'relative',
  },
  omWatermark: {
    position: 'absolute',
    fontSize: 160,
    opacity: 0.055,
    top: '18%',
  },
  raamContainer: {
    width: '100%',
    flex: 1,
    paddingHorizontal: 18,
    paddingTop: 14,
    paddingBottom: 4,
  },
  raamScroll: { flex: 1 },
  raamText: {
    fontSize: 24,
    fontFamily: 'Poppins_700Bold',
    color: '#E65100',
    lineHeight: 40,
    letterSpacing: 2.5,
  },
  ripple: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FF9800',
    top: '40%',
    alignSelf: 'center',
  },
  // thin progress bar at bottom of tap area
  malaBarTrack: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 4,
    backgroundColor: 'rgba(255,111,0,0.15)',
  },
  malaBarFill: {
    height: '100%',
    backgroundColor: '#FF6F00',
    borderRadius: 2,
  },

  // ── Bottom HUD ──
  bottomHud: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginBottom: 14,
    borderRadius: 20,
    paddingTop: 14,
    shadowColor: '#FF6F00',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 8,
  },
  hudCell: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  hudLabel: {
    fontSize: 11,
    fontFamily: 'Inter_500Medium',
    color: 'rgba(255,255,255,0.8)',
    letterSpacing: 0.8,
  },
  hudValue: {
    fontSize: 32,
    fontFamily: 'Poppins_800ExtraBold',
    color: '#FFFFFF',
    lineHeight: 38,
  },
  hudDivider: {
    width: 1,
    height: 40,
    backgroundColor: 'rgba(255,255,255,0.3)',
    alignSelf: 'center',
  },

  // ── Toast ──
  toast: {
    position: 'absolute',
    bottom: 100,
    alignSelf: 'center',
    backgroundColor: 'rgba(230,81,0,0.93)',
    paddingHorizontal: 26,
    paddingVertical: 11,
    borderRadius: 26,
  },
  toastText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontFamily: 'Poppins_600SemiBold',
  },

  // ── Target Modal ──
  modalBg: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCard: {
    width: '80%',
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 26,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 22,
    elevation: 12,
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: 'Poppins_700Bold',
    color: '#E65100',
    marginBottom: 4,
  },
  modalSubtitle: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    color: '#9E9E9E',
    textAlign: 'center',
    marginBottom: 16,
  },
  modalInput: {
    width: '100%',
    height: 54,
    borderWidth: 1.5,
    borderColor: '#FF9800',
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 22,
    fontFamily: 'Poppins_700Bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 18,
  },
  modalSaveBtn: {
    width: '100%',
    borderRadius: 12,
    overflow: 'hidden',
  },
  modalSaveBtnGrad: {
    paddingVertical: 14,
    alignItems: 'center',
  },
  modalSaveBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: 'Poppins_700Bold',
  },
});
