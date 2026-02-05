import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen bg-gray-50 font-sans">
      {/* Navbar */}
      <nav className="flex justify-between items-center px-8 py-4 bg-white shadow-sm">
        <div className="text-2xl font-bold text-green-600 tracking-tight">
          Fresh<span className="text-gray-800">&Safe</span>
        </div>
        <div className="space-x-6 text-sm font-medium">
          <Link href="/login" className="text-gray-600 hover:text-green-600 transition">
            Log In
          </Link>
          <button className="bg-green-600 text-white px-5 py-2 rounded-full hover:bg-green-700 transition">
            Shop Now
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="text-center py-24 bg-green-50 px-4">
        <h1 className="text-5xl md:text-6xl font-extrabold text-gray-900 mb-6">
          Fresh Fish & Meat, <br/> 
          <span className="text-green-600">Delivered Chemical-Free</span>
        </h1>
        <p className="text-xl text-gray-600 mb-10 max-w-2xl mx-auto">
          We deliver the freshest catch from the coast directly to your kitchen. 
          No preservatives, just pure taste.
        </p>
        <div className="flex justify-center gap-4">
          <button className="bg-green-600 text-white px-8 py-4 rounded-lg text-lg font-bold hover:bg-green-700 shadow-lg transition transform hover:-translate-y-1">
            Browse Products
          </button>
          <button className="bg-white text-green-700 border border-green-200 px-8 py-4 rounded-lg text-lg font-bold hover:bg-green-50 shadow-sm transition">
            Learn More
          </button>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 px-8 max-w-6xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 text-center">
            <div className="text-4xl mb-4">🐟</div>
            <h3 className="text-xl font-bold mb-2">Fresh Catch</h3>
            <p className="text-gray-500">Sourced directly from local fishermen daily.</p>
          </div>
          <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 text-center">
            <div className="text-4xl mb-4">❄️</div>
            <h3 className="text-xl font-bold mb-2">Chemical Free</h3>
            <p className="text-gray-500">0% Ammonia, 0% Formalin. Lab tested.</p>
          </div>
          <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 text-center">
            <div className="text-4xl mb-4">🚚</div>
            <h3 className="text-xl font-bold mb-2">Fast Delivery</h3>
            <p className="text-gray-500">Express delivery slots available near you.</p>
          </div>
        </div>
      </section>
    </main>
  );
}