import React, { useState } from "react";
import styles from "../../styles/pet-sales/topbar.module.css";
import Image from "next/image";
import { Search } from "@/public/SVG";

const Topbar = ({ buttons = [], onButtonClick }) => {
  /**
   * buttons: array of objects
   * Example:
   * [
   *   { label: "+ Add Rooms", color: "purple", action: "addRoom" },
   *   { label: "+ Add Bookings", color: "red", action: "addBooking" },
   *   { label: "+ Add More", color: "gray", action: "addMore" }
   * ]
   */

  const [selectedBranch, setSelectedBranch] = useState("");
  const [selectedService, setSelectedService] = useState(""); 

  const handleChangeBranch = (e) => {
    setSelectedBranch(e.target.value);
  };
  
  const handleChangeService = (e) => {
    setSelectedService(e.target.value);
  };

  return (
    <header className={styles.topbar}>
      {/* Search Box */}
      <div className={styles["search-wrapper"]}>  
        <div className={styles.searchContainer}>
          <input
            type="text"
            placeholder="Search here"
            className={styles.search}
          />
          <span className={styles.searchIcon}><Search /></span>
        </div>

        <div className={styles["select-bar"]}>
          <select value={selectedBranch} onChange={handleChangeBranch}>
            <option value="">Select Branch</option>
            <option value="Option1">First Branch</option>
            <option value="Option2">Second Branch</option>
            <option value="Option3">Third Branch</option>
            <option value="Option4">Fourth Branch</option>
          </select>
        </div>

        <div className={styles["select-bar"]}>
          <select value={selectedService} onChange={handleChangeService}>
            <option value="">Select Service</option>
            <option value="Option11">Grooming</option>
            <option value="Option22">Training</option>
            <option value="Option33">Pet Care</option>
            <option value="Option44">Meal</option>
          </select>
        </div>
      </div>

      {/* Buttons */}
      <div className={styles.actions}>
        {buttons.map((btn, index) => {
          if (!btn || !btn.label) return null; 
          const colorClass = btn.color && styles[btn.color] ? styles[btn.color] : styles.purple;
          return (
            <button
              key={index}
              className={`${styles.btn} ${colorClass}`}
              onClick={() => onButtonClick && onButtonClick(btn.action)} // ✅ Call handler with action
            >
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
