"use client";
import { useEffect, useState } from "react";
import axios from "axios";

export default function OutletViewProduct() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  
  const outletId = typeof window !== "undefined" ? localStorage.getItem("outlet_id") : null;

  useEffect(() => {
    if (outletId) {
      // 1. Fetch immediately on load
      fetchProducts();

      // 2. Set up a timer to fetch every 5 seconds (5000ms)
      const intervalId = setInterval(() => {
        // We fetch silently (without setting loading state) to avoid flickering
        fetchProducts(true); 
      }, 5000);

      // 3. Cleanup: Stop the timer when the user leaves the page
      return () => clearInterval(intervalId);
    }
  }, [outletId]);

  // isBackground = true means "don't show the loading spinner"
  const fetchProducts = async (isBackground = false) => {
    if (!isBackground) setLoading(true);
    
    try {
      const res = await axios.get(
        `http://localhost:8000/api/v1/outlet/products/${outletId}`
      );
      setProducts(res.data);
    } catch (err) {
      console.error("Failed to fetch products");
    } finally {
      if (!isBackground) setLoading(false);
    }
  };

  const handleToggle = async (productId: number) => {
    try {
      // Optimistic Update: Change UI immediately before server responds
      setProducts(prev => prev.map(p => 
        p.id === productId ? { ...p, is_enabled: !p.is_enabled } : p
      ));

      await axios.post(
        "http://localhost:8000/api/v1/outlet/products/toggle",
        null,
        { params: { outlet_id: outletId, product_id: productId } }
      );
      // No need to fetchProducts() here because the Interval will catch it anyway!
    } catch (err) {
      console.error("Toggle failed");
      fetchProducts(true); // Revert changes on error
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-3">
          Manage Shop Inventory
          {/* Live Indicator */}
          <span className="flex h-3 w-3 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
          </span>
        </h1>
        <div className="text-sm text-gray-500 font-medium bg-gray-100 px-3 py-1 rounded-full">
            Auto-updating every 5s
        </div>
      </div>

      {loading && products.length === 0 && (
         <div className="text-center py-12">Loading products...</div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {products.map((product) => (
          <div
            key={product.id}
            className={`relative p-5 rounded-xl border-2 transition-all shadow-sm ${
                product.is_enabled ? "border-green-500 bg-green-50/30" : "border-gray-200 bg-white"
            }`}
          >
            <div className={`absolute top-4 right-4 px-3 py-1 rounded-full text-xs font-bold ${
                product.is_enabled ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
            }`}>
                {product.is_enabled ? "LIVE" : "HIDDEN"}
            </div>

            <div className="flex items-center gap-4 mb-4">
                <div className="w-20 h-20 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0">
                    {product.image ? (
                        <img src={`http://localhost:8000${product.image}`} alt={product.name} className="w-full h-full object-cover" />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">No Img</div>
                    )}
                </div>
                <div>
                    <h2 className="text-lg font-bold text-slate-900 leading-tight">{product.name}</h2>
                    <p className="text-sm text-gray-500 mt-1">{product.category_name}</p>
                </div>
            </div>

            <div className="flex justify-between items-center mb-4 px-1">
                 <div className="text-sm text-gray-600">Price: <span className="font-bold text-black">₹{product.price}</span></div>
            </div>

            <button
              onClick={() => handleToggle(product.id)}
              className={`w-full py-3 rounded-lg font-bold transition-colors ${
                product.is_enabled
                  ? "bg-red-100 text-red-600 hover:bg-red-200"
                  : "bg-green-600 text-white hover:bg-green-700 shadow-md"
              }`}
            >
              {product.is_enabled ? "Turn OFF" : "Turn ON"}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}