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

  const handleLogout = () => {
    localStorage.removeItem("token");
    router.push("/login");
  };

  // ✅ CLEANED: One entry per path, organized by priority
  const navItems = [
    // 1. Business Metrics
    { name: "Dashboard", href: "/admin", icon: "🏠" },
    { name: "Sales Overview", href: "/admin/sales", icon: "📊" },
    

    // 2. Core Store Management
    { name: "Outlets", href: "/admin/outlets", icon: "🏪" },
    { name: "Users", href: "/admin/users", icon: "👥" },
    { name: "Categories", href: "/admin/categories", icon: "📁" },
    { name: "Products", href: "/admin/products", icon: "📦" },
    { name: "Daily Deals", href: "/admin/daily-deals", icon: "🔥" },
    { name: "Coupons", href: "/admin/coupons", icon: "🎟️" },

    // 3. CMS / Marketing Content
    { name: "Banners", href: "/admin/banners", icon: "🖼️" },
    { name: "Certificates", href: "/admin/certificates", icon: "📜" },
    { name: "Testimonials", href: "/admin/testimonials", icon: "💬" },
    { name: "News", href: "/admin/news", icon: "📰" },
    { name: "Marquee", href: "/admin/marquee", icon: "🏃" },
    { name: "FAQs", href: "/admin/faq", icon: "❓" },

    // 4. Legal & Support
    { name: "Terms & Conditions", href: "/admin/termsandconditions", icon: "📄" },
    { name: "Refund Policy", href: "/admin/refundpolicy", icon: "🔒" },
    { name: "Privacy Policy", href: "/admin/privacy", icon: "🛡️" },
    { name: "Contact Us", href: "/admin/contact", icon: "📞" },

    // 5. Account
    { name: "Change Password", href: "/admin/change-password", icon: "🔑" },
  ];

  return (
    <div className="min-h-screen bg-gray-100 flex">
      {/* --- SIDEBAR --- */}
      <aside
        className={`bg-slate-800 text-white w-64 h-screen flex flex-col transition-all duration-300 ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-64"
        } fixed md:relative z-20`}
      >
        {/* Header */}
        <div className="p-4 flex justify-between items-center border-b border-slate-700 flex-shrink-0">
          <h1 className="text-xl font-bold text-green-400">FreshAdmin</h1>
          <button
            className="md:hidden text-gray-400 hover:text-white"
            onClick={() => setIsSidebarOpen(false)}
          >
            ✕
          </button>
        </div>

        {/* Scrollable Navigation */}
        <nav className="flex-1 overflow-y-auto mt-4 px-2 space-y-1 custom-scrollbar pb-24">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href} // ✅ Keys are now unique
                href={item.href}
                className={`flex items-center px-4 py-3 rounded-lg transition-all duration-200 ${
                  isActive
                    ? "bg-green-600 text-white shadow-lg shadow-green-900/20"
                    : "text-gray-300 hover:bg-slate-700/50 hover:text-white"
                }`}
              >
                <span className="mr-3 text-lg">{item.icon}</span>
                <span className="font-semibold text-sm">{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* Logout Button */}
        <div className="p-4 border-t border-slate-700 bg-slate-800 flex-shrink-0">
          <button
            onClick={handleLogout}
            className="flex items-center w-full px-4 py-3 text-red-400 hover:bg-red-500/10 hover:text-red-300 rounded-lg transition-colors group"
          >
            <span className="mr-3 text-lg group-hover:scale-110 transition-transform">🚪</span>
            <span className="font-bold text-sm uppercase tracking-wider">Logout</span>
          </button>
        </div>
      </aside>

      {/* --- MAIN CONTENT --- */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Mobile Header */}
        <header className="md:hidden bg-white shadow-sm p-4 flex justify-between items-center flex-shrink-0 z-10">
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="text-gray-600 p-2 rounded-lg bg-gray-50 font-bold text-xs flex items-center gap-2"
          >
            <span className="text-lg">☰</span> Menu
          </button>
          <span className="font-black text-slate-800 uppercase tracking-tighter italic">FreshPanel</span>
        </header>

        {/* Page Content */}
        <div className="flex-1 p-6 md:p-10 overflow-y-auto bg-gray-50/50">
          {children}
        </div>
      </main>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #334155;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #10b981;
        }
      `}</style>
    </div>
  );
}