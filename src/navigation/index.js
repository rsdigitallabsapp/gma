import React, { useEffect, useRef } from 'react';
import { AppState } from 'react-native';
import { NavigationContainer, createNavigationContainerRef } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import * as Notifications from 'expo-notifications';
import { Storage } from '../storage';

import { WelcomeScreen } from '../screens/onboarding/WelcomeScreen';
import { CategoryScreen } from '../screens/onboarding/CategoryScreen';
import { WakeTimeScreen } from '../screens/onboarding/WakeTimeScreen';
import { PermissionsScreen } from '../screens/onboarding/PermissionsScreen';
import { AffirmationScreen } from '../screens/AffirmationScreen';
import { HomeScreen } from '../screens/HomeScreen';
import { EditWakeTimeScreen } from '../screens/settings/EditWakeTimeScreen';
import { EditCategoriesScreen } from '../screens/settings/EditCategoriesScreen';
import { PaywallScreen } from '../screens/settings/PaywallScreen';
import { CustomAffirmationsScreen } from '../screens/settings/CustomAffirmationsScreen';
import { AddAffirmationScreen } from '../screens/settings/AddAffirmationScreen';
import { HistoryScreen } from '../screens/HistoryScreen';
import { StatsScreen } from '../screens/StatsScreen';
import { FocusScreen } from '../screens/FocusScreen';

const Stack = createNativeStackNavigator();
export const navigationRef = createNavigationContainerRef();

function initialRoute() {
  if (!Storage.isOnboarded()) return 'Welcome';
  if (!Storage.isDoneToday()) return 'Affirmation';
  return 'Home';
}

// Navigate to AffirmationScreen if the user hasn't done today's ritual yet.
// Only fires during a morning window (4 AM – 4 PM) so late-night unlocks are ignored.
function navigateToAffirmationIfNeeded() {
  if (!navigationRef.isReady()) return;
  if (!Storage.isOnboarded()) return;
  if (Storage.isDoneToday()) return;

  const hour = new Date().getHours();
  if (hour < 4 || hour >= 16) return;

  const current = navigationRef.getCurrentRoute();
  if (current?.name === 'Affirmation') return;

  navigationRef.navigate('Affirmation');
}

export function RootNavigator() {
  const startRoute = initialRoute();
  const appState = useRef(AppState.currentState);

  useEffect(() => {
    // Notification tap → open AffirmationScreen directly
    const notifSub = Notifications.addNotificationResponseReceivedListener(() => {
      navigateToAffirmationIfNeeded();
    });

    // App comes to foreground (from Android unlock or manual open) → open AffirmationScreen if needed
    const appStateSub = AppState.addEventListener('change', nextState => {
      if (appState.current.match(/inactive|background/) && nextState === 'active') {
        navigateToAffirmationIfNeeded();
      }
      appState.current = nextState;
    });

    return () => {
      notifSub.remove();
      appStateSub.remove();
    };
  }, []);

  return (
    <NavigationContainer ref={navigationRef}>
      <Stack.Navigator
        initialRouteName={startRoute}
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: '#13110D' },
          animation: 'fade',
        }}
      >
        <Stack.Screen name="Welcome" component={WelcomeScreen} />
        <Stack.Screen name="Categories" component={CategoryScreen} />
        <Stack.Screen name="WakeTime" component={WakeTimeScreen} />
        <Stack.Screen name="Permissions" component={PermissionsScreen} />
        <Stack.Screen name="Affirmation" component={AffirmationScreen} />
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="EditWakeTime" component={EditWakeTimeScreen} />
        <Stack.Screen name="EditCategories" component={EditCategoriesScreen} />
        <Stack.Screen name="Paywall" component={PaywallScreen} />
        <Stack.Screen name="CustomAffirmations" component={CustomAffirmationsScreen} />
        <Stack.Screen name="AddAffirmation" component={AddAffirmationScreen} />
        <Stack.Screen name="History" component={HistoryScreen} />
        <Stack.Screen name="Stats" component={StatsScreen} />
        <Stack.Screen name="Focus" component={FocusScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
