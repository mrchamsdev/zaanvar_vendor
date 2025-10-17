import React, { useEffect, useState } from "react";
import styles from "../../styles/pet-sales/myPuppies.module.css";
import Topbar from "./Topbar";
import { Delete, Edit, Filter, View2 } from "@/public/SVG";
import { useRouter } from "next/router";
import PetForm from "./petForm";
// import ChangeStatusModal from "./ChangeStatusModal";
import ChangeStatus from "./changeStutus";

const MyPuppies = () => {
  const [showForm, setShowForm] = useState(false);
  const [filterStatus, setFilterStatus] = useState("All");
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);

  const Router = useRouter();
  // const [showChangeStatus, setShowChangeStatus] = useState(false);
  const [selectedPet, setSelectedPet] = useState(null);


  // 
  const [showChangeStatus, setShowChangeStatus] = useState(false);
// const [selectedPet, setSelectedPet] = useState(null);

const handleDelete = (pet) => {
  setSelectedPet(pet);
  setShowChangeStatus(true); // opens ChangeStatus modal
};

const handleStatusChange = ({ status, details }) => {
  // call API or update local state with new status + details
  console.log("New status:", status, "details:", details, "for pet:", selectedPet);
  setShowChangeStatus(false);
};

  
  const PetData = [
    {
      img: "https://zaanvar-care.b-cdn.net/media/1760346888104-img1.jpg",
      id: "0984235 52869",
      breed: "weiler",
      age: "10/05/2025",
      gender: "32",
      price: "₹ 2632",
      stutus: "Available",
    },
    {
      img: "https://zaanvar-care.b-cdn.net/media/1760346888104-img1.jpg",
      id: "098765 532369",
      breed: "Rottweiler",
      age: "10/05/2025",
      gender: "32",
      price: "₹ 232",
      stutus: "Not Available",
    },
  ];

  const buttons = [
    { label: "+ Add Puppies", color: "purple", action: "addRoom" },
    { label: "+ Add Bookings", color: "red", action: "addBooking" },
    { label: "+ Add More", color: "gray", action: "addMore" },
  ];

  const handleView = () => {
    Router.push("/my-puppies/view");
  };

  // const handleDelete = (pet) => {
  //   setSelectedPet(pet);
  //   setShowChangeStatus(true); // open Change Status modal instead of deleting
  // };

  // const handleStatusChange = (status) => {
  //   console.log("Status changed to:", status);
  //   // Update PetData or call API here
  //   setShowChangeStatus(false);
  // };

  const filteredPets =
    filterStatus === "All"
      ? PetData
      : PetData.filter((pet) => pet.stutus === filterStatus);

  useEffect(() => {
    if (showForm || showChangeStatus) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }
    return () => {
      document.body.style.overflow = "auto";
    };
  }, [showForm, showChangeStatus]);

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
            <span style={{ paddingRight: "10px" }}>Status</span>
            <button
              className={styles.filterBtn}
              onClick={() => setShowFilterDropdown(!showFilterDropdown)}
            >
              <div className={styles["filter-icon"]}>
                <Filter />
              </div>
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
                <option value="Available">Available</option>
                <option value="Not Available">Not Available</option>
                <option value="Reserved">Reserved</option>
                <option value="Sold Out">Sold Out</option>
                <option value="On Hold">On Hold</option>
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
            <div className={styles["edit-container"]}>
              <div>
                <Edit />
              </div>
              <div onClick={handleView}>
                <View2 />
              </div>
              <div
                className={styles["delete"]}
                onClick={() => handleDelete(pet)}
              >
                <Delete />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Change Status Modal */}
      {showChangeStatus && selectedPet && (
        <ChangeStatus
          pet={selectedPet}
          onClose={() => setShowChangeStatus(false)}
          onStatusChange={handleStatusChange}
        />
      )}
      {showChangeStatus && (
  <ChangeStatus
    pet={selectedPet}
    onClose={() => setShowChangeStatus(false)}
    onStatusChange={handleStatusChange}
  />
)}


      {/* Add Puppies Modal */}
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
