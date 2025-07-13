import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Product } from "@/types/Product";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import InventoryOverview from "@/components/InventoryOverview";
import DemandForecast from "@/components/DemandForecast";
import ProductManagement from "@/components/ProductManagement";
import StockOptimization from "@/components/StockOptimization";
import { Package, TrendingUp, AlertTriangle, BarChart3, Sun, Moon, Plus, Palette } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { useNavigate, Link, useLocation } from "react-router-dom";
import ProductDialog from "@/components/ProductDialog";

const fetchProducts = async (): Promise<Product[]> => {
  const res = await fetch("/api/products");
  if (!res.ok) throw new Error("Failed to fetch products");
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

const mainNavLinks = [
  { to: "/dashboard", label: "Dashboard" },
  { to: "/suppliers", label: "Suppliers" },
  { to: "/purchase-orders", label: "Purchase Orders" },
  { to: "/warehouses", label: "Warehouses" },
  { to: "/stock-transfers", label: "Stock Transfers" },
  { to: "/shipments", label: "Shipments" },
  { to: "/orders", label: "Orders" },
  { to: "/deliveries", label: "Deliveries" },
];

const Index = () => {
  const [dark, setDark] = useState(false);
  const [showLanding, setShowLanding] = useState(true);
  const [theme, setTheme] = useState("default");
  const navigate = useNavigate();
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [profile, setProfile] = useState({ name: "", avatar: "" });

  const { data: products = [], isLoading } = useQuery<Product[]>({
    queryKey: ["products"],
    queryFn: fetchProducts
  });

  const { data: forecastAccuracyData, isLoading: isLoadingAccuracy, error: errorAccuracy } = useQuery({
    queryKey: ["forecastAccuracy"],
    queryFn: fetchForecastAccuracy
  });

  const { data: costSavingsData, isLoading: isLoadingSavings, error: errorSavings } = useQuery({
    queryKey: ["costSavings"],
    queryFn: fetchCostSavings
  });

  const totalProducts = products.length;
  const lowStockCount = products.filter(p => p.stock < p.min_stock).length;

  useEffect(() => {
    const root = document.documentElement;
    if (dark) {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
    // Theme switching
    if (theme === "default") {
      root.style.setProperty("--primary", "222.2 47.4% 11.2%");
      root.style.setProperty("--primary-foreground", "210 40% 98%");
      root.style.setProperty("--secondary", "210 40% 96.1%");
      root.style.setProperty("--secondary-foreground", "222.2 47.4% 11.2%");
    } else if (theme === "green") {
      root.style.setProperty("--primary", "158 64% 38%"); // green
      root.style.setProperty("--primary-foreground", "210 40% 98%");
      root.style.setProperty("--secondary", "174 60% 90%"); // teal
      root.style.setProperty("--secondary-foreground", "158 64% 38%");
    } else if (theme === "orange") {
      root.style.setProperty("--primary", "24 94% 50%"); // orange
      root.style.setProperty("--primary-foreground", "210 40% 98%");
      root.style.setProperty("--secondary", "340 82% 90%"); // pink
      root.style.setProperty("--secondary-foreground", "24 94% 50%");
    }
  }, [dark, theme]);

  useEffect(() => {
    const data = localStorage.getItem("profile_settings");
    if (data) {
      const parsed = JSON.parse(data);
      setProfile({ name: parsed.name || "", avatar: parsed.avatar || "" });
    }
  }, []);

  if (showLanding) {
    const location = useLocation();
    return (
      <div className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden" style={{ background: "linear-gradient(135deg, #0072CE 0%, #FFB81C 100%)" }}>
        {/* SVG Ellipse Overlay for Soft Organic Shape */}
        <div className="absolute inset-0 z-0 pointer-events-none">
          <svg width="100%" height="100%" className="opacity-70 pointer-events-none" style={{position:'absolute',top:0,left:0}}>
            <defs>
              <radialGradient id="landingGradient" cx="60%" cy="40%" r="80%">
                <stop offset="0%" stopColor="#0072CE"/>
                <stop offset="100%" stopColor="#FFB81C"/>
              </radialGradient>
            </defs>
            <ellipse cx="60%" cy="40%" rx="900" ry="400" fill="url(#landingGradient)"/>
          </svg>
        </div>
        <div className="relative z-10 flex flex-col items-center text-center space-y-6 animate-fade-in mt-32">
          <h1 className="text-5xl md:text-6xl font-extrabold gradient-text drop-shadow-lg">Welcome to SupplySense</h1>
          <p className="text-xl md:text-2xl text-slate-700 dark:text-slate-200 font-medium max-w-xl">AI-powered supply chain optimization: demand forecasting, stock optimization, and product management—all in one beautiful dashboard.</p>
          <button
            className="mt-6 px-8 py-3 rounded-full bg-gradient-to-tr from-blue-500 to-purple-500 text-white font-semibold text-lg shadow-xl hover:scale-105 transition-all duration-300"
            onClick={() => setShowLanding(false)}
          >
            Get Started
          </button>
        </div>
        <button
          className="fixed top-6 right-6 z-50 p-2 rounded-full bg-white/80 dark:bg-slate-800/80 shadow-lg border border-slate-200 dark:border-slate-700 transition-colors duration-300 hover:scale-110"
          onClick={() => setDark((d) => !d)}
          aria-label="Toggle dark mode"
        >
          {dark ? (
            <Sun className="h-6 w-6 text-yellow-400 transition-transform duration-300" />
          ) : (
            <Moon className="h-6 w-6 text-slate-700 transition-transform duration-300" />
          )}
        </button>
      </div>
    );
  }

  return (
    <>
      <div
        className="min-h-screen p-6 relative overflow-x-hidden"
        style={{
          background: "linear-gradient(135deg, #0072CE 0%, #FFB81C 100%)"
        }}
      >
        <div className="absolute inset-0 pointer-events-none z-0">
          <svg width="100%" height="100%" className="opacity-30 pointer-events-none" style={{position:'absolute',top:0,left:0}}>
            <defs>
              <radialGradient id="heroGradient" cx="50%" cy="40%" r="80%">
                <stop offset="0%" stopColor="#0072CE"/>
                <stop offset="100%" stopColor="#FFB81C"/>
              </radialGradient>
            </defs>
            <ellipse cx="60%" cy="30%" rx="600" ry="250" fill="url(#heroGradient)"/>
          </svg>
        </div>
        <div className="max-w-7xl mx-auto space-y-6 relative z-10">
          <div className="text-center mb-8 fade-in">
            <h1 className="text-5xl font-extrabold text-slate-800 mb-2 gradient-text drop-shadow-lg">Smart Inventory Management</h1>
            <p className="text-xl text-slate-600 font-medium">AI-Powered Demand Forecasting & Stock Optimization</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 slide-up">
            <Card className="border-l-4 border-l-blue-500 dashboard-card hover-glow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Products</CardTitle>
                <Package className="h-4 w-4 text-blue-500 animate-bounce-slow" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{isLoading ? '...' : totalProducts}</div>
                <p className="text-xs text-muted-foreground">+12% from last month</p>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-green-500 dashboard-card hover-glow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Forecast Accuracy</CardTitle>
                <TrendingUp className="h-4 w-4 text-green-500 animate-pulse" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {isLoadingAccuracy ? '...' : errorAccuracy ? '--' : `${forecastAccuracyData?.accuracy ?? '--'}%`}
                </div>
                <p className="text-xs text-muted-foreground">{isLoadingAccuracy ? '' : '+2.1% improvement'}</p>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-orange-500 dashboard-card hover-glow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Low Stock Alerts</CardTitle>
                <AlertTriangle className="h-4 w-4 text-orange-500 animate-pulse" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{isLoading ? '...' : lowStockCount}</div>
                <p className="text-xs text-muted-foreground">Requires attention</p>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-purple-500 dashboard-card hover-glow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Cost Savings</CardTitle>
                <BarChart3 className="h-4 w-4 text-purple-500 animate-spin-slow" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {isLoadingSavings ? '...' : errorSavings ? '--' : `$${costSavingsData?.savings?.toLocaleString() ?? '--'}`}
                </div>
                <p className="text-xs text-muted-foreground">This quarter</p>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="overview" className="space-y-6 fade-in glass-effect shadow-xl rounded-xl p-2">
            <TabsList className="grid w-full grid-cols-4 glass-effect rounded-lg mb-2 overflow-x-auto scrollbar-thin" role="tablist">
              <TabsTrigger value="overview" className="interactive-element focus:outline-none focus:ring-2 focus:ring-blue-400" role="tab" aria-selected={true}>Overview</TabsTrigger>
              <TabsTrigger value="forecast" className="interactive-element focus:outline-none focus:ring-2 focus:ring-blue-400" role="tab" aria-selected={false}>Demand Forecast</TabsTrigger>
              <TabsTrigger value="products" className="interactive-element focus:outline-none focus:ring-2 focus:ring-blue-400" role="tab" aria-selected={false}>Products</TabsTrigger>
              <TabsTrigger value="optimization" className="interactive-element focus:outline-none focus:ring-2 focus:ring-blue-400" role="tab" aria-selected={false}>Optimization</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="slide-up">
              <InventoryOverview />
            </TabsContent>

            <TabsContent value="forecast" className="slide-up">
              <DemandForecast />
            </TabsContent>

            <TabsContent value="products" className="slide-up">
              <ProductManagement />
            </TabsContent>

            <TabsContent value="optimization" className="slide-up">
              <StockOptimization />
            </TabsContent>
          </Tabs>
        </div>
        <button
          className="floating-action bg-gradient-to-tr from-blue-500 to-purple-500 text-white shadow-2xl hover:scale-105 transition-all duration-300 flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-purple-400"
          style={{ bottom: 32, right: 32 }}
          title="Add Product"
          aria-label="Add Product"
          tabIndex={0}
          onClick={() => setAddDialogOpen(true)}
        >
          <Plus className="h-7 w-7" />
        </button>
      </div>
      <ProductDialog
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
        onSave={() => setAddDialogOpen(false)}
      />
    </>
  );
};

export default Index;
