import React, { useState, useMemo } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  ShoppingCart,
  Download,
  Calendar,
} from 'lucide-react-native';
import { useInventory } from '@/contexts/InventoryContext';
import type { DateRange } from '@/types/inventory';
import { rf } from '@/constants/responsiveFonts';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';

export default function ReportsScreen() {
  const insets = useSafeAreaInsets();
  const { getReportData, isLoading, currencySymbol } = useInventory();
  const [selectedRange, setSelectedRange] = useState<DateRange>('month');

  const reportData = useMemo(() => {
    return getReportData(selectedRange);
  }, [getReportData, selectedRange]);

  const formatCurrency = (amount: number) => {
    return `${currencySymbol} ${amount.toLocaleString()}`;
  };

  const getRangeName = (range: DateRange) => {
    switch (range) {
      case 'week':
        return 'This Week';
      case 'month':
        return 'This Month';
      case 'all':
        return 'All Time';
    }
  };

  const handleExportExcel = async () => {
    try {
      let csvContent = `Inventory Report - ${getRangeName(selectedRange)}\n`;
      csvContent += `Generated On: ${new Date().toLocaleDateString()}\n\n`;
      csvContent += `Summary\n`;
      csvContent += `Total Sales,${formatCurrency(reportData.totalSales)}\n`;
      csvContent += `Total Purchases,${formatCurrency(reportData.totalPurchases)}\n`;
      csvContent += `Net Profit,${formatCurrency(reportData.totalProfit)}\n`;
      csvContent += `Total Transactions,${reportData.transactionCount}\n\n`;
      
      if (reportData.topProducts.length > 0) {
        csvContent += `Top Selling Products\n`;
        csvContent += `Rank,Product Name,Units Sold,Revenue\n`;
        reportData.topProducts.forEach((p, i) => {
          csvContent += `#${i + 1},${p.productName},${p.totalQuantity},${formatCurrency(p.totalRevenue)}\n`;
        });
      }

      const fileName = `inventory_report_${selectedRange}_${Date.now()}.csv`;

      if (Platform.OS === 'web') {
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        a.click();
        URL.revokeObjectURL(url);
        Alert.alert('Success', 'Report exported successfully!');
      } else {
        const file = new File(Paths.cache, fileName);
        file.write(csvContent);

        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(file.uri);
        } else {
          Alert.alert('Success', `Report saved to ${file.uri}`);
        }
      }
    } catch (error) {
      console.error('Error exporting CSV:', error);
      Alert.alert('Error', 'Failed to export report. Please try again.');
    }
  };

  const handleExportPDF = async () => {
    try {
      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Inventory Report</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 40px; }
            h1 { color: #111827; margin-bottom: 10px; }
            .subtitle { color: #6B7280; margin-bottom: 30px; }
            .summary { background: #F3F4F6; padding: 20px; border-radius: 8px; margin-bottom: 30px; }
            .summary-item { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #E5E7EB; }
            .summary-item:last-child { border-bottom: none; }
            .label { font-weight: 600; color: #374151; }
            .value { color: #111827; }
            .profit { color: #10B981; font-weight: 700; font-size: 18px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th { background: #6366F1; color: white; padding: 12px; text-align: left; }
            td { padding: 12px; border-bottom: 1px solid #E5E7EB; }
            tr:hover { background: #F9FAFB; }
            .footer { margin-top: 40px; text-align: center; color: #6B7280; font-size: 12px; }
          </style>
        </head>
        <body>
          <h1>Inventory Report</h1>
          <div class="subtitle">${getRangeName(selectedRange)} - Generated on ${new Date().toLocaleDateString()}</div>
          
          <div class="summary">
            <h2>Financial Summary</h2>
            <div class="summary-item">
              <span class="label">Total Sales</span>
              <span class="value">${formatCurrency(reportData.totalSales)}</span>
            </div>
            <div class="summary-item">
              <span class="label">Total Purchases</span>
              <span class="value">${formatCurrency(reportData.totalPurchases)}</span>
            </div>
            <div class="summary-item">
              <span class="label">Net Profit</span>
              <span class="profit">${formatCurrency(reportData.totalProfit)}</span>
            </div>
            <div class="summary-item">
              <span class="label">Total Transactions</span>
              <span class="value">${reportData.transactionCount}</span>
            </div>
          </div>

          ${reportData.topProducts.length > 0 ? `
            <h2>Top Selling Products</h2>
            <table>
              <thead>
                <tr>
                  <th>Rank</th>
                  <th>Product Name</th>
                  <th>Units Sold</th>
                  <th>Revenue</th>
                </tr>
              </thead>
              <tbody>
                ${reportData.topProducts.map((p, i) => `
                  <tr>
                    <td>#${i + 1}</td>
                    <td>${p.productName}</td>
                    <td>${p.totalQuantity}</td>
                    <td>${formatCurrency(p.totalRevenue)}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          ` : ''}

          <div class="footer">
            Generated by Inventory Management System
          </div>
        </body>
        </html>
      `;

      const fileName = `inventory_report_${selectedRange}_${Date.now()}.html`;

      if (Platform.OS === 'web') {
        const printWindow = window.open('', '_blank');
        if (printWindow) {
          printWindow.document.write(htmlContent);
          printWindow.document.close();
          setTimeout(() => {
            printWindow.print();
          }, 250);
        }
      } else {
        const file = new File(Paths.cache, fileName);
        file.write(htmlContent);

        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(file.uri, {
            mimeType: 'text/html',
            dialogTitle: 'Export Report as PDF',
          });
        } else {
          Alert.alert('Success', `Report saved to ${file.uri}`);
        }
      }
    } catch (error) {
      console.error('Error exporting PDF:', error);
      Alert.alert('Error', 'Failed to export report. Please try again.');
    }
  };

  if (isLoading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color="#6366F1" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 20 }]}>
        <Text style={styles.title}>Reports</Text>
        <Text style={styles.subtitle}>Financial overview and insights</Text>
      </View>

      <View style={styles.rangeSelector}>
        <TouchableOpacity
          style={[styles.rangeButton, selectedRange === 'week' && styles.rangeButtonActive]}
          onPress={() => setSelectedRange('week')}
        >
          <Text style={[styles.rangeText, selectedRange === 'week' && styles.rangeTextActive]}>
            Week
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.rangeButton, selectedRange === 'month' && styles.rangeButtonActive]}
          onPress={() => setSelectedRange('month')}
        >
          <Text style={[styles.rangeText, selectedRange === 'month' && styles.rangeTextActive]}>
            Month
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.rangeButton, selectedRange === 'all' && styles.rangeButtonActive]}
          onPress={() => setSelectedRange('all')}
        >
          <Text style={[styles.rangeText, selectedRange === 'all' && styles.rangeTextActive]}>
            All Time
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.summarySection}>
          <Text style={styles.sectionTitle}>{getRangeName(selectedRange)} Summary</Text>

          <View style={styles.statsGrid}>
            <View style={[styles.statCard, styles.profitCard]}>
              <View style={styles.statIconContainer}>
                <View style={[styles.statIcon, { backgroundColor: '#D1FAE5' }]}>
                  <TrendingUp size={24} color="#10B981" />
                </View>
              </View>
              <Text style={styles.statLabel}>Total Profit</Text>
              <Text style={[styles.statValue, { color: '#10B981' }]}>
                {formatCurrency(reportData.totalProfit)}
              </Text>
            </View>

            <View style={[styles.statCard, styles.salesCard]}>
              <View style={styles.statIconContainer}>
                <View style={[styles.statIcon, { backgroundColor: '#DBEAFE' }]}>
                  <DollarSign size={24} color="#3B82F6" />
                </View>
              </View>
              <Text style={styles.statLabel}>Total Sales</Text>
              <Text style={[styles.statValue, { color: '#3B82F6' }]}>
                {formatCurrency(reportData.totalSales)}
              </Text>
            </View>

            <View style={[styles.statCard, styles.purchaseCard]}>
              <View style={styles.statIconContainer}>
                <View style={[styles.statIcon, { backgroundColor: '#FEF3C7' }]}>
                  <ShoppingCart size={24} color="#F59E0B" />
                </View>
              </View>
              <Text style={styles.statLabel}>Total Purchases</Text>
              <Text style={[styles.statValue, { color: '#F59E0B' }]}>
                {formatCurrency(reportData.totalPurchases)}
              </Text>
            </View>

            <View style={[styles.statCard, styles.transactionCard]}>
              <View style={styles.statIconContainer}>
                <View style={[styles.statIcon, { backgroundColor: '#E0E7FF' }]}>
                  <Calendar size={24} color="#6366F1" />
                </View>
              </View>
              <Text style={styles.statLabel}>Transactions</Text>
              <Text style={[styles.statValue, { color: '#6366F1' }]}>
                {reportData.transactionCount}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.profitLossSection}>
          <Text style={styles.sectionTitle}>Profit & Loss</Text>
          <View style={styles.profitLossCard}>
            <View style={styles.profitLossRow}>
              <View style={styles.profitLossLeft}>
                <View style={[styles.profitLossIcon, { backgroundColor: '#D1FAE5' }]}>
                  <TrendingUp size={20} color="#10B981" />
                </View>
                <Text style={styles.profitLossLabel}>Revenue (Sales)</Text>
              </View>
              <Text style={[styles.profitLossValue, { color: '#10B981' }]}>
                {formatCurrency(reportData.totalSales)}
              </Text>
            </View>

            <View style={styles.divider} />

            <View style={styles.profitLossRow}>
              <View style={styles.profitLossLeft}>
                <View style={[styles.profitLossIcon, { backgroundColor: '#FEE2E2' }]}>
                  <TrendingDown size={20} color="#EF4444" />
                </View>
                <Text style={styles.profitLossLabel}>Expenses (Purchases)</Text>
              </View>
              <Text style={[styles.profitLossValue, { color: '#EF4444' }]}>
                {formatCurrency(reportData.totalPurchases)}
              </Text>
            </View>

            <View style={styles.divider} />

            <View style={styles.profitLossRow}>
              <View style={styles.profitLossLeft}>
                <View style={[styles.profitLossIcon, { backgroundColor: '#DBEAFE' }]}>
                  <DollarSign size={20} color="#3B82F6" />
                </View>
                <Text style={[styles.profitLossLabel, { fontWeight: '700' as const }]}>Net Profit</Text>
              </View>
              <Text style={[styles.profitLossValue, styles.netProfit]}>
                {formatCurrency(reportData.totalProfit)}
              </Text>
            </View>
          </View>
        </View>

        {reportData.topProducts.length > 0 && (
          <View style={styles.topProductsSection}>
            <Text style={styles.sectionTitle}>Top Selling Products</Text>
            {reportData.topProducts.map((product, index) => (
              <View key={product.productId} style={styles.topProductCard}>
                <View style={styles.topProductLeft}>
                  <View style={styles.rankBadge}>
                    <Text style={styles.rankText}>#{index + 1}</Text>
                  </View>
                  <View style={styles.topProductInfo}>
                    <Text style={styles.topProductName}>{product.productName}</Text>
                    <Text style={styles.topProductQuantity}>{product.totalQuantity} units sold</Text>
                  </View>
                </View>
                <Text style={styles.topProductRevenue}>{formatCurrency(product.totalRevenue)}</Text>
              </View>
            ))}
          </View>
        )}

        <View style={styles.exportSection}>
          <Text style={styles.sectionTitle}>Export Report</Text>
          <View style={styles.exportButtons}>
            <TouchableOpacity
              style={styles.exportButton}
              onPress={handleExportExcel}
            >
              <Download size={20} color="#10B981" />
              <Text style={styles.exportButtonText}>Export as CSV</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.exportButton}
              onPress={handleExportPDF}
            >
              <Download size={20} color="#EF4444" />
              <Text style={styles.exportButtonText}>Export as PDF</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  centerContent: {
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  title: {
    fontSize: rf(32),
    fontWeight: '700' as const,
    color: '#111827',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: rf(14),
    color: '#6B7280',
  },
  rangeSelector: {
    flexDirection: 'row' as const,
    padding: 20,
    gap: 8,
    backgroundColor: '#FFFFFF',
  },
  rangeButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    alignItems: 'center' as const,
  },
  rangeButtonActive: {
    backgroundColor: '#6366F1',
  },
  rangeText: {
    fontSize: rf(14),
    fontWeight: '600' as const,
    color: '#6B7280',
  },
  rangeTextActive: {
    color: '#FFFFFF',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  summarySection: {
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: rf(18),
    fontWeight: '700' as const,
    color: '#111827',
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row' as const,
    flexWrap: 'wrap' as const,
    gap: 12,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  profitCard: {},
  salesCard: {},
  purchaseCard: {},
  transactionCard: {},
  statIconContainer: {
    marginBottom: 12,
  },
  statIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  statLabel: {
    fontSize: rf(12),
    color: '#6B7280',
    marginBottom: 4,
  },
  statValue: {
    fontSize: rf(20),
    fontWeight: '700' as const,
  },
  profitLossSection: {
    marginTop: 24,
  },
  profitLossCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  profitLossRow: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    paddingVertical: 12,
  },
  profitLossLeft: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 12,
  },
  profitLossIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  profitLossLabel: {
    fontSize: rf(14),
    color: '#374151',
  },
  profitLossValue: {
    fontSize: rf(16),
    fontWeight: '600' as const,
  },
  netProfit: {
    fontSize: rf(18),
    fontWeight: '700' as const,
    color: '#3B82F6',
  },
  divider: {
    height: 1,
    backgroundColor: '#E5E7EB',
  },
  topProductsSection: {
    marginTop: 24,
  },
  topProductCard: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  topProductLeft: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    flex: 1,
    marginRight: 12,
  },
  rankBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#EEF2FF',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    marginRight: 12,
  },
  rankText: {
    fontSize: rf(14),
    fontWeight: '700' as const,
    color: '#6366F1',
  },
  topProductInfo: {
    flex: 1,
  },
  topProductName: {
    fontSize: rf(14),
    fontWeight: '600' as const,
    color: '#111827',
    marginBottom: 2,
  },
  topProductQuantity: {
    fontSize: rf(12),
    color: '#6B7280',
  },
  topProductRevenue: {
    fontSize: rf(16),
    fontWeight: '700' as const,
    color: '#10B981',
  },
  exportSection: {
    marginTop: 24,
  },
  exportButtons: {
    gap: 12,
  },
  exportButton: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  exportButtonText: {
    fontSize: rf(16),
    fontWeight: '600' as const,
    color: '#374151',
  },
});
