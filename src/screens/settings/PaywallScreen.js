import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, ActivityIndicator, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PACKAGE_TYPE } from 'react-native-purchases';
import { colors, fonts, spacing, radius } from '../../theme';
import { Storage } from '../../storage';
import {
  getOfferings,
  purchasePackage,
  restorePurchases,
  PERIOD_LABELS,
} from '../../services/purchases';

const FEATURES = [
  { title: 'Custom affirmations', desc: 'Write your own and they play every morning first.' },
  { title: 'Streak shield', desc: 'Miss one day without breaking your streak, once a week.' },
  { title: 'Affirmation history', desc: 'See every affirmation you have ever said.' },
  { title: 'Favorites', desc: 'Heart the ones you love and surface them more often.' },
];

// Packages shown in this order
const PLAN_ORDER = [PACKAGE_TYPE.MONTHLY, PACKAGE_TYPE.THREE_MONTH, PACKAGE_TYPE.ANNUAL];

function savingsPercent(monthlyPkg, targetPkg) {
  if (!monthlyPkg || !targetPkg) return null;
  const monthlyPrice = monthlyPkg.product.price;
  const targetMonths = targetPkg.packageType === PACKAGE_TYPE.THREE_MONTH ? 3 : 12;
  const targetMonthlyEq = targetPkg.product.price / targetMonths;
  return Math.round((1 - targetMonthlyEq / monthlyPrice) * 100);
}

