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

interface Product {
  _id: string;
  name: string;
}

interface StockTransferItem {
  product_id: string;
  quantity: number;
}

interface StockTransfer {
  id?: string;
  from_warehouse: string;
  to_warehouse: string;
  items: StockTransferItem[];
  status: string;
  transfer_date: string;
}

const fetchWarehouses = async (): Promise<Warehouse[]> => {
  const res = await fetch("/api/warehouses");
  if (!res.ok) throw new Error("Failed to fetch warehouses");
  return res.json();
};

const fetchProducts = async (): Promise<Product[]> => {
  const res = await fetch("/api/products");
  if (!res.ok) throw new Error("Failed to fetch products");
  return res.json();
};

const fetchTransfers = async (): Promise<StockTransfer[]> => {
  const res = await fetch("/api/stock-transfers");
  if (!res.ok) throw new Error("Failed to fetch stock transfers");
  return res.json();
};

const StockTransferManagement = () => {
  const queryClient = useQueryClient();
  const { data: warehouses = [] } = useQuery<Warehouse[]>({ queryKey: ["warehouses"], queryFn: fetchWarehouses });
  const { data: products = [] } = useQuery<Product[]>({ queryKey: ["products"], queryFn: fetchProducts });
  const { data: transfers = [], isLoading } = useQuery<StockTransfer[]>({ queryKey: ["stock-transfers"], queryFn: fetchTransfers });

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<StockTransfer | null>(null);
  const [form, setForm] = useState<StockTransfer>({
    from_warehouse: "",
    to_warehouse: "",
    items: [],
    status: "pending",
    transfer_date: "",
  });

  const resetForm = () => {
    setForm({ from_warehouse: "", to_warehouse: "", items: [], status: "pending", transfer_date: "" });
    setEditing(null);
  };

  const addMutation = useMutation({
    mutationFn: async (transfer: StockTransfer) => {
      const res = await fetch("/api/stock-transfers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(transfer),
      });
      if (!res.ok) throw new Error("Failed to add stock transfer");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["stock-transfers"] });
      setDialogOpen(false);
      resetForm();
    },
  });

  const editMutation = useMutation({
    mutationFn: async (transfer: StockTransfer) => {
      const res = await fetch(`/api/stock-transfers/${transfer.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(transfer),
      });
      if (!res.ok) throw new Error("Failed to update stock transfer");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["stock-transfers"] });
      setDialogOpen(false);
      resetForm();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/stock-transfers/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete stock transfer");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["stock-transfers"] });
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
    setForm(f => ({ ...f, items: [...f.items, { product_id: "", quantity: 1 }] }));
  };

  const handleItemChange = (idx: number, field: keyof StockTransferItem, value: string | number) => {
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
        <CardTitle>Stock Transfer Management</CardTitle>
        <Button onClick={() => { setDialogOpen(true); resetForm(); }} size="sm" variant="outline">
          <Plus className="w-4 h-4 mr-1" /> Add Stock Transfer
        </Button>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div>Loading stock transfers...</div>
        ) : transfers.length === 0 ? (
          <div className="text-muted-foreground">No stock transfers found.</div>
        ) : (
          <div className="space-y-4">
            {transfers.map((t) => (
              <div key={t.id} className="flex items-center justify-between border rounded p-3">
                <div>
                  <div className="font-semibold">From: {warehouses.find(w => w.id === t.from_warehouse)?.name || t.from_warehouse} → To: {warehouses.find(w => w.id === t.to_warehouse)?.name || t.to_warehouse}</div>
                  <div className="text-xs text-muted-foreground">Status: {t.status} | Date: {t.transfer_date}</div>
                  <div className="text-xs mt-1">Items:
                    <ul className="ml-4 list-disc">
                      {t.items.map((item, idx) => (
                        <li key={idx}>
                          {products.find(p => p._id === item.product_id)?.name || item.product_id} - Qty: {item.quantity}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button size="icon" variant="ghost" onClick={() => { setEditing(t); setForm(t); setDialogOpen(true); }} aria-label="Edit">
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button size="icon" variant="ghost" onClick={() => deleteMutation.mutate(t.id!)} aria-label="Delete">
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
              <DialogTitle>{editing ? "Edit Stock Transfer" : "Add Stock Transfer"}</DialogTitle>
            </DialogHeader>
            <div className="flex gap-2">
              <Select
                required
                value={form.from_warehouse}
                onValueChange={val => setForm(f => ({ ...f, from_warehouse: val }))}
              >
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="From Warehouse" />
                </SelectTrigger>
                <SelectContent>
                  {warehouses.map(w => (
                    <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select
                required
                value={form.to_warehouse}
                onValueChange={val => setForm(f => ({ ...f, to_warehouse: val }))}
              >
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="To Warehouse" />
                </SelectTrigger>
                <SelectContent>
                  {warehouses.map(w => (
                    <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
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
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
            <Input
              required
              type="date"
              placeholder="Transfer Date"
              value={form.transfer_date}
              onChange={e => setForm(f => ({ ...f, transfer_date: e.target.value }))}
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

export default StockTransferManagement; 