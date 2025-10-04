export type Product = {
  id: string;
  name: string;
  category: string;
  buyingPrice: number;
  sellingPrice: number;
  stock: number;
  supplierName: string;
  imageUri?: string;
  createdAt: string;
  updatedAt: string;
};

export type TransactionType = 'sale' | 'purchase';

export type Transaction = {
  id: string;
  type: TransactionType;
  productId: string;
  productName: string;
  quantity: number;
  pricePerUnit: number;
  totalAmount: number;
  profit?: number;
  date: string;
  notes?: string;
};

export type DashboardSummary = {
  totalProducts: number;
  stockValue: number;
  monthlyProfit: number;
  monthlySales: number;
  monthlyPurchases: number;
  lowStockProducts: Product[];
};

export type DateRange = 'week' | 'month' | 'all';

export type ReportData = {
  totalSales: number;
  totalPurchases: number;
  totalProfit: number;
  transactionCount: number;
  topProducts: {
    productId: string;
    productName: string;
    totalQuantity: number;
    totalRevenue: number;
  }[];
};
