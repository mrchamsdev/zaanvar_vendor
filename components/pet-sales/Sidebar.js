import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import styles from "../../styles/pet-sales/sidebar.module.css";
import { BackButton, Calender3, FourDots } from "@/public/SVG";

const Sidebar = ({ isMobileOpen, setMobileOpen }) => {
  const [collapsed, setCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const router = useRouter();

  const menuItems = [
    { name: "Dashboard", icon: <FourDots />, path: "/pet-sales" },
    { name: "My Pets", icon: <Calender3 />, path: "/my-pets" },
    { name: "My Puppies", icon: <Calender3 />, path: "/my-puppies" },
    { name: "Settings", icon: <Calender3 />, path: "/settings" },
  ];

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
          {!collapsed && <p>Zaanvar</p>}
          <div className={styles.backButton} onClick={toggleSidebar}>
            <BackButton />
          </div>
        </h2>

        <ul className={styles.nav}>
          {menuItems.map((item) => (
            <li
              key={item.name}
              className={router.pathname.startsWith(item.path) ? styles.active : ""}
              onClick={() => isMobile && setMobileOpen(false)}
            >
              <Link href={item.path}>
                {React.cloneElement(item.icon, { className: styles.icon })}
                {!collapsed && <span className={styles.name}>{item.name}</span>}
              </Link>
            </li>
          ))}
        </ul>
      </aside>
    </>
  );
};

export default Sidebar;
