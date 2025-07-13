import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardHeader, CardTitle, CardContent } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "./ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Pencil, Trash2, Plus } from "lucide-react";

interface Order {
  id: string;
  customer_info: { name: string };
}

interface Delivery {
  id?: string;
  order_id: string;
  status: string;
  delivery_date: string;
  proof_of_delivery?: string;
}

const fetchOrders = async (): Promise<Order[]> => {
  const res = await fetch("/api/orders");
  if (!res.ok) throw new Error("Failed to fetch orders");
  return res.json();
};

const fetchDeliveries = async (): Promise<Delivery[]> => {
  const res = await fetch("/api/deliveries");
  if (!res.ok) throw new Error("Failed to fetch deliveries");
  return res.json();
};

const DeliveryManagement = () => {
  const queryClient = useQueryClient();
  const { data: orders = [] } = useQuery<Order[]>({ queryKey: ["orders"], queryFn: fetchOrders });
  const { data: deliveries = [], isLoading } = useQuery<Delivery[]>({ queryKey: ["deliveries"], queryFn: fetchDeliveries });

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Delivery | null>(null);
  const [form, setForm] = useState<Delivery>({
    order_id: "",
    status: "pending",
    delivery_date: "",
    proof_of_delivery: "",
  });

  const resetForm = () => {
    setForm({ order_id: "", status: "pending", delivery_date: "", proof_of_delivery: "" });
    setEditing(null);
  };

  const addMutation = useMutation({
    mutationFn: async (delivery: Delivery) => {
      const res = await fetch("/api/deliveries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(delivery),
      });
      if (!res.ok) throw new Error("Failed to add delivery");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["deliveries"] });
      setDialogOpen(false);
      resetForm();
    },
  });

  const editMutation = useMutation({
    mutationFn: async (delivery: Delivery) => {
      const res = await fetch(`/api/deliveries/${delivery.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(delivery),
      });
      if (!res.ok) throw new Error("Failed to update delivery");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["deliveries"] });
      setDialogOpen(false);
      resetForm();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/deliveries/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete delivery");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["deliveries"] });
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
        <CardTitle>Delivery Management</CardTitle>
        <Button onClick={() => { setDialogOpen(true); resetForm(); }} size="sm" variant="outline">
          <Plus className="w-4 h-4 mr-1" /> Add Delivery
        </Button>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div>Loading deliveries...</div>
        ) : deliveries.length === 0 ? (
          <div className="text-muted-foreground">No deliveries found.</div>
        ) : (
          <div className="space-y-4">
            {deliveries.map((d) => (
              <div key={d.id} className="flex items-center justify-between border rounded p-3">
                <div>
                  <div className="font-semibold">Order: {orders.find(o => o.id === d.order_id)?.customer_info?.name || d.order_id}</div>
                  <div className="text-xs text-muted-foreground">Status: {d.status} | Date: {d.delivery_date}</div>
                  {d.proof_of_delivery && (
                    <div className="text-xs mt-1">Proof: {d.proof_of_delivery}</div>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button size="icon" variant="ghost" onClick={() => { setEditing(d); setForm(d); setDialogOpen(true); }} aria-label="Edit">
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button size="icon" variant="ghost" onClick={() => deleteMutation.mutate(d.id!)} aria-label="Delete">
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
              <DialogTitle>{editing ? "Edit Delivery" : "Add Delivery"}</DialogTitle>
            </DialogHeader>
            <Select
              required
              value={form.order_id}
              onValueChange={val => setForm(f => ({ ...f, order_id: val }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select Order" />
              </SelectTrigger>
              <SelectContent>
                {orders.map(o => (
                  <SelectItem key={o.id} value={o.id}>{o.customer_info?.name || o.id}</SelectItem>
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
                <SelectItem value="out_for_delivery">Out for Delivery</SelectItem>
                <SelectItem value="delivered">Delivered</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
            <Input
              required
              type="date"
              placeholder="Delivery Date"
              value={form.delivery_date}
              onChange={e => setForm(f => ({ ...f, delivery_date: e.target.value }))}
            />
            <Input
              placeholder="Proof of Delivery (URL or text)"
              value={form.proof_of_delivery || ""}
              onChange={e => setForm(f => ({ ...f, proof_of_delivery: e.target.value }))}
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

export default DeliveryManagement; 