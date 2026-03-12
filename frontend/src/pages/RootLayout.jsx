import { useState } from "react";
import Sidebar from '../components/layout/Sidebar';
import TopNav from '../components/layout/TopNav';
import { Outlet } from "react-router-dom";

// Loading component for Suspense
export const rootLoader = () => (
  <div className="flex items-center justify-center min-vh-100">
    <div className="loader"></div>
  </div>
);

export default function RootLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <>
    <div className="flex flex-row">
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      {isSidebarOpen && <div className="mobile-overlay" onClick={() => setIsSidebarOpen(false)} />}
      <div className="flex flex-col grow bg-dark">
        <TopNav onMenuClick={() => setIsSidebarOpen(true)} />
        <main className="custom-bg p-6 text-white grow" >
            <Outlet />
        </main>
      </div>
    </div>
    </>
  );
};