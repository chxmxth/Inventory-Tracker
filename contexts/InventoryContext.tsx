import AsyncStorage from '@react-native-async-storage/async-storage';
import createContextHook from '@nkzw/create-context-hook';
import { useCallback, useEffect, useMemo, useState } from 'react';

import type { Product, Transaction, DashboardSummary, DateRange, ReportData } from '@/types/inventory';
import { getCurrencySymbol } from '@/constants/currency';

const PRODUCTS_KEY = '@inventory_products';
const TRANSACTIONS_KEY = '@inventory_transactions';
const SETTINGS_KEY = '@inventory_settings';
const LOW_STOCK_THRESHOLD = 10;

interface Settings {
  companyName: string;
  currency: string;
}

export const [InventoryProvider, useInventory] = createContextHook(() => {
  const [products, setProducts] = useState<Product[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currency, setCurrency] = useState('LKR');
  const [currencySymbol, setCurrencySymbol] = useState('Rs.');
  const [companyName, setCompanyName] = useState('');

  const loadData = useCallback(async () => {
    try {
      const [productsData, transactionsData, settingsData] = await Promise.all([
        AsyncStorage.getItem(PRODUCTS_KEY),
        AsyncStorage.getItem(TRANSACTIONS_KEY),
        AsyncStorage.getItem(SETTINGS_KEY),
      ]);

      if (productsData) {
        setProducts(JSON.parse(productsData));
      }
      if (transactionsData) {
        setTransactions(JSON.parse(transactionsData));
      }
      if (settingsData) {
        const settings: Settings = JSON.parse(settingsData);
        setCurrency(settings.currency || 'LKR');
        setCurrencySymbol(getCurrencySymbol(settings.currency || 'LKR'));
        setCompanyName(settings.companyName || '');
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const saveProducts = useCallback(async (newProducts: Product[]) => {
    try {
      await AsyncStorage.setItem(PRODUCTS_KEY, JSON.stringify(newProducts));
      setProducts(newProducts);
    } catch (error) {
      console.error('Error saving products:', error);
    }
  }, []);

  const saveTransactions = useCallback(async (newTransactions: Transaction[]) => {
    try {
      await AsyncStorage.setItem(TRANSACTIONS_KEY, JSON.stringify(newTransactions));
      setTransactions(newTransactions);
    } catch (error) {
      console.error('Error saving transactions:', error);
    }
  }, []);

  const addProduct = useCallback(async (product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newProduct: Product = {
      ...product,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await saveProducts([...products, newProduct]);
  }, [products, saveProducts]);

  const updateProduct = useCallback(async (id: string, updates: Partial<Product>) => {
    const updatedProducts = products.map((p) =>
      p.id === id ? { ...p, ...updates, updatedAt: new Date().toISOString() } : p
    );
    await saveProducts(updatedProducts);
  }, [products, saveProducts]);

  const deleteProduct = useCallback(async (id: string) => {
    const filteredProducts = products.filter((p) => p.id !== id);
    await saveProducts(filteredProducts);
  }, [products, saveProducts]);

  const addTransaction = useCallback(async (
    type: 'sale' | 'purchase',
    productId: string,
    quantity: number,
    notes?: string
  ) => {
    const product = products.find((p) => p.id === productId);
    if (!product) {
      throw new Error('Product not found');
    }

    if (type === 'sale' && product.stock < quantity) {
      throw new Error('Insufficient stock');
    }

    const pricePerUnit = type === 'sale' ? product.sellingPrice : product.buyingPrice;
    const totalAmount = pricePerUnit * quantity;
    const profit = type === 'sale' ? (product.sellingPrice - product.buyingPrice) * quantity : 0;

    const newTransaction: Transaction = {
      id: Date.now().toString(),
      type,
      productId,
      productName: product.name,
      quantity,
      pricePerUnit,
      totalAmount,
      profit: type === 'sale' ? profit : undefined,
      date: new Date().toISOString(),
      notes,
    };

    const newStock = type === 'sale' ? product.stock - quantity : product.stock + quantity;
    await updateProduct(productId, { stock: newStock });
    await saveTransactions([newTransaction, ...transactions]);
  }, [products, transactions, updateProduct, saveTransactions]);

  const removeItem = useCallback(async (
    productId: string,
    quantity: number,
    reason: 'damaged' | 'expired' | 'lost' | 'other',
    notes?: string
  ) => {
    const product = products.find((p) => p.id === productId);
    if (!product) {
      throw new Error('Product not found');
    }

    if (product.stock < quantity) {
      throw new Error('Insufficient stock');
    }

    const newTransaction: Transaction = {
      id: Date.now().toString(),
      type: 'removal',
      productId,
      productName: product.name,
      quantity,
      pricePerUnit: product.buyingPrice,
      totalAmount: product.buyingPrice * quantity,
      date: new Date().toISOString(),
      notes,
      removalReason: reason,
    };

    const newStock = product.stock - quantity;
    await updateProduct(productId, { stock: newStock });
    await saveTransactions([newTransaction, ...transactions]);
  }, [products, transactions, updateProduct, saveTransactions]);

  const getDashboardSummary = useCallback((): DashboardSummary => {
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const monthlyTransactions = transactions.filter(
      (t) => new Date(t.date) >= firstDayOfMonth
    );

    const monthlySales = monthlyTransactions
      .filter((t) => t.type === 'sale')
      .reduce((sum, t) => sum + t.totalAmount, 0);

    const monthlyPurchases = monthlyTransactions
      .filter((t) => t.type === 'purchase')
      .reduce((sum, t) => sum + t.totalAmount, 0);

    const monthlyProfit = monthlyTransactions
      .filter((t) => t.type === 'sale')
      .reduce((sum, t) => sum + (t.profit || 0), 0);

    const stockValue = products.reduce(
      (sum, p) => sum + p.buyingPrice * p.stock,
      0
    );

    const lowStockProducts = products.filter((p) => p.stock <= LOW_STOCK_THRESHOLD);

    return {
      totalProducts: products.length,
      stockValue,
      monthlyProfit,
      monthlySales,
      monthlyPurchases,
      lowStockProducts,
    };
  }, [products, transactions]);

  const getReportData = useCallback((range: DateRange): ReportData => {
    const now = new Date();
    let startDate: Date;

    switch (range) {
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'all':
        startDate = new Date(0);
        break;
    }

    const filteredTransactions = transactions.filter(
      (t) => new Date(t.date) >= startDate
    );

    const totalSales = filteredTransactions
      .filter((t) => t.type === 'sale')
      .reduce((sum, t) => sum + t.totalAmount, 0);

    const totalPurchases = filteredTransactions
      .filter((t) => t.type === 'purchase')
      .reduce((sum, t) => sum + t.totalAmount, 0);

    const totalProfit = filteredTransactions
      .filter((t) => t.type === 'sale')
      .reduce((sum, t) => sum + (t.profit || 0), 0);

    const productSales = new Map<string, { name: string; quantity: number; revenue: number }>();

    filteredTransactions
      .filter((t) => t.type === 'sale')
      .forEach((t) => {
        const existing = productSales.get(t.productId);
        if (existing) {
          existing.quantity += t.quantity;
          existing.revenue += t.totalAmount;
        } else {
          productSales.set(t.productId, {
            name: t.productName,
            quantity: t.quantity,
            revenue: t.totalAmount,
          });
        }
      });

    const topProducts = Array.from(productSales.entries())
      .map(([productId, data]) => ({
        productId,
        productName: data.name,
        totalQuantity: data.quantity,
        totalRevenue: data.revenue,
      }))
      .sort((a, b) => b.totalRevenue - a.totalRevenue)
      .slice(0, 5);

    return {
      totalSales,
      totalPurchases,
      totalProfit,
      transactionCount: filteredTransactions.length,
      topProducts,
    };
  }, [transactions]);

  const updateSettings = useCallback(async (newSettings: Settings) => {
    try {
      await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(newSettings));
      setCurrency(newSettings.currency);
      setCurrencySymbol(getCurrencySymbol(newSettings.currency));
      setCompanyName(newSettings.companyName);
    } catch (error) {
      console.error('Error updating settings:', error);
      throw error;
    }
  }, []);

  return useMemo(() => ({
    products,
    transactions,
    isLoading,
    currency,
    currencySymbol,
    companyName,
    addProduct,
    updateProduct,
    deleteProduct,
    addTransaction,
    removeItem,
    getDashboardSummary,
    getReportData,
    updateSettings,
  }), [products, transactions, isLoading, currency, currencySymbol, companyName, addProduct, updateProduct, deleteProduct, addTransaction, removeItem, getDashboardSummary, getReportData, updateSettings]);
});
