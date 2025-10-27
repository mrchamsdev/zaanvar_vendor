// // components/pet-sales/Layout.js
// import React, { useState } from "react";
// import Sidebar from "./Sidebar";
// import Topbar from "./Topbar";

// const Layout = ({
//   children,
//   menuItems = [],          // ✅ dynamic menu
//   topbarButtons = [],       // ✅ dynamic topbar buttons
//   logoText = "Zaanvar",    // ✅ dynamic logo
//   sidebarToggleButton = null // ✅ dynamic sidebar toggle/back button
// }) => {
//   const [isMobileOpen, setMobileOpen] = useState(false);

//   return (
//     <div style={{ display: "flex", minHeight: "100vh" }}>
//       {/* Sidebar */}
//       <Sidebar
//         toggleButton={sidebarToggleButton}
//         menuItems={menuItems}
//         logoText={logoText}
//         isMobileOpen={isMobileOpen}
//         setMobileOpen={setMobileOpen}
//       />

//       {/* Main content area */}
//       <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
//         {/* Topbar */}
//         {/* <Topbar buttons={topbarButtons} /> */}

//         {/* Page content */}
//         <main style={{ flex: 1, padding: "1rem" }}>
//           {children}
//         </main>
//       </div>
//     </div>
//   );
// };

// export default Layout;

"use client";
import React, { useState } from "react";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import styles from "../../styles/pet-sales/dashBoard.module.css"; // ✅ reuse styles
import Image from "next/image";
import { Notification } from "@/public/SVG";

const Layout = ({
  children,
  menuItems = [],
  topbarButtons = [],
  logoText = "Zaanvar",
  sidebarToggleButton = null,
}) => {
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  return (
    <div className={styles["dashboardContainer"]}>
      {/* ✅ Sidebar */}
      <Sidebar
        isMobileOpen={isMobileOpen}
        setMobileOpen={setIsMobileOpen}
        toggleButton={sidebarToggleButton}
        menuItems={menuItems}
        logoText={logoText}
      />

      {/* ✅ Mobile Header (Visible Only on Small Screens) */}
      <div className={styles["sidebar-toggle"]}>
        <button
          className={styles["menu-button"]}
          onClick={() => setIsMobileOpen(true)}
        >
          ☰
        </button>

        <Image
          src="https://zaanvar-care.b-cdn.net/media/1759818805009-ZAANVAR_FINAL%20LOGO%203.png"
          height={45}
          width={70}
          className={styles["image-blog"]}
          alt="Logo"
        />

        <Notification className={styles["menu-button"]} />
      </div>

      {/* ✅ Main Section */}
      <div className={styles["mainSection"]}>
        {topbarButtons.length > 0 && <Topbar buttons={topbarButtons} />}
        <main style={{ flex: 1 }}>{children}</main>
      </div>
    </div>
  );
};

export default Layout;