export function PaywallScreen({ navigation }) {
  const [packages, setPackages] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    getOfferings().then(offering => {
      if (!offering?.availablePackages?.length) {
        setError('Subscription options are unavailable right now. Try again later.');
        setLoading(false);
        return;
      }

      const sorted = PLAN_ORDER
        .map(type => offering.availablePackages.find(p => p.packageType === type))
        .filter(Boolean);

      setPackages(sorted);
      // Pre-select annual (or the last available)
      const annual = sorted.find(p => p.packageType === PACKAGE_TYPE.ANNUAL);
      setSelected(annual ?? sorted[sorted.length - 1]);
      setLoading(false);
    });
  }, []);

  const handlePurchase = async () => {
    if (!selected || purchasing) return;
    setError(null);
    setPurchasing(true);

    const { success, cancelled, error: err } = await purchasePackage(selected);
    setPurchasing(false);

    if (cancelled) return;
    if (err) { setError(err); return; }

    if (success) {
      Storage.setPremium(true);
      navigation.replace('CustomAffirmations');
    }
  };

  const handleRestore = async () => {
    if (restoring) return;
    setError(null);
    setRestoring(true);

    const { success, error: err } = await restorePurchases();
    setRestoring(false);

    if (success) {
      Storage.setPremium(true);
      navigation.replace('CustomAffirmations');
    } else {
      Alert.alert('Nothing to restore', err ?? 'No active subscription found on this account.');
    }
  };

  const monthlyPkg = packages.find(p => p.packageType === PACKAGE_TYPE.MONTHLY);

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} activeOpacity={0.7}>
          <Text style={styles.backArrow}>←</Text>
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>

        <Text style={styles.eyebrow}>GMA Premium</Text>
        <Text style={styles.headline}>Make every{'\n'}morning yours.</Text>
        <Text style={styles.sub}>
          Cancel any time. Unlock everything GMA has to offer.
        </Text>

        <View style={styles.featureList}>
          {FEATURES.map((f, i) => (
            <View key={i} style={styles.featureRow}>
              <View style={styles.featureDot} />
              <View style={styles.featureText}>
                <Text style={styles.featureTitle}>{f.title}</Text>
                <Text style={styles.featureDesc}>{f.desc}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Plan selector */}
        {loading ? (
          <ActivityIndicator color={colors.gold} style={{ marginVertical: spacing.xl }} />
        ) : error && packages.length === 0 ? (
          <View style={styles.errorCard}>
            <Text style={styles.errorCardText}>{error}</Text>
          </View>
        ) : (
          <View style={styles.plans}>
            {packages.map(pkg => {
              const isSelected = selected?.identifier === pkg.identifier;
              const isAnnual = pkg.packageType === PACKAGE_TYPE.ANNUAL;
              const savings = isAnnual ? savingsPercent(monthlyPkg, pkg) : null;
              const period = PERIOD_LABELS[pkg.packageType] ?? '';

              return (
                <TouchableOpacity
                  key={pkg.identifier}
                  style={[styles.planCard, isSelected && styles.planCardSelected]}
                  onPress={() => setSelected(pkg)}
                  activeOpacity={0.8}
                >
                  <View style={styles.planLeft}>
                    <View style={[styles.radio, isSelected && styles.radioSelected]}>
                      {isSelected && <View style={styles.radioDot} />}
                    </View>
                    <View>
                      <Text style={[styles.planName, isSelected && styles.planNameSelected]}>
                        {period.charAt(0).toUpperCase() + period.slice(1)}
                      </Text>
                      {isAnnual && (
                        <View style={styles.popularBadge}>
                          <Text style={styles.popularText}>⭐ Most Popular</Text>
                        </View>
                      )}
                    </View>
                  </View>

                  <View style={styles.planRight}>
                    {savings !== null && (
                      <View style={styles.savingsBadge}>
                        <Text style={styles.savingsText}>Save {savings}%</Text>
                      </View>
                    )}
                    <Text style={[styles.planPrice, isSelected && styles.planPriceSelected]}>
                      {pkg.product.priceString}
                    </Text>
                    <Text style={styles.planPeriod}>/ {period}</Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {error && packages.length > 0 && (
          <Text style={styles.inlineError}>{error}</Text>
        )}

        <TouchableOpacity
          style={[styles.btn, (!selected || purchasing) && styles.btnDisabled]}
          onPress={handlePurchase}
          disabled={!selected || purchasing || loading}
          activeOpacity={0.85}
        >
          {purchasing ? (
            <ActivityIndicator color={colors.bg} />
          ) : (
            <Text style={styles.btnText}>
              {selected
                ? `Start ${PERIOD_LABELS[selected.packageType] ?? 'Premium'} plan`
                : 'Select a plan'}
            </Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleRestore}
          disabled={restoring}
          style={styles.restoreBtn}
          activeOpacity={0.7}
        >
          {restoring ? (
            <ActivityIndicator color={colors.textMuted} size="small" />
          ) : (
            <Text style={styles.restoreText}>Restore purchases</Text>
          )}
        </TouchableOpacity>

        <Text style={styles.fine}>
          Subscriptions renew automatically. Cancel any time in your App Store or Google Play settings.
          By subscribing you agree to our Terms of Service and Privacy Policy.
        </Text>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  content: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xxl,
  },

  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: spacing.lg,
  },
  backArrow: { color: colors.textDim, fontSize: 18 },
  backText: { color: colors.textDim, fontSize: 15 },

  eyebrow: {
    color: colors.gold,
    fontSize: 11,
    letterSpacing: 3,
    textTransform: 'uppercase',
    marginBottom: spacing.sm,
  },
  headline: {
    fontFamily: fonts.display,
    fontSize: 38,
    color: colors.text,
    lineHeight: 48,
    marginBottom: spacing.sm,
  },
  sub: {
    color: colors.textDim,
    fontSize: 15,
    lineHeight: 23,
    marginBottom: spacing.lg,
  },

  featureList: { gap: 10, marginBottom: spacing.lg },
  featureRow: {
    flexDirection: 'row',
    gap: 14,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'flex-start',
  },
  featureDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.gold,
    marginTop: 6,
  },
  featureText: { flex: 1 },
  featureTitle: { color: colors.text, fontSize: 15, fontWeight: '600', marginBottom: 3 },
  featureDesc: { color: colors.textDim, fontSize: 13, lineHeight: 19 },

  plans: { gap: 10, marginBottom: spacing.lg },
  planCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    paddingVertical: 14,
    paddingHorizontal: spacing.md,
  },
  planCardSelected: {
    borderColor: colors.gold,
    backgroundColor: colors.surfaceElevated,
  },
  planLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioSelected: { borderColor: colors.gold },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.gold,
  },
  planName: { color: colors.textDim, fontSize: 16, fontWeight: '600' },
  planNameSelected: { color: colors.text },
  popularBadge: { marginTop: 2 },
  popularText: { color: colors.gold, fontSize: 12, fontWeight: '500' },

  planRight: { alignItems: 'flex-end', gap: 2 },
  savingsBadge: {
    backgroundColor: colors.goldDim,
    borderRadius: radius.full,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginBottom: 2,
  },
  savingsText: { color: colors.gold, fontSize: 11, fontWeight: '700' },
  planPrice: {
    fontFamily: fonts.display,
    fontSize: 20,
    color: colors.textDim,
  },
  planPriceSelected: { color: colors.text },
  planPeriod: { color: colors.textMuted, fontSize: 12 },

  errorCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.lg,
    alignItems: 'center',
  },
  errorCardText: { color: colors.textDim, fontSize: 14, textAlign: 'center', lineHeight: 20 },
  inlineError: {
    color: '#E07070',
    fontSize: 13,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },

  btn: {
    backgroundColor: colors.gold,
    borderRadius: 999,
    paddingVertical: 18,
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  btnDisabled: { opacity: 0.5 },
  btnText: { color: colors.bg, fontSize: 16, fontWeight: '700', letterSpacing: 0.5 },

  restoreBtn: {
    alignItems: 'center',
    paddingVertical: 14,
    marginBottom: spacing.sm,
  },
  restoreText: {
    color: colors.textMuted,
    fontSize: 13,
    textDecorationLine: 'underline',
  },

  fine: {
    color: colors.textMuted,
    fontSize: 11,
    lineHeight: 17,
    textAlign: 'center',
    paddingHorizontal: spacing.sm,
  },
});
