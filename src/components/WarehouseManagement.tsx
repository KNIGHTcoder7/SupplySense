import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardHeader, CardTitle, CardContent } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "./ui/dialog";
import { Pencil, Trash2, Plus } from "lucide-react";

interface Warehouse {
  id?: string;
  name: string;
  address: string;
}

const fetchWarehouses = async (): Promise<Warehouse[]> => {
  const res = await fetch("/api/warehouses");
  if (!res.ok) throw new Error("Failed to fetch warehouses");
  return res.json();
};

const WarehouseManagement = () => {
  const queryClient = useQueryClient();
  const { data: warehouses = [], isLoading } = useQuery<Warehouse[]>({
    queryKey: ["warehouses"],
    queryFn: fetchWarehouses,
  });

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Warehouse | null>(null);
  const [form, setForm] = useState<Warehouse>({ name: "", address: "" });

  const resetForm = () => {
    setForm({ name: "", address: "" });
    setEditing(null);
  };

  const addMutation = useMutation({
    mutationFn: async (warehouse: Warehouse) => {
      const res = await fetch("/api/warehouses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(warehouse),
      });
      if (!res.ok) throw new Error("Failed to add warehouse");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["warehouses"] });
      setDialogOpen(false);
      resetForm();
    },
  });

  const editMutation = useMutation({
    mutationFn: async (warehouse: Warehouse) => {
      const res = await fetch(`/api/warehouses/${warehouse.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(warehouse),
      });
      if (!res.ok) throw new Error("Failed to update warehouse");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["warehouses"] });
      setDialogOpen(false);
      resetForm();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/warehouses/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete warehouse");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["warehouses"] });
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
        <CardTitle>Warehouse Management</CardTitle>
        <Button onClick={() => { setDialogOpen(true); resetForm(); }} size="sm" variant="outline">
          <Plus className="w-4 h-4 mr-1" /> Add Warehouse
        </Button>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div>Loading warehouses...</div>
        ) : warehouses.length === 0 ? (
          <div className="text-muted-foreground">No warehouses found.</div>
        ) : (
          <div className="space-y-4">
            {warehouses.map((w) => (
              <div key={w.id} className="flex items-center justify-between border rounded p-3">
                <div>
                  <div className="font-semibold">{w.name}</div>
                  <div className="text-xs text-muted-foreground">{w.address}</div>
                </div>
                <div className="flex gap-2">
                  <Button size="icon" variant="ghost" onClick={() => { setEditing(w); setForm(w); setDialogOpen(true); }} aria-label="Edit">
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button size="icon" variant="ghost" onClick={() => deleteMutation.mutate(w.id!)} aria-label="Delete">
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
              <DialogTitle>{editing ? "Edit Warehouse" : "Add Warehouse"}</DialogTitle>
            </DialogHeader>
            <Input
              required
              placeholder="Name"
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            />
            <Input
              required
              placeholder="Address"
              value={form.address}
              onChange={e => setForm(f => ({ ...f, address: e.target.value }))}
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

export default WarehouseManagement; 