import React from "react";
// import styles from "./Topbar.module.css";
import styles from "../../styles/pet-sales/topbar.module.css"
import Image from "next/image";
import { Search } from "@/public/SVG";

const Topbar = () => {
  return (
    <header className={styles.topbar}>
    <div className={styles.searchContainer}>
      <input
        type="text"
        placeholder="Search here"
        className={styles.search}
      />
      <span className={styles.searchIcon}><Search/></span>
    </div>
  
    <div className={styles.actions}>
      <button className={`${styles.btn} ${styles.purple}`}>+ Add Rooms</button>
      <button className={`${styles.btn} ${styles.red}`}>+ Add Bookings</button>
      <button className={`${styles.btn} ${styles.gray}`}>+ Add More</button>
  
      <div className={styles.avatar}>
        <Image
          src="https://zaanvar-care.b-cdn.net/media/1760346888104-img1.jpg"
          width={50}
          height={50}
          alt="User Avatar"
        />
        <span className={styles.onlineDot}></span>
      </div>
    </div>
  </header>
  
  );
};

export default Topbar;
