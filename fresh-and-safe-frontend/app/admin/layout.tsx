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

  // ✅ UNIQUE ID FOR EACH ITEM (VERY IMPORTANT)
  const navItems = [
    { id: "dashboard", name: "Dashboard", href: "/admin", icon: "🏠" },
    { id: "outlets", name: "Outlets", href: "/admin/outlets", icon: "🏪" },
    { id: "categories", name: "Categories", href: "/admin/categories", icon: "📁" },
    { id: "certificates", name: "Certificates", href: "/admin/certificates", icon: "📜" },
    { id: "banners", name: "Banners", href: "/admin/banners", icon: "🖼️" },
    { id: "products", name: "Products", href: "/admin/products", icon: "📦" },
    { id: "terms", name: "Terms & Conditions", href: "/admin/termsandconditions", icon: "📄" },
    { id: "refund", name: "Refund Policy", href: "/admin/refundpolicy", icon: "🔒" },
    { id: "news", name: "News", href: "/admin/news", icon: "📰" },
    { id: "faq", name: "FAQs", href: "/admin/faq", icon: "❓" },
    { id: "privacy", name: "Privacy Policy", href: "/admin/privacy", icon: "🛡️" },
    { id: "marquee", name: "Marquee", href: "/admin/marquee", icon: "🏃" },
    { id: "contact", name: "Contact Us", href: "/admin/contact", icon: "📞" },
    { id: "deals", name: "Daily Deals", href: "/admin/daily-deals", icon: "🔥" },
    { id: "coupons", name: "Coupons", href: "/admin/coupons", icon: "🎟️" },
    { id: "password", name: "Change Password", href: "/admin/change-password", icon: "🔑" },
    { id: "users", name: "Users", href: "/admin/users", icon: "👥" },
    { id: "sales", name: "Sales Overview", href: "/admin/sales", icon: "📊" },
    { id: "testimonials", name: "Testimonials", href: "/admin/testimonials", icon: "💬" },
  ];

  return (
    <div className="min-h-screen bg-gray-100 flex">
      {/* SIDEBAR */}
      <aside
        className={`bg-slate-800 text-white w-64 h-screen flex flex-col transition-all duration-300 ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-64"
        } fixed md:relative z-10`}
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

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto mt-4 px-2 space-y-2 custom-scrollbar">
          {navItems.map((item) => {
            const isActive =
              pathname === item.href || pathname.startsWith(item.href + "/");

            return (
              <Link
                key={item.id}
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

        {/* Logout */}
        <div className="p-4 border-t border-slate-700 bg-slate-800 flex-shrink-0">
          <button
            onClick={handleLogout}
            className="flex items-center w-full px-4 py-3 text-red-400 hover:bg-slate-700 hover:text-red-300 rounded-md transition-colors"
          >
            <span className="mr-3 text-lg">🚪</span>
            <span className="font-medium">Logout</span>
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Mobile Header */}
        <header className="md:hidden bg-white shadow-sm p-4 flex justify-between items-center flex-shrink-0">
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="text-gray-600 p-2 rounded hover:bg-gray-100"
          >
            ☰ Menu
          </button>
          <span className="font-bold text-slate-800">Admin Panel</span>
        </header>

        {/* Page Content */}
        <div className="flex-1 p-8 overflow-y-auto">{children}</div>
      </main>

      {/* Scrollbar Style */}
      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 5px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #1e293b;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #475569;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #10b981;
        }
      `}</style>
    </div>
  );
}
