import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { Target, TrendingUp, AlertCircle, CheckCircle, Zap } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/components/ui/use-toast";

const fetchOptimizationData = async () => {
  const res = await fetch("/api/optimize");
  if (!res.ok) {
    throw new Error("Network response was not ok");
  }
  return res.json();
};

const costSavingsData = [
  { name: 'Reduced Overstock', value: 15400, color: '#3b82f6' },
  { name: 'Minimized Stockouts', value: 8900, color: '#10b981' },
  { name: 'Optimized Reorders', value: 12600, color: '#f59e0b' },
  { name: 'Demand Accuracy', value: 6800, color: '#8b5cf6' },
];

const StockOptimization = () => {
  const { data, isLoading, error } = useQuery({
    queryKey: ['optimizationData'],
    queryFn: fetchOptimizationData,
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const generatePurchaseOrderMutation = useMutation({
    mutationFn: async (item: { product_id: string; product: string; suggestedOrder: number }) => {
      // This is a placeholder. In a real app, you'd send more data.
      const res = await fetch("/api/purchase-orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          supplier_id: "placeholder-supplier-id", // Replace with actual supplier ID
          items: [{ product_id: item.product_id, quantity: item.suggestedOrder, price: 0 }],
          status: "pending",
          order_date: new Date().toISOString(),
          expected_delivery: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        }),
      });
      if (!res.ok) {
        throw new Error("Failed to generate purchase order");
      }
      return res.json();
    },
    onSuccess: (data, variables) => {
      toast({
        title: "Success",
        description: `Purchase order for ${variables.product} has been generated.`,
      });
      queryClient.invalidateQueries({ queryKey: ['optimizationData'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Could not generate purchase order.",
        variant: "destructive",
      });
    },
  });

  const optimizationData = data?.chart_data || [];
  const reorderRecommendations = data?.reorder_recommendations || [];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Stock Level Optimization */}
      <Card className="glass-effect dashboard-card chart-container shadow-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-blue-500 animate-bounce-slow" />
            Stock Level Optimization
          </CardTitle>
          <CardDescription>AI-recommended optimal stock levels vs current inventory</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading && <p>Loading optimization data...</p>}
          {error && <p>Error: {error.message}</p>}
          {optimizationData.length > 0 && (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={optimizationData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="category" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="current" fill="#94a3b8" name="Current Stock" />
                <Bar dataKey="optimal" fill="#3b82f6" name="Optimal Stock" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Reorder Recommendations */}
      <Card className="glass-effect dashboard-card shadow-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-orange-500 animate-pulse" />
            Reorder Recommendations
          </CardTitle>
          <CardDescription>AI-powered suggestions for restocking</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 custom-scrollbar">
          {isLoading && <p>Loading recommendations...</p>}
          {error && <p>Error: {error.message}</p>}
          {reorderRecommendations.map((item, index) => (
            <div key={index} className="p-4 rounded-lg bg-slate-50 space-y-3 interactive-element">
              <div className="flex items-center justify-between">
                <span className="font-medium">{item.product}</span>
                <Badge variant={item.priority === 'high' ? 'destructive' : item.priority === 'medium' ? 'default' : 'secondary'} className="shadow-sm px-2 py-1 text-xs rounded-lg">
                  {item.priority} priority
                </Badge>
              </div>
              <div className="grid grid-cols-3 gap-2 text-sm text-slate-600">
                <div>Current: {item.currentStock}</div>
                <div>Reorder at: {item.reorderPoint}</div>
                <div>Suggested: {item.suggestedOrder}</div>
              </div>
              <Progress 
                value={(item.currentStock / item.reorderPoint) * 100} 
                className="h-2 progress-bar" 
              />
              <Button 
                size="sm" 
                className="w-full hover-glow"
                onClick={() => generatePurchaseOrderMutation.mutate(item)}
                disabled={generatePurchaseOrderMutation.isPending}
              >
                {generatePurchaseOrderMutation.isPending ? 'Generating...' : 'Generate Purchase Order'}
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Cost Savings Analysis */}
      <Card className="glass-effect dashboard-card shadow-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-green-500 animate-bounce-slow" />
            Cost Savings Analysis
          </CardTitle>
          <CardDescription>Potential savings from optimization</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={costSavingsData}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {costSavingsData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => `$${value.toLocaleString()}`} />
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-2">
              {costSavingsData.map((item, index) => (
                <div key={index} className="flex items-center justify-between text-sm interactive-element p-2 rounded">
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full status-indicator" 
                      style={{ backgroundColor: item.color }}
                    />
                    <span>{item.name}</span>
                  </div>
                  <span className="font-medium">${item.value.toLocaleString()}</span>
                </div>
              ))}
            </div>
            <div className="pt-2 border-t">
              <div className="flex items-center justify-between font-semibold p-2 rounded gradient-bg text-white">
                <span>Total Potential Savings</span>
                <span>
                  ${costSavingsData.reduce((sum, item) => sum + item.value, 0).toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default StockOptimization;
