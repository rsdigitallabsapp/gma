import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, fonts, spacing, radius } from '../theme';
import { Storage } from '../storage';

function formatDate(dateStr) {
  const [year, month, day] = dateStr.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

function groupByMonth(history) {
  const groups = [];
  const seen = {};
  history.forEach(entry => {
    const [year, month] = entry.date.split('-');
    const key = `${year}-${month}`;
    if (!seen[key]) {
      seen[key] = true;
      const label = new Date(Number(year), Number(month) - 1, 1)
        .toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
      groups.push({ type: 'header', key, label });
    }
    groups.push({ type: 'item', ...entry });
  });
  return groups;
}

export function HistoryScreen({ navigation }) {
  const history = Storage.getHistory();
  const items = groupByMonth(history);

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.navRow}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} activeOpacity={0.7}>
          <Text style={styles.backArrow}>←</Text>
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.titleRow}>
        <Text style={styles.eyebrow}>Premium</Text>
        <Text style={styles.headline}>Affirmation{'\n'}History</Text>
        <Text style={styles.sub}>{history.length} affirmation{history.length !== 1 ? 's' : ''} spoken</Text>
      </View>

      {history.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyTitle}>Nothing here yet.</Text>
          <Text style={styles.emptySub}>Complete your first morning affirmation and it will appear here.</Text>
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item, i) => item.key ?? `${item.date}-${i}`}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => {
            if (item.type === 'header') {
              return <Text style={styles.monthHeader}>{item.label}</Text>;
            }
            return (
              <View style={styles.card}>
                <Text style={styles.cardDate}>{formatDate(item.date)}</Text>
                <Text style={styles.cardText}>{item.text}</Text>
              </View>
            );
          }}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },

  navRow: { paddingHorizontal: spacing.md, paddingTop: spacing.sm },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  backArrow: { color: colors.textDim, fontSize: 18 },
  backText: { color: colors.textDim, fontSize: 15 },

  titleRow: { paddingHorizontal: spacing.md, paddingTop: spacing.md, paddingBottom: spacing.sm },
  eyebrow: {
    color: colors.gold,
    fontSize: 11,
    letterSpacing: 3,
    textTransform: 'uppercase',
    marginBottom: spacing.sm,
  },
  headline: {
    fontFamily: fonts.display,
    fontSize: 34,
    color: colors.text,
    lineHeight: 42,
    marginBottom: 6,
  },
  sub: { color: colors.textDim, fontSize: 14 },

  list: { paddingHorizontal: spacing.md, paddingBottom: spacing.xl },

  monthHeader: {
    color: colors.textMuted,
    fontSize: 11,
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginTop: spacing.lg,
    marginBottom: spacing.xs,
  },

  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 8,
  },
  cardDate: {
    color: colors.gold,
    fontSize: 11,
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  cardText: {
    fontFamily: fonts.display,
    fontSize: 18,
    color: colors.text,
    lineHeight: 26,
  },

  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  emptyTitle: {
    fontFamily: fonts.display,
    fontSize: 22,
    color: colors.text,
    marginBottom: 10,
  },
  emptySub: {
    color: colors.textDim,
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
  },
});
