import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from "recharts";
import { Brain, TrendingUp, Calendar, RefreshCw } from "lucide-react";
import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Product } from "@/types/Product";

const fetchProducts = async (): Promise<Product[]> => {
  const res = await fetch("/api/products");
  if (!res.ok) throw new Error("Failed to fetch products");
  return res.json();
};

const fetchForecast = async (productId: string, periods: number) => {
  if (!productId) return null;
  const res = await fetch("/api/forecast", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ product_id: productId, periods }),
  });
  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.detail || "Failed to fetch forecast");
  }
  const data = await res.json();
  return data.chart_data;
};

const fetchDemandInsights = async () => {
  const res = await fetch("/api/insights");
  if (!res.ok) {
    throw new Error("Network response was not ok");
  }
  return res.json();
};

const DemandForecast: React.FC = () => {
  const [selectedProduct, setSelectedProduct] = useState<string>("");
  const [forecastPeriod, setForecastPeriod] = useState<number>(8);

  const { data: products = [], isLoading: isLoadingProducts } = useQuery<Product[]>({
    queryKey: ["products"],
    queryFn: fetchProducts
  });

  const { data: forecastData, isLoading: isLoadingForecast, error: forecastError, refetch } = useQuery({
    queryKey: ['forecast', selectedProduct, forecastPeriod],
    queryFn: () => fetchForecast(selectedProduct, forecastPeriod),
    enabled: !!selectedProduct, // Only run query if a product is selected
  });

  const { data: demandInsights = [], isLoading: isLoadingInsights, error: insightsError } = useQuery({
    queryKey: ['demandInsights'],
    queryFn: fetchDemandInsights
  });

  const handleRefresh = () => {
    if (selectedProduct) {
      refetch();
    }
  };

  return (
    <div className="space-y-6">
      {/* Controls */}
      <Card className="glass-effect dashboard-card shadow-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-purple-500 animate-bounce-slow" />
            AI Demand Forecasting
          </CardTitle>
          <CardDescription>Machine learning powered demand predictions and stock optimization</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium">Product:</label>
              <Select value={selectedProduct} onValueChange={setSelectedProduct}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Select a product" />
                </SelectTrigger>
                <SelectContent>
                  {isLoadingProducts ? (
                    <SelectItem value="loading" disabled>Loading...</SelectItem>
                  ) : (
                    products.map(p => <SelectItem key={p._id} value={p._id}>{p.name}</SelectItem>)
                  )}
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <label className="text-sm font-medium">Forecast Period:</label>
              <Select value={String(forecastPeriod)} onValueChange={(val) => setForecastPeriod(Number(val))}>
                <SelectTrigger className="w-[120px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="4">4 Weeks</SelectItem>
                  <SelectItem value="8">8 Weeks</SelectItem>
                  <SelectItem value="12">12 Weeks</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isLoadingForecast || !selectedProduct}>
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoadingForecast ? 'animate-spin' : ''}`} />
              Refresh Forecast
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Forecast Chart */}
      <Card className="glass-effect dashboard-card shadow-xl">
        <CardHeader>
          <CardTitle>Demand Prediction vs Actual</CardTitle>
          <CardDescription>
            {selectedProduct ? `Showing forecast for ${products.find(p => p._id === selectedProduct)?.name}` : 'Select a product to see its forecast'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingForecast && <p>Loading forecast...</p>}
          {forecastError && <p className="text-red-500">Error: {forecastError.message}</p>}
          {!selectedProduct && <p>Please select a product to view the forecast.</p>}
          {forecastData && (
            <ResponsiveContainer width="100%" height={400}>
              <AreaChart data={forecastData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="period" />
                <YAxis />
                <Tooltip 
                  formatter={(value, name) => [
                    value ? `${Math.round(value as number)} units` : 'N/A', 
                    name === 'actual' ? 'Actual Demand' : 'Predicted Demand'
                  ]}
                />
                <Area 
                  type="monotone" 
                  dataKey="predicted" 
                  stroke="#8b5cf6" 
                  fill="#8b5cf6" 
                  fillOpacity={0.1}
                  strokeWidth={2}
                  name="predicted"
                  connectNulls
                />
                <Line 
                  type="monotone" 
                  dataKey="actual" 
                  stroke="#10b981" 
                  strokeWidth={3}
                  name="actual"
                  dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }}
                  connectNulls
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Demand Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {isLoadingInsights && <p>Loading insights...</p>}
        {insightsError && <p className="text-red-500">Error fetching insights.</p>}
        {demandInsights.map((insight, index) => (
          <Card key={index} className="glass-effect dashboard-card shadow-xl">
            <CardHeader>
              <CardTitle className="text-lg">{insight.product}</CardTitle>
              <div className="flex items-center gap-2">
                <Badge variant={insight.currentDemand === 'High' ? 'default' : 'secondary'} className="bg-gradient-to-tr from-green-100 to-blue-100 text-green-700">
                  {insight.currentDemand} Demand
                </Badge>
                <Badge variant="outline">
                  {insight.confidence}% Confidence
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-600">Trend:</span>
                <div className="flex items-center gap-1">
                  <TrendingUp className={`h-4 w-4 ${
                    insight.predictedTrend === 'Increasing' ? 'text-green-500' : 
                    insight.predictedTrend === 'Decreasing' ? 'text-red-500' : 'text-blue-500'
                  }`} />
                  <span className="text-sm font-medium">{insight.predictedTrend}</span>
                </div>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-600">Season:</span>
                <span className="text-sm font-medium">{insight.seasonality}</span>
              </div>
              
              <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                <div className="text-sm font-medium text-blue-800 mb-1">AI Recommendation:</div>
                <div className="text-sm text-blue-700">{insight.recommendation}</div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default DemandForecast;
