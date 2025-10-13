import React, { useState } from "react";
import styles from "../../styles/pet-sales/sidebar.module.css";
import { BackButton, Calender3, FourDots } from "@/public/SVG";

const Sidebar = () => {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside className={`${styles.sidebar} ${collapsed ? styles.collapsed : ""}`}>
      <h2 className={styles.logo}>
        {!collapsed && <p>Zaanvar</p>}
        <div
          className={styles.backButton}
          onClick={() => setCollapsed(!collapsed)}
        >
          <BackButton />
        </div>
      </h2>

      <ul className={styles.nav}>
        <li className={styles.active}>
          <FourDots className={styles.icon} />
          {!collapsed && <span>Dashboard</span>}
        </li>
        <li>
          <Calender3 className={styles.icon} />
          {!collapsed && <span>My Pets</span>}
        </li>
        <li>
          <Calender3 className={styles.icon} />
          {!collapsed && <span>My Puppies</span>}
        </li>
        <li>
          <Calender3 className={styles.icon} />
          {!collapsed && <span>Bookings</span>}
        </li>
        <li>
          <Calender3 className={styles.icon} />
          {!collapsed && <span>Expenses</span>}
        </li>
        <li>
          <Calender3 className={styles.icon} />
          {!collapsed && <span>Dairy</span>}
        </li>
        <li>
          <Calender3 className={styles.icon} />
          {!collapsed && <span>Settings</span>}
        </li>
      </ul>
    </aside>
  );
};

export default Sidebar;
