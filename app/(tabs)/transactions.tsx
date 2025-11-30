import React, { useState, useMemo } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Plus, Search, TrendingUp, TrendingDown, Calendar, Package, AlertTriangle } from 'lucide-react-native';
import { useInventory } from '@/contexts/InventoryContext';
import type { Transaction } from '@/types/inventory';

export default function TransactionsScreen() {
  const insets = useSafeAreaInsets();
  const { transactions, products, addTransaction, isLoading } = useInventory();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'sale' | 'purchase' | 'removal'>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [transactionType, setTransactionType] = useState<'sale' | 'purchase'>('sale');
  const [selectedProductId, setSelectedProductId] = useState('');
  const [quantity, setQuantity] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const filteredTransactions = useMemo(() => {
    return transactions.filter((transaction) => {
      const matchesSearch = transaction.productName
        .toLowerCase()
        .includes(searchQuery.toLowerCase());
      const matchesType = filterType === 'all' || transaction.type === filterType;
      return matchesSearch && matchesType;
    });
  }, [transactions, searchQuery, filterType]);

  const handleAddTransaction = async () => {
    if (!selectedProductId || !quantity) {
      Alert.alert('Error', 'Please select a product and enter quantity');
      return;
    }

    const quantityNum = parseInt(quantity, 10);
    if (isNaN(quantityNum) || quantityNum <= 0) {
      Alert.alert('Error', 'Please enter a valid quantity');
      return;
    }

    setIsSubmitting(true);
    try {
      await addTransaction(transactionType, selectedProductId, quantityNum, notes || undefined);
      setShowAddModal(false);
      setSelectedProductId('');
      setQuantity('');
      setNotes('');
      Alert.alert('Success', `${transactionType === 'sale' ? 'Sale' : 'Purchase'} recorded successfully`);
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to add transaction');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return `Today, ${date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`;
    } else if (date.toDateString() === yesterday.toDateString()) {
      return `Yesterday, ${date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`;
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    }
  };

  const formatCurrency = (amount: number) => {
    return `Rs. ${amount.toLocaleString()}`;
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
        <Text style={styles.title}>Transactions</Text>
        <Text style={styles.subtitle}>{filteredTransactions.length} total</Text>
      </View>

      <View style={styles.searchContainer}>
        <View style={styles.searchBox}>
          <Search size={20} color="#9CA3AF" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search transactions..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#9CA3AF"
          />
        </View>
      </View>

      <View style={styles.filterContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.filterRow}>
            <TouchableOpacity
              style={[styles.filterButton, filterType === 'all' && styles.filterButtonActive]}
              onPress={() => setFilterType('all')}
            >
              <Text style={[styles.filterText, filterType === 'all' && styles.filterTextActive]}>
                All
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.filterButton, filterType === 'sale' && styles.filterButtonActive]}
              onPress={() => setFilterType('sale')}
            >
              <Text style={[styles.filterText, filterType === 'sale' && styles.filterTextActive]}>
                Sales
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.filterButton, filterType === 'purchase' && styles.filterButtonActive]}
              onPress={() => setFilterType('purchase')}
            >
              <Text style={[styles.filterText, filterType === 'purchase' && styles.filterTextActive]}>
                Purchases
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.filterButton, filterType === 'removal' && styles.filterButtonActive]}
              onPress={() => setFilterType('removal')}
            >
              <Text style={[styles.filterText, filterType === 'removal' && styles.filterTextActive]}>
                Removals
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {filteredTransactions.length === 0 ? (
          <View style={styles.emptyState}>
            <Package size={64} color="#D1D5DB" />
            <Text style={styles.emptyTitle}>No transactions yet</Text>
            <Text style={styles.emptySubtitle}>
              {searchQuery ? 'Try a different search' : 'Add your first transaction to get started'}
            </Text>
          </View>
        ) : (
          filteredTransactions.map((transaction) => (
            <View key={transaction.id} style={styles.transactionCard}>
              <View style={styles.transactionHeader}>
                <View style={styles.transactionLeft}>
                  <View
                    style={[
                      styles.transactionIcon,
                      transaction.type === 'sale' ? styles.saleIcon : 
                      transaction.type === 'purchase' ? styles.purchaseIcon : 
                      styles.removalIcon,
                    ]}
                  >
                    {transaction.type === 'sale' ? (
                      <TrendingUp size={20} color="#10B981" />
                    ) : transaction.type === 'purchase' ? (
                      <TrendingDown size={20} color="#F59E0B" />
                    ) : (
                      <AlertTriangle size={20} color="#EF4444" />
                    )}
                  </View>
                  <View style={styles.transactionInfo}>
                    <Text style={styles.productName}>{transaction.productName}</Text>
                    <View style={styles.transactionMeta}>
                      <Calendar size={12} color="#9CA3AF" />
                      <Text style={styles.transactionDate}>{formatDate(transaction.date)}</Text>
                    </View>
                  </View>
                </View>
                <View style={styles.transactionRight}>
                  <Text
                    style={[
                      styles.transactionAmount,
                      transaction.type === 'sale' ? styles.saleAmount : 
                      transaction.type === 'purchase' ? styles.purchaseAmount : 
                      styles.removalAmount,
                    ]}
                  >
                    {transaction.type === 'sale' ? '+' : transaction.type === 'purchase' ? '-' : ''}
                    {transaction.type === 'removal' ? 'Loss: ' : ''}{formatCurrency(transaction.totalAmount)}
                  </Text>
                  <Text style={styles.transactionQuantity}>{transaction.quantity} units</Text>
                </View>
              </View>
              {transaction.profit !== undefined && transaction.profit > 0 && (
                <View style={styles.profitBadge}>
                  <Text style={styles.profitText}>Profit: {formatCurrency(transaction.profit)}</Text>
                </View>
              )}
              {transaction.type === 'removal' && transaction.removalReason && (
                <View style={styles.removalReasonBadge}>
                  <Text style={styles.removalReasonText}>
                    Reason: {transaction.removalReason.charAt(0).toUpperCase() + transaction.removalReason.slice(1)}
                  </Text>
                </View>
              )}
              {transaction.notes && (
                <Text style={styles.transactionNotes}>{transaction.notes}</Text>
              )}
            </View>
          ))
        )}
        <View style={{ height: 100 }} />
      </ScrollView>

      <TouchableOpacity
        style={[styles.fab, { bottom: insets.bottom + 20 }]}
        onPress={() => setShowAddModal(true)}
      >
        <Plus size={28} color="#FFFFFF" />
      </TouchableOpacity>

      <Modal
        visible={showAddModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowAddModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { paddingBottom: insets.bottom + 20 }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Transaction</Text>
              <TouchableOpacity onPress={() => setShowAddModal(false)}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.typeSelector}>
              <TouchableOpacity
                style={[
                  styles.typeButton,
                  transactionType === 'sale' && styles.typeButtonActive,
                ]}
                onPress={() => setTransactionType('sale')}
              >
                <TrendingUp size={20} color={transactionType === 'sale' ? '#10B981' : '#9CA3AF'} />
                <Text
                  style={[
                    styles.typeButtonText,
                    transactionType === 'sale' && styles.typeButtonTextActive,
                  ]}
                >
                  Sale
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.typeButton,
                  transactionType === 'purchase' && styles.typeButtonActive,
                ]}
                onPress={() => setTransactionType('purchase')}
              >
                <TrendingDown size={20} color={transactionType === 'purchase' ? '#F59E0B' : '#9CA3AF'} />
                <Text
                  style={[
                    styles.typeButtonText,
                    transactionType === 'purchase' && styles.typeButtonTextActive,
                  ]}
                >
                  Purchase
                </Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalForm} showsVerticalScrollIndicator={false}>
              <Text style={styles.label}>Product</Text>
              <View style={styles.pickerContainer}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  {products.map((product) => (
                    <TouchableOpacity
                      key={product.id}
                      style={[
                        styles.productChip,
                        selectedProductId === product.id && styles.productChipActive,
                      ]}
                      onPress={() => setSelectedProductId(product.id)}
                    >
                      <Text
                        style={[
                          styles.productChipText,
                          selectedProductId === product.id && styles.productChipTextActive,
                        ]}
                      >
                        {product.name}
                      </Text>
                      <Text style={styles.productChipStock}>Stock: {product.stock}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              <Text style={styles.label}>Quantity</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter quantity"
                value={quantity}
                onChangeText={setQuantity}
                keyboardType="numeric"
                placeholderTextColor="#9CA3AF"
              />

              <Text style={styles.label}>Notes (Optional)</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Add notes..."
                value={notes}
                onChangeText={setNotes}
                multiline
                numberOfLines={3}
                placeholderTextColor="#9CA3AF"
              />

              <TouchableOpacity
                style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
                onPress={handleAddTransaction}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.submitButtonText}>Add Transaction</Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
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
    fontSize: 32,
    fontWeight: '700' as const,
    color: '#111827',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
  },
  searchContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
  },
  searchBox: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 48,
  },
  searchInput: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    color: '#111827',
  },
  filterContainer: {
    paddingHorizontal: 20,
    paddingBottom: 16,
    backgroundColor: '#FFFFFF',
  },
  filterRow: {
    flexDirection: 'row' as const,
    gap: 8,
  },
  filterButton: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
  },
  filterButtonActive: {
    backgroundColor: '#6366F1',
  },
  filterText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#6B7280',
  },
  filterTextActive: {
    color: '#FFFFFF',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  emptyState: {
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600' as const,
    color: '#111827',
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 8,
    textAlign: 'center' as const,
  },
  transactionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  transactionHeader: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'flex-start' as const,
  },
  transactionLeft: {
    flexDirection: 'row' as const,
    flex: 1,
    marginRight: 12,
  },
  transactionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    marginRight: 12,
  },
  saleIcon: {
    backgroundColor: '#D1FAE5',
  },
  purchaseIcon: {
    backgroundColor: '#FEF3C7',
  },
  removalIcon: {
    backgroundColor: '#FEE2E2',
  },
  transactionInfo: {
    flex: 1,
  },
  productName: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#111827',
    marginBottom: 4,
  },
  transactionMeta: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 4,
  },
  transactionDate: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  transactionRight: {
    alignItems: 'flex-end' as const,
  },
  transactionAmount: {
    fontSize: 18,
    fontWeight: '700' as const,
    marginBottom: 4,
  },
  saleAmount: {
    color: '#10B981',
  },
  purchaseAmount: {
    color: '#F59E0B',
  },
  removalAmount: {
    color: '#EF4444',
  },
  transactionQuantity: {
    fontSize: 12,
    color: '#6B7280',
  },
  profitBadge: {
    marginTop: 12,
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: '#D1FAE5',
    borderRadius: 8,
    alignSelf: 'flex-start' as const,
  },
  profitText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: '#059669',
  },
  removalReasonBadge: {
    marginTop: 12,
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: '#FEE2E2',
    borderRadius: 8,
    alignSelf: 'flex-start' as const,
  },
  removalReasonText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: '#DC2626',
  },
  transactionNotes: {
    marginTop: 12,
    fontSize: 14,
    color: '#6B7280',
    fontStyle: 'italic' as const,
  },
  fab: {
    position: 'absolute' as const,
    right: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#6366F1',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end' as const,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: '#111827',
  },
  modalClose: {
    fontSize: 24,
    color: '#9CA3AF',
  },
  typeSelector: {
    flexDirection: 'row' as const,
    padding: 20,
    gap: 12,
  },
  typeButton: {
    flex: 1,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    gap: 8,
  },
  typeButtonActive: {
    backgroundColor: '#EEF2FF',
    borderWidth: 2,
    borderColor: '#6366F1',
  },
  typeButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#6B7280',
  },
  typeButtonTextActive: {
    color: '#6366F1',
  },
  modalForm: {
    paddingHorizontal: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#374151',
    marginBottom: 8,
    marginTop: 16,
  },
  pickerContainer: {
    marginBottom: 8,
  },
  productChip: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    marginRight: 8,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  productChipActive: {
    backgroundColor: '#EEF2FF',
    borderColor: '#6366F1',
  },
  productChipText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#6B7280',
  },
  productChipTextActive: {
    color: '#6366F1',
  },
  productChipStock: {
    fontSize: 11,
    color: '#9CA3AF',
    marginTop: 2,
  },
  input: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#111827',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top' as const,
  },
  submitButton: {
    backgroundColor: '#6366F1',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center' as const,
    marginTop: 24,
    marginBottom: 20,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#FFFFFF',
  },
});
