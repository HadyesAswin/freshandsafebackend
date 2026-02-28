"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import {
  LayoutDashboard,
  TrendingUp,
  Store,
  Users,
  FolderTree,
  Package,
  Zap,
  Ticket,
  Image as ImageIcon,
  Award,
  MessageSquare,
  Newspaper,
  MonitorPlay,
  HelpCircle,
  FileText,
  ShieldCheck,
  ShieldAlert,
  Phone,
  KeyRound,
  LogOut,
  Menu,
  X,
} from "lucide-react";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  
  // ✅ ADDED: isMounted state to prevent Next.js Server-Side Rendering (SSR) flashes
  const [isMounted, setIsMounted] = useState(false);
  const [isAuthorized, setIsAuthorized] = useState(false);

  // ✅ THE SECURITY GUARD: Checks token on mount AND on every URL change
  useEffect(() => {
    setIsMounted(true); // Tells the app we are safely in the browser now

    const token = localStorage.getItem("admin_token");
    if (!token) {
      setIsAuthorized(false);
      // Immediately destroy history and kick to login
      router.replace("/login"); 
    } else {
      setIsAuthorized(true);
    }
  }, [pathname, router]); // <-- Added 'pathname' so it checks every time the URL changes

  const handleLogout = () => {
    const confirmLogout = window.confirm("Are you sure you want to logout?");
    
    if (confirmLogout) {
      localStorage.removeItem("admin_token"); 
      router.replace("/login"); 
    }
  };

  // ✅ STRICT RETURN: Returns absolutely nothing until the browser verifies the token.
  // This completely kills the bug where navigating directly to /admin/coupons loads the page.
  if (!isMounted || !isAuthorized) {
    return null;
  }

  // ✅ Kept exact same routes and names, swapped emojis for minimal Lucide icons
  const navItems = [
    // 1. Business Metrics
    { name: "Dashboard", href: "/admin", icon: LayoutDashboard },
    { name: "Sales Overview", href: "/admin/sales", icon: TrendingUp },

    // 2. Core Store Management
    { name: "Outlets", href: "/admin/outlets", icon: Store },
    { name: "Users", href: "/admin/users", icon: Users },
    { name: "Categories", href: "/admin/categories", icon: FolderTree },
    { name: "Products", href: "/admin/products", icon: Package },
    { name: "Daily Deals", href: "/admin/daily-deals", icon: Zap },
    { name: "Coupons", href: "/admin/coupons", icon: Ticket },

    // 3. CMS / Marketing Content
    { name: "Banners", href: "/admin/banners", icon: ImageIcon },
    { name: "Certificates", href: "/admin/certificates", icon: Award },
    { name: "Testimonials", href: "/admin/testimonials", icon: MessageSquare },
    { name: "News", href: "/admin/news", icon: Newspaper },
    { name: "Marquee", href: "/admin/marquee", icon: MonitorPlay },
    { name: "FAQs", href: "/admin/faq", icon: HelpCircle },

    // 4. Legal & Support
    { name: "Terms & Conditions", href: "/admin/termsandconditions", icon: FileText },
    { name: "Refund Policy", href: "/admin/refundpolicy", icon: ShieldAlert },
    { name: "Privacy Policy", href: "/admin/privacy", icon: ShieldCheck },
    { name: "Contact Us", href: "/admin/contact", icon: Phone },

    // 5. Account
    { name: "Change Password", href: "/admin/change-password", icon: KeyRound },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex font-sans">
      {/* SIDEBAR */}
      <aside
        className={`bg-white border-r border-gray-200 w-64 h-screen flex flex-col transition-all duration-300 ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-64"
        } fixed md:relative z-30`}
      >
        {/* Header */}
        <div className="h-16 flex justify-between items-center px-6 border-b border-gray-100 flex-shrink-0">
          <h1 className="text-xl font-bold text-gray-900 tracking-tight">
            Fresh & Safe<span className="text-red-600"> Admin</span>
          </h1>
          <button
            className="md:hidden text-gray-400 hover:text-gray-900 transition-colors"
            onClick={() => setIsSidebarOpen(false)}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Navigation */}
        <nav className="flex-1 overflow-y-auto mt-4 px-3 space-y-1 custom-scrollbar pb-6">
          {navItems.map((item) => {
            const isActive =
              pathname === item.href || pathname.startsWith(item.href + "/");
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => {
                  // ✅ Fix: Close sidebar on mobile when a link is clicked
                  if (window.innerWidth < 768) {
                    setIsSidebarOpen(false);
                  }
                }}
                className={`flex items-center px-3 py-2.5 rounded-md transition-colors duration-200 ${
                  isActive
                    ? "bg-red-50 text-red-600 font-medium"
                    : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                }`}
              >
                <Icon
                  className={`w-5 h-5 mr-3 flex-shrink-0 ${
                    isActive ? "text-red-600" : "text-gray-400"
                  }`}
                  strokeWidth={isActive ? 2.5 : 2}
                />
                <span className="text-sm">{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* Logout Button */}
        <div className="p-4 border-t border-gray-100 flex-shrink-0 bg-white">
          <button
            onClick={handleLogout}
            className="flex items-center w-full px-3 py-2.5 text-gray-600 hover:bg-red-50 hover:text-red-600 rounded-md transition-colors group"
          >
            <LogOut className="w-5 h-5 mr-3 flex-shrink-0 text-gray-400 group-hover:text-red-600 transition-colors" />
            <span className="font-medium text-sm">Logout</span>
          </button>
        </div>
      </aside>

      {/* Overlay for mobile when sidebar is open */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/20 z-20 md:hidden backdrop-blur-sm"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* MAIN CONTENT */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden min-w-0">
        {/* Mobile Header */}
        <header className="md:hidden h-16 bg-white border-b border-gray-200 px-4 flex justify-between items-center flex-shrink-0 z-10">
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="text-gray-600 p-2 -ml-2 rounded-md hover:bg-gray-100 flex items-center"
          >
            <Menu className="w-6 h-6" />
          </button>
          <span className="font-bold text-gray-900 tracking-tight">
            Fresh <span className="text-red-600">Admin</span>
          </span>
          <div className="w-8" /> {/* Spacer for centering */}
        </header>

        {/* Page Content */}
        <div className="flex-1 p-4 md:p-8 overflow-y-auto">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </div>
      </main>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #e5e7eb;
          border-radius: 20px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #d1d5db;
        }
      `}</style>
    </div>
  );
}