import React from "react";
import styles from "../../styles/pet-sales/topbar.module.css";
import Image from "next/image";
import { Search } from "@/public/SVG";

const Topbar = ({ buttons = [] }) => {
  /**
   * buttons: array of objects
   * Example:
   * [
   *   { label: "+ Add Rooms", color: "purple" },
   *   { label: "+ Add Bookings", color: "red" },
   *   { label: "+ Add More" } // defaults to purple
   * ]
   */

  return (
    <header className={styles.topbar}>
      {/* Search Box */}
      <div className={styles.searchContainer}>
        <input
          type="text"
          placeholder="Search here"
          className={styles.search}
        />
        <span className={styles.searchIcon}><Search /></span>
      </div>

      {/* Buttons */}
      <div className={styles.actions}>
        {buttons.map((btn, index) => {
          if (!btn || !btn.label) return null; 
          const colorClass = btn.color && styles[btn.color] ? styles[btn.color] : styles.purple;
          return (
            <button key={index} className={`${styles.btn} ${colorClass}`}>
              {btn.label}
            </button>
          );
        })}

        {/* Avatar */}
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
