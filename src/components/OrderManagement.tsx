import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardHeader, CardTitle, CardContent } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "./ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Pencil, Trash2, Plus } from "lucide-react";

interface Product {
  _id: string;
  name: string;
}

interface CustomerInfo {
  name: string;
  email: string;
  phone: string;
}

interface CustomerOrderItem {
  product_id: string;
  quantity: number;
  price: number;
}

interface CustomerOrder {
  id?: string;
  customer_info: CustomerInfo;
  items: CustomerOrderItem[];
  status: string;
  delivery_address: string;
  placed_date: string;
}

const fetchProducts = async (): Promise<Product[]> => {
  const res = await fetch("/api/products");
  if (!res.ok) throw new Error("Failed to fetch products");
  return res.json();
};

const fetchOrders = async (): Promise<CustomerOrder[]> => {
  const res = await fetch("/api/orders");
  if (!res.ok) throw new Error("Failed to fetch orders");
  return res.json();
};

const OrderManagement = () => {
  const queryClient = useQueryClient();
  const { data: products = [] } = useQuery<Product[]>({ queryKey: ["products"], queryFn: fetchProducts });
  const { data: orders = [], isLoading } = useQuery<CustomerOrder[]>({ queryKey: ["orders"], queryFn: fetchOrders });

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<CustomerOrder | null>(null);
  const [form, setForm] = useState<CustomerOrder>({
    customer_info: { name: "", email: "", phone: "" },
    items: [],
    status: "pending",
    delivery_address: "",
    placed_date: "",
  });

  const resetForm = () => {
    setForm({ customer_info: { name: "", email: "", phone: "" }, items: [], status: "pending", delivery_address: "", placed_date: "" });
    setEditing(null);
  };

  const addMutation = useMutation({
    mutationFn: async (order: CustomerOrder) => {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(order),
      });
      if (!res.ok) throw new Error("Failed to add order");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      setDialogOpen(false);
      resetForm();
    },
  });

  const editMutation = useMutation({
    mutationFn: async (order: CustomerOrder) => {
      const res = await fetch(`/api/orders/${order.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(order),
      });
      if (!res.ok) throw new Error("Failed to update order");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      setDialogOpen(false);
      resetForm();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/orders/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete order");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
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

  const handleItemChange = (idx: number, field: keyof CustomerOrderItem, value: string | number) => {
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
        <CardTitle>Order Management</CardTitle>
        <Button onClick={() => { setDialogOpen(true); resetForm(); }} size="sm" variant="outline">
          <Plus className="w-4 h-4 mr-1" /> Add Order
        </Button>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div>Loading orders...</div>
        ) : orders.length === 0 ? (
          <div className="text-muted-foreground">No orders found.</div>
        ) : (
          <div className="space-y-4">
            {orders.map((o) => (
              <div key={o.id} className="flex items-center justify-between border rounded p-3">
                <div>
                  <div className="font-semibold">{o.customer_info.name} ({o.customer_info.email}, {o.customer_info.phone})</div>
                  <div className="text-xs text-muted-foreground">Status: {o.status} | Placed: {o.placed_date} | Address: {o.delivery_address}</div>
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
              <DialogTitle>{editing ? "Edit Order" : "Add Order"}</DialogTitle>
            </DialogHeader>
            <Input
              required
              placeholder="Customer Name"
              value={form.customer_info.name}
              onChange={e => setForm(f => ({ ...f, customer_info: { ...f.customer_info, name: e.target.value } }))}
            />
            <Input
              required
              type="email"
              placeholder="Customer Email"
              value={form.customer_info.email}
              onChange={e => setForm(f => ({ ...f, customer_info: { ...f.customer_info, email: e.target.value } }))}
            />
            <Input
              required
              placeholder="Customer Phone"
              value={form.customer_info.phone}
              onChange={e => setForm(f => ({ ...f, customer_info: { ...f.customer_info, phone: e.target.value } }))}
            />
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
                <SelectItem value="processing">Processing</SelectItem>
                <SelectItem value="shipped">Shipped</SelectItem>
                <SelectItem value="delivered">Delivered</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
            <Input
              required
              placeholder="Delivery Address"
              value={form.delivery_address}
              onChange={e => setForm(f => ({ ...f, delivery_address: e.target.value }))}
            />
            <Input
              required
              type="date"
              placeholder="Placed Date"
              value={form.placed_date}
              onChange={e => setForm(f => ({ ...f, placed_date: e.target.value }))}
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

export default OrderManagement; 