"use client";
import { useState, useEffect } from "react";
import axios from "axios";

export default function CategoriesPage() {
  const [categories, setCategories] = useState([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    description: "",
    display_order: 0,
    status: true,
  });
  
  const [editingId, setEditingId] = useState<number | null>(null);
  const [message, setMessage] = useState("");

  // 1. Define fetchCategories correctly in scope
  const fetchCategories = async () => {
    try {
      const res = await axios.get("http://localhost:8000/api/v1/categories/");
      setCategories(res.data);
    } catch (err) {
      console.error("Failed to load categories", err);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleChange = (e: any) => {
    const { name, value, type, checked } = e.target;
    setFormData({ ...formData, [name]: type === "checkbox" ? checked : value });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) setSelectedFile(e.target.files[0]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");
    const token = localStorage.getItem("token");

    // CRITICAL: We use FormData to send the File and Form fields together
    const data = new FormData();
    data.append("name", formData.name);
    data.append("slug", formData.slug);
    data.append("description", formData.description || "");
    data.append("display_order", String(formData.display_order));
    data.append("status", String(formData.status));
    
    if (selectedFile) {
      data.append("image", selectedFile);
    }

    try {
      const url = editingId 
        ? `http://localhost:8000/api/v1/categories/${editingId}`
        : "http://localhost:8000/api/v1/categories/";
      
      const method = editingId ? "put" : "post";

      await axios({
        method: method,
        url: url,
        data: data,
        headers: { 
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data" 
        }
      });

      setMessage(editingId ? "✅ Updated successfully!" : "✅ Created successfully!");
      
      // Reset Form
      setFormData({ name: "", slug: "", description: "", display_order: 0, status: true });
      setSelectedFile(null);
      setEditingId(null);
      
      // 2. Refresh the list
      fetchCategories();

    } catch (err: any) {
      console.error("Upload failed", err);
      setMessage("❌ Error: " + (err.response?.data?.detail || "Action failed"));
    }
  };

  const handleEdit = (cat: any) => {
    setEditingId(cat.id);
    setFormData({
      name: cat.name,
      slug: cat.slug,
      description: cat.description || "",
      display_order: cat.display_order || 0,
      status: cat.status,
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this category?")) return;
    const token = localStorage.getItem("token");
    try {
      await axios.delete(`http://localhost:8000/api/v1/categories/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchCategories();
    } catch (err) { console.error(err); }
  };

  return (
    <div className="max-w-6xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6 text-gray-800">Manage Categories</h1>

      <div className="bg-white p-6 rounded-lg shadow-md mb-8">
        <h2 className="text-lg font-semibold mb-4">{editingId ? "✏️ Edit Category" : "➕ Add New Category"}</h2>
        
        {message && <p className="mb-4 font-bold text-sm">{message}</p>}

        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input name="name" value={formData.name} onChange={handleChange} placeholder="Category Name" className="border p-2 rounded" required />
          <input name="slug" value={formData.slug} onChange={handleChange} placeholder="Manual Slug (e.g. fresh-fish)" className="border p-2 rounded" required />
          
          <div className="flex flex-col">
            <label className="text-xs font-bold text-gray-500 mb-1">Category Image</label>
            <input type="file" onChange={handleFileChange} className="border p-1 rounded text-sm" accept="image/*" />
          </div>

          <input name="display_order" type="number" value={formData.display_order} onChange={handleChange} placeholder="Order" className="border p-2 rounded" />
          
          <textarea name="description" value={formData.description} onChange={handleChange} placeholder="Description" className="border p-2 rounded md:col-span-2" />
          
          <div className="flex items-center space-x-2">
            <input type="checkbox" name="status" checked={formData.status} onChange={handleChange} id="status" className="h-4 w-4 text-green-600" />
            <label htmlFor="status" className="text-sm font-medium">Is Active</label>
          </div>

          <div className="md:col-span-2 flex space-x-2">
            <button type="submit" className="bg-green-600 text-white px-6 py-2 rounded font-bold hover:bg-green-700">
              {editingId ? "Update" : "Save Category"}
            </button>
            {editingId && <button type="button" onClick={() => { setEditingId(null); setFormData({name: "", slug: "", description: "", display_order: 0, status: true}); }} className="bg-gray-400 text-white px-6 py-2 rounded">Cancel</button>}
          </div>
        </form>
      </div>

      {/* --- DATA TABLE --- */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <table className="min-w-full text-left">
          <thead className="bg-gray-100 text-xs font-bold text-gray-600 uppercase">
            <tr>
              <th className="px-6 py-3">Image</th>
              <th className="px-6 py-3">Details</th>
              <th className="px-6 py-3">Status</th>
              <th className="px-6 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {categories.map((cat: any) => (
              <tr key={cat.id} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                  {cat.image ? (
                    <img 
                      src={`http://localhost:8000${cat.image}`} 
                      alt={cat.name} 
                      className="w-12 h-12 object-cover rounded shadow-sm border" 
                    />
                  ) : (
                    <div className="w-12 h-12 bg-gray-200 rounded" />
                  )}
                </td>
                <td className="px-6 py-4">
                  <div className="font-bold text-gray-800">{cat.name}</div>
                  <div className="text-xs text-gray-500">{cat.slug}</div>
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded-full text-xs font-bold ${cat.status ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {cat.status ? "Active" : "Inactive"}
                  </span>
                </td>
                <td className="px-6 py-4 text-right space-x-3">
                  <button onClick={() => handleEdit(cat)} className="text-blue-600 font-bold hover:underline">Edit</button>
                  <button onClick={() => handleDelete(cat.id)} className="text-red-600 font-bold hover:underline">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}