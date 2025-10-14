import React, { useState } from "react";
import styles from "../../styles/pet-sales/myPuppies.module.css";
import Topbar from "./Topbar";
import { View2 } from "@/public/SVG";

const MyPuppies = () => {
  const [filterStatus, setFilterStatus] = useState("All");
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);

  const PetData = [
    { img: "https://zaanvar-care.b-cdn.net/media/1760346888104-img1.jpg", id: "0984235 52869", breed:"weiler", age:"10/05/2025", gender:"32", price:"₹ 2632", stutus:"Availbale" },
    { img: "https://zaanvar-care.b-cdn.net/media/1760346888104-img1.jpg", id: "098765 532369", breed:"Rottweiler", age:"10/05/2025", gender:"32", price:"₹ 232", stutus:"Not Availbale" },
    { img: "https://zaanvar-care.b-cdn.net/media/1760346888104-img1.jpg", id: "098765 532369", breed:"Rottweiler", age:"10/05/2025", gender:"32", price:"₹ 632", stutus:"Not For Sale" },
    { img: "https://zaanvar-care.b-cdn.net/media/1760346888104-img1.jpg", id: "098765 532369", breed:"Rottweiler", age:"10/05/2025", gender:"3", price:"₹ 2632", stutus:"Availbale" },
    { img: "https://zaanvar-care.b-cdn.net/media/1760346888104-img1.jpg", id: "098765 532369", breed:"Rottweiler", age:"10/05/2025", gender:"7", price:"₹ 464", stutus:"Not Availbale" },
    { img: "https://zaanvar-care.b-cdn.net/media/1760346888104-img1.jpg", id: "098765 532369", breed:"Rottweiler", age:"10/05/2025", gender:"2", price:"₹ 4332", stutus:"Not For Sale" }
  ];

  const buttons = [
    { label: "+ Add Rooms", color: "purple" },
    { label: "+ Add Bookings", color: "red" },
    { label: "+ Add More", color:"gray"} 
  ];

  // Filtered pets based on selected status
  const filteredPets = filterStatus === "All"
    ? PetData
    : PetData.filter(pet => pet.stutus === filterStatus);

  return (
    <>
      {/* Topbar with dynamic buttons */}
      <Topbar buttons={buttons} />

      {/* Table Header */}
      <div className={styles["tableRow2"]}>
        <p>Pet Photo</p>
        <p>Pet Id</p>
        <p>Pet Breed</p>
        <p>Age</p>
        <p>Gender</p>
        <p>Price</p>

        {/* Status Column with Filter Button */}
        <div className={styles.statusHeader}>
          <span>Status</span>
          <button
            className={styles.filterBtn}
            onClick={() => setShowFilterDropdown(!showFilterDropdown)}
          >
            &#x25BC;
          </button>

          {showFilterDropdown && (
            <select
              value={filterStatus}
              onChange={(e) => {
                setFilterStatus(e.target.value);
                setShowFilterDropdown(false);
              }}
              className={styles.statusDropdown}
            >
              <option value="All">All</option>
              <option value="Availbale">Available</option>
              <option value="Not Availbale">Not Available</option>
              <option value="Not For Sale">Not For Sale</option>
            </select>
          )}
        </div>

        <p>Action</p>
      </div>

      {/* Table Rows */}
      {filteredPets.map((pet, index) => (
        <div key={index} className={styles.tableRow}>
          <img src={pet.img} alt={pet.breed} className={styles.petImage} />
          <p>{pet.id}</p>
          <p>{pet.breed}</p>
          <p>{pet.age}</p>
          <p>{pet.gender}</p>
          <p>{pet.price}</p>
          <p>{pet.stutus}</p>
          <div className={styles["edit-container"]}>
            <View2 />
          </div>
        </div>
      ))}
    </>
  );
};

export default MyPuppies;
