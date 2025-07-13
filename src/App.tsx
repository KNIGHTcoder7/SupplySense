import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Link, useLocation, useNavigate } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import ProfileSettings from "./pages/ProfileSettings";
import Logout from "./pages/Logout";
import AnalyticsDashboard from "@/components/AnalyticsDashboard";
import SupplierManagement from "@/components/SupplierManagement";
import PurchaseOrderManagement from "@/components/PurchaseOrderManagement";
import WarehouseManagement from "@/components/WarehouseManagement";
import StockTransferManagement from "@/components/StockTransferManagement";
import ShipmentManagement from "@/components/ShipmentManagement";
import OrderManagement from "@/components/OrderManagement";
import DeliveryManagement from "@/components/DeliveryManagement";
import LastMileDelivery from "@/components/LastMileDelivery";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { useEffect, useState } from "react";
import Settings from "./pages/Settings";

const queryClient = new QueryClient();

const mainNavLinks = [
  { to: "/dashboard", label: "Dashboard" },
  { to: "/suppliers", label: "Suppliers" },
  { to: "/purchase-orders", label: "Purchase Orders" },
  { to: "/warehouses", label: "Warehouses" },
  { to: "/stock-transfers", label: "Stock Transfers" },
  { to: "/shipments", label: "Shipments" },
  { to: "/orders", label: "Orders" },
  { to: "/deliveries", label: "Deliveries" },
  // Removed Last Mile
];

function AppLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const [profile, setProfile] = useState({ name: "", avatar: "" });

  useEffect(() => {
    const loadProfile = () => {
      const data = localStorage.getItem("profile_settings");
      if (data) {
        const parsed = JSON.parse(data);
        setProfile({ name: parsed.name || "", avatar: parsed.avatar || "" });
      }
    };
    loadProfile();
    // Listen for changes from other tabs/windows
    const onStorage = (e: StorageEvent) => {
      if (e.key === "profile_settings") loadProfile();
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  // Always render the navbar/header
  return (
    <>
      <header className="fixed top-0 left-0 w-full z-50 bg-gradient-to-r from-blue-600 via-blue-500 to-yellow-400 shadow-lg">
        <nav className="max-w-7xl mx-auto flex items-center justify-between px-6 py-3">
          <div className="text-2xl font-extrabold tracking-tight text-white">SupplySense</div>
          <div className="flex gap-2 items-center">
            {mainNavLinks.map(link => (
              <Link
                key={link.to}
                to={link.to}
                className={`px-4 py-2 rounded-md font-medium transition-colors duration-200 hover:bg-white/20 hover:text-white ${location.pathname === link.to ? "bg-white/30 text-white" : "text-white/90"}`}
              >
                {link.label}
              </Link>
            ))}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <div className="flex items-center gap-2 cursor-pointer px-2 py-1 rounded-md hover:bg-white/20 transition-colors">
                  <Avatar className="border-2 border-blue-400 dark:border-purple-500 shadow-md">
                    {profile.avatar ? (
                      <AvatarImage src={profile.avatar} alt={profile.name || "Avatar"} />
                    ) : (
                      <AvatarImage src="https://i.pravatar.cc/150?img=8" alt="Default Avatar" />
                    )}
                    <AvatarFallback>{profile.name ? profile.name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0,2) : "JD"}</AvatarFallback>
                  </Avatar>
                  <span className="hidden sm:block font-semibold text-white/90 text-base max-w-[120px] truncate">{profile.name || "User"}</span>
                </div>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="glass-effect shadow-xl mt-2">
                <DropdownMenuItem onClick={() => navigate("/profile")}>Profile</DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/settings")}>Settings</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-red-500" onClick={() => navigate("/logout")}>Logout</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </nav>
      </header>
      {/* Main Content with padding for the navbar */}
      <main className="pt-20 min-h-screen bg-gradient-to-br from-blue-100 to-yellow-100">
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/dashboard" element={<Index />} />
          <Route path="/suppliers" element={<SupplierManagement />} />
          <Route path="/purchase-orders" element={<PurchaseOrderManagement />} />
          <Route path="/warehouses" element={<WarehouseManagement />} />
          <Route path="/stock-transfers" element={<StockTransferManagement />} />
          <Route path="/shipments" element={<ShipmentManagement />} />
          <Route path="/orders" element={<OrderManagement />} />
          <Route path="/deliveries" element={<DeliveryManagement />} />
          <Route path="/profile" element={<ProfileSettings />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/logout" element={<Logout />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
    </>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AppLayout />
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
