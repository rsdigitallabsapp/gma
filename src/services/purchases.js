import Purchases, { LOG_LEVEL, PACKAGE_TYPE } from 'react-native-purchases';
import { Platform } from 'react-native';

// ─── Replace these with your RevenueCat API keys ─────────────────────────────
const API_KEYS = {
  ios: 'appl_EcfvtVPzBCqlaZRRASiJtcWmsnp',
  android: 'goog_YOUR_ANDROID_REVENUECAT_KEY',
};
// ─────────────────────────────────────────────────────────────────────────────

export const ENTITLEMENT_ID = 'premium';

// Package type → human-readable period label
export const PERIOD_LABELS = {
  [PACKAGE_TYPE.MONTHLY]: 'month',
  [PACKAGE_TYPE.THREE_MONTH]: '3 months',
  [PACKAGE_TYPE.ANNUAL]: 'year',
};

export function initializePurchases() {
  try {
    if (__DEV__) {
      Purchases.setLogLevel(LOG_LEVEL.DEBUG);
    }
    Purchases.configure({
      apiKey: Platform.OS === 'ios' ? API_KEYS.ios : API_KEYS.android,
    });
  } catch (e) {
    // Native module not linked yet — requires a full Xcode rebuild after pod install
    console.warn('[RevenueCat] Initialization skipped:', e.message);
  }
}

// Returns true if the "premium" entitlement is active
export function isEntitlementActive(customerInfo) {
  return customerInfo?.entitlements?.active?.[ENTITLEMENT_ID] !== undefined;
}

// Fetches the current RevenueCat Offering (returns null if unavailable)
export async function getOfferings() {
  try {
    const offerings = await Purchases.getOfferings();
    return offerings.current ?? null;
  } catch {
    return null;
  }
}

// Purchase a package. Returns { success, cancelled, error }
export async function purchasePackage(pkg) {
  try {
    const { customerInfo } = await Purchases.purchasePackage(pkg);
    return { success: isEntitlementActive(customerInfo), cancelled: false, error: null };
  } catch (e) {
    if (e.userCancelled) {
      return { success: false, cancelled: true, error: null };
    }
    return { success: false, cancelled: false, error: e.message ?? 'Purchase failed.' };
  }
}

// Restore past purchases. Returns { success, error }
export async function restorePurchases() {
  try {
    const customerInfo = await Purchases.restorePurchases();
    const active = isEntitlementActive(customerInfo);
    return {
      success: active,
      error: active ? null : 'No active subscription found.',
    };
  } catch (e) {
    return { success: false, error: e.message ?? 'Restore failed.' };
  }
}

// Check current premium status from RevenueCat (source of truth)
export async function checkPremiumStatus() {
  try {
    const customerInfo = await Purchases.getCustomerInfo();
    return isEntitlementActive(customerInfo);
  } catch {
    return null; // null = unknown (use cached value)
  }
}

// Register a listener that fires whenever the customer's subscription status changes
export function addCustomerInfoListener(callback) {
  return Purchases.addCustomerInfoUpdateListener((customerInfo) => {
    callback(isEntitlementActive(customerInfo));
  });
}
