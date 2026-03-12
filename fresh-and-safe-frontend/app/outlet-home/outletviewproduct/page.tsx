"use client";
import { useEffect, useState } from "react";
import axios from "axios";
import { 
  Package, 
  Activity, 
  Image as ImageIcon, 
  Power, 
  Loader2 
} from "lucide-react";

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
    <div className="space-y-6 animate-in fade-in duration-500 pb-10">
      
      {/* Header Area */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-gray-200">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
            <Package className="w-6 h-6 text-red-600" />
            Manage Shop Inventory
            {/* Premium Red Live Indicator */}
            <span className="flex h-2.5 w-2.5 relative ml-2 mt-1">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-600"></span>
            </span>
          </h1>
          <p className="text-sm text-gray-500 mt-1">Control which products are visible to customers in your outlet.</p>
        </div>
        
        <div className="flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-semibold text-gray-600 shadow-sm">
          <Activity className="w-3.5 h-3.5 text-red-500" /> 
          Auto-sync active (5s)
        </div>
      </div>

      {loading && products.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-gray-500 gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-red-600" />
          <p className="text-sm font-medium">Loading your inventory...</p>
        </div>
      )}

      {/* Products Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 pt-2">
        {products.map((product) => (
          <div
            key={product.id}
            className={`group relative flex flex-col bg-white p-5 rounded-2xl border transition-all duration-300 shadow-sm hover:shadow-md ${
                product.is_enabled 
                  ? "border-gray-200" 
                  : "border-gray-200 opacity-80 grayscale-[20%]"
            }`}
          >
            {/* Status Badge */}
            <div className="absolute top-4 right-4 z-10">
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                product.is_enabled 
                  ? "bg-green-50 text-green-700 border-green-200" 
                  : "bg-gray-100 text-gray-500 border-gray-200"
              }`}>
                {product.is_enabled ? "Published" : "Hidden"}
              </span>
            </div>

            {/* Product Info */}
            <div className="flex items-start gap-4 mb-5">
              <div className="w-20 h-20 bg-gray-50 rounded-xl border border-gray-100 overflow-hidden flex-shrink-0 flex items-center justify-center relative">
                {product.image ? (
                    <img 
                      src={`http://localhost:8000${product.image}`} 
                      alt={product.name} 
                      className="w-full h-full object-cover" 
                    />
                ) : (
                    <ImageIcon className="w-6 h-6 text-gray-300" />
                )}
                
                {/* Overlay if hidden */}
                {!product.is_enabled && (
                  <div className="absolute inset-0 bg-white/40 backdrop-blur-[1px]"></div>
                )}
              </div>
              
              <div className="flex-1 pt-1">
                  <h2 className="text-base font-bold text-gray-900 leading-tight line-clamp-2 pr-16">
                    {product.name}
                  </h2>
                  <p className="text-xs font-medium text-gray-500 mt-1 uppercase tracking-wider">
                    {product.category_name}
                  </p>
                  
                  {/* ✅ Added the Product Unit here! */}
                  <div className="mt-2 inline-flex items-center font-bold text-gray-900 bg-gray-50 px-2 py-0.5 rounded-md border border-gray-100 text-sm">
                    ₹{product.price}
                    {product.unit && (
                      <span className="text-xs text-gray-500 font-medium ml-1.5">
                        / {product.unit}
                      </span>
                    )}
                  </div>
              </div>
            </div>

            {/* Action Button */}
            <div className="mt-auto pt-4 border-t border-gray-100">
              <button
                onClick={() => handleToggle(product.id)}
                className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-bold transition-all active:scale-[0.98] ${
                  product.is_enabled
                    ? "bg-white text-gray-600 border border-gray-200 hover:bg-red-50 hover:text-red-600 hover:border-red-200"
                    : "bg-red-600 text-white border border-red-600 hover:bg-red-700 shadow-sm"
                }`}
              >
                <Power className="w-4 h-4" />
                {product.is_enabled ? "Hide Product" : "Publish to Store"}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}