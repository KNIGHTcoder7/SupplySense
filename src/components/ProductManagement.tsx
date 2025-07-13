import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Plus, Edit, Trash2, Filter, Download, Upload } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import ProductDialog from "./ProductDialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import { Product } from "@/types/Product";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

const fetchProducts = async () => {
  const res = await fetch("/api/products");
  if (!res.ok) throw new Error("Failed to fetch products");
  return res.json();
};

const addProduct = async (newProduct: Omit<Product, 'id' | 'lastRestocked'>) => {
  const res = await fetch("/api/products", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(newProduct),
  });
  if (!res.ok) throw new Error("Failed to add product");
  return res.json();
};

const updateProduct = async (updatedProduct: Product) => {
  if (!updatedProduct._id) throw new Error("Product _id is required for update");
  const res = await fetch(`/api/products/${updatedProduct._id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(updatedProduct),
  });
  if (!res.ok) throw new Error("Failed to update product");
  return res.json();
};

const ProductManagement = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: products = [], isLoading, isError } = useQuery<Product[]>({
    queryKey: ["products"],
    queryFn: fetchProducts
  });

  const mutation = useMutation({
    mutationFn: addProduct,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast({ title: "Success", description: "Product added successfully" });
      setDialogOpen(false);
    },
    onError: (error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  });

  const updateMutation = useMutation({
    mutationFn: updateProduct,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast({ title: "Success", description: "Product updated successfully" });
      setDialogOpen(false);
    },
    onError: (error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  });

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | undefined>();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'In Stock': return 'default';
      case 'Low Stock': return 'secondary';
      case 'Critical': return 'destructive';
      default: return 'outline';
    }
  };

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.sku.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleExport = () => {
    const csvHeaders = ['ID', 'Name', 'Category', 'SKU', 'Stock', 'Min Stock', 'Price', 'Supplier', 'Last Restocked', 'Status'];
    const csvData = filteredProducts.map(product => [
      product.id,
      product.name,
      product.category,
      product.sku,
      product.stock,
      product.min_stock,
      product.price,
      product.supplier,
      product.lastRestocked,
      product.status
    ]);

    const csvContent = [csvHeaders, ...csvData]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `products_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: "Export Successful",
      description: `Exported ${filteredProducts.length} products to CSV`,
    });
  };

  const handleExportExcel = () => {
    const ws = XLSX.utils.json_to_sheet(filteredProducts);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Products");
    XLSX.writeFile(wb, `products_${new Date().toISOString().split('T')[0]}.xlsx`);
    toast({ title: "Export Successful", description: `Exported ${filteredProducts.length} products to Excel` });
  };

  const handleExportPDF = () => {
    const doc = new jsPDF();
    doc.text("Products", 10, 10);
    filteredProducts.forEach((p, i) => {
      doc.text(`${p.id} | ${p.name} | ${p.category} | ${p.sku} | ${p.stock} | ${p.price}`, 10, 20 + i * 8);
    });
    doc.save(`products_${new Date().toISOString().split('T')[0]}.pdf`);
    toast({ title: "Export Successful", description: `Exported ${filteredProducts.length} products to PDF` });
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      const data = evt.target?.result;
      if (!data) return;
      let importedProducts: Product[] = [];
      if (file.name.endsWith(".csv")) {
        const text = data as string;
        const rows = text.split("\n").slice(1);
        importedProducts = rows.map(row => {
          const [id, name, category, sku, stock, min_stock, price, supplier, lastRestocked, status] = row.split(",");
          return { id, name, category, sku, stock: Number(stock), min_stock: Number(min_stock), price: Number(price), supplier, lastRestocked, status } as Product;
        }).filter(p => p.id);
      } else {
        const workbook = XLSX.read(data, { type: "binary" });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        importedProducts = XLSX.utils.sheet_to_json(sheet) as Product[];
      }
      queryClient.setQueryData(['products'], (oldData: Product[] = []) => [...oldData, ...importedProducts]);
      toast({ title: "Import Successful", description: `Imported ${importedProducts.length} products.` });
    };
    if (file.name.endsWith(".csv")) {
      reader.readAsText(file);
    } else {
      reader.readAsBinaryString(file);
    }
  };

  const handleAddProduct = () => {
    setEditingProduct(undefined);
    setDialogOpen(true);
  };

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
    setDialogOpen(true);
  };

  const handleDeleteProduct = async (productId: string) => {
    const previousProducts = queryClient.getQueryData<Product[]>(['products']) || [];
    const product = products.find(p => p.id === productId || p._id === productId);
    const backendId = product?._id;
    if (!backendId) {
      toast({ title: "Error", description: "Product _id not found for backend delete.", variant: "destructive" });
      return;
    }
    try {
      const res = await fetch(`/api/products/${backendId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Backend delete failed");
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast({ title: "Success", description: "Product deleted successfully." });
    } catch (error) {
      // Rollback local delete if backend fails
      queryClient.setQueryData<Product[]>(['products'], previousProducts);
      toast({ title: "Error", description: "Failed to delete product from backend.", variant: "destructive" });
    }
  };

  const handleSaveProduct = (product: Product) => {
    if (editingProduct) {
      updateMutation.mutate(product);
    } else {
      mutation.mutate(product);
    }
  };

  // Calculate counts based on real data, not status field
  const inStockCount = products.filter(p => p.stock > p.min_stock).length;
  const lowStockCount = products.filter(p => p.stock <= p.min_stock && p.stock > p.min_stock / 2).length;
  const criticalCount = products.filter(p => p.stock <= p.min_stock / 2).length;

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <Card className="glass-effect dashboard-card shadow-xl">
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <CardTitle>Product Management</CardTitle>
              <CardDescription>Manage your inventory products and stock levels</CardDescription>
            </div>
            <div className="flex gap-2 flex-wrap" role="toolbar" aria-label="Product actions">
              <Button variant="outline" size="sm" onClick={handleExport} aria-label="Export as CSV" className="focus:outline-none focus:ring-2 focus:ring-blue-400">
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
              <Button variant="outline" size="sm" onClick={handleExportExcel} aria-label="Export as Excel" className="focus:outline-none focus:ring-2 focus:ring-blue-400">
                <Download className="h-4 w-4 mr-2" />
                Export Excel
              </Button>
              <Button variant="outline" size="sm" onClick={handleExportPDF} aria-label="Export as PDF" className="focus:outline-none focus:ring-2 focus:ring-blue-400">
                <Download className="h-4 w-4 mr-2" />
                Export PDF
              </Button>
              <label className="inline-flex items-center" aria-label="Import products">
                <input type="file" accept=".csv,.xlsx,.xls" className="hidden" onChange={handleImport} />
                <Button variant="outline" size="sm" asChild className="focus:outline-none focus:ring-2 focus:ring-blue-400">
                  <span><Upload className="h-4 w-4 mr-2" />Import</span>
                </Button>
              </label>
              <Button size="sm" onClick={handleAddProduct} aria-label="Add Product" className="focus:outline-none focus:ring-2 focus:ring-purple-400">
                <Plus className="h-4 w-4 mr-2" />
                Add Product
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search products by name or SKU..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-[180px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="Electronics">Electronics</SelectItem>
                <SelectItem value="Footwear">Footwear</SelectItem>
                <SelectItem value="Appliances">Appliances</SelectItem>
                <SelectItem value="Accessories">Accessories</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Products Table */}
      <Card className="glass-effect rounded-xl shadow-md mt-4">
        <CardContent className="p-0">
          <Table className="glass-effect rounded-xl shadow-md mt-4 overflow-x-auto block min-w-full" role="table" aria-label="Product table">
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>SKU</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Stock</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Supplier</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && <TableRow><TableCell colSpan={8}>Loading...</TableCell></TableRow>}
              {isError && <TableRow><TableCell colSpan={8}>Error fetching products.</TableCell></TableRow>}
              {filteredProducts.map((product) => (
                <TableRow key={product._id || product.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{product.name}</div>
                      <div className="text-sm text-gray-500">ID: {product.id}</div>
                    </div>
                  </TableCell>
                  <TableCell className="font-mono text-sm">{product.sku}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{product.category}</Badge>
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{product.stock}</div>
                      <div className="text-sm text-gray-500">Min: {product.min_stock}</div>
                    </div>
                  </TableCell>
                  <TableCell>${product.price}</TableCell>
                  <TableCell>{product.supplier}</TableCell>
                  <TableCell>
                    <Badge variant={getStatusColor(product.status)} className="shadow-sm px-2 py-1 text-xs rounded-lg">
                      {product.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="sm" onClick={() => handleEditProduct(product)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This action cannot be undone. This will permanently delete the product "{product.name}".
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDeleteProduct(product.id)}>
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="glass-effect dashboard-card shadow-xl">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-600">{inStockCount}</div>
            <div className="text-sm text-gray-600">In Stock</div>
          </CardContent>
        </Card>
        <Card className="glass-effect dashboard-card shadow-xl">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-yellow-600">{lowStockCount}</div>
            <div className="text-sm text-gray-600">Low Stock</div>
          </CardContent>
        </Card>
        <Card className="glass-effect dashboard-card shadow-xl">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-red-600">{criticalCount}</div>
            <div className="text-sm text-gray-600">Critical</div>
          </CardContent>
        </Card>
        <Card className="glass-effect dashboard-card shadow-xl">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-blue-600">${products.reduce((sum, p) => sum + (p.stock * p.price), 0).toLocaleString()}</div>
            <div className="text-sm text-gray-600">Total Value</div>
          </CardContent>
        </Card>
      </div>

      <ProductDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        product={editingProduct}
        onSave={handleSaveProduct}
      />
    </div>
  );
};

export default ProductManagement;
