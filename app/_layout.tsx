import React, { useCallback } from 'react';
import { View, Image, Text, StyleSheet } from 'react-native';
import { Stack } from 'expo-router';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { JaapProvider } from '../context/JaapContext';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    'Poppins_400Regular': require('../assets/fonts/Poppins-Regular.ttf'),
    'Poppins_500Medium': require('../assets/fonts/Poppins-Medium.ttf'),
    'Poppins_600SemiBold': require('../assets/fonts/Poppins-SemiBold.ttf'),
    'Poppins_700Bold': require('../assets/fonts/Poppins-Bold.ttf'),
    'Poppins_800ExtraBold': require('../assets/fonts/Poppins-ExtraBold.ttf'),
    'Inter_400Regular': require('../assets/fonts/Inter-Regular.ttf'),
    'Inter_500Medium': require('../assets/fonts/Inter-Medium.ttf'),
    'Inter_600SemiBold': require('../assets/fonts/Inter-SemiBold.ttf'),
    'Inter_700Bold': require('../assets/fonts/Inter-Bold.ttf'),
  });

  const onLayoutRootView = useCallback(async () => {
    if (fontsLoaded || fontError) {
      await SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) {
    return (
      <View style={styles.loading}>
        <Image
          source={require('../assets/logo.jpeg')}
          style={styles.splashLogo}
        />
        <Text style={styles.splashTitle}>Ram Naam Tracker</Text>
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <JaapProvider>
        <View style={{ flex: 1 }} onLayout={onLayoutRootView}>
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="(tabs)" />
          </Stack>
        </View>
      </JaapProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  splashLogo: {
    width: 160,
    height: 160,
    borderRadius: 40, // 25% of 160
  },
  splashTitle: {
    marginTop: 24,
    fontSize: 22,
    fontWeight: '600',
    color: '#333333',
    letterSpacing: 0.3,
  },
});
