import { Edit2, Package, Plus, Search, Trash2, AlertCircle } from 'lucide-react-native';
import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useInventory } from '@/contexts/InventoryContext';
import type { Product } from '@/types/inventory';

export default function ProductsScreen() {
  const insets = useSafeAreaInsets();
  const { products, addProduct, updateProduct, deleteProduct, removeItem, isLoading, currencySymbol } = useInventory();
  const [searchQuery, setSearchQuery] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    buyingPrice: '',
    sellingPrice: '',
    stock: '',
    supplierName: '',
  });
  const [removeModalVisible, setRemoveModalVisible] = useState(false);
  const [removingProduct, setRemovingProduct] = useState<Product | null>(null);
  const [removeQuantity, setRemoveQuantity] = useState('');
  const [removeReason, setRemoveReason] = useState<'damaged' | 'expired' | 'lost' | 'other'>('damaged');
  const [removeNotes, setRemoveNotes] = useState('');

  const filteredProducts = useMemo(() => {
    if (!searchQuery) return products;
    const query = searchQuery.toLowerCase();
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(query) ||
        p.category.toLowerCase().includes(query) ||
        p.supplierName.toLowerCase().includes(query)
    );
  }, [products, searchQuery]);

  const handleOpenModal = (product?: Product) => {
    if (product) {
      setEditingProduct(product);
      setFormData({
        name: product.name,
        category: product.category,
        buyingPrice: product.buyingPrice.toString(),
        sellingPrice: product.sellingPrice.toString(),
        stock: product.stock.toString(),
        supplierName: product.supplierName,
      });
    } else {
      setEditingProduct(null);
      setFormData({
        name: '',
        category: '',
        buyingPrice: '',
        sellingPrice: '',
        stock: '',
        supplierName: '',
      });
    }
    setModalVisible(true);
  };

  const handleSave = async () => {
    if (
      !formData.name ||
      !formData.category ||
      !formData.buyingPrice ||
      !formData.sellingPrice ||
      !formData.stock ||
      !formData.supplierName
    ) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    const buyingPrice = parseFloat(formData.buyingPrice);
    const sellingPrice = parseFloat(formData.sellingPrice);
    const stock = parseInt(formData.stock, 10);

    if (isNaN(buyingPrice) || isNaN(sellingPrice) || isNaN(stock)) {
      Alert.alert('Error', 'Please enter valid numbers');
      return;
    }

    try {
      if (editingProduct) {
        await updateProduct(editingProduct.id, {
          name: formData.name,
          category: formData.category,
          buyingPrice,
          sellingPrice,
          stock,
          supplierName: formData.supplierName,
        });
      } else {
        await addProduct({
          name: formData.name,
          category: formData.category,
          buyingPrice,
          sellingPrice,
          stock,
          supplierName: formData.supplierName,
        });
      }
      setModalVisible(false);
    } catch {
      Alert.alert('Error', 'Failed to save product');
    }
  };

  const handleDelete = (product: Product) => {
    Alert.alert(
      'Delete Product',
      `Are you sure you want to delete "${product.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteProduct(product.id);
            } catch {
              Alert.alert('Error', 'Failed to delete product');
            }
          },
        },
      ]
    );
  };

  const handleOpenRemoveModal = (product: Product) => {
    setRemovingProduct(product);
    setRemoveQuantity('');
    setRemoveReason('damaged');
    setRemoveNotes('');
    setRemoveModalVisible(true);
  };

  const handleRemoveItems = async () => {
    if (!removingProduct || !removeQuantity) {
      Alert.alert('Error', 'Please enter quantity');
      return;
    }

    const quantity = parseInt(removeQuantity, 10);
    if (isNaN(quantity) || quantity <= 0) {
      Alert.alert('Error', 'Please enter a valid quantity');
      return;
    }

    if (quantity > removingProduct.stock) {
      Alert.alert('Error', 'Quantity exceeds available stock');
      return;
    }

    try {
      await removeItem(removingProduct.id, quantity, removeReason, removeNotes || undefined);
      setRemoveModalVisible(false);
      Alert.alert('Success', 'Items removed from inventory');
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to remove items');
    }
  };

  const getStockColor = (stock: number) => {
    if (stock === 0) return '#EF4444';
    if (stock <= 10) return '#F59E0B';
    return '#10B981';
  };

  const renderProduct = ({ item }: { item: Product }) => (
    <View style={styles.productCard}>
      <View style={styles.productHeader}>
        <View style={styles.productInfo}>
          <Text style={styles.productName}>{item.name}</Text>
          <Text style={styles.productCategory}>{item.category}</Text>
        </View>
        <View style={styles.productActions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleOpenRemoveModal(item)}
          >
            <AlertCircle size={18} color="#F59E0B" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleOpenModal(item)}
          >
            <Edit2 size={18} color="#1E40AF" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleDelete(item)}
          >
            <Trash2 size={18} color="#EF4444" />
          </TouchableOpacity>
        </View>
      </View>
      <View style={styles.productDetails}>
        <View style={styles.productDetailRow}>
          <Text style={styles.productDetailLabel}>Buying Price:</Text>
          <Text style={styles.productDetailValue}>{currencySymbol} {item.buyingPrice}</Text>
        </View>
        <View style={styles.productDetailRow}>
          <Text style={styles.productDetailLabel}>Selling Price:</Text>
          <Text style={styles.productDetailValue}>{currencySymbol} {item.sellingPrice}</Text>
        </View>
        <View style={styles.productDetailRow}>
          <Text style={styles.productDetailLabel}>Stock:</Text>
          <Text style={[styles.productDetailValue, { color: getStockColor(item.stock) }]}>
            {item.stock} units
          </Text>
        </View>
        <View style={styles.productDetailRow}>
          <Text style={styles.productDetailLabel}>Supplier:</Text>
          <Text style={styles.productDetailValue}>{item.supplierName}</Text>
        </View>
      </View>
    </View>
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
      <View style={[styles.header, { paddingTop: insets.top + 20 }]}>
        <Text style={styles.title}>Products</Text>
        <Text style={styles.subtitle}>{products.length} items</Text>
      </View>

      <View style={styles.searchContainer}>
        <Search size={20} color="#9CA3AF" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search products..."
          placeholderTextColor="#9CA3AF"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {filteredProducts.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Package size={64} color="#D1D5DB" />
          <Text style={styles.emptyTitle}>
            {searchQuery ? 'No products found' : 'No products yet'}
          </Text>
          <Text style={styles.emptySubtitle}>
            {searchQuery
              ? 'Try a different search term'
              : 'Add your first product to get started'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredProducts}
          renderItem={renderProduct}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}

      <TouchableOpacity
        style={styles.fab}
        onPress={() => handleOpenModal()}
      >
        <Plus size={24} color="#fff" />
      </TouchableOpacity>

      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingProduct ? 'Edit Product' : 'Add Product'}
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Product Name *</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="Enter product name"
                  placeholderTextColor="#9CA3AF"
                  value={formData.name}
                  onChangeText={(text) => setFormData({ ...formData, name: text })}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Category *</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="e.g., Electronics, Clothing"
                  placeholderTextColor="#9CA3AF"
                  value={formData.category}
                  onChangeText={(text) => setFormData({ ...formData, category: text })}
                />
              </View>

              <View style={styles.formRow}>
                <View style={styles.formGroupHalf}>
                  <Text style={styles.formLabel}>Buying Price *</Text>
                  <TextInput
                    style={styles.formInput}
                    placeholder="0"
                    placeholderTextColor="#9CA3AF"
                    keyboardType="numeric"
                    value={formData.buyingPrice}
                    onChangeText={(text) => setFormData({ ...formData, buyingPrice: text })}
                  />
                </View>

                <View style={styles.formGroupHalf}>
                  <Text style={styles.formLabel}>Selling Price *</Text>
                  <TextInput
                    style={styles.formInput}
                    placeholder="0"
                    placeholderTextColor="#9CA3AF"
                    keyboardType="numeric"
                    value={formData.sellingPrice}
                    onChangeText={(text) => setFormData({ ...formData, sellingPrice: text })}
                  />
                </View>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Stock Quantity *</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="0"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="numeric"
                  value={formData.stock}
                  onChangeText={(text) => setFormData({ ...formData, stock: text })}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Supplier Name *</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="Enter supplier name"
                  placeholderTextColor="#9CA3AF"
                  value={formData.supplierName}
                  onChangeText={(text) => setFormData({ ...formData, supplierName: text })}
                />
              </View>

              <View style={styles.formActions}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => setModalVisible(false)}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
                  <Text style={styles.saveButtonText}>Save</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      <Modal
        visible={removeModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setRemoveModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Remove Items</Text>
              <TouchableOpacity onPress={() => setRemoveModalVisible(false)}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              {removingProduct && (
                <View style={styles.removeInfoCard}>
                  <Text style={styles.removeInfoLabel}>Product</Text>
                  <Text style={styles.removeInfoValue}>{removingProduct.name}</Text>
                  <Text style={styles.removeInfoStock}>Available: {removingProduct.stock} units</Text>
                </View>
              )}

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Quantity to Remove *</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="0"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="numeric"
                  value={removeQuantity}
                  onChangeText={setRemoveQuantity}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Reason *</Text>
                <View style={styles.reasonButtons}>
                  <TouchableOpacity
                    style={[styles.reasonButton, removeReason === 'damaged' && styles.reasonButtonActive]}
                    onPress={() => setRemoveReason('damaged')}
                  >
                    <Text style={[styles.reasonButtonText, removeReason === 'damaged' && styles.reasonButtonTextActive]}>
                      Damaged
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.reasonButton, removeReason === 'expired' && styles.reasonButtonActive]}
                    onPress={() => setRemoveReason('expired')}
                  >
                    <Text style={[styles.reasonButtonText, removeReason === 'expired' && styles.reasonButtonTextActive]}>
                      Expired
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.reasonButton, removeReason === 'lost' && styles.reasonButtonActive]}
                    onPress={() => setRemoveReason('lost')}
                  >
                    <Text style={[styles.reasonButtonText, removeReason === 'lost' && styles.reasonButtonTextActive]}>
                      Lost
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.reasonButton, removeReason === 'other' && styles.reasonButtonActive]}
                    onPress={() => setRemoveReason('other')}
                  >
                    <Text style={[styles.reasonButtonText, removeReason === 'other' && styles.reasonButtonTextActive]}>
                      Other
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Notes (Optional)</Text>
                <TextInput
                  style={[styles.formInput, styles.textArea]}
                  placeholder="Additional details..."
                  placeholderTextColor="#9CA3AF"
                  value={removeNotes}
                  onChangeText={setRemoveNotes}
                  multiline
                  numberOfLines={3}
                />
              </View>

              <View style={styles.formActions}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => setRemoveModalVisible(false)}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.removeButton} onPress={handleRemoveItems}>
                  <Text style={styles.removeButtonText}>Remove Items</Text>
                </TouchableOpacity>
              </View>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 16,
    backgroundColor: '#F9FAFB',
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
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginBottom: 16,
    paddingHorizontal: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 16,
    color: '#111827',
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  productCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  productHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: '#111827',
    marginBottom: 4,
  },
  productCategory: {
    fontSize: 14,
    color: '#6B7280',
  },
  productActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    padding: 8,
  },
  productDetails: {
    gap: 8,
  },
  productDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  productDetailLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  productDetailValue: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#111827',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600' as const,
    color: '#111827',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#1E40AF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    flex: 1,
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: '#111827',
  },
  modalClose: {
    fontSize: 24,
    color: '#6B7280',
  },
  modalBody: {
    padding: 20,
  },
  formGroup: {
    marginBottom: 20,
  },
  formLabel: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#111827',
    marginBottom: 8,
  },
  formInput: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#111827',
  },
  formRow: {
    flexDirection: 'row',
    gap: 12,
  },
  formGroupHalf: {
    flex: 1,
    marginBottom: 20,
  },
  formActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#6B7280',
  },
  saveButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    backgroundColor: '#1E40AF',
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#fff',
  },
  removeInfoCard: {
    backgroundColor: '#FEF3C7',
    borderRadius: 8,
    padding: 16,
    marginBottom: 20,
  },
  removeInfoLabel: {
    fontSize: 12,
    color: '#92400E',
    marginBottom: 4,
  },
  removeInfoValue: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#111827',
    marginBottom: 4,
  },
  removeInfoStock: {
    fontSize: 14,
    color: '#78350F',
  },
  reasonButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  reasonButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#F9FAFB',
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  reasonButtonActive: {
    backgroundColor: '#FEF3C7',
    borderColor: '#F59E0B',
  },
  reasonButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#6B7280',
  },
  reasonButtonTextActive: {
    color: '#D97706',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  removeButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    backgroundColor: '#F59E0B',
    alignItems: 'center',
  },
  removeButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#fff',
  },
});
