import React from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import styles from "../../styles/pet-sales/mobHeader.module.css";
import { CircleMobBackIcon, FourDots, Calender3 } from "@/public/image/SVG";

const MobSidebar = ({ isOpen = false, handleClose }) => {
  const router = useRouter();

  const menuItems = [
    { name: "Dashboard", icon: <FourDots />, path: "/pet-sales" },
    { name: "My Pets", icon: <Calender3 />, path: "/my-pets" },
    { name: "My Puppies", icon: <Calender3 />, path: "/my-puppies" },
    { name: "Settings", icon: <Calender3 />, path: "/settings" },
  ];

  return (
    <>
      {/* Overlay */}
      {isOpen && <div className={styles.overlay} onClick={handleClose} />}

      {/* Sidebar */}
      <>
  <button className={styles.mobileToggle} onClick={toggleSidebar}>
    ☰
  </button>
  {mobileOpen && (
    <div className={styles.sidebarOverlay} onClick={() => setMobileOpen(false)} />
  )}
      <aside className={`${styles.mobSidebar} ${isOpen ? styles.active : ""}`}>
        <div className={styles.header}>
          <span onClick={handleClose}>
            <CircleMobBackIcon />
          </span>
          <p>Zaanvar</p>
        </div>

        <ul className={styles.menu}>
          {menuItems.map((item) => (
            <li
              key={item.name}
              className={router.pathname.startsWith(item.path) ? styles.active : ""}
              onClick={handleClose}
            >
              <Link href={item.path} className={styles.link}>
                {item.icon}
                <span>{item.name}</span>
              </Link>
            </li>
          ))}
        </ul>
      </aside>
      </>
    </>
  );
};

export default MobSidebar;
