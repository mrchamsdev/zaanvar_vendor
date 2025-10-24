import React, { useEffect, useState } from "react";
import styles from "../../styles/pet-sales/myPuppies.module.css";
import Topbar from "./Topbar";
import { Delete, Edit, Filter, View2 } from "@/public/SVG";
import { useRouter } from "next/router";
import PetForm from "./petForm";
import ChangeStatus from "./changeStutus";

const MyPuppies = () => {
  const [showForm, setShowForm] = useState(false);
  const [filterStatus, setFilterStatus] = useState("All");
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [showChangeStatus, setShowChangeStatus] = useState(false);
  const [selectedPet, setSelectedPet] = useState(null);

  // 1️⃣ Track which pet is being edited
  const [editingPet, setEditingPet] = useState(null);

  const Router = useRouter();

  const [petList, setPetList] = useState([
    {
      img: "https://zaanvar-care.b-cdn.net/media/1760346888104-img1.jpg",
      id: "0984235 52869",
      breed: "Rottweiler",
      age: "10/05/2025",
      gender: "Male",
      price: "₹ 2632",
      stutus: "Available",
      petType: "Dog",       
      petBreed: "Pug", 
      status: "Available", 
      color: "Red",
      vaccination: "1",
      negotiable: "Yes",
      size: "6.5",
      hasParents: "yes",
      petName: "Shubh",
      petVariety: "KCI",
      sireMother: "no",
      address: "Old GAli",
      fatherName: "shubh",
      motherName: "Shubh",
      videos: [],
      
    },
  ]);

  const handleAddPet = (newPet) => {
    setPetList((prev) => [...prev, newPet]);
    setShowForm(false);
  };

  const handleDelete = (pet) => {
    setSelectedPet(pet);
    setShowChangeStatus(true);
  };

  const handleStatusChange = ({ status, details }) => {
    console.log("New status:", status, "details:", details, "for pet:", selectedPet);
    setShowChangeStatus(false);
  };

  const filteredPets =
    filterStatus === "All"
      ? petList
      : petList.filter((pet) => pet.stutus === filterStatus);

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
        buttons={[
          { label: "+ Add Puppies", color: "purple", action: "addRoom" },
          { label: "+ Add Bookings", color: "red", action: "addBooking" },
          { label: "+ Add More", color: "gray", action: "addMore" },
        ]}
        onButtonClick={(action) => {
          if (action === "addRoom") {
            setEditingPet(null);
            setShowForm(true);
          } else setShowForm(false);
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
              {/* 3️⃣ Edit Button */}
              <div
                onClick={() => {
                  setEditingPet(pet);
                  setShowForm(true);
                }}
              >
                <Edit />
              </div>
              <div onClick={() => Router.push("/my-puppies/view")}>
                <View2 />
              </div>
              <div className={styles["delete"]} onClick={() => handleDelete(pet)}>
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

      {/* Add/Edit Puppies Modal */}
      {showForm && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h2>{editingPet ? "Edit Puppy" : "Add Puppies"}</h2>
              <button
                className={styles.closeBtn}
                onClick={() => {
                  setShowForm(false);
                  setEditingPet(null);
                }}
              >
                &#x2715;
              </button>
            </div>

            <PetForm
              onSave={(petData) => {
                if (editingPet) {
                  setPetList((prev) =>
                    prev.map((p) => (p.id === editingPet.id ? { ...p, ...petData } : p))
                  );
                  setEditingPet(null);
                } else {
                  setPetList((prev) => [...prev, petData]);
                }
                setShowForm(false);
              }}
              initialData={editingPet}
            />
          </div>
        </div>
      )}
    </>
  );
};

export default MyPuppies;
