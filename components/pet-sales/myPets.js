

import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";
import ChangeStatusForPet from "./ChangeStatusForPet";
import AddNewPetPopup from "./AddNewPetPopup";
import { Delete, Edit, View2 } from "@/public/images/SVG";
import { IMAGE_URL } from "../utilities/Constants";
import Image from "next/image";
import styles from "../../styles/pet-sales/mypets.module.css";
import { AddPetIcon } from "@/public/images/SVG";

const MyPets = ({ pets = [], isAddPopupOpen, setIsAddPopupOpen, setEditingPet, refreshPets, editingPet }) => {
  const router = useRouter();
  const [selectedPet, setSelectedPet] = useState(null);
  const [showChangeStatus, setShowChangeStatus] = useState(false);
  const [petList, setPetList] = useState(pets);

  // Update petList when pets prop changes
  useEffect(() => {
    console.log("MyPets received new pets data, count:", pets.length);
    setPetList(pets);
  }, [pets]);

  const statusClass = (status) => {
    const s = (status || "").toLowerCase();
    if (s === "lost") return styles.statusLost;
    if (s === "found") return styles.statusFound;
    if (s === "adopt") return styles.statusAdopt;
    if (s === "deleted") return styles.statusDeleted;
    return styles.statusDefault;
  };

  const handleDeleteClick = (pet) => {
    setSelectedPet(pet);
    setShowChangeStatus(true);
  };

  const handleAddBtnClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    console.log("Add button clicked");
    
    if (typeof setIsAddPopupOpen !== 'function') {
      console.error("setIsAddPopupOpen is not a function! Check parent props.");
      return;
    }

    setEditingPet(null); 
    setIsAddPopupOpen(true);
  };

  // Handle add/edit success - refresh data from server
  const handleAddEditSuccess = async (savedPet) => {
    console.log("Add/Edit popup closed, received pet:", savedPet);
    setIsAddPopupOpen(false);
    setEditingPet(null);
    
    // Always refresh data from server to get latest
    if (refreshPets) {
      console.log("Refreshing data after add/edit...");
      const refreshedData = await refreshPets();
      console.log("Refreshed data count:", refreshedData?.length);
    }
  };

   // Handle status change success - FIXED to only update the specific pet
  const handleStatusChangeSuccess = async (result) => {
    console.log("Status changed, result:", result);
    setShowChangeStatus(false);
    
    if (result) {
      const { status, petId, updatedPet } = result;
      
      console.log("Updating pet with ID:", petId, "to status:", status);
      
      // Update only the specific pet that changed
      setPetList(prevList => {
        const updatedList = prevList.map(pet => {
          // Match by id or _id
          if (pet.id === petId || pet._id === petId) {
            console.log("Found matching pet:", pet.petName, "updating status from", pet.petStatus, "to", status);
            // Return the updated pet object
            return { 
              ...pet, 
              petStatus: status,
              ...updatedPet // Merge any other updated fields
            };
          }
          // Return unchanged pet
          return pet;
        });
        
        console.log("Updated list length:", updatedList.length);
        return updatedList;
      });
    }
    
    setSelectedPet(null);
    
    // Optional: Refresh data from server to ensure consistency
    if (refreshPets) {
      console.log("Refreshing data after status change...");
      const refreshedData = await refreshPets();
      console.log("Refreshed data count:", refreshedData?.length);
    }
  };

  return (
    <>
      <div className={styles.tableContainer}>
        <div className={styles.tableHeader}>
          <span className={styles.colSno}>S NO</span>
          <span className={styles.colName}>Pet Name</span>
          <span className={styles.colType}>Pet Type</span>
          <span className={styles.colBreed}>Pet Breed</span>
          <span className={styles.colStatus}>Status</span>
          <span className={styles.colActions}>Actions</span>
        </div>

        {petList && petList.length > 0 ? (
          petList.map((pet, index) => (
            <div key={pet._id || pet.id || index} className={styles.tableRow}>
              <span className={`${styles.cell} ${styles.colSno}`}>
                {(index + 1).toString().padStart(2, "0")}
              </span>

              <span className={`${styles.cell} ${styles.colName}`}>
                <span>{pet.petName || "—"}</span>
              </span>

              <span className={`${styles.cell} ${styles.colType}`}>
                {pet.petType || "—"}
              </span>

              <span className={`${styles.cell} ${styles.colBreed}`}>
                {pet.breed || "—"}
              </span>

              <span className={`${styles.cell} ${styles.colStatus}`}>
                <span className={`${styles.statusBadge} ${statusClass(pet.petStatus)}`}>
                  {pet.petStatus || "—"}
                </span>
              </span>

              <span className={`${styles.cell} ${styles.colActions}`}>
                <div className={styles.actionGroup}>
                  <button
                    className={styles.actionBtn}
                    title="Edit"
                    onClick={() => {
                      console.log("Editing pet:", pet);
                      setEditingPet(pet);
                      setIsAddPopupOpen(true);
                    }}
                  >
                    <Edit />
                  </button>
                  <button
                    className={`${styles.actionBtn} ${styles.actionDelete}`}
                    title="Delete/Change Status"
                    onClick={() => handleDeleteClick(pet)}
                  >
                    <Delete />
                  </button>
                  <button
                    className={styles.actionBtn}
                    title="View"
                    onClick={() =>
                      router.push({ pathname: `/my-pets/${pet.id || pet._id}` })
                    }
                  >
                    <View2 />
                  </button>
                </div>
              </span>
              
              <div className={styles.mobileCard} onClick={() => router.push({ pathname: `/my-pets/${pet.id || pet._id}` })}>
                <div className={styles.mobileCardLeft}>
                  {pet.morePhotos && pet.morePhotos.length > 0 ? (
                    <Image 
                      src={`${IMAGE_URL}${pet.morePhotos[0]}`} 
                      alt={pet.petName} 
                      width={56} 
                      height={56} 
                      className={styles.mobileAvatar} 
                    />
                  ) : (
                    <div className={styles.mobileAvatarPlaceholder} />
                  )}
                </div>
                <div className={styles.mobileCardBody}>
                  <p className={styles.mobilePetName}>{pet.breed || "—"}</p>
                  <p className={styles.mobilePetSub}>{pet.petType || "—"} , {pet.petGender || "—"}</p>
                  <p className={styles.mobilePetSub}>{pet.petAge || "—"}</p>
                </div>
                <div className={styles.mobileCardRight}>
                  <span className={`${styles.statusBadge} ${statusClass(pet.petStatus)}`}>
                    {pet.petStatus || "—"}
                  </span>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className={styles.emptyState}>No pets found.</div>
        )}
        
        <div 
          className={styles.addIconContainer} 
          onClick={handleAddBtnClick}
          style={{ cursor: 'pointer', zIndex: 100 }}
        >
          <AddPetIcon className={styles.addIcon} />
        </div>
      </div>

      {showChangeStatus && selectedPet && (
        <ChangeStatusForPet
          pet={selectedPet}
          onClose={() => setShowChangeStatus(false)}
          onStatusChange={handleStatusChangeSuccess}
        />
      )}

      {isAddPopupOpen && (
        <AddNewPetPopup
          closePopup={handleAddEditSuccess}
          petData={editingPet}
          fetchPetData={refreshPets}
        />
      )}
    </>
  );
};

export default MyPets;