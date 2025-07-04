// File: src/screens/TradeHistoryScreen.tsx

import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useUser } from '../utils/useUser';
import { fetchTradeHistoryForUser, TradeHistory } from '../services/tradeHistoryService';
import ScreenWrapper from '../components/ScreenWrapper';
import AppText from '../components/AppText';
import { colors, spacing, typography } from '../theme';;

export default function TradeHistoryScreen() {
  const user = useUser();
  const [tradeHistory, setTradeHistory] = useState<TradeHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadTradeHistory = useCallback(async () => {
    if (!user) return;
    try {
      if (!refreshing) setLoading(true);
      const data = await fetchTradeHistoryForUser(user.id);
      setTradeHistory(data);
    } catch (error) {
      console.error('Failed to fetch trade history:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user, refreshing]);

  useEffect(() => {
    loadTradeHistory();
  }, [loadTradeHistory]);

  const onRefresh = () => {
    setRefreshing(true);
    loadTradeHistory();
  };

  const renderItem = ({ item }: { item: TradeHistory }) => {
    const otherParty =
      item.offered_by === user?.id
        ? item.accepted_by_user?.username || 'Anonymous'
        : item.offered_by_user?.username || 'Anonymous';

    const completedDate = item.completed_at
      ? new Date(item.completed_at).toLocaleString(undefined, {
          dateStyle: 'medium',
          timeStyle: 'short',
        })
      : 'Pending';

    return (
      <View style={styles.card}>
        <AppText style={styles.title}>{item.listings?.title || 'Unknown Listing'}</AppText>
        <AppText style={styles.subtext}>
          Traded with: <AppText style={styles.highlight}>{otherParty}</AppText>
        </AppText>
        <AppText style={styles.subtext}>Completed: {completedDate}</AppText>
        {(item.rating !== null && item.rating !== undefined) && (
          <AppText style={styles.subtext}>
            ⭐ {item.rating}/5 — {item.review || 'No comment'}
          </AppText>
        )}
      </View>
    );
  };

  if (loading && !refreshing) {
    return (
      <ScreenWrapper style={styles.center}>
        <ActivityIndicator size="large" color="#2196F3" />
        <AppText style={styles.loadingText}>Loading your trade history...</AppText>
      </ScreenWrapper>
    );
  }

  if (!user) {
    return (
      <ScreenWrapper style={styles.center}>
        <AppText style={styles.infoText}>Please log in to view your trade history.</AppText>
      </ScreenWrapper>
    );
  }

  return (
    <ScreenWrapper style={styles.container}>
      <AppText style={styles.heading}>Your Trade History</AppText>
      <FlatList
        data={tradeHistory}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={
          <View style={styles.centerEmpty}>
            <AppText style={styles.emptyText}>You haven't completed any trades yet.</AppText>
          </View>
        }
        contentContainerStyle={tradeHistory.length === 0 ? styles.flatListEmpty : undefined}
      />
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#fefefe' },
  heading: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 18,
    color: '#222',
  },
  card: {
    backgroundColor: colors.background,
    padding: 18,
    borderRadius: 14,
    marginBottom: 12,
    // iOS shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    // Android shadow
    elevation: 3,
  },
  title: { fontSize: 18, fontWeight: '700', marginBottom: 6, color: '#111' },
  subtext: { fontSize: 15, marginBottom: 4, color: '#444' },
  highlight: { fontWeight: '600', color: '#2196F3' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  loadingText: { marginTop: 10, fontSize: 16, color: '#555' },
  infoText: { fontSize: 16, color: '#666' },
  centerEmpty: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 50 },
  emptyText: { fontSize: 17, color: '#999', fontStyle: 'italic' },
  flatListEmpty: { flexGrow: 1, justifyContent: 'center' },
});
