"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function AllCategoriesPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [zipcode, setZipcode] = useState<string | null>(null);

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
          setCategories(data.categories || []);
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
            {/* ✅ Back button still works perfectly */}
            <button onClick={() => router.back()} className="text-gray-500 hover:text-black font-medium">← Back</button>
            <h1 className="text-3xl font-bold text-slate-800">All Categories</h1>
        </div>

        {loading && <div className="text-center py-20 text-gray-400">Loading categories...</div>}

        {!loading && categories.length === 0 && (
            <div className="text-center py-20">
                <p className="text-xl text-gray-500">No categories found in this area.</p>
            </div>
        )}

        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
          {categories.map((cat) => (
            <Link 
                key={cat.id} 
                // ✅ Make sure this link points to where your single category page is!
                // If single category is also under user, change to /user/category/${cat.slug}
                href={`/category/${cat.slug}`} 
                className="group bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-lg hover:border-green-200 transition-all text-center flex flex-col items-center"
            >
              <div className="w-24 h-24 mb-4 rounded-full bg-gray-50 overflow-hidden group-hover:scale-110 transition-transform duration-300">
                {cat.image ? (
                  <img src={`http://localhost:8000${cat.image}`} className="w-full h-full object-cover" alt={cat.name} />
                ) : <div className="w-full h-full flex items-center justify-center text-2xl">🥗</div>}
              </div>
              <h3 className="font-bold text-gray-700 group-hover:text-green-700">{cat.name}</h3>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}