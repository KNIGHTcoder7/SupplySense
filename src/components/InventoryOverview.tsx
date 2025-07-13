import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";
import { AlertTriangle, TrendingUp, TrendingDown, Package2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

const fetchStockMovement = async () => {
  const res = await fetch("/api/stock-movement");
  if (!res.ok) throw new Error("Failed to fetch stock movement data");
  return res.json();
};

const fetchProducts = async () => {
  const res = await fetch("/api/products");
  if (!res.ok) {
    throw new Error("Network response was not ok");
  }
  return res.json();
};

const InventoryOverview = () => {
  const { data: stockData = [], isLoading: isLoadingStock, error: stockError } = useQuery({
    queryKey: ['stockMovement'],
    queryFn: fetchStockMovement,
  });

  const { data: products = [], isLoading, error } = useQuery({
    queryKey: ['products'],
    queryFn: fetchProducts,
  });

  // Compute real trend for top products
  const topProducts = products?.slice(0, 5).map(p => {
    let trend: 'up' | 'down' | 'none' = 'none';
    if (p.sales_history && p.sales_history.length > 1) {
      const first = p.sales_history[0].sales;
      const last = p.sales_history[p.sales_history.length - 1].sales;
      if (last > first) trend = 'up';
      else if (last < first) trend = 'down';
    }
    return { ...p, trend };
  }) || [];
  const lowStockAlerts = products?.filter(p => p.stock < p.min_stock) || [];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Stock Movement Chart */}
      <Card className="glass-effect dashboard-card chart-container shadow-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package2 className="h-5 w-5 text-blue-500 animate-bounce-slow" />
            Stock Movement Trends
          </CardTitle>
          <CardDescription>Monthly inventory levels, sales, and restocking patterns</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingStock && <p>Loading stock movement...</p>}
          {stockError && <p className="text-red-500">Error: {stockError.message}</p>}
          {stockData.length > 0 && (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={stockData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="inStock" stroke="#3b82f6" strokeWidth={2} name="In Stock" />
                <Line type="monotone" dataKey="sold" stroke="#10b981" strokeWidth={2} name="Sold" />
                <Line type="monotone" dataKey="restocked" stroke="#f59e0b" strokeWidth={2} name="Restocked" />
              </LineChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Top Products */}
      <Card className="glass-effect dashboard-card shadow-md bg-white dark:bg-slate-800">
        <CardHeader>
          <CardTitle className="text-slate-900 dark:text-slate-100">Top Performing Products</CardTitle>
          <CardDescription className="text-slate-600 dark:text-slate-300">Best sellers with current stock levels</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 custom-scrollbar">
          {isLoading && <p className="text-slate-700 dark:text-slate-200">Loading products...</p>}
          {error && <p className="text-red-600 dark:text-red-400">Error fetching products: {error.message}</p>}
          {topProducts.map((product, index) => (
            <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-900 interactive-element">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium text-slate-800 dark:text-slate-100">{product.name}</span>
                  {product.trend === 'up' ? (
                    <TrendingUp className="h-4 w-4 text-green-500 animate-bounce-slow" />
                  ) : product.trend === 'down' ? (
                    <TrendingDown className="h-4 w-4 text-red-500 animate-bounce-slow" />
                  ) : null}
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                  <Badge variant="outline" className="bg-gradient-to-tr from-blue-100 to-purple-100 text-blue-700 dark:bg-slate-800 dark:text-blue-300">
                    {product.category}
                  </Badge>
                  <span>Stock: {product.stock}</span>
                  <span>Sold: {product.sold || 'N/A'}</span>
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Low Stock Alerts */}
      <Card className="glass-effect dashboard-card shadow-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-500 animate-pulse" />
            Low Stock Alerts
          </CardTitle>
          <CardDescription>Products requiring immediate attention</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoading && <p>Loading alerts...</p>}
          {error && <p>Error fetching alerts: {error.message}</p>}
          {lowStockAlerts.map((item, index) => (
            <div key={index} className="space-y-2 interactive-element p-2 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="font-medium">{item.name}</span>
                <Badge variant={item.stock < (item.min_stock / 2) ? 'destructive' : 'secondary'}>
                  {item.stock < (item.min_stock / 2) ? 'Urgent' : 'Low'}
                </Badge>
              </div>
              <div className="flex items-center justify-between text-sm text-slate-600">
                <span>Current: {item.stock}</span>
                <span>Min: {item.min_stock}</span>
              </div>
              <Progress 
                value={(item.stock / item.min_stock) * 100} 
                className="h-2 progress-bar rounded-full bg-blue-100" 
              />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
};

export default InventoryOverview;
