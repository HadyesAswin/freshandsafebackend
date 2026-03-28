"use client";
import { useEffect, useState } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import { Plus, Pencil, Trash2, Image as ImageIcon, Package, Filter } from "lucide-react";

export default function ProductsPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]); 
  const [selectedCategory, setSelectedCategory] = useState<string>(""); 
  const router = useRouter();

  // Fetch both products and categories
  const fetchData = async () => {
    try {
      const [productsRes, categoriesRes] = await Promise.all([
        axios.get("http://localhost:8000/api/v1/products/"),
        axios.get("http://localhost:8000/api/v1/categories/")
      ]);
      setProducts(productsRes.data);
      setCategories(categoriesRes.data);
    } catch (error) {
      console.error("Failed to fetch data", error);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this product?")) return;
    const token = localStorage.getItem("admin_token");

    try {
      await axios.delete(
        `http://localhost:8000/api/v1/products/${id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchData(); // Refresh the list
    } catch (error) {
      alert("Failed to delete product.");
    }
  };


  // ✅ NEW: Toggle Stock Status
  const handleToggleStock = async (id: number, currentAvailability: boolean) => {
    const token = localStorage.getItem("admin_token");
    try {
      await axios.patch(
        `http://localhost:8000/api/v1/products/${id}/availability`,
        { is_available: !currentAvailability },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchData(); // Refresh list immediately
    } catch (error) {
      alert("Failed to update stock status.");
    }
  };

  // Safe helper to get category name (handles both nested objects and raw IDs)
  const getCategoryName = (product: any) => {
    if (product.category?.name) return product.category.name;
    const matchedCategory = categories.find(c => c.id === product.category_id);
    return matchedCategory ? matchedCategory.name : "Uncategorized";
  };

  // Filter products based on selected category
  const filteredProducts = selectedCategory
    ? products.filter(p => p.category_id?.toString() === selectedCategory || p.category?.id?.toString() === selectedCategory)
    : products;

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-10">
      
      {/* Header Area */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Products</h1>
          <p className="text-sm text-gray-500 mt-1">Manage your inventory, pricing, and product details.</p>
        </div>
        <button
          onClick={() => router.push("/admin/products/form")}
          className="w-full sm:w-auto flex items-center justify-center gap-2 bg-red-600 text-white px-4 py-2.5 rounded-lg font-medium text-sm hover:bg-red-700 transition-all shadow-sm active:scale-[0.98]"
        >
          <Plus className="w-4 h-4" />
          Add Product
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-gray-400 hidden sm:block" />
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">
            Filter Category:
          </label>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full sm:w-auto bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-lg focus:ring-red-500 focus:border-red-500 block p-2 outline-none transition-colors min-w-[200px]"
          >
            <option value="">All Products</option>
            {categories.map((cat: any) => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Table Container */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm text-left text-gray-500">
            <thead className="text-xs text-gray-500 uppercase bg-gray-50/50 border-b border-gray-200">
              <tr>
                <th scope="col" className="px-6 py-4 font-medium w-24 text-center">Image</th>
                <th scope="col" className="px-6 py-4 font-medium">Name</th>
                <th scope="col" className="px-6 py-4 font-medium">Category</th>
                {/* ✅ Updated Header Title */}
                <th scope="col" className="px-6 py-4 font-medium">Price / Unit</th>
                <th scope="col" className="px-6 py-4 font-medium text-center">Status</th>
                <th scope="col" className="px-6 py-4 font-medium text-center">Stock</th>
                <th scope="col" className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <Package className="w-8 h-8 text-gray-300 mx-auto mb-3" />
                    <p className="text-sm text-gray-500 font-medium">
                      {selectedCategory ? "No products found in this category." : "No products found. Add your first product!"}
                    </p>
                  </td>
                </tr>
              ) : (
                filteredProducts.map((product) => (
                  <tr key={product.id} className="hover:bg-gray-50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex justify-center">
                        {product.image ? (
                          <img
                            src={`http://localhost:8000${product.image}`}
                            alt={product.name}
                            className="w-12 h-12 object-cover rounded-lg shadow-sm border border-gray-200 bg-white"
                          />
                        ) : (
                          <div className="w-12 h-12 bg-gray-50 rounded-lg border border-gray-100 flex items-center justify-center">
                            <ImageIcon className="w-5 h-5 text-gray-300" />
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 font-medium text-gray-900">
                      {product.name}
                    </td>
                    
                    <td className="px-6 py-4 text-gray-600">
                      <span className="bg-gray-100 text-gray-700 px-2.5 py-1 rounded-md text-xs font-medium border border-gray-200">
                        {getCategoryName(product)}
                      </span>
                    </td>

                    {/* ✅ Display Unit dynamically next to the Price */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="font-bold text-gray-900">₹{product.price}</span>
                      {product.unit && (
                        <span className="text-xs text-gray-500 font-medium ml-1">
                          / {product.unit}
                        </span>
                      )}
                      
                      {product.compare_price && (
                        <span className="text-xs text-gray-400 line-through ml-2 font-medium">
                          ₹{product.compare_price}
                        </span>
                      )}
                    </td>

                    <td className="px-6 py-4 text-center">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                        product.status 
                        ? 'bg-green-50 text-green-700 border-green-200' 
                        : 'bg-red-50 text-red-700 border-red-200'
                      }`}>
                        {product.status ? "Active" : "Inactive"}
                      </span>
                    </td>
                    {/* ✅ NEW: The Stock Toggle Switch */}
                    <td className="px-6 py-4 text-center">
                      <div className="flex flex-col items-center gap-1.5">
                        <button
                          onClick={() => handleToggleStock(product.id, product.is_available)}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                            product.is_available ? 'bg-emerald-500 hover:bg-emerald-600' : 'bg-gray-300 hover:bg-gray-400'
                          }`}
                          title={product.is_available ? "Mark as Stockout" : "Mark as In Stock"}
                        >
                          <span 
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow-sm ${
                              product.is_available ? 'translate-x-6' : 'translate-x-1'
                            }`} 
                          />
                        </button>
                        <span className={`text-[10px] font-extrabold uppercase tracking-widest ${
                          product.is_available ? 'text-emerald-600' : 'text-gray-400'
                        }`}>
                          {product.is_available ? 'In Stock' : 'Stockout'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => router.push(`/admin/products/form?id=${product.id}`)}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Edit Product"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(product.id)}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete Product"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}