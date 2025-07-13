import { useQuery } from "@tanstack/react-query";
import { Card, CardHeader, CardTitle, CardContent } from "./ui/card";

const fetchSummary = async () => {
  const res = await fetch("/api/supply-chain-summary");
  if (!res.ok) throw new Error("Failed to fetch summary");
  return res.json();
};

const fetchForecastAccuracy = async () => {
  const res = await fetch("/api/forecast-accuracy");
  if (!res.ok) throw new Error("Failed to fetch forecast accuracy");
  return res.json();
};

const fetchCostSavings = async () => {
  const res = await fetch("/api/cost-savings");
  if (!res.ok) throw new Error("Failed to fetch cost savings");
  return res.json();
};

const fetchInsights = async () => {
  const res = await fetch("/api/insights");
  if (!res.ok) throw new Error("Failed to fetch insights");
  return res.json();
};

const AnalyticsDashboard = () => {
  const { data: summary, isLoading: loadingSummary } = useQuery({ queryKey: ["supply-chain-summary"], queryFn: fetchSummary });
  const { data: accuracy } = useQuery({ queryKey: ["forecast-accuracy"], queryFn: fetchForecastAccuracy });
  const { data: savings } = useQuery({ queryKey: ["cost-savings"], queryFn: fetchCostSavings });
  const { data: insights } = useQuery({ queryKey: ["insights"], queryFn: fetchInsights });

  return (
    <div className="max-w-6xl mx-auto mt-8 space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader><CardTitle>Total Suppliers</CardTitle></CardHeader>
          <CardContent className="text-3xl font-bold">{loadingSummary ? "..." : summary?.total_suppliers}</CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Total Warehouses</CardTitle></CardHeader>
          <CardContent className="text-3xl font-bold">{loadingSummary ? "..." : summary?.total_warehouses}</CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Total Products</CardTitle></CardHeader>
          <CardContent className="text-3xl font-bold">{loadingSummary ? "..." : summary?.total_products}</CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Open Purchase Orders</CardTitle></CardHeader>
          <CardContent className="text-3xl font-bold">{loadingSummary ? "..." : summary?.open_purchase_orders}</CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Open Customer Orders</CardTitle></CardHeader>
          <CardContent className="text-3xl font-bold">{loadingSummary ? "..." : summary?.open_customer_orders}</CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Open Deliveries</CardTitle></CardHeader>
          <CardContent className="text-3xl font-bold">{loadingSummary ? "..." : summary?.open_deliveries}</CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Open Shipments</CardTitle></CardHeader>
          <CardContent className="text-3xl font-bold">{loadingSummary ? "..." : summary?.open_shipments}</CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Forecast Accuracy</CardTitle></CardHeader>
          <CardContent className="text-3xl font-bold">{accuracy ? `${accuracy.accuracy}%` : "..."}</CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Cost Savings</CardTitle></CardHeader>
          <CardContent className="text-3xl font-bold">{savings ? `$${savings.savings}` : "..."}</CardContent>
        </Card>
      </div>
      <div>
        <Card>
          <CardHeader><CardTitle>Dynamic Insights</CardTitle></CardHeader>
          <CardContent>
            {insights && insights.length > 0 ? (
              <ul className="space-y-2">
                {insights.map((insight: { product: string; currentDemand: number; predictedTrend: string; confidence: number; recommendation: string }, idx: number) => (
                  <li key={idx} className="border-b pb-2">
                    <div className="font-semibold">{insight.product}</div>
                    <div>Demand: {insight.currentDemand} | Trend: {insight.predictedTrend} | Confidence: {insight.confidence}%</div>
                    <div className="text-sm text-muted-foreground">{insight.recommendation}</div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="text-muted-foreground">No insights available.</div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AnalyticsDashboard; 