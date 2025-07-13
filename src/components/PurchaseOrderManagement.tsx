import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardHeader, CardTitle, CardContent } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "./ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Pencil, Trash2, Plus } from "lucide-react";

interface Supplier {
  id: string;
  name: string;
}

interface Product {
  _id: string;
  name: string;
}

interface PurchaseOrderItem {
  product_id: string;
  quantity: number;
  price: number;
}

interface PurchaseOrder {
  id?: string;
  supplier_id: string;
  items: PurchaseOrderItem[];
  status: string;
  order_date: string;
  expected_delivery: string;
}

const fetchSuppliers = async (): Promise<Supplier[]> => {
  const res = await fetch("/api/suppliers");
  if (!res.ok) throw new Error("Failed to fetch suppliers");
  return res.json();
};

const fetchProducts = async (): Promise<Product[]> => {
  const res = await fetch("/api/products");
  if (!res.ok) throw new Error("Failed to fetch products");
  return res.json();
};

const fetchOrders = async (): Promise<PurchaseOrder[]> => {
  const res = await fetch("/api/purchase-orders");
  if (!res.ok) throw new Error("Failed to fetch purchase orders");
  return res.json();
};

const PurchaseOrderManagement = () => {
  const queryClient = useQueryClient();
  const { data: suppliers = [] } = useQuery<Supplier[]>({ queryKey: ["suppliers"], queryFn: fetchSuppliers });
  const { data: products = [] } = useQuery<Product[]>({ queryKey: ["products"], queryFn: fetchProducts });
  const { data: orders = [], isLoading } = useQuery<PurchaseOrder[]>({ queryKey: ["purchase-orders"], queryFn: fetchOrders });

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<PurchaseOrder | null>(null);
  const [form, setForm] = useState<PurchaseOrder>({
    supplier_id: "",
    items: [],
    status: "pending",
    order_date: "",
    expected_delivery: "",
  });

  const resetForm = () => {
    setForm({ supplier_id: "", items: [], status: "pending", order_date: "", expected_delivery: "" });
    setEditing(null);
  };

  const addMutation = useMutation({
    mutationFn: async (order: PurchaseOrder) => {
      const res = await fetch("/api/purchase-orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(order),
      });
      if (!res.ok) throw new Error("Failed to add purchase order");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["purchase-orders"] });
      setDialogOpen(false);
      resetForm();
    },
  });

  const editMutation = useMutation({
    mutationFn: async (order: PurchaseOrder) => {
      const res = await fetch(`/api/purchase-orders/${order.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(order),
      });
      if (!res.ok) throw new Error("Failed to update purchase order");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["purchase-orders"] });
      setDialogOpen(false);
      resetForm();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/purchase-orders/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete purchase order");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["purchase-orders"] });
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

  const handleAddItem = () => {
    setForm(f => ({ ...f, items: [...f.items, { product_id: "", quantity: 1, price: 0 }] }));
  };

  const handleItemChange = (idx: number, field: keyof PurchaseOrderItem, value: string | number) => {
    setForm(f => ({
      ...f,
      items: f.items.map((item, i) => i === idx ? { ...item, [field]: value } : item)
    }));
  };

  const handleRemoveItem = (idx: number) => {
    setForm(f => ({ ...f, items: f.items.filter((_, i) => i !== idx) }));
  };

  return (
    <Card className="max-w-3xl mx-auto mt-8">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Purchase Order Management</CardTitle>
        <Button onClick={() => { setDialogOpen(true); resetForm(); }} size="sm" variant="outline">
          <Plus className="w-4 h-4 mr-1" /> Add Purchase Order
        </Button>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div>Loading purchase orders...</div>
        ) : orders.length === 0 ? (
          <div className="text-muted-foreground">No purchase orders found.</div>
        ) : (
          <div className="space-y-4">
            {orders.map((o) => (
              <div key={o.id} className="flex items-center justify-between border rounded p-3">
                <div>
                  <div className="font-semibold">Supplier: {suppliers.find(s => s.id === o.supplier_id)?.name || o.supplier_id}</div>
                  <div className="text-xs text-muted-foreground">Status: {o.status} | Order Date: {o.order_date} | Expected: {o.expected_delivery}</div>
                  <div className="text-xs mt-1">Items:
                    <ul className="ml-4 list-disc">
                      {o.items.map((item, idx) => (
                        <li key={idx}>
                          {products.find(p => p._id === item.product_id)?.name || item.product_id} - Qty: {item.quantity} @ ${item.price}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button size="icon" variant="ghost" onClick={() => { setEditing(o); setForm(o); setDialogOpen(true); }} aria-label="Edit">
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button size="icon" variant="ghost" onClick={() => deleteMutation.mutate(o.id!)} aria-label="Delete">
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
              <DialogTitle>{editing ? "Edit Purchase Order" : "Add Purchase Order"}</DialogTitle>
            </DialogHeader>
            <Select
              required
              value={form.supplier_id}
              onValueChange={val => setForm(f => ({ ...f, supplier_id: val }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select Supplier" />
              </SelectTrigger>
              <SelectContent>
                {suppliers.map(s => (
                  <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="font-semibold">Items</div>
                <Button type="button" size="sm" variant="outline" onClick={handleAddItem}>
                  <Plus className="w-4 h-4 mr-1" /> Add Item
                </Button>
              </div>
              {form.items.map((item, idx) => (
                <div key={idx} className="flex gap-2 items-center">
                  <Select
                    required
                    value={item.product_id}
                    onValueChange={val => handleItemChange(idx, "product_id", val)}
                  >
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Product" />
                    </SelectTrigger>
                    <SelectContent>
                      {products.map(p => (
                        <SelectItem key={p._id} value={p._id}>{p.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input
                    required
                    type="number"
                    min={1}
                    className="w-20"
                    placeholder="Qty"
                    value={item.quantity}
                    onChange={e => handleItemChange(idx, "quantity", Number(e.target.value))}
                  />
                  <Input
                    required
                    type="number"
                    min={0}
                    step={0.01}
                    className="w-24"
                    placeholder="Price"
                    value={item.price}
                    onChange={e => handleItemChange(idx, "price", Number(e.target.value))}
                  />
                  <Button type="button" size="icon" variant="ghost" onClick={() => handleRemoveItem(idx)} aria-label="Remove">
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </Button>
                </div>
              ))}
            </div>
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
                <SelectItem value="ordered">Ordered</SelectItem>
                <SelectItem value="received">Received</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
            <Input
              required
              type="date"
              placeholder="Order Date"
              value={form.order_date}
              onChange={e => setForm(f => ({ ...f, order_date: e.target.value }))}
            />
            <Input
              required
              type="date"
              placeholder="Expected Delivery"
              value={form.expected_delivery}
              onChange={e => setForm(f => ({ ...f, expected_delivery: e.target.value }))}
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

export default PurchaseOrderManagement; 