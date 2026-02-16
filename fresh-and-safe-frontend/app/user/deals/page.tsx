"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function AllDealsPage() {
  const router = useRouter();
  const [deals, setDeals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [zipcode, setZipcode] = useState<string | null>(null);

  useEffect(() => {
    // 1. Check Zipcode
    const storedZip = localStorage.getItem("zipcode");
    if (!storedZip) {
      router.push("/");
      return;
    }
    setZipcode(storedZip);

    // 2. Fetch Data
    const fetchData = async () => {
      try {
        const res = await fetch(`http://localhost:8000/api/v1/location-products?zipcode=${storedZip}`);
        if (res.ok) {
          const data = await res.json();
          setDeals(data.daily_deals || []);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [router]);

  return (
    <main className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <header className="bg-white shadow-sm border-b sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <Link href="/" className="text-2xl font-extrabold text-green-600 tracking-tight">
             Fresh<span className="text-slate-800">&Safe</span>
          </Link>
          {zipcode && (
            <div className="bg-gray-100 text-gray-700 px-4 py-1.5 rounded-full text-xs font-bold">
               📍 {zipcode}
            </div>
          )}
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-10">
        <div className="flex items-center gap-4 mb-8">
            <button onClick={() => router.back()} className="text-gray-500 hover:text-black font-medium">← Back</button>
            <h1 className="text-3xl font-bold text-red-600 flex items-center gap-2">
                <span className="text-4xl">🔥</span> Today's Exclusive Deals
            </h1>
        </div>

        {loading && <div className="text-center py-20 text-gray-400">Loading hot deals...</div>}

        {!loading && deals.length === 0 && (
            <div className="text-center py-20 bg-white rounded-xl shadow-sm border border-gray-100">
                <div className="text-6xl mb-4">🧊</div>
                <h3 className="text-xl font-bold text-gray-800">No deals active right now.</h3>
                <p className="text-gray-500">Check back later for fresh offers!</p>
            </div>
        )}

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {deals.map((product) => (
            <div key={product.id} className="bg-white rounded-xl shadow-sm border border-red-100 overflow-hidden hover:shadow-xl transition-all group">
                {/* Image Section */}
                <div className="relative h-48 bg-gray-50 overflow-hidden">
                    {product.image ? (
                        <img 
                            src={`http://localhost:8000${product.image}`} 
                            alt={product.name} 
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-300 font-bold">No Image</div>
                    )}
                    
                    <span className="absolute top-3 left-3 bg-red-600 text-white text-[10px] font-bold px-3 py-1 rounded-full animate-pulse">
                        LIMITED OFFER
                    </span>
                </div>

                {/* Content Section */}
                <div className="p-5">
                    <h3 className="font-bold text-gray-800 truncate mb-1 text-lg">{product.name}</h3>
                    
                    <div className="flex items-baseline gap-3 mb-4">
                        <span className="text-2xl font-black text-red-600">₹{product.price}</span>
                        {product.original_price && (
                            <span className="text-sm text-gray-400 line-through">₹{product.original_price}</span>
                        )}
                    </div>

                    <button className="w-full py-3 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700 active:scale-95 transition-all shadow-md">
                        Add to Cart
                    </button>
                </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}