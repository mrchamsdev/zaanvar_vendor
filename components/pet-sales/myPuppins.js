import React, { useEffect, useState } from "react";
import styles from "../../styles/pet-sales/myPuppies.module.css";
import Topbar from "./Topbar";
import { Delete, Edit, View2 } from "@/public/SVG";
import { useRouter } from "next/router";
import PetForm from "./petForm";

const MyPuppies = () => {
  const [showForm, setShowForm] = useState(false);
  const [filterStatus, setFilterStatus] = useState("All");
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);

  const Router = useRouter();

  const PetData = [
    {
      img: "https://zaanvar-care.b-cdn.net/media/1760346888104-img1.jpg",
      id: "0984235 52869",
      breed: "weiler",
      age: "10/05/2025",
      gender: "32",
      price: "₹ 2632",
      stutus: "Availbale",
    },
    {
      img: "https://zaanvar-care.b-cdn.net/media/1760346888104-img1.jpg",
      id: "098765 532369",
      breed: "Rottweiler",
      age: "10/05/2025",
      gender: "32",
      price: "₹ 232",
      stutus: "Not Availbale",
    },
    // ... other pets
  ];

  const buttons = [
    { label: "+ Add Puppies", color: "purple", action: "addRoom" }, // changed label
    { label: "+ Add Bookings", color: "red", action: "addBooking" },
    { label: "+ Add More", color: "gray", action: "addMore" },
  ];

  const handleOnClick = () => {
    Router.push("/my-puppies/view");
  };

  const filteredPets =
    filterStatus === "All"
      ? PetData
      : PetData.filter((pet) => pet.stutus === filterStatus);

  useEffect(() => {
    if (showForm) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }
    return () => {
      document.body.style.overflow = "auto";
    };
  }, [showForm]);

  return (
    <>
      <Topbar
        buttons={buttons}
        onButtonClick={(action) => {
          if (action === "addRoom") setShowForm(true);
          else setShowForm(false);
        }}
      />

      <div className={styles.tableContainer}>
        <div className={styles["tableRow2"]}>
          <p>Pet Photo</p>
          <p>Pet Id</p>
          <p>Pet Breed</p>
          <p>Age</p>
          <p>Gender</p>
          <p>Price</p>
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

        {filteredPets.map((pet, index) => (
          <div key={index} className={styles.tableRow}>
            <img src={pet.img} alt={pet.breed} className={styles.petImage} />
            <p>{pet.id}</p>
            <p>{pet.breed}</p>
            <p>{pet.age}</p>
            <p>{pet.gender}</p>
            <p>{pet.price}</p>
            <p>{pet.stutus}</p>
            <div onClick={handleOnClick} className={styles["edit-container"]}>
              <div>
                <Edit />
              </div>
              <View2 />
              <Delete />
            </div>
          </div>
        ))}
      </div>

      {/* Modal Popup */}
      {showForm && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h2>Add Puppies</h2>
              <button
                className={styles.closeBtn}
                onClick={() => setShowForm(false)}
              >
                &#x2715;
              </button>
            </div>
            <PetForm />
          </div>
        </div>
      )}
    </>
  );
};

export default MyPuppies;
