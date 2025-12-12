import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import styles from "../../styles/pet-sales/sidebar.module.css";

const Sidebar = ({
  isMobileOpen,
  setMobileOpen,
  toggleButton, 
  menuItems = [], 
  logoText = "Zaanvar" 
}) => {
  const [collapsed, setCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const toggleSidebar = () => {
    if (isMobile) {
      setMobileOpen(!isMobileOpen);
    } else {
      setCollapsed(!collapsed);
    }
  };

  return (
    <>
      {/* Mobile overlay */}
      {isMobile && isMobileOpen && (
        <div className={styles.sidebarOverlay} onClick={() => setMobileOpen(false)} />
      )}

      <aside
        className={`${styles.sidebar} 
          ${collapsed ? styles.collapsed : ""} 
          ${isMobileOpen ? styles.active : ""}`}
      >
        <h2 className={styles.logo}>
          {!collapsed && <p>{logoText}</p>}
          <div className={styles.backButton} onClick={toggleSidebar}>
            {/* Render dynamic button/icon if passed, else fallback */}
            {toggleButton || <span>&larr;</span>}
          </div>
        </h2>

        <ul className={styles.nav}>
          {menuItems.map((item) => {
            const isActive = router.pathname === item.path;
            // Use the same icon for both active and non-active states
            const iconToUse = item.activeIcon || item.icon;
            
            return (
              <li
                key={item.name}
                className={isActive ? styles.active : ""}
                onClick={() => isMobile && setMobileOpen(false)}
              >
                <Link href={item.path}>
                  {iconToUse && React.cloneElement(iconToUse, { className: styles.icon })}
                  {!collapsed && <span className={styles.name}>{item.name}</span>}
                </Link>
              </li>
            );
          })}
        </ul>
      </aside>
    </>
  );
};

export default Sidebar;
