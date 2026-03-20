import React, { useEffect, useState } from "react";
import styles from "../../styles/pet-sales/myPuppies.module.css";
import { Delete, Edit, Filter, View2 } from "@/public/images/SVG";
import { useRouter } from "next/router";
import PetForm from "./petForm";
import ChangeStatus from "./changeStutus";
import useStore from "../state/useStore";
import { WebApimanager } from "../utilities/WebApiManager";
import Image from "next/image";
import { IMAGE_URL } from "../utilities/Constants";

const MyPuppies = ({ pets = [], showForm, setShowForm }) => {
  const { getJwtToken, getUserInfo } = useStore();
  console.log(getUserInfo(), "getUserInfo");
  const jwttoken = getJwtToken();
  const currentUser = getUserInfo();
  const webApi = new WebApimanager(jwttoken);
  console.log(currentUser, "currentUser");
  const [filterStatus, setFilterStatus] = useState("All");
  const [showFilterDropdown, setShowFilterDropdown] = useState();
  const [showChangeStatus, setShowChangeStatus] = useState(false);
  const [selectedPet, setSelectedPet] = useState(null);
  const [addresses, setAddresses] = useState([]); 

  // 1️⃣ Track which pet is being edited
  const [editingPet, setEditingPet] = useState(null);

  const Router = useRouter();


  console.log(pets, "petsss")
  const [petList, setPetList] = useState(pets);
  //   {
  //     img: "https://zaanvar-care.b-cdn.net/media/1760346888104-img1.jpg",
  //     id: "0984235 52869",
  //     breed: "Rottweiler",
  //     age: "10/05/2025",
  //     gender: "Male",
  //     price: "₹ 2632",
  //     stutus: "Available",
  //     petType: "Dog",
  //     petBreed: "Pug",
  //     status: "Available",
  //     color: "Red",
  //     vaccination: "1",
  //     negotiable: "Yes",
  //     size: "6.5",
  //     hasParents: "yes",
  //     petName: "Shubh",
  //     petVariety: "KCI",
  //     sireMother: "no",
  //     address: "Old GAli",
  //     fatherName: "shubh",
  //     motherName: "Shubh",
  //     videos: [],

  //   },
  // ]);

  const handleAddPet = (newPet) => {
    pets((prev) => [...prev, newPet]);
    setShowForm(false);
  };

  const handleDelete = (pet) => {
    setSelectedPet(pet);
    setShowChangeStatus(true);
  };

  const handleStatusChange = ({ status, details }) => {
    console.log(
      "New status:",
      status,
      "details:",
      details,
      "for pet:",
      selectedPet
    );
    setShowChangeStatus(false);
  };

  const filteredPets =
    filterStatus === "All"
      ? pets
      : pets.filter((pet) => pet.stutus === filterStatus);

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
      <div className={styles.tableContainer}>
        <div className={styles["tableRow2"]} style={{ gridTemplateColumns: "0.5fr 1fr 1fr 1fr 1fr 1fr 0.5fr", display: "grid", gap: "10px", padding: "10px 20px" }}>
          <p>S NO</p>
          <p>Puppy Name</p>
          <p>Puppy Type</p>
          <p>Puppy Breed</p>
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
          <p>Price</p>
          <p>Actions</p>
        </div>

        {pets.map((pet, index) => (
          <div key={index} className={styles.tableRow} style={{ gridTemplateColumns: "0.5fr 1fr 1fr 1fr 1fr 1fr 0.5fr", display: "grid", gap: "10px", padding: "10px 20px", alignItems: "center" }}>
            <p>{(index + 1).toString().padStart(2, "0")}</p>
            <p>{pet?.petName || "—"}</p>
            <p>{pet?.petType || "—"}</p>
            <p>{pet?.breed || "—"}</p>
            <p>
              <span className={styles.statusBadge} style={{ background: "#eee", padding: "4px 12px", borderRadius: "15px", fontSize: "14px" }}>
                {pet?.petStatus || "—"}
              </span>
            </p>
            <p>{pet?.price || "—"}</p>
            <div className={styles["edit-container"]}>
              {/* Edit Button */}
              <div
                onClick={() => {
                  setEditingPet(pet);
                  setShowForm(true);
                }}
                style={{ cursor: "pointer" }}
              >
                <Edit />
              </div>
              <div
                onClick={() => handleDelete(pet)}
                style={{ cursor: "pointer" }}
                className={styles["delete"]}
              >
                <Delete />
              </div>
              <div
                onClick={() =>
                  Router.push({
                    pathname: "/my-puppies/view",
                    query: { data: encodeURIComponent(JSON.stringify(pet)) },
                  })
                }
                style={{ cursor: "pointer" }}
              >
                <View2 />
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
              currentUser={currentUser}
              pets={pets}
              initialData={editingPet}
              addresses={addresses}
              onSave={async (petData) => {
                try {
                  const payload = {
                    ...petData,
                    address:
                      typeof petData.address === "object"
                        ? petData.address.id 
                        : Number(petData.address), 
                  };

                  console.log("🚀 Payload Sent to API:", payload);

                  const response = await webApi.post(
                    // "petSales/create",
                    "vendorPetSales/create",
                    payload
                  );
                  console.log("🟢 Raw response:", response);

                  if (editingPet) {
                    setPetList((prev) =>
                      prev.map((p) =>
                        p.id === editingPet.id ? { ...p, ...petData } : p
                      )
                    );
                    setEditingPet(null);
                  } else {
                    setPetList((prev) => [...prev, petData]);
                  }

                  setShowForm(false);
                } catch (error) {
                  console.error("❌ Error saving pet:", error);
                }
              }}
            />
          </div>
        </div>
      )}
    </>
  );
};

export default MyPuppies;
