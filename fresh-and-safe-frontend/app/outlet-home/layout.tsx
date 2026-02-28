"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { 
  LayoutDashboard, 
  Truck, 
  CheckCircle, 
  BarChart3, 
  Package, 
  User, 
  Settings, 
  LogOut, 
  Menu, 
  X,
  Store
} from "lucide-react";

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

  // 📱 Close sidebar automatically on mobile route change
  const handleMobileNavClick = () => {
    if (typeof window !== "undefined" && window.innerWidth < 768) {
      setIsSidebarOpen(false);
    }
  };

  // 📌 Outlet Navigation
  const navItems = [
    { name: "Dashboard", href: "/outlet-home", icon: LayoutDashboard },
    { name: "Out For Delivery", href: "/outlet-home/out-for-delivery", icon: Truck },
    { name: "Completed Orders", href: "/outlet-home/completed-orders", icon: CheckCircle },
    { name: "Sales Report", href: "/outlet-home/reports", icon: BarChart3 },
    { name: "Manage Products", href: "/outlet-home/outletviewproduct", icon: Package },
    { name: "Profile", href: "/outlet-home/profile", icon: User },
    { name: "Security", href: "/outlet-home/settings", icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex font-sans">
      
      {/* --- SIDEBAR --- */}
      <aside
        className={`bg-white border-r border-gray-200 w-64 min-h-screen flex-shrink-0 transition-transform duration-300 ease-in-out ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0 md:w-20 lg:w-64"
        } fixed md:relative z-40 flex flex-col shadow-[4px_0_24px_rgba(0,0,0,0.02)]`}
      >
        {/* Sidebar Header */}
        <div className="h-16 flex justify-between items-center px-6 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <div className="bg-red-600 p-1.5 rounded-lg flex items-center justify-center">
              <Store className="w-5 h-5 text-white" />
            </div>
            <h1 className={`text-xl font-bold text-gray-900 tracking-tight ${!isSidebarOpen && 'md:hidden lg:block'}`}>
              Fresh<span className="text-red-600">Outlet</span>
            </h1>
          </div>
          <button
            className="md:hidden text-gray-400 hover:text-gray-900 transition-colors p-1"
            onClick={() => setIsSidebarOpen(false)}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 mt-6 px-3 space-y-1.5 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = item.href === '/outlet-home' 
              ? pathname === item.href 
              : pathname.startsWith(item.href);
              
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={handleMobileNavClick}
                className={`flex items-center px-3 py-2.5 rounded-lg transition-all group ${
                  isActive
                    ? "bg-red-50 text-red-600 font-semibold"
                    : "text-gray-500 hover:bg-gray-50 hover:text-gray-900 font-medium"
                }`}
              >
                <Icon className={`w-5 h-5 flex-shrink-0 ${isActive ? "text-red-600" : "text-gray-400 group-hover:text-gray-600"}`} />
                <span className={`ml-3 ${!isSidebarOpen && 'md:hidden lg:block'}`}>{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* Logout Section */}
        <div className="p-4 border-t border-gray-100 bg-gray-50/50">
          <button
            onClick={handleLogout}
            className="flex items-center w-full px-3 py-2.5 text-gray-500 hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors group font-medium"
          >
            <LogOut className="w-5 h-5 flex-shrink-0 text-gray-400 group-hover:text-red-500 transition-colors" />
            <span className={`ml-3 ${!isSidebarOpen && 'md:hidden lg:block'}`}>Logout</span>
          </button>
        </div>
      </aside>

      {/* Mobile Overlay Backdrop */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-gray-900/20 backdrop-blur-sm z-30 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* --- MAIN CONTENT --- */}
      <main className="flex-1 flex flex-col min-h-screen overflow-hidden bg-gray-50 relative z-0">
        
        {/* Mobile Header */}
        <header className="md:hidden bg-white shadow-sm border-b border-gray-200 h-16 px-4 flex justify-between items-center sticky top-0 z-20">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="text-gray-500 p-2 -ml-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <Menu className="w-5 h-5" />
            </button>
            <span className="font-bold text-gray-900 tracking-tight">Outlet Panel</span>
          </div>
          <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
            <Store className="w-4 h-4 text-red-600" />
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 p-4 sm:p-8 overflow-y-auto">
          {children}
        </div>
      </main>
    </div>
  );
}