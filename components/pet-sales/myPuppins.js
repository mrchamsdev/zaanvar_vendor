

import React, { useEffect, useState } from "react";
import styles from "../../styles/pet-sales/myPuppies.module.css";
import { Delete, Edit, Filter, View2, AddPetIcon } from "@/public/images/SVG";
import AddNewPuppyPopup from "./AddNewPuppyPopUp";
import { useRouter } from "next/router";
import ChangeStatus from "./ChangeStatus";
import useStore from "../state/useStore";
import { WebApimanager } from "../utilities/WebApiManager";
import Image from "next/image";
import { IMAGE_URL } from "../utilities/Constants";

const MyPuppies = ({ 
  pets = [], 
  showForm, 
  setShowForm, 
  setEditingPet, 
  refreshPets, 
  editingPet 
}) => {
  const { getJwtToken, getUserInfo } = useStore();
  const jwttoken = getJwtToken();
  const currentUser = getUserInfo();
  const webApi = new WebApimanager(jwttoken);
  
  const [filterStatus, setFilterStatus] = useState("All");
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [showChangeStatus, setShowChangeStatus] = useState(false);
  const [selectedPet, setSelectedPet] = useState(null);
  const [petList, setPetList] = useState(pets);

  const Router = useRouter();

  // Update petList when pets prop changes (initial load)
  useEffect(() => {
    setPetList(pets);
  }, [pets]);

  const statusClass = (status) => {
    const s = (status || "").toLowerCase();
    if (s === "lost") return styles.statusLost;
    if (s === "found") return styles.statusFound;
    if (s === "adopt") return styles.statusAdopt;
    if (s === "available") return styles.statusAvailable;
    if (s === "sold out") return styles.statusSoldOut;
    if (s === "reserved") return styles.statusReserved;
    if (s === "on hold") return styles.statusOnHold;
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
    
    if (typeof setShowForm !== 'function') {
      console.error("setShowForm is not a function! Check parent props.");
      return;
    }

    setEditingPet(null); 
    setShowForm(true);
  };

const handleAddEditSuccess = (savedPet) => {
  console.log("Add/Edit puppy popup closed, received pet:", savedPet);
  setShowForm(false);
  setEditingPet(null);
  
  if (savedPet && savedPet !== false) {
    if (editingPet) {
      // Update existing pet
      setPetList(prevList => 
        prevList.map(pet => 
          (pet.id === editingPet.id || pet._id === editingPet._id) 
            ? { ...pet, ...savedPet } // Merge updates
            : pet
        )
      );
    } else if (savedPet.id || savedPet._id) {
      // Add new pet to the list (add to beginning)
      setPetList(prevList => [savedPet, ...prevList]);
    }
  }
};

  // Handle status change - update local state without refresh
 const handleStatusChangeSuccess = async (updatedPet) => {
  console.log("Status changed, updating local state:", updatedPet);
  setShowChangeStatus(false);
  setSelectedPet(null);
  
  // Update local state immediately for better UX
  if (updatedPet) {
    setPetList(prevList =>
      prevList.map(pet =>
        (pet.id === updatedPet.id || pet._id === updatedPet._id)
          ? { 
              ...pet, 
              petStatus: updatedPet.petStatus,
              ...updatedPet
            }
          : pet
      )
    );
  }
  
  // Refresh data from server to ensure consistency
  if (refreshPets) {
    console.log("Refreshing data from server after status change...");
    await refreshPets();
  }
};

  const handleStatusUpdate = (data) => {
  // data contains { petId, status, updatedPet }
  setAllPets(currentPets => 
    currentPets.map(item => 
      item.id === data.petId ? { ...item, petStatus: data.status } : item
    )
  );
};

  const handleLocalUpdate = ({ status, details, updatedPet }) => {
    // Update local state immediately for better UX
    setPetList(prev =>
      prev.map(p =>
        p.id === selectedPet?.id || p._id === selectedPet?._id
          ? { ...p, petStatus: status }
          : p
      )
    );
    handleStatusChangeSuccess(updatedPet || selectedPet);
  };

  // Filter pets based on status
  const filteredPets = filterStatus === "All"
    ? petList
    : petList.filter((pet) => pet.petStatus === filterStatus);

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
        {/* ── Desktop / Tablet header ── */}
        <div className={styles.tableHeader}>
          <span className={styles.colSno}>S NO</span>
          <span className={styles.colName}>Puppy Name</span>
          <span className={styles.colType}>Puppy Type</span>
          <span className={styles.colBreed}>Puppy Breed</span>
          <span className={styles.colStatus}>Status</span>
          <span className={styles.colPrice}>Price</span>
          <span className={styles.colActions}>Actions</span>
        </div>

        {/* ── Rows ── */}
        {filteredPets.length > 0 ? (
          filteredPets.map((pet, index) => (
            <div key={pet._id || pet.id || index} className={styles.tableRow}>
              <span className={`${styles.cell} ${styles.colSno}`}>
                {(index + 1).toString().padStart(2, "0")}
              </span>

              <span className={`${styles.cell} ${styles.colName}`}>
                <div className={styles.petMeta}>
                  <span>{pet.petName || "—"}</span>
                </div>
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

              <span className={`${styles.cell} ${styles.colPrice}`}>
                {pet.price ? `₹ ${pet.price}/-` : "—"}
              </span>

              <span className={`${styles.cell} ${styles.colActions}`}>
                <div className={styles.actionGroup}>
                  <button
                    className={styles.actionBtn}
                    title="Edit"
                    onClick={() => {
                      console.log("Editing pet:", pet);
                      setEditingPet(pet);
                      setShowForm(true);
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
                      Router.push({ pathname: `/my-puppies/${pet.postId || pet.id}` })
                    }
                  >
                    <View2 />
                  </button>
                </div>
              </span>

              {/* ── Mobile card layout ── */}
              <div className={styles.mobileCard} onClick={() =>
                Router.push({ pathname: `/my-puppies/${pet.postId || pet.id}` })
              }>
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
                  <p className={styles.mobilePetSub}>
                    {pet.petType || "—"} , {pet.petGender || "—"}
                  </p>
                  <p className={styles.mobilePetSub}>
                    {pet.petAge || "—"}
                  </p>
                </div>

                <div className={styles.mobileCardRight}>
                  <p className={styles.mobilePetSub}>
                    {pet.price ? `₹ ${pet.price}/-` : "—"}
                  </p>
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
          style={{ cursor: 'pointer', zIndex: 100 }}
        >
          <AddPetIcon className={styles.addIcon} />
        </div>
      </div>
      
      {/* Delete/Status Change Popup */}
      {showChangeStatus && selectedPet && (
  <ChangeStatus
    pet={selectedPet}
    setPet={setSelectedPet}
    onClose={() => setShowChangeStatus(false)}
    onStatusChange={handleLocalUpdate}
  />
)}

      {/* Add/Edit Puppy Popup */}
      {showForm && (
        <AddNewPuppyPopup
          closePopup={handleAddEditSuccess}
          petData={editingPet}
          fetchPetData={refreshPets}
        />
      )}
    </>
  );
};

export default MyPuppies;