import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardHeader, CardTitle, CardContent } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "./ui/dialog";
import { Pencil, Trash2, Plus } from "lucide-react";

interface Supplier {
  id?: string;
  name: string;
  contact_info: string;
  lead_time_days: number;
  reliability_score: number;
}

const fetchSuppliers = async (): Promise<Supplier[]> => {
  const res = await fetch("/api/suppliers");
  if (!res.ok) throw new Error("Failed to fetch suppliers");
  return res.json();
};

const SupplierManagement = () => {
  const queryClient = useQueryClient();
  const { data: suppliers = [], isLoading } = useQuery<Supplier[]>({
    queryKey: ["suppliers"],
    queryFn: fetchSuppliers,
  });

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Supplier | null>(null);
  const [form, setForm] = useState<Supplier>({
    name: "",
    contact_info: "",
    lead_time_days: 1,
    reliability_score: 1.0,
  });

  const resetForm = () => {
    setForm({ name: "", contact_info: "", lead_time_days: 1, reliability_score: 1.0 });
    setEditing(null);
  };

  const addMutation = useMutation({
    mutationFn: async (supplier: Supplier) => {
      const res = await fetch("/api/suppliers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(supplier),
      });
      if (!res.ok) throw new Error("Failed to add supplier");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["suppliers"] });
      setDialogOpen(false);
      resetForm();
    },
  });

  const editMutation = useMutation({
    mutationFn: async (supplier: Supplier) => {
      const res = await fetch(`/api/suppliers/${supplier.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(supplier),
      });
      if (!res.ok) throw new Error("Failed to update supplier");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["suppliers"] });
      setDialogOpen(false);
      resetForm();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/suppliers/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete supplier");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["suppliers"] });
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
        <CardTitle>Supplier Management</CardTitle>
        <Button onClick={() => { setDialogOpen(true); resetForm(); }} size="sm" variant="outline">
          <Plus className="w-4 h-4 mr-1" /> Add Supplier
        </Button>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div>Loading suppliers...</div>
        ) : suppliers.length === 0 ? (
          <div className="text-muted-foreground">No suppliers found.</div>
        ) : (
          <div className="space-y-4">
            {suppliers.map((s) => (
              <div key={s.id} className="flex items-center justify-between border rounded p-3">
                <div>
                  <div className="font-semibold">{s.name}</div>
                  <div className="text-xs text-muted-foreground">Contact: {s.contact_info}</div>
                  <div className="text-xs">Lead Time: {s.lead_time_days} days | Reliability: {s.reliability_score}</div>
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
              <DialogTitle>{editing ? "Edit Supplier" : "Add Supplier"}</DialogTitle>
            </DialogHeader>
            <Input
              required
              placeholder="Name"
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            />
            <Input
              required
              placeholder="Contact Info"
              value={form.contact_info}
              onChange={e => setForm(f => ({ ...f, contact_info: e.target.value }))}
            />
            <Input
              type="number"
              min={1}
              step={1}
              value={form.lead_time_days}
              onChange={e => setForm({ ...form, lead_time_days: Number(e.target.value) })}
              placeholder="Lead Time Days"
              className="mb-2"
            />
            <div className="mb-2">
              <label htmlFor="reliability-score" className="block text-sm font-medium text-gray-700 mb-1">Reliability Score: {form.reliability_score}</label>
              <input
                id="reliability-score"
                type="range"
                min={0}
                max={1}
                step={0.01}
                value={form.reliability_score}
                onChange={e => setForm({ ...form, reliability_score: Number(e.target.value) })}
                className="w-full"
              />
            </div>
            <DialogFooter>
              <Button type="submit">{editing ? "Update" : "Add"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default SupplierManagement; 