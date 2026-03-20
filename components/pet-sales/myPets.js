import React, { useEffect, useState } from "react";
import styles from "../../styles/pet-sales/mypets.module.css";
import Sidebar from "./Sidebar";
import { Delete, Edit, View2 } from "@/public/images/SVG";
import { useRouter } from "next/router";
import Image from "next/image";
import { IMAGE_URL } from "../utilities/Constants";
import ChangeStatus from "./changeStutus"; // ✅ added
import AddNewPetPopup from "./AddNewPetPopup";

const MyPets = ({ pets = [], isAddPopupOpen, setIsAddPopupOpen }) => {
  const router = useRouter();
  const [selectedPet, setSelectedPet] = useState(null);

  // ✅ added for ChangeStatus modal
  const [showChangeStatus, setShowChangeStatus] = useState(false);
  const [editingPet, setEditingPet] = useState(null);

  const handleDelete = (pet) => {
    setSelectedPet(pet);
    setShowChangeStatus(true);
  };

  const { data } = router.query;
  const [pet, setPet] = useState(null);

  useEffect(() => {
    if (data) {
      setPet(JSON.parse(data));
    }
  }, [data]);

  return (
    <>
      {isAddPopupOpen ? (
        <AddNewPetPopup
          isAddPopupOpen={isAddPopupOpen}
          setIsAddPopupOpen={setIsAddPopupOpen}
          petData={editingPet}
          IMAGE_URL={IMAGE_URL}
          fetchPetData={() => router.reload()} // basic fallback fetching trigger
        />
      ) : (
        <div className={styles.tableContainer}>
          <div className={styles["tableRow2"]} style={{ gridTemplateColumns: "0.5fr 1fr 1fr 1fr 1fr 0.5fr", display: "grid", gap: "10px", padding: "10px 20px" }}>
            <p>S NO</p>
            <p>Pet Name</p>
            <p>Pet Type</p>
            <p>Pet Breed</p>
            <p>Status</p>
            <p>Actions</p>
          </div>

          {pets.map((pet, index) => (
            <div key={index} className={styles.tableRow} style={{ gridTemplateColumns: "0.5fr 1fr 1fr 1fr 1fr 0.5fr", display: "grid", gap: "10px", padding: "10px 20px", alignItems: "center" }}>
              <p>{(index + 1).toString().padStart(2, "0")}</p>
              <p>{pet.petName || "—"}</p>
              <p>{pet.petType || "—"}</p>
              <p>{pet.breed || "—"}</p>
              <p>
                 <span className={styles.statusBadge} style={{ background: "#eee", padding: "4px 12px", borderRadius: "15px", fontSize: "14px" }}>
                   {pet.petStatus || "—"}
                 </span>
              </p>
              <div className={styles["edit-container"]}>
                <div
                  className={styles["edit"]}
                  onClick={() => {
                    setEditingPet(pet);
                    setIsAddPopupOpen(true);
                  }}
                  style={{ cursor: "pointer" }}
                >
                  <Edit />
                </div>
                <div
                  className={styles["delete"]}
                  onClick={() => handleDelete(pet)}
                  style={{ cursor: "pointer" }}
                >
                  <Delete />
                </div>
                <div
                  className={styles["view"]}
                  onClick={() =>
                    router.push({
                      pathname: "/my-pets/view",
                      query: { data: JSON.stringify(pet) },
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
      )}

      {/* ✅ Change Status Modal */}
      {showChangeStatus && selectedPet && (
        <ChangeStatus
          pet={selectedPet}
          onClose={() => setShowChangeStatus(false)}
          onStatusChange={({ status, details }) => {
            console.log("New status:", status, "details:", details);
            setShowChangeStatus(false);
            router.reload();
          }}
        />
      )}
    </>
  );
};

export default MyPets;
