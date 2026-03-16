// src/app/(user)/layout.tsx
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function UserLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // Note: No <html> or <body> tags here! Just a Fragment (<>)
    <>
      {/* The Traffic Controller Navbar (Desktop + Mobile) */}
      <Navbar />
      
      {/* MAIN WRAPPER:
         - pb-24 ensures mobile content isn't hidden behind the bottom bar.
         - md:pb-0 removes that bottom padding on desktop.
      */}
      <main className="min-h-screen pb-24 md:pb-0">
        {children}
      </main>

      <div className="hidden md:block">
        <Footer />
      </div>
    </>
  );
}