// src/components/Navbar.tsx
import DesktopNavbar from "./navigation/DesktopNavbar";
import MobileNavbar from "./navigation/MobileNavbar";
import MobileHomeHeader from "./navigation/MobileHomeHeader"; // <--- Import this

export default function Navbar() {
  return (
    <>
      {/* Desktop: Only shows on md screens */}
      <DesktopNavbar />
      
      {/* Mobile Top: Only shows on mobile home page */}
      <MobileHomeHeader />
      
      {/* Mobile Bottom: Shows on all mobile pages */}
      <MobileNavbar />
    </>
  );
}