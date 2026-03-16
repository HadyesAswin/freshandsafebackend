"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

// Interface for items in the cart
interface CartItem {
  id: number;
  name: string;
  price: number;
  image?: string;
  quantity: number;
}

export default function AllDealsPage() {
  const router = useRouter();
  const [deals, setDeals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [zipcode, setZipcode] = useState<string | null>(null);

  // ================================
  // Fetch Deals Based on Zipcode
  // ================================
  useEffect(() => {
    const storedZip = localStorage.getItem("zipcode");
    if (!storedZip) {
      router.push("/");
      return;
    }
    setZipcode(storedZip);

    const fetchData = async () => {
      try {
        const res = await fetch(`http://localhost:8000/api/v1/location-products?zipcode=${storedZip}`);
        if (res.ok) {
          const data = await res.json();
          setDeals(data.daily_deals || []);
        }
      } catch (err) {
        console.error("Error fetching deals:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [router]);

  // ================================
  // ✅ FIXED: Hybrid Add to Cart Logic
  // ================================
  const handleAddToCart = async (product: any) => {
    // 1. Always get the LATEST cart from localStorage first
    const existingCart = localStorage.getItem("cart");
    let currentCart: CartItem[] = existingCart ? JSON.parse(existingCart) : [];

    const existingIndex = currentCart.findIndex((item) => item.id === product.id);

    if (existingIndex > -1) {
      currentCart[existingIndex].quantity += 1;
    } else {
      currentCart.push({
        id: product.id,
        name: product.name,
        price: product.price,
        image: product.image,
        quantity: 1,
      });
    }

    // 2. Save locally immediately
    localStorage.setItem("cart", JSON.stringify(currentCart));

    // 3. Sync with DB if the user is logged in
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      const user = JSON.parse(storedUser);
      try {
        await fetch("http://localhost:8000/api/v1/cart/sync", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            user_id: user.id,
            // Sync the full cleaned list so the DB matches the UI exactly
            items: currentCart.map((i) => ({ product_id: i.id, quantity: i.quantity })),
          }),
        });
      } catch (err) {
        console.error("Database cloud sync failed:", err);
      }
    }

    alert(`🔥 ${product.name} added to cart!`);
  };

  return (
    <main className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <header className="bg-white shadow-sm border-b sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <Link href="/" className="text-2xl font-extrabold text-green-600 tracking-tight">
             Fresh<span className="text-slate-800">&Safe</span>
          </Link>
          {zipcode && (
            <div className="bg-gray-100 text-gray-700 px-4 py-1.5 rounded-full text-xs font-bold border border-gray-200">
               📍 Delivering to: {zipcode}
            </div>
          )}
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-10">
        <div className="flex items-center gap-4 mb-10">
            <button onClick={() => router.back()} className="bg-white border p-2 rounded-lg shadow-sm hover:bg-gray-50 transition-colors">
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7"></path></svg>
            </button>
            <h1 className="text-3xl font-black text-slate-800 flex items-center gap-3">
                <span className="text-red-600">🔥</span> Today's Exclusive Deals
            </h1>
        </div>

        {loading ? (
            <div className="flex flex-col items-center justify-center py-32">
                <div className="w-12 h-12 border-4 border-red-100 border-t-red-600 rounded-full animate-spin mb-4"></div>
                <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">Hunting for deals...</p>
            </div>
        ) : deals.length === 0 ? (
            <div className="text-center py-24 bg-white rounded-3xl shadow-sm border border-gray-100">
                <div className="text-7xl mb-6 grayscale">🧊</div>
                <h3 className="text-2xl font-black text-gray-800">Everything is standard price!</h3>
                <p className="text-gray-500 mt-2">No active deals found for your location right now.</p>
                <Link href="/" className="inline-block mt-8 text-green-600 font-black hover:underline tracking-tight">Browse All Products →</Link>
            </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
            {deals.map((product) => (
              <div key={product.id} className="bg-white rounded-3xl shadow-sm border border-transparent hover:border-red-100 overflow-hidden hover:shadow-2xl hover:shadow-red-50 transition-all duration-300 group">
                  {/* Image Section */}
                  <div className="relative h-56 bg-gray-50 overflow-hidden p-6 flex items-center justify-center">
                      {product.image ? (
                          <img 
                              src={`http://localhost:8000${product.image}`} 
                              alt={product.name} 
                              className="max-w-full max-h-full object-contain group-hover:scale-110 transition-transform duration-500"
                          />
                      ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-300 font-bold uppercase tracking-widest text-[10px]">No Image</div>
                      )}
                      
                      <div className="absolute top-4 left-4 flex flex-col gap-2">
                        <span className="bg-red-600 text-white text-[10px] font-black px-3 py-1 rounded-full shadow-lg shadow-red-200 animate-pulse">
                            DEAL OF THE DAY
                        </span>
                        {product.original_price && (
                          <span className="bg-white text-red-600 text-[10px] font-black px-3 py-1 rounded-full border border-red-100 shadow-sm w-fit">
                            SAVE ₹{product.original_price - product.price}
                          </span>
                        )}
                      </div>
                  </div>

                  {/* Content Section */}
                  <div className="p-6">
                      <Link href={`/product/${product.slug}`} className="block mb-2">
                        <h3 className="font-black text-slate-800 truncate text-lg group-hover:text-red-600 transition-colors leading-tight">
                          {product.name}
                        </h3>
                      </Link>
                      
                      <div className="flex items-baseline gap-3 mb-6">
                          <span className="text-3xl font-black text-red-600 tracking-tight">₹{product.price}</span>
                          {product.original_price && (
                              <span className="text-base text-gray-300 line-through font-bold">₹{product.original_price}</span>
                          )}
                      </div>

                      <button 
                        onClick={() => handleAddToCart(product)}
                        className="w-full py-4 bg-red-600 text-white font-black rounded-2xl hover:bg-red-700 active:scale-95 transition-all shadow-xl shadow-red-100 flex items-center justify-center gap-2"
                      >
                          Add to Cart
                      </button>
                  </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}