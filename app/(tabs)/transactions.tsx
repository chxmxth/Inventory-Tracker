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
  Platform,
} from 'react-native';

import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Plus, Search, TrendingUp, TrendingDown, Calendar, Package, AlertTriangle, FileText } from 'lucide-react-native';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { useInventory } from '@/contexts/InventoryContext';
import type { Transaction } from '@/types/inventory';

import { rf } from '@/constants/responsiveFonts';

export default function TransactionsScreen() {
  const insets = useSafeAreaInsets();
  const { transactions, products, addTransaction, isLoading, currencySymbol, companyName } = useInventory();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'sale' | 'purchase' | 'removal'>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [transactionType, setTransactionType] = useState<'sale' | 'purchase'>('sale');
  const [selectedProductId, setSelectedProductId] = useState('');
  const [quantity, setQuantity] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);



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
    return `${currencySymbol} ${amount.toLocaleString()}`;
  };

  const generateInvoiceHTML = (transaction: Transaction) => {
    const date = new Date(transaction.date);
    const formattedDate = date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0, user-scalable=no" />
          <style>
            body {
              font-family: 'Helvetica Neue', 'Helvetica', Arial, sans-serif;
              padding: 40px;
              background: white;
              margin: 0;
            }
            .header {
              text-align: center;
              margin-bottom: 40px;
              border-bottom: 3px solid #6366F1;
              padding-bottom: 20px;
            }
            .company-name {
              font-size: 32px;
              font-weight: bold;
              color: #111827;
              margin: 0;
            }
            .app-name {
              font-size: 14px;
              color: #6B7280;
              margin: 5px 0 0 0;
            }
            .invoice-title {
              font-size: 24px;
              font-weight: bold;
              color: #374151;
              margin: 30px 0 10px 0;
            }
            .invoice-details {
              margin: 20px 0;
              padding: 20px;
              background: #F9FAFB;
              border-radius: 8px;
            }
            .detail-row {
              display: flex;
              justify-content: space-between;
              padding: 8px 0;
              border-bottom: 1px solid #E5E7EB;
            }
            .detail-row:last-child {
              border-bottom: none;
            }
            .detail-label {
              font-weight: 600;
              color: #6B7280;
            }
            .detail-value {
              color: #111827;
              font-weight: 500;
            }
            .transaction-type {
              display: inline-block;
              padding: 6px 16px;
              border-radius: 20px;
              font-size: 14px;
              font-weight: 600;
              text-transform: uppercase;
            }
            .type-sale {
              background: #D1FAE5;
              color: #059669;
            }
            .type-purchase {
              background: #FEF3C7;
              color: #D97706;
            }
            .type-removal {
              background: #FEE2E2;
              color: #DC2626;
            }
            .items-table {
              width: 100%;
              margin: 30px 0;
              border-collapse: collapse;
            }
            .items-table th {
              background: #F3F4F6;
              padding: 12px;
              text-align: left;
              font-weight: 600;
              color: #374151;
              border-bottom: 2px solid #E5E7EB;
            }
            .items-table td {
              padding: 12px;
              border-bottom: 1px solid #E5E7EB;
              color: #111827;
            }
            .total-section {
              margin-top: 30px;
              padding-top: 20px;
              border-top: 3px solid #6366F1;
            }
            .total-row {
              display: flex;
              justify-content: space-between;
              padding: 10px 0;
              font-size: 18px;
            }
            .total-label {
              font-weight: 600;
              color: #374151;
            }
            .total-amount {
              font-weight: bold;
              color: #111827;
              font-size: 24px;
            }
            .profit-row {
              background: #D1FAE5;
              padding: 12px;
              border-radius: 8px;
              margin-top: 10px;
            }
            .notes-section {
              margin-top: 30px;
              padding: 15px;
              background: #FFFBEB;
              border-left: 4px solid #F59E0B;
              border-radius: 4px;
            }
            .notes-label {
              font-weight: 600;
              color: #92400E;
              margin-bottom: 5px;
            }
            .notes-text {
              color: #78350F;
              font-style: italic;
            }
            .footer {
              margin-top: 50px;
              text-align: center;
              color: #9CA3AF;
              font-size: 12px;
              padding-top: 20px;
              border-top: 1px solid #E5E7EB;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1 class="company-name">${companyName || 'Inventory Manager'}</h1>
          </div>

          <h2 class="invoice-title">
            ${transaction.type === 'sale' ? 'Sales Invoice' : 
              transaction.type === 'purchase' ? 'Purchase Invoice' : 'Removal Record'}
          </h2>

          <div class="invoice-details">
            <div class="detail-row">
              <span class="detail-label">Invoice ID:</span>
              <span class="detail-value">#${transaction.id}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Date:</span>
              <span class="detail-value">${formattedDate}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Type:</span>
              <span class="transaction-type type-${transaction.type}">${transaction.type}</span>
            </div>
          </div>

          <table class="items-table">
            <thead>
              <tr>
                <th>Product</th>
                <th style="text-align: right;">Quantity</th>
                <th style="text-align: right;">Price per Unit</th>
                <th style="text-align: right;">Total</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>${transaction.productName}</strong></td>
                <td style="text-align: right;">${transaction.quantity} units</td>
                <td style="text-align: right;">${formatCurrency(transaction.pricePerUnit)}</td>
                <td style="text-align: right;"><strong>${formatCurrency(transaction.totalAmount)}</strong></td>
              </tr>
            </tbody>
          </table>

          <div class="total-section">
            <div class="total-row">
              <span class="total-label">Total Amount:</span>
              <span class="total-amount">${formatCurrency(transaction.totalAmount)}</span>
            </div>

            ${transaction.type === 'removal' && transaction.removalReason ? `
              <div style="background: #FEE2E2; padding: 12px; border-radius: 8px; margin-top: 10px;">
                <div class="total-row" style="margin: 0;">
                  <span class="total-label" style="color: #DC2626;">Removal Reason:</span>
                  <span style="color: #DC2626; font-weight: 600;">${transaction.removalReason.charAt(0).toUpperCase() + transaction.removalReason.slice(1)}</span>
                </div>
              </div>
            ` : ''}
          </div>

          ${transaction.notes ? `
            <div class="notes-section">
              <div class="notes-label">Notes:</div>
              <div class="notes-text">${transaction.notes}</div>
            </div>
          ` : ''}

          <div class="footer">
            <p>This is a computer-generated document</p>
          </div>
        </body>
      </html>
    `;
  };

  const handlePrintInvoice = async (transaction: Transaction) => {
    try {
      const html = generateInvoiceHTML(transaction);
      
      if (Platform.OS === 'web') {
        const printWindow = window.open('', '_blank');
        if (printWindow) {
          printWindow.document.write(html);
          printWindow.document.close();
          printWindow.focus();
          setTimeout(() => {
            printWindow.print();
          }, 250);
        }
      } else {
        const { uri } = await Print.printToFileAsync({ html });
        const isAvailable = await Sharing.isAvailableAsync();
        
        if (isAvailable) {
          await Sharing.shareAsync(uri, {
            mimeType: 'application/pdf',
            dialogTitle: `Invoice #${transaction.id}`,
            UTI: 'com.adobe.pdf',
          });
        } else {
          Alert.alert('Success', 'Invoice generated successfully');
        }
      }
    } catch (error) {
      console.error('Error generating invoice:', error);
      Alert.alert('Error', 'Failed to generate invoice');
    }
  };

  const handleViewInvoice = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setShowInvoiceModal(true);
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
              {transaction.type !== 'removal' && (
                <TouchableOpacity
                  style={styles.invoiceButton}
                  onPress={() => handleViewInvoice(transaction)}
                >
                  <FileText size={16} color="#6366F1" />
                  <Text style={styles.invoiceButtonText}>View Invoice</Text>
                </TouchableOpacity>
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

      <Modal
        visible={showInvoiceModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowInvoiceModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.invoiceModalContent, { paddingBottom: insets.bottom + 20 }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Invoice Preview</Text>
              <TouchableOpacity onPress={() => setShowInvoiceModal(false)}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>

            {selectedTransaction && (
              <ScrollView style={styles.invoicePreview} showsVerticalScrollIndicator={false}>
                <View style={styles.invoiceHeader}>
                  <Text style={styles.invoiceCompany}>{companyName || 'Inventory Manager'}</Text>
                </View>

                <Text style={styles.invoiceTitle}>
                  {selectedTransaction.type === 'sale' ? 'Sales Invoice' : 'Purchase Invoice'}
                </Text>

                <View style={styles.invoiceDetailsCard}>
                  <View style={styles.invoiceDetailRow}>
                    <Text style={styles.invoiceDetailLabel}>Invoice ID:</Text>
                    <Text style={styles.invoiceDetailValue}>#{selectedTransaction.id}</Text>
                  </View>
                  <View style={styles.invoiceDetailRow}>
                    <Text style={styles.invoiceDetailLabel}>Date:</Text>
                    <Text style={styles.invoiceDetailValue}>
                      {new Date(selectedTransaction.date).toLocaleString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </Text>
                  </View>
                  <View style={styles.invoiceDetailRow}>
                    <Text style={styles.invoiceDetailLabel}>Type:</Text>
                    <View
                      style={[
                        styles.invoiceTypeBadge,
                        selectedTransaction.type === 'sale'
                          ? styles.invoiceTypeSale
                          : styles.invoiceTypePurchase,
                      ]}
                    >
                      <Text
                        style={[
                          styles.invoiceTypeBadgeText,
                          selectedTransaction.type === 'sale'
                            ? styles.invoiceTypeSaleText
                            : styles.invoiceTypePurchaseText,
                        ]}
                      >
                        {selectedTransaction.type.toUpperCase()}
                      </Text>
                    </View>
                  </View>
                </View>

                <View style={styles.invoiceItemsCard}>
                  <View style={styles.invoiceItemsHeader}>
                    <Text style={styles.invoiceItemsHeaderText}>Product</Text>
                    <Text style={styles.invoiceItemsHeaderText}>Details</Text>
                  </View>
                  <View style={styles.invoiceItemRow}>
                    <Text style={styles.invoiceProductName}>{selectedTransaction.productName}</Text>
                  </View>
                  <View style={styles.invoiceItemRow}>
                    <Text style={styles.invoiceItemLabel}>Quantity:</Text>
                    <Text style={styles.invoiceItemValue}>{selectedTransaction.quantity} units</Text>
                  </View>
                  <View style={styles.invoiceItemRow}>
                    <Text style={styles.invoiceItemLabel}>Price per Unit:</Text>
                    <Text style={styles.invoiceItemValue}>
                      {formatCurrency(selectedTransaction.pricePerUnit)}
                    </Text>
                  </View>
                  <View style={[styles.invoiceItemRow, styles.invoiceTotalRow]}>
                    <Text style={styles.invoiceTotalLabel}>Total:</Text>
                    <Text style={styles.invoiceTotalValue}>
                      {formatCurrency(selectedTransaction.totalAmount)}
                    </Text>
                  </View>
                </View>

                {selectedTransaction.notes && (
                  <View style={styles.invoiceNotesCard}>
                    <Text style={styles.invoiceNotesLabel}>Notes:</Text>
                    <Text style={styles.invoiceNotesText}>{selectedTransaction.notes}</Text>
                  </View>
                )}

                <View style={styles.invoiceFooter}>
                  <Text style={styles.invoiceFooterText}>This is a computer-generated document</Text>
                </View>
              </ScrollView>
            )}

            <TouchableOpacity
              style={styles.printButton}
              onPress={() => {
                if (selectedTransaction) {
                  handlePrintInvoice(selectedTransaction);
                }
              }}
            >
              <FileText size={20} color="#FFFFFF" />
              <Text style={styles.printButtonText}>
                {Platform.OS === 'web' ? 'Print Invoice' : 'Share Invoice'}
              </Text>
            </TouchableOpacity>
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
    fontSize: rf(32),
    fontWeight: '700' as const,
    color: '#111827',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: rf(14),
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
    fontSize: rf(16),
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
    fontSize: rf(14),
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
    fontSize: rf(20),
    fontWeight: '600' as const,
    color: '#111827',
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: rf(14),
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
    fontSize: rf(16),
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
    fontSize: rf(12),
    color: '#9CA3AF',
  },
  transactionRight: {
    alignItems: 'flex-end' as const,
  },
  transactionAmount: {
    fontSize: rf(18),
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
    fontSize: rf(12),
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
    fontSize: rf(12),
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
    fontSize: rf(12),
    fontWeight: '600' as const,
    color: '#DC2626',
  },
  transactionNotes: {
    marginTop: 12,
    fontSize: rf(14),
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
    flex: 1,
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
    fontSize: rf(20),
    fontWeight: '700' as const,
    color: '#111827',
  },
  modalClose: {
    fontSize: rf(24),
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
    fontSize: rf(16),
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
    fontSize: rf(14),
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
    fontSize: rf(14),
    fontWeight: '600' as const,
    color: '#6B7280',
  },
  productChipTextActive: {
    color: '#6366F1',
  },
  productChipStock: {
    fontSize: rf(11),
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
    fontSize: rf(16),
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
    fontSize: rf(16),
    fontWeight: '600' as const,
    color: '#FFFFFF',
  },
  invoiceButton: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    marginTop: 12,
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: '#EEF2FF',
    borderRadius: 8,
    gap: 8,
    borderWidth: 1,
    borderColor: '#C7D2FE',
  },
  invoiceButtonText: {
    fontSize: rf(14),
    fontWeight: '600' as const,
    color: '#6366F1',
  },
  invoiceModalContent: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
  },
  invoicePreview: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  invoiceHeader: {
    alignItems: 'center' as const,
    paddingVertical: 24,
    borderBottomWidth: 3,
    borderBottomColor: '#6366F1',
    marginBottom: 20,
  },
  invoiceCompany: {
    fontSize: rf(28),
    fontWeight: '700' as const,
    color: '#111827',
  },
  invoiceAppName: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
  invoiceTitle: {
    fontSize: rf(20),
    fontWeight: '700' as const,
    color: '#374151',
    marginBottom: 16,
  },
  invoiceDetailsCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  invoiceDetailRow: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  invoiceDetailLabel: {
    fontSize: rf(14),
    fontWeight: '600' as const,
    color: '#6B7280',
  },
  invoiceDetailValue: {
    fontSize: rf(14),
    fontWeight: '500' as const,
    color: '#111827',
    textAlign: 'right' as const,
    flex: 1,
    marginLeft: 12,
  },
  invoiceTypeBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  invoiceTypeSale: {
    backgroundColor: '#D1FAE5',
  },
  invoiceTypePurchase: {
    backgroundColor: '#FEF3C7',
  },
  invoiceTypeBadgeText: {
    fontSize: rf(12),
    fontWeight: '700' as const,
  },
  invoiceTypeSaleText: {
    color: '#059669',
  },
  invoiceTypePurchaseText: {
    color: '#D97706',
  },
  invoiceItemsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    overflow: 'hidden',
    marginBottom: 20,
  },
  invoiceItemsHeader: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    backgroundColor: '#F3F4F6',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  invoiceItemsHeaderText: {
    fontSize: rf(14),
    fontWeight: '600' as const,
    color: '#374151',
  },
  invoiceItemRow: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  invoiceProductName: {
    fontSize: rf(16),
    fontWeight: '700' as const,
    color: '#111827',
  },
  invoiceItemLabel: {
    fontSize: rf(14),
    color: '#6B7280',
  },
  invoiceItemValue: {
    fontSize: rf(14),
    fontWeight: '500' as const,
    color: '#111827',
  },
  invoiceTotalRow: {
    backgroundColor: '#F9FAFB',
    borderBottomWidth: 0,
    marginTop: 8,
  },
  invoiceTotalLabel: {
    fontSize: rf(16),
    fontWeight: '700' as const,
    color: '#374151',
  },
  invoiceTotalValue: {
    fontSize: rf(20),
    fontWeight: '700' as const,
    color: '#111827',
  },
  invoiceProfitCard: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    backgroundColor: '#D1FAE5',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  invoiceProfitLabel: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#059669',
  },
  invoiceProfitValue: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: '#059669',
  },
  invoiceNotesCard: {
    backgroundColor: '#FFFBEB',
    borderLeftWidth: 4,
    borderLeftColor: '#F59E0B',
    borderRadius: 8,
    padding: 16,
    marginBottom: 20,
  },
  invoiceNotesLabel: {
    fontSize: rf(14),
    fontWeight: '600' as const,
    color: '#92400E',
    marginBottom: 8,
  },
  invoiceNotesText: {
    fontSize: rf(14),
    color: '#78350F',
    fontStyle: 'italic' as const,
  },
  invoiceFooter: {
    alignItems: 'center' as const,
    paddingVertical: 24,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    marginTop: 20,
  },
  invoiceFooterText: {
    fontSize: rf(11),
    color: '#9CA3AF',
    textAlign: 'center' as const,
    marginBottom: 4,
  },
  printButton: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    backgroundColor: '#6366F1',
    borderRadius: 12,
    paddingVertical: 16,
    marginHorizontal: 20,
    marginBottom: 20,
    gap: 8,
  },
  printButtonText: {
    fontSize: rf(16),
    fontWeight: '600' as const,
    color: '#FFFFFF',
  },
});
