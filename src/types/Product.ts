export interface Product {
  _id?: string; // MongoDB ObjectId, optional
  id?: string; // MongoDB id, optional for new products
  name: string;
  category: string;
  sku: string;
  stock: number;
  min_stock: number;
  price: number;
  supplier: string;
  lastRestocked: string;
  status: string;
  sales_history?: { period: string; sales: number }[];
} 