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
  const [refreshKey, setRefreshKey] = useState(0);

  // Force re-render when pets change
  useEffect(() => {
    console.log("MyPets received new pets data, count:", pets.length);
    setRefreshKey(prev => prev + 1);
  }, [pets]);

  const statusClass = (status) => {
    const s = (status || "").toLowerCase();
    if (s === "lost") return styles.statusLost;
    if (s === "found") return styles.statusFound;
    if (s === "adopt") return styles.statusAdopt;
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

  const handleAddEditSuccess = async () => {
    console.log("Add/Edit popup closed, refreshing data...");
    setIsAddPopupOpen(false);
    setEditingPet(null);
    if (refreshPets) {
      const refreshedData = await refreshPets();
      console.log("Refreshed data count:", refreshedData?.length);
    }
  };
  const handleStatusChangeSuccess = async () => {
    console.log("Status changed, refreshing data...");
    setShowChangeStatus(false);
    setSelectedPet(null);
    if (refreshPets) {
      const refreshedData = await refreshPets();
      console.log("Refreshed data count:", refreshedData?.length);
    }
  };

  return (
    <>
      <div className={styles.tableContainer} key={refreshKey}>
        <div className={styles.tableHeader}>
          <span className={styles.colSno}>S NO</span>
          <span className={styles.colName}>Pet Name</span>
          <span className={styles.colType}>Pet Type</span>
          <span className={styles.colBreed}>Pet Breed</span>
          <span className={styles.colStatus}>Status</span>
          <span className={styles.colActions}>Actions</span>
        </div>

        {pets && pets.length > 0 ? (
          pets.map((pet, index) => (
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
                      setEditingPet(pet);
                      setIsAddPopupOpen(true);
                    }}
                  >
                    <Edit />
                  </button>
                  <button
                    className={`${styles.actionBtn} ${styles.actionDelete}`}
                    title="Delete"
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
                    <Image src={`${IMAGE_URL}${pet.morePhotos[0]}`} alt={pet.petName} width={56} height={56} className={styles.mobileAvatar} />
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
          <div className={styles.emptyState}>No puppies found.</div>
        )}
          <div 
        className={styles.addIconContainer} 
        onClick={handleAddBtnClick}
        style={{ cursor: 'pointer', zIndex: 100}}
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