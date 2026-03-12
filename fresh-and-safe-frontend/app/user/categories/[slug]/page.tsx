"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Heart } from "lucide-react";

interface Product {
  id: number;
  name: string;
  slug: string;
  price: number;
  compare_price?: number;
  image?: string;
  unit?: string;
}

export default function CategoryProductPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;

  const [products, setProducts] = useState<Product[]>([]);
  const [categoryName, setCategoryName] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [zipcode, setZipcode] = useState<string | null>(null);
  
  const [wishlist, setWishlist] = useState<Product[]>([]);

  useEffect(() => {
    const storedZip = localStorage.getItem("zipcode");
    if (!storedZip) {
      router.push("/");
      return;
    }
    setZipcode(storedZip);

    // 1. Instantly load local wishlist for fast UI
    const storedWishlist = localStorage.getItem("wishlist");
    if (storedWishlist) setWishlist(JSON.parse(storedWishlist));

    // 2. If User is logged in, fetch their true wishlist from the Database
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      const user = JSON.parse(storedUser);
      fetch(`http://localhost:8000/api/v1/wishlist/${user.id}`)
        .then(res => res.json())
        .then(dbWishlist => {
          setWishlist(dbWishlist);
          localStorage.setItem("wishlist", JSON.stringify(dbWishlist)); // Keep local in sync with DB
        })
        .catch(err => console.error("Failed to fetch DB wishlist", err));
    }

    // 3. Fetch Category Products
    const fetchData = async () => {
      try {
        const res = await fetch(`http://localhost:8000/api/v1/location-products/category/${slug}?zipcode=${storedZip}`);
        if (res.ok) {
          const data = await res.json();
          setCategoryName(data.category_name);
          setProducts(data.products || []);
        }
      } catch (err) {
        console.error("Error loading category:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [slug, router]);

  // ✅ Hybrid Toggle Logic
  const toggleWishlist = async (product: Product) => {
    let updatedWishlist;
    const isLoved = wishlist.some((item) => item.id === product.id);
    
    // Optimistic UI Update
    if (isLoved) {
      updatedWishlist = wishlist.filter((item) => item.id !== product.id);
    } else {
      updatedWishlist = [...wishlist, product];
    }
    
    setWishlist(updatedWishlist);
    localStorage.setItem("wishlist", JSON.stringify(updatedWishlist));

    // ✅ Sync to Database if Logged In
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

  return (
    <main className="min-h-screen bg-gray-50 pb-20">
      <header className="bg-white shadow-sm border-b sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <Link href="/" className="text-2xl font-extrabold text-green-600 tracking-tight">
            Fresh<span className="text-slate-800">&Safe</span>
          </Link>

          <div className="flex items-center gap-4">
            {zipcode && (
              <div className="bg-gray-100 text-gray-700 px-4 py-1.5 rounded-full text-xs font-bold">
                📍 {zipcode}
              </div>
            )}
            <Link href="/user/wishlist" className="p-2 text-gray-400 hover:text-red-500 transition-colors relative">
               <Heart className="w-6 h-6" />
               {wishlist.length > 0 && (
                 <span className="absolute top-0 right-0 bg-red-500 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                   {wishlist.length}
                 </span>
               )}
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-10">
        <div className="flex items-center gap-4 mb-8">
          <button onClick={() => router.back()} className="text-gray-500 hover:text-black font-medium transition">
            ← Back
          </button>
          {!loading && <h1 className="text-3xl font-bold text-slate-800 capitalize">{categoryName || slug}</h1>}
        </div>

        {loading && (
          <div className="h-64 flex flex-col items-center justify-center text-gray-400 gap-4">
            <div className="w-8 h-8 border-4 border-gray-200 border-t-green-500 rounded-full animate-spin"></div>
            Loading products...
          </div>
        )}

        {!loading && products.length === 0 && (
          <div className="text-center py-20 bg-white rounded-2xl border border-gray-100 shadow-sm">
            <div className="text-6xl mb-4">🥬</div>
            <h2 className="text-xl font-bold text-gray-700">No products found.</h2>
            <p className="text-gray-500">We are currently out of stock for {categoryName} in your area.</p>
          </div>
        )}

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {products.map((product) => {
            const isLoved = wishlist.some(item => item.id === product.id);

            return (
              <div key={product.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group relative">
                
                {/* Wishlist Button */}
                <button 
                  onClick={() => toggleWishlist(product)}
                  className="absolute top-3 right-3 z-10 p-2 bg-white/80 backdrop-blur-sm rounded-full shadow-sm hover:scale-110 transition-transform"
                >
                  <Heart className={`w-5 h-5 transition-colors duration-300 ${isLoved ? 'fill-red-500 text-red-500' : 'text-gray-400'}`} />
                </button>

                <div className="relative h-48 bg-gray-50 overflow-hidden">
                  {product.image ? (
                    <img src={`http://localhost:8000${product.image}`} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-300 font-bold">No Image</div>
                  )}
                </div>

                <div className="p-5">
                  <h3 className="font-bold text-gray-800 truncate mb-1 text-lg">{product.name}</h3>
                  <div className="flex items-baseline gap-2 mb-4">
                    <span className="text-2xl font-black text-green-700">₹{product.price}</span>
                    {product.compare_price && <span className="text-sm text-gray-400 line-through">₹{product.compare_price}</span>}
                  </div>
                  <button onClick={() => router.push(`/user/product/${product.slug}`)} className="w-full py-2 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 active:scale-95 transition-all shadow-md text-sm">
                    View Details
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </main>
  );
}