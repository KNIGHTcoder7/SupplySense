import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardHeader, CardTitle, CardContent } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "./ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Pencil, Trash2, Plus } from "lucide-react";

interface Warehouse {
  id: string;
  name: string;
}

interface PurchaseOrder {
  id: string;
  supplier_id: string;
}

interface Shipment {
  id?: string;
  purchase_order_id: string;
  warehouse_id: string;
  status: string;
  expected_delivery: string;
  actual_delivery: string;
}

const fetchWarehouses = async (): Promise<Warehouse[]> => {
  const res = await fetch("/api/warehouses");
  if (!res.ok) throw new Error("Failed to fetch warehouses");
  return res.json();
};

const fetchOrders = async (): Promise<PurchaseOrder[]> => {
  const res = await fetch("/api/purchase-orders");
  if (!res.ok) throw new Error("Failed to fetch purchase orders");
  return res.json();
};

const fetchShipments = async (): Promise<Shipment[]> => {
  const res = await fetch("/api/shipments");
  if (!res.ok) throw new Error("Failed to fetch shipments");
  return res.json();
};

const ShipmentManagement = () => {
  const queryClient = useQueryClient();
  const { data: warehouses = [] } = useQuery<Warehouse[]>({ queryKey: ["warehouses"], queryFn: fetchWarehouses });
  const { data: orders = [] } = useQuery<PurchaseOrder[]>({ queryKey: ["purchase-orders"], queryFn: fetchOrders });
  const { data: shipments = [], isLoading } = useQuery<Shipment[]>({ queryKey: ["shipments"], queryFn: fetchShipments });

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Shipment | null>(null);
  const [form, setForm] = useState<Shipment>({
    purchase_order_id: "",
    warehouse_id: "",
    status: "pending",
    expected_delivery: "",
    actual_delivery: "",
  });

  const resetForm = () => {
    setForm({ purchase_order_id: "", warehouse_id: "", status: "pending", expected_delivery: "", actual_delivery: "" });
    setEditing(null);
  };

  const addMutation = useMutation({
    mutationFn: async (shipment: Shipment) => {
      const res = await fetch("/api/shipments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(shipment),
      });
      if (!res.ok) throw new Error("Failed to add shipment");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shipments"] });
      setDialogOpen(false);
      resetForm();
    },
  });

  const editMutation = useMutation({
    mutationFn: async (shipment: Shipment) => {
      const res = await fetch(`/api/shipments/${shipment.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(shipment),
      });
      if (!res.ok) throw new Error("Failed to update shipment");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shipments"] });
      setDialogOpen(false);
      resetForm();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/shipments/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete shipment");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shipments"] });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editing) {
      editMutation.mutate({ ...form, id: editing.id });
    } else {
      addMutation.mutate(form);
    }
  };

  return (
    <Card className="max-w-2xl mx-auto mt-8">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Shipment Management</CardTitle>
        <Button onClick={() => { setDialogOpen(true); resetForm(); }} size="sm" variant="outline">
          <Plus className="w-4 h-4 mr-1" /> Add Shipment
        </Button>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div>Loading shipments...</div>
        ) : shipments.length === 0 ? (
          <div className="text-muted-foreground">No shipments found.</div>
        ) : (
          <div className="space-y-4">
            {shipments.map((s) => (
              <div key={s.id} className="flex items-center justify-between border rounded p-3">
                <div>
                  <div className="font-semibold">PO: {orders.find(o => o.id === s.purchase_order_id)?.id || s.purchase_order_id} → Warehouse: {warehouses.find(w => w.id === s.warehouse_id)?.name || s.warehouse_id}</div>
                  <div className="text-xs text-muted-foreground">Status: {s.status} | Expected: {s.expected_delivery} | Actual: {s.actual_delivery}</div>
                </div>
                <div className="flex gap-2">
                  <Button size="icon" variant="ghost" onClick={() => { setEditing(s); setForm(s); setDialogOpen(true); }} aria-label="Edit">
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button size="icon" variant="ghost" onClick={() => deleteMutation.mutate(s.id!)} aria-label="Delete">
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <DialogHeader>
              <DialogTitle>{editing ? "Edit Shipment" : "Add Shipment"}</DialogTitle>
            </DialogHeader>
            <Select
              required
              value={form.purchase_order_id}
              onValueChange={val => setForm(f => ({ ...f, purchase_order_id: val }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select Purchase Order" />
              </SelectTrigger>
              <SelectContent>
                {orders.map(o => (
                  <SelectItem key={o.id} value={o.id}>{o.id}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              required
              value={form.warehouse_id}
              onValueChange={val => setForm(f => ({ ...f, warehouse_id: val }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select Warehouse" />
              </SelectTrigger>
              <SelectContent>
                {warehouses.map(w => (
                  <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              required
              value={form.status}
              onValueChange={val => setForm(f => ({ ...f, status: val }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="in_transit">In Transit</SelectItem>
                <SelectItem value="received">Received</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
            <Input
              required
              type="date"
              placeholder="Expected Delivery"
              value={form.expected_delivery}
              onChange={e => setForm(f => ({ ...f, expected_delivery: e.target.value }))}
            />
            <Input
              type="date"
              placeholder="Actual Delivery"
              value={form.actual_delivery}
              onChange={e => setForm(f => ({ ...f, actual_delivery: e.target.value }))}
            />
            <DialogFooter>
              <Button type="submit">{editing ? "Update" : "Add"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default ShipmentManagement; 