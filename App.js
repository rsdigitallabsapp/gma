import React, { useEffect, useCallback } from 'react';
import { View } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
import { useFonts, PlayfairDisplay_700Bold, PlayfairDisplay_700Bold_Italic } from '@expo-google-fonts/playfair-display';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { RootNavigator } from './src/navigation';
import { initializePurchases, checkPremiumStatus, addCustomerInfoListener } from './src/services/purchases';
import { Storage } from './src/storage';

SplashScreen.preventAutoHideAsync();

// Initialize RevenueCat before the first render
initializePurchases();

export default function App() {
  const [fontsLoaded] = useFonts({
    PlayfairDisplay_700Bold,
    PlayfairDisplay_700Bold_Italic,
  });

  useEffect(() => {
    // Sync RevenueCat entitlement → local MMKV cache on launch
    checkPremiumStatus().then(isPremium => {
      if (isPremium === true) Storage.setPremium(true);
      if (isPremium === false) Storage.setPremium(false);
      // null = offline; keep cached value
    });

    // Keep MMKV in sync whenever subscription status changes (renewal, expiry, etc.)
    const unsub = addCustomerInfoListener(isPremium => {
      Storage.setPremium(isPremium);
    });

    return () => unsub?.();
  }, []);

  const onLayoutRootView = useCallback(async () => {
    if (fontsLoaded) {
      await SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) return null;

  return (
    <SafeAreaProvider>
      <View style={{ flex: 1, backgroundColor: '#0A0D17' }} onLayout={onLayoutRootView}>
        <StatusBar style="light" />
        <RootNavigator />
      </View>
    </SafeAreaProvider>
  );
}
