import React from 'react';
import AccountDesktop from './AccountDesktop';
import AccountMobile from './AccountMobile';

export default function AccountPage() {
  return (
    <main className="min-h-screen bg-[#fafafa]">
      {/* MOBILE VIEW: Shows by default, hides on medium (md) screens and up */}
      <div className="block md:hidden">
        <AccountMobile />
      </div>

      {/* DESKTOP VIEW: Hidden by default, shows on medium (md) screens and up */}
      <div className="hidden md:block">
        <AccountDesktop />
      </div>
    </main>
  );
}