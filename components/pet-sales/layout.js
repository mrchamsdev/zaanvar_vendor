// components/pet-sales/Layout.js
import React, { useState } from "react";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";

const Layout = ({
  children,
  menuItems = [],          // ✅ dynamic menu
  topbarButtons = [],       // ✅ dynamic topbar buttons
  logoText = "App Name",    // ✅ dynamic logo
  sidebarToggleButton = null // ✅ dynamic sidebar toggle/back button
}) => {
  const [isMobileOpen, setMobileOpen] = useState(false);

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      {/* Sidebar */}
      <Sidebar
        toggleButton={sidebarToggleButton}
        menuItems={menuItems}
        logoText={logoText}
        isMobileOpen={isMobileOpen}
        setMobileOpen={setMobileOpen}
      />

      {/* Main content area */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        {/* Topbar */}
        {/* <Topbar buttons={topbarButtons} /> */}

        {/* Page content */}
        <main style={{ flex: 1, padding: "1rem" }}>
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;
