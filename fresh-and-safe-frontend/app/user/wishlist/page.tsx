"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Heart, HeartCrack, Trash2, AlertCircle } from "lucide-react";

interface Product {
  id: number;
  name: string;
  slug: string;
  price: number;
  compare_price?: number;
  image?: string;
  unit?: string;
  is_available?: boolean;
}

export default function WishlistPage() {
  const router = useRouter();
  const [wishlist, setWishlist] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchWishlistData = useCallback(() => {
    const storedUser = localStorage.getItem("user");
    const storedZip = localStorage.getItem("zipcode");
    const storedWishlist = localStorage.getItem("wishlist");
    const localWishlist = storedWishlist ? JSON.parse(storedWishlist) : [];

    if (storedUser) {
      const user = JSON.parse(storedUser);
      let fetchUrl = `http://localhost:8000/api/v1/wishlist/${user.id}`;
      if (storedZip && storedZip !== "undefined") {
          fetchUrl += `?zipcode=${storedZip}`;
      }

      fetch(fetchUrl)
        .then(res => res.json())
        .then(dbWishlist => {
          setWishlist(dbWishlist);
          localStorage.setItem("wishlist", JSON.stringify(dbWishlist));
          setLoading(false);
        })
        .catch(() => setLoading(false));
    } else {
      // ✅ GUEST LOGIC: Validate local wishlist against zipcode
      console.log("👤 Guest Wishlist: Validating with backend...");
      if (localWishlist.length > 0) {
        fetch(`http://localhost:8000/api/v1/wishlist/guest`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              zipcode: storedZip,
              items: localWishlist
            })
        })
        .then(res => res.json())
        .then(validatedItems => {
            setWishlist(validatedItems);
            localStorage.setItem("wishlist", JSON.stringify(validatedItems));
            setLoading(false);
        })
        .catch(() => {
            setWishlist(localWishlist);
            setLoading(false);
        });
      } else {
        setWishlist([]);
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    fetchWishlistData();

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'zipcode') {
        setLoading(true);
        fetchWishlistData();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [fetchWishlistData]);

  const removeFromWishlist = async (productId: number) => {
    const updatedWishlist = wishlist.filter(item => item.id !== productId);
    setWishlist(updatedWishlist);
    localStorage.setItem("wishlist", JSON.stringify(updatedWishlist));

    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      const user = JSON.parse(storedUser);
      try {
        await fetch("http://localhost:8000/api/v1/wishlist/sync", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            user_id: user.id,
            product_ids: updatedWishlist.map(item => item.id)
          })
        });
      } catch (error) {
        console.error("Wishlist sync failed", error);
      }
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center font-bold text-gray-500">Loading Wishlist...</div>;

  const unavailableItemsCount = wishlist.filter(item => item.is_available === false).length;

  return (
    <main className="min-h-screen bg-gray-50 pb-20">
      <header className="bg-white shadow-sm border-b sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <Link href="/" className="text-2xl font-extrabold text-green-600 tracking-tight">
            Fresh<span className="text-slate-800">&Safe</span>
          </Link>
          <Link href="/" className="text-sm font-bold text-green-600 hover:underline">
            Continue Shopping →
          </Link>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="flex items-center gap-3 mb-6 border-b pb-6">
          <Heart className="w-8 h-8 text-red-500 fill-red-500" />
          <h1 className="text-3xl font-black text-slate-800">My Wishlist</h1>
          <span className="bg-red-100 text-red-600 px-3 py-1 rounded-full text-xs font-bold ml-2">
            {wishlist.length} Items
          </span>
        </div>

        {unavailableItemsCount > 0 && (
            <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl mb-8 flex items-center gap-3">
                <AlertCircle className="w-6 h-6 flex-shrink-0" />
                <p className="text-sm font-bold">
                    You have {unavailableItemsCount} item(s) in your wishlist that are currently out of stock in your selected delivery area.
                </p>
            </div>
        )}

        {wishlist.length === 0 ? (
          <div className="bg-white p-16 rounded-3xl text-center shadow-sm border border-gray-100 max-w-2xl mx-auto mt-10">
            <HeartCrack className="w-20 h-20 text-gray-200 mx-auto mb-6" />
            <h2 className="text-2xl font-black text-slate-800 mb-2">Your wishlist is empty</h2>
            <p className="text-gray-500 mb-8 font-medium">Looks like you haven't saved any items you love yet.</p>
            <Link href="/" className="px-8 py-4 bg-green-600 text-white font-black rounded-xl hover:bg-green-700 shadow-lg shadow-green-100 transition-all">
              Discover Products
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {wishlist.map((product) => {
              const isUnavailable = product.is_available === false;

              return (
                <div key={product.id} className={`bg-white rounded-2xl shadow-sm border overflow-hidden transition-all duration-300 group relative ${isUnavailable ? 'opacity-60 border-red-200 bg-red-50/30' : 'border-gray-100 hover:shadow-lg hover:-translate-y-1'}`}>
                  
                  {isUnavailable && (
                    <div className="absolute top-0 left-0 bg-red-500 text-white px-3 py-1 rounded-br-lg shadow-sm flex items-center z-10">
                        <span className="text-[10px] font-black uppercase tracking-wider">Unavailable Here</span>
                    </div>
                  )}

                  <button 
                    onClick={() => removeFromWishlist(product.id)}
                    className="absolute top-3 right-3 z-10 p-2 bg-white/90 backdrop-blur-sm rounded-full shadow-sm hover:bg-red-50 hover:text-red-500 text-gray-400 transition-all"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>

                  <div className="relative h-48 bg-gray-50 overflow-hidden p-4 flex items-center justify-center">
                    {product.image ? (
                      <img src={`http://localhost:8000${product.image}`} alt={product.name} className={`w-full h-full object-contain ${!isUnavailable && 'group-hover:scale-105 transition-transform duration-500'}`} />
                    ) : (
                      <div className="text-gray-300 font-bold text-[10px] uppercase">No Image</div>
                    )}
                  </div>

                  <div className="p-5 border-t border-gray-50">
                    <h3 className={`font-black truncate mb-1 text-lg ${isUnavailable ? 'text-slate-500 line-through' : 'text-gray-800'}`}>
                      {product.name}
                    </h3>
                    <div className="flex items-baseline gap-2 mb-4">
                      <span className={`text-xl font-black ${isUnavailable ? 'text-gray-400' : 'text-slate-900'}`}>₹{product.price}</span>
                    </div>
                    
                    <button 
                      onClick={() => !isUnavailable && router.push(`/user/product/${product.slug}`)} 
                      disabled={isUnavailable}
                      className={`w-full py-3 font-black rounded-xl transition-all shadow-md text-sm ${isUnavailable ? 'bg-gray-300 text-gray-500 cursor-not-allowed shadow-none' : 'bg-gray-900 text-white hover:bg-black active:scale-95'}`}
                    >
                      {isUnavailable ? "Currently Unavailable" : "View & Buy"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}