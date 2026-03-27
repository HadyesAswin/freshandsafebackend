"use client";

import { useState, useEffect } from "react";
import { Store, AlertTriangle, Save, Loader2, Search } from "lucide-react";

interface StockItem {
  shop_product_id: number | string;
  product_id: number;
  product_name: string;
  image: string | null;
  unit: string;
  stock: number;
  low_stock_threshold: number;
  is_available: boolean;
}

interface Outlet {
  id: number;
  name: string;
}

export default function StockManagement() {
  const [outlets, setOutlets] = useState<Outlet[]>([]);
  const [selectedOutlet, setSelectedOutlet] = useState<string>("");
  const [stockItems, setStockItems] = useState<StockItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Tracks the new stock values typed by the admin before saving
  const [stockEdits, setStockEdits] = useState<Record<number, number>>({});
  
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);


  // Helper to calculate total weight for display
  const calculateTotalWeight = (stock: number, unitStr: string) => {
    if (!unitStr) return null;
    
    // Extract numbers and type (g or kg)
    const match = unitStr.match(/(\d+)\s*(g|kg)/i);
    if (!match) return null;

    const value = parseFloat(match[1]);
    const type = match[2].toLowerCase();

    // Convert everything to KG for the "Total" display
    const totalKg = type === 'g' ? (value * stock) / 1000 : value * stock;
    
    return totalKg >= 1 ? `${totalKg} kg` : `${totalKg * 1000} g`;
  };

  // 1. Fetch Outlets on Load
  useEffect(() => {
    const fetchOutlets = async () => {
      try {
        // Replace with your actual endpoint that lists all outlets
        const res = await fetch("http://localhost:8000/api/v1/admin/outlets-list/"); // Added trailing slash 
        if (res.ok) {
          const data = await res.json();
          setOutlets(data);
          if (data.length > 0) setSelectedOutlet(data[0].id.toString());
        }
      } catch (error) {
        console.error("Failed to fetch outlets", error);
      }
    };
    fetchOutlets();
  }, []);

  // 2. Fetch Stock when an Outlet is selected
  useEffect(() => {
    if (!selectedOutlet) return;
    
    const fetchStock = async () => {
      setIsLoading(true);
      setStockItems([]);
      setStockEdits({});
      setMessage(null);
      try {
        const res = await fetch(`http://localhost:8000/api/v1/admin/stock/${selectedOutlet}/`); // Added trailing slash
        if (res.ok) {
          const data = await res.json();
          setStockItems(data);
        }
      } catch (error) {
        console.error("Failed to fetch stock", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchStock();
  }, [selectedOutlet]);

  // Handle Input Change
  const handleStockChange = (shopProductId: number | string, value: string) => {
    // Allow empty string so user can backspace everything
    if (value === "") {
      setStockEdits((prev) => ({
        ...prev,
        [shopProductId]: 0, // Set to 0 internally if cleared
      }));
      return;
    }

    const newStock = parseInt(value, 10);
    if (isNaN(newStock) || newStock < 0) return;

    setStockEdits((prev) => ({
      ...prev,
      [shopProductId]: newStock,
    }));
  };

  // Submit Bulk Update
  const handleSaveChanges = async () => {
    // ✅ FIX: Do NOT use parseInt here. Keep the ID as it is (could be "12" or "new_12")
    const updates = Object.entries(stockEdits).map(([id, newStock]) => ({
      shop_product_id: id, 
      new_stock: newStock,
    }));

    if (updates.length === 0) return;

    const confirmSave = window.confirm(`Are you sure you want to update the stock for ${updates.length} items?`);
    if (!confirmSave) return;

    setIsSaving(true);
    setMessage(null);

    try {
      // ✅ FIX: Ensure outlet_id is passed correctly in the URL
      const res = await fetch(`http://localhost:8000/api/v1/admin/stock/update?outlet_id=${selectedOutlet}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ updates }),
      });

      if (res.ok) {
        setMessage({ text: "Stock updated successfully!", type: "success" });
        setStockEdits({}); 
        
        // Refresh the table data
        const refreshRes = await fetch(`http://localhost:8000/api/v1/admin/stock/${selectedOutlet}`);
        if (refreshRes.ok) setStockItems(await refreshRes.json());
      } else {
        setMessage({ text: "Failed to update stock.", type: "error" });
      }
    } catch (error) {
      setMessage({ text: "Network error occurred.", type: "error" });
    } finally {
      setIsSaving(false);
      setTimeout(() => setMessage(null), 3000);
    }
  };

  // Filter items by search bar
  const filteredItems = stockItems.filter(item => 
    item.product_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const hasEdits = Object.keys(stockEdits).length > 0;

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Header & Controls */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-cyan-50 text-[#00b8d9] rounded-xl flex items-center justify-center">
            <Store size={24} />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-slate-800">Inventory Management</h1>
            <p className="text-sm text-slate-500 font-medium">Monitor and update outlet stock levels</p>
          </div>
        </div>

        <div className="flex items-center gap-4 w-full md:w-auto">
          <select
            value={selectedOutlet}
            onChange={(e) => setSelectedOutlet(e.target.value)}
            className="flex-1 md:w-48 bg-slate-50 border border-slate-200 text-slate-700 font-bold text-sm rounded-xl px-4 py-3 outline-none focus:border-[#00b8d9] transition-colors"
          >
            <option value="" disabled>Select Outlet</option>
            {outlets.map((outlet) => (
              <option key={outlet.id} value={outlet.id}>{outlet.name}</option>
            ))}
          </select>

          <button
            onClick={handleSaveChanges}
            disabled={!hasEdits || isSaving}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition-all ${
              hasEdits && !isSaving
                ? "bg-[#00b8d9] text-white hover:bg-[#00a2bf] shadow-md shadow-cyan-500/20 active:scale-95"
                : "bg-slate-100 text-slate-400 cursor-not-allowed"
            }`}
          >
            {isSaving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
            Save Changes
          </button>
        </div>
      </div>

      {/* Messages */}
      {message && (
        <div className={`p-4 rounded-xl font-bold text-sm flex items-center gap-2 ${message.type === 'success' ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' : 'bg-rose-50 text-rose-600 border border-rose-200'}`}>
          {message.text}
        </div>
      )}

      {/* Main Table Area */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden flex flex-col">
        {/* Search Bar */}
        <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center gap-3">
          <Search size={18} className="text-slate-400" />
          <input 
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search products..."
            className="bg-transparent border-none outline-none text-sm font-semibold text-slate-700 placeholder:text-slate-400 w-full"
          />
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-[10px] uppercase tracking-widest text-slate-400">
                <th className="p-4 font-black">Product</th>
                <th className="p-4 font-black text-center">Status</th>
                <th className="p-4 font-black text-center">Current Stock</th>
                <th className="p-4 font-black text-center">New Stock</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={4} className="p-12 text-center text-slate-400">
                    <Loader2 size={24} className="animate-spin mx-auto mb-2" />
                    <p className="font-semibold text-sm">Loading inventory...</p>
                  </td>
                </tr>
              ) : filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-12 text-center text-slate-400 font-semibold text-sm">
                    No products found for this outlet.
                  </td>
                </tr>
              ) : (
                filteredItems.map((item) => {
                  // Determine if we show the original stock or the un-saved edited stock
                  const displayedStock = stockEdits[item.shop_product_id] ?? item.stock;
                  const isLowStock = displayedStock <= item.low_stock_threshold;
                  const isEdited = stockEdits[item.shop_product_id] !== undefined;

                  return (
                    <tr key={item.shop_product_id} className={`transition-colors hover:bg-slate-50 ${isLowStock ? 'bg-rose-50/30' : ''}`}>
                      <td className="p-4">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-lg bg-slate-100 flex items-center justify-center overflow-hidden flex-shrink-0">
                            {item.image ? <img src={`http://localhost:8000${item.image}`} alt={item.product_name} className="w-full h-full object-cover" /> : "📦"}
                          </div>
                          <div>
                             {/* ✅ ADDED the unit right next to the name */}
                             <span className="font-bold text-slate-800 text-sm flex items-center gap-2">
                               {item.product_name} 
                               {item.unit && <span className="bg-slate-100 text-slate-500 text-[10px] px-2 py-0.5 rounded uppercase tracking-wider">{item.unit}</span>}
                             </span>
                          </div>
                        </div>
                      </td>
                      
                      <td className="p-4 text-center">
                        {isLowStock ? (
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-100 text-rose-700 text-xs font-bold">
                            <AlertTriangle size={12} /> Low Stock
                          </div>
                        ) : (
                          <div className="inline-flex items-center px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold">
                            In Stock
                          </div>
                        )}
                      </td>

                     <td className="p-4 text-center">
                        <div className="flex flex-col">
                            <span className="font-extrabold text-slate-800">{item.stock}</span>
                            <span className="text-[10px] text-slate-400 font-bold uppercase">
                            Total: {calculateTotalWeight(item.stock, item.unit)}
                            </span>
                        </div>
                     </td>

                      <td className="p-4">
                        <div className="flex flex-col items-center gap-1">
                            <div className="flex items-center justify-center gap-2">
                            <input
                                type="number"
                                min="0"
                                // ✅ FIX: Improved logic to allow backspacing to empty
                                value={stockEdits[item.shop_product_id] === 0 ? "" : (stockEdits[item.shop_product_id] ?? item.stock)}
                                onChange={(e) => handleStockChange(item.shop_product_id, e.target.value)}
                                placeholder="0"
                                className={`w-24 text-center font-bold text-sm py-2 rounded-xl border-2 outline-none transition-all ${
                                isEdited 
                                    ? "bg-cyan-50 border-[#00b8d9] text-[#00b8d9]" 
                                    : "bg-slate-50 border-slate-200 text-slate-800 focus:border-slate-300"
                                }`}
                            />
                            <span className="text-[10px] font-black text-slate-400 w-8 text-left uppercase leading-tight">
                                {item.unit || 'QTY'}
                            </span>
                            </div>
                            
                            {/* ✅ NEW: Weight Preview - shows exactly what the new total weight will be */}
                            {isEdited && (
                            <span className="text-[10px] text-[#00b8d9] font-black animate-in fade-in zoom-in duration-300">
                                Will be: {calculateTotalWeight(displayedStock, item.unit)}
                            </span>
                            )}
                        </div>
                        </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}