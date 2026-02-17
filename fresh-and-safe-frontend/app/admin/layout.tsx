"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // Logout Function
  const handleLogout = () => {
    // 1. Clear Token
    localStorage.removeItem("token");
    // 2. Redirect to Login
    router.push("/login");
  };

  // Navigation Links
  const navItems = [
    { name: "Dashboard", href: "/admin", icon: "🏠" },
    { name: "Outlets", href: "/admin/outlets", icon: "🏪" },
    { name: "Categories", href: "/admin/categories", icon: "📁" },
  { name: "Certificates", href: "/admin/certificates", icon: "📜" }, // ✅ NEW
  { name: "Banners", href: "/admin/banners", icon: "🖼️" },
  { name: "Products", href: "/admin/products", icon: "📦" }, 
  { name: "Terms & Conditions", href: "/admin/termsandconditions", icon: "📄"},
  { name: "Refund Policy", href: "/admin/refundpolicy", icon: "🔒" },
  { name: "News", href: "/admin/news", icon: "📰" },
  { name: "FAQs", href: "/admin/faq", icon: "❓" },
  { name: "Privacy Policy", href: "/admin/privacy", icon: "🛡️" },
  { name: "Marquee", href: "/admin/marquee", icon: "🏃" }, 
  { name: "Contact Us", href: "/admin/contact", icon: "📞" },
  { name: "Daily Deals", href: "/admin/daily-deals", icon: "🔥" },
  { name: "Coupons", href: "/admin/coupons", icon: "🎟️" },
  { name: "Change Password", href: "/admin/change-password", icon: "🔑" },
    { name: "Orders", href: "/admin/orders", icon: "🛒" },     // (Coming Soon)
    { name: "Users", href: "/admin/users", icon: "👥" },       // (Coming Soon)
  ];

  return (
    <div className="min-h-screen bg-gray-100 flex">
      {/* --- SIDEBAR --- */}
      <aside 
        className={`bg-slate-800 text-white w-64 min-h-screen flex-shrink-0 transition-all duration-300 ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-64"
        } fixed md:relative z-10`}
      >
        <div className="p-4 flex justify-between items-center border-b border-slate-700">
          <h1 className="text-xl font-bold text-green-400">FreshAdmin</h1>
          <button 
            className="md:hidden text-gray-400 hover:text-white"
            onClick={() => setIsSidebarOpen(false)}
          >
            ✕
          </button>
        </div>

        <nav className="mt-6 px-2 space-y-2">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center px-4 py-3 rounded-md transition-colors ${
                  isActive
                    ? "bg-green-600 text-white shadow-md"
                    : "text-gray-300 hover:bg-slate-700 hover:text-white"
                }`}
              >
                <span className="mr-3 text-lg">{item.icon}</span>
                <span className="font-medium">{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* LOGOUT BUTTON (Bottom) */}
        <div className="absolute bottom-0 w-full p-4 border-t border-slate-700 bg-slate-800">
          <button
            onClick={handleLogout}
            className="flex items-center w-full px-4 py-3 text-red-400 hover:bg-slate-700 hover:text-red-300 rounded-md transition-colors"
          >
            <span className="mr-3 text-lg">🚪</span>
            <span className="font-medium">Logout</span>
          </button>
        </div>
      </aside>

      {/* --- MAIN CONTENT --- */}
      <main className="flex-1 flex flex-col min-h-screen overflow-hidden">
        {/* Mobile Header (Hamburger) */}
        <header className="md:hidden bg-white shadow-sm p-4 flex justify-between items-center">
          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="text-gray-600 p-2 rounded hover:bg-gray-100"
          >
            ☰ Menu
          </button>
          <span className="font-bold text-slate-800">Admin Panel</span>
        </header>

        {/* Page Content */}
        <div className="flex-1 p-8 overflow-y-auto">
          {children}
        </div>
      </main>
    </div>
  );
}