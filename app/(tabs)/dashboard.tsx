import { useRouter } from 'expo-router';
import { Package, Plus, TrendingUp } from 'lucide-react-native';
import React, { useMemo } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useInventory } from '@/contexts/InventoryContext';
import { rf } from '@/constants/responsiveFonts';

export default function DashboardScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { getDashboardSummary, transactions, isLoading, currencySymbol } = useInventory();
  const summary = useMemo(() => getDashboardSummary(), [getDashboardSummary]);

  const recentTransactions = useMemo(
    () => transactions.slice(0, 5),
    [transactions]
  );

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1E40AF" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + 20 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Dashboard</Text>
          <Text style={styles.headerSubtitle}>
            {new Date().toLocaleDateString('en-US', {
              weekday: 'long',
              month: 'long',
              day: 'numeric',
            })}
          </Text>
        </View>

        <View style={styles.metricsGrid}>
          <View style={[styles.metricCard, styles.primaryCard]}>
            <View style={styles.metricIconContainer}>
              <Package size={24} color="#fff" />
            </View>
            <Text style={styles.metricValue}>{summary.totalProducts}</Text>
            <Text style={styles.metricLabel}>Total Products</Text>
          </View>

          <View style={[styles.metricCard, styles.successCard]}>
            <View style={styles.metricIconContainer}>
              <TrendingUp size={24} color="#fff" />
            </View>
            <Text style={styles.metricValue}>
              {currencySymbol} {summary.stockValue.toLocaleString()}
            </Text>
            <Text style={styles.metricLabel}>Stock Value</Text>
          </View>
        </View>

        <View style={styles.profitCard}>
          <Text style={styles.profitTitle}>This Month</Text>
          <Text style={styles.profitAmount}>
            {currencySymbol} {summary.monthlyProfit.toLocaleString()}
          </Text>
          <Text style={styles.profitLabel}>Net Profit</Text>
          <View style={styles.profitDetails}>
            <View style={styles.profitDetailItem}>
              <Text style={styles.profitDetailLabel}>Sales</Text>
              <Text style={styles.profitDetailValue}>
                {currencySymbol} {summary.monthlySales.toLocaleString()}
              </Text>
            </View>
            <View style={styles.profitDetailDivider} />
            <View style={styles.profitDetailItem}>
              <Text style={styles.profitDetailLabel}>Purchases</Text>
              <Text style={styles.profitDetailValue}>
                {currencySymbol} {summary.monthlyPurchases.toLocaleString()}
              </Text>
            </View>
          </View>
        </View>

        {summary.lowStockProducts.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Low Stock Alert</Text>
            {summary.lowStockProducts.map((product) => (
              <View key={product.id} style={styles.lowStockItem}>
                <View style={styles.lowStockInfo}>
                  <Text style={styles.lowStockName}>{product.name}</Text>
                  <Text style={styles.lowStockCategory}>{product.category}</Text>
                </View>
                <View style={styles.lowStockBadge}>
                  <Text style={styles.lowStockBadgeText}>
                    {product.stock} left
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {recentTransactions.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Recent Activity</Text>
              <TouchableOpacity onPress={() => router.push('/(tabs)/transactions')}>
                <Text style={styles.seeAllText}>See All</Text>
              </TouchableOpacity>
            </View>
            {recentTransactions.map((transaction) => (
              <View key={transaction.id} style={styles.transactionItem}>
                <View style={styles.transactionInfo}>
                  <Text style={styles.transactionName}>
                    {transaction.productName}
                  </Text>
                  <Text style={styles.transactionDetails}>
                    {transaction.type === 'sale' ? 'Sale' : 'Purchase'} •{' '}
                    {transaction.quantity} units
                  </Text>
                </View>
                <Text
                  style={[
                    styles.transactionAmount,
                    transaction.type === 'sale'
                      ? styles.transactionAmountPositive
                      : styles.transactionAmountNegative,
                  ]}
                >
                  {transaction.type === 'sale' ? '+' : '-'}{currencySymbol}{' '}
                  {transaction.totalAmount.toLocaleString()}
                </Text>
              </View>
            ))}
          </View>
        )}

        <View style={styles.quickActions}>
          <TouchableOpacity
            style={styles.quickActionButton}
            onPress={() => router.push('/(tabs)/products')}
          >
            <Plus size={20} color="#fff" />
            <Text style={styles.quickActionText}>Add Product</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.quickActionButton, styles.quickActionButtonSecondary]}
            onPress={() => router.push('/(tabs)/transactions')}
          >
            <Plus size={20} color="#1E40AF" />
            <Text style={styles.quickActionTextSecondary}>Record Sale</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 24,
  },
  headerTitle: {
    fontSize: rf(32),
    fontWeight: '700' as const,
    color: '#111827',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: rf(14),
    color: '#6B7280',
  },
  metricsGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  metricCard: {
    flex: 1,
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  primaryCard: {
    backgroundColor: '#1E40AF',
  },
  successCard: {
    backgroundColor: '#10B981',
  },
  metricIconContainer: {
    marginBottom: 12,
  },
  metricValue: {
    fontSize: rf(24),
    fontWeight: '700' as const,
    color: '#fff',
    marginBottom: 4,
  },
  metricLabel: {
    fontSize: rf(12),
    color: 'rgba(255, 255, 255, 0.8)',
  },
  profitCard: {
    backgroundColor: '#fff',
    padding: 24,
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  profitTitle: {
    fontSize: rf(14),
    color: '#6B7280',
    marginBottom: 8,
  },
  profitAmount: {
    fontSize: rf(36),
    fontWeight: '700' as const,
    color: '#10B981',
    marginBottom: 4,
  },
  profitLabel: {
    fontSize: rf(16),
    color: '#111827',
    marginBottom: 20,
  },
  profitDetails: {
    flexDirection: 'row',
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  profitDetailItem: {
    flex: 1,
  },
  profitDetailDivider: {
    width: 1,
    backgroundColor: '#F3F4F6',
    marginHorizontal: 16,
  },
  profitDetailLabel: {
    fontSize: rf(12),
    color: '#6B7280',
    marginBottom: 4,
  },
  profitDetailValue: {
    fontSize: rf(16),
    fontWeight: '600' as const,
    color: '#111827',
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: rf(18),
    fontWeight: '600' as const,
    color: '#111827',
    marginBottom: 12,
  },
  seeAllText: {
    fontSize: rf(14),
    color: '#1E40AF',
    fontWeight: '600' as const,
  },
  lowStockItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  lowStockInfo: {
    flex: 1,
  },
  lowStockName: {
    fontSize: rf(16),
    fontWeight: '600' as const,
    color: '#111827',
    marginBottom: 2,
  },
  lowStockCategory: {
    fontSize: rf(14),
    color: '#6B7280',
  },
  lowStockBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  lowStockBadgeText: {
    fontSize: rf(12),
    fontWeight: '600' as const,
    color: '#D97706',
  },
  transactionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  transactionInfo: {
    flex: 1,
  },
  transactionName: {
    fontSize: rf(16),
    fontWeight: '600' as const,
    color: '#111827',
    marginBottom: 2,
  },
  transactionDetails: {
    fontSize: rf(14),
    color: '#6B7280',
  },
  transactionAmount: {
    fontSize: rf(16),
    fontWeight: '600' as const,
  },
  transactionAmountPositive: {
    color: '#10B981',
  },
  transactionAmountNegative: {
    color: '#EF4444',
  },
  quickActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  quickActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1E40AF',
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  quickActionButtonSecondary: {
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#1E40AF',
  },
  quickActionText: {
    fontSize: rf(16),
    fontWeight: '600' as const,
    color: '#fff',
  },
  quickActionTextSecondary: {
    fontSize: rf(16),
    fontWeight: '600' as const,
    color: '#1E40AF',
  },
});
