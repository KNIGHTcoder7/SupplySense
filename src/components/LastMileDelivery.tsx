import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Truck, MapPin, Clock, AlertTriangle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';

// Fix for default marker icon issue with webpack
delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
});

// Define the types for our delivery data
interface Driver {
  name: string;
  avatar: string;
}

interface Delivery {
  id: string;
  orderId: string;
  driver: Driver;
  status: "In Transit" | "Delayed" | "Nearing Destination" | "Delivered";
  etaMinutes: number;
  currentLocation: {
    lat: number;
    lng: number;
  };
}

// Fetch function for last-mile deliveries
const fetchLastMileDeliveries = async (): Promise<Delivery[]> => {
  const res = await fetch("/api/last-mile-deliveries");
  if (!res.ok) {
    throw new Error("Network response was not ok for last-mile deliveries");
  }
  return res.json();
};

// Helper to get badge color based on status
const getStatusBadgeVariant = (status: Delivery["status"]) => {
  switch (status) {
    case "In Transit":
      return "default";
    case "Delayed":
      return "destructive";
    case "Nearing Destination":
      return "secondary";
    case "Delivered":
      return "outline";
    default:
      return "default";
  }
};

const LastMileDelivery = () => {
  const { data: deliveries = [], isLoading, isError, error } = useQuery({
    queryKey: ["lastMileDeliveries"],
    queryFn: fetchLastMileDeliveries,
    // Refetch every 15 seconds to simulate real-time updates
    refetchInterval: 15000,
  });

  const mapCenter: [number, number] = deliveries.length > 0
    ? [deliveries[0].currentLocation.lat, deliveries[0].currentLocation.lng]
    : [34.0522, -118.2437]; // Default to LA if no deliveries

  if (isError) {
    return (
      <div className="flex items-center justify-center h-full text-red-500">
        <AlertTriangle className="mr-2" />
        Error loading delivery data: {error.message}
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 lg:p-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Map View - Placeholder */}
      <Card className="lg:col-span-2 glass-effect dashboard-card shadow-xl">
        <CardHeader>
          <CardTitle className="flex items-center">
            <MapPin className="mr-2 text-blue-500" />
            Live Delivery Map
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-96 w-full rounded-md" />
          ) : (
            <MapContainer center={mapCenter} zoom={12} scrollWheelZoom={false} className="h-96 rounded-md z-0">
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              {deliveries.map((delivery) => (
                <Marker key={delivery.id} position={[delivery.currentLocation.lat, delivery.currentLocation.lng]}>
                  <Popup>
                    <b>Driver:</b> {delivery.driver.name} <br />
                    <b>Order:</b> {delivery.orderId} <br />
                    <b>Status:</b> {delivery.status}
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
          )}
        </CardContent>
      </Card>

      {/* Driver & Delivery Status */}
      <div className="space-y-6">
        <Card className="glass-effect dashboard-card shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Truck className="mr-2 text-green-500" />
              Ongoing Deliveries
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 max-h-96 overflow-y-auto">
            {isLoading
              ? Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex items-center space-x-4">
                    <Skeleton className="h-12 w-12 rounded-full" />
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-[150px]" />
                      <Skeleton className="h-4 w-[100px]" />
                    </div>
                  </div>
                ))
              : deliveries.map((delivery) => (
                  <div key={delivery.id} className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-900 interactive-element">
                    <div className="flex items-center space-x-3">
                      <Avatar>
                        <AvatarImage src={delivery.driver.avatar} alt={delivery.driver.name} />
                        <AvatarFallback>{delivery.driver.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-semibold">{delivery.driver.name}</p>
                        <p className="text-sm text-muted-foreground">{delivery.orderId}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge variant={getStatusBadgeVariant(delivery.status)}>{delivery.status}</Badge>
                      {delivery.status !== "Delivered" && (
                         <p className="text-sm text-muted-foreground flex items-center justify-end mt-1">
                           <Clock className="h-3 w-3 mr-1" /> {delivery.etaMinutes} min
                         </p>
                      )}
                    </div>
                  </div>
                ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default LastMileDelivery; 