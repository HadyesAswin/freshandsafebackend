"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";

export default function OutletLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // 🔐 Protect Route (Check Outlet Token)
  useEffect(() => {
    const token = localStorage.getItem("outlet_token");
    if (!token) {
      router.push("/shop-login");
    }
  }, [router]);

  // 🚪 Logout
  const handleLogout = () => {
    localStorage.removeItem("outlet_token");
    localStorage.removeItem("outlet_id");
    router.push("/shop-login");
  };

  // 📌 Outlet Navigation
  const navItems = [
    { name: "Dashboard", href: "/outlet-home", icon: "🏠" },
    { name: "Out For Delivery", href: "/outlet-home/out-for-delivery", icon: "🚚" },
    { name: "Completed Orders", href: "/outlet-home/completed-orders", icon: "✅" },
    { name: "Sales Report", href: "/outlet-home/reports", icon: "📊" },
    { name: "Manage Products", href: "/outlet-home/outletviewproduct", icon: "📦" },
    { name: "Profile", href: "/outlet-home/profile", icon: "👤" },
    { name: "ChangePassword", href: "/outlet-home/settings", icon: "⚙️" },
  ];

  return (
    <div className="min-h-screen bg-gray-100 flex">
      {/* --- SIDEBAR --- */}
      <aside
        className={`bg-green-800 text-white w-64 min-h-screen flex-shrink-0 transition-all duration-300 ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-64"
        } fixed md:relative z-10`}
      >
        <div className="p-4 flex justify-between items-center border-b border-green-700">
          <h1 className="text-xl font-bold text-white">FreshOutlet</h1>
          <button
            className="md:hidden text-gray-300 hover:text-white"
            onClick={() => setIsSidebarOpen(false)}
          >
            ✕
          </button>
        </div>

        <nav className="mt-6 px-2 space-y-2">
          {navItems.map((item) => {
            const isActive = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center px-4 py-3 rounded-md transition-colors ${
                  isActive
                    ? "bg-green-600 text-white shadow-md"
                    : "text-gray-200 hover:bg-green-700 hover:text-white"
                }`}
              >
                <span className="mr-3 text-lg">{item.icon}</span>
                <span className="font-medium">{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* LOGOUT */}
        <div className="absolute bottom-0 w-full p-4 border-t border-green-700 bg-green-800">
          <button
            onClick={handleLogout}
            className="flex items-center w-full px-4 py-3 text-red-300 hover:bg-green-700 hover:text-red-200 rounded-md transition-colors"
          >
            <span className="mr-3 text-lg">🚪</span>
            <span className="font-medium">Logout</span>
          </button>
        </div>
      </aside>

      {/* --- MAIN CONTENT --- */}
      <main className="flex-1 flex flex-col min-h-screen overflow-hidden">
        {/* Mobile Header */}
        <header className="md:hidden bg-white shadow-sm p-4 flex justify-between items-center">
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="text-gray-600 p-2 rounded hover:bg-gray-100"
          >
            ☰ Menu
          </button>
          <span className="font-bold text-green-800">Outlet Panel</span>
        </header>

        {/* Page Content */}
        <div className="flex-1 p-8 overflow-y-auto">{children}</div>
      </main>
    </div>
  );
}
