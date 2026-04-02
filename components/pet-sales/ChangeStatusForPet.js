import React, { useState, useEffect } from "react";
import { WebApimanager } from "../utilities/WebApiManager";
import styles from "../../styles/pet-sales/chageStutus.module.css";
import useStore from "../state/useStore";

const ChangeStatusForPet = ({ pet, setPet, onClose, onStatusChange }) => {
  const { getJwtToken } = useStore();
  const jwt = getJwtToken();
  const webApi = new WebApimanager(jwt);

  const [selectedStatus, setSelectedStatus] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [apiProcessing, setApiProcessing] = useState({ loader: false, message: "" });

  useEffect(() => {
    if (pet) {
      // If backend says "Deleted", show "Delete" in dropdown for consistency
      setSelectedStatus(pet.petStatus === "Deleted" ? "Delete" : pet.petStatus || "");
    }
    document.body.style.overflow = "hidden";
    return () => (document.body.style.overflow = "auto");
  }, [pet]);

  const triggerStatusUpdateAPI = async (statusValue) => {
    try {
      setApiProcessing({ loader: true, message: "Updating..." });
      
      // ✅ Map "Delete" option to "Deleted" for the database/payload
      const finalStatus = statusValue === "Delete" ? "Deleted" : statusValue;

      const payload = {
        petStatus: finalStatus,
        statusDate: new Date().toISOString(),
      };

      const response = await webApi.put(`vendorPetProfile/update/${pet.id}`, payload);

      if (response.status === 200 || response.data?.status === "success") {
        if (typeof setPet === "function") {
          setPet((prevPet) => ({
            ...prevPet,
            petStatus: finalStatus,
          }));
        }

        // Notify parent list to remove/update
        if (onStatusChange) onStatusChange(finalStatus, pet.id); 
        
        onClose();
      } else {
        setErrorMessage(response.data?.message || "Failed to update status.");
      }
    } catch (err) {
      console.error("Update Error:", err);
      setErrorMessage(err.response?.data?.message || "Connection error.");
    } finally {
      setApiProcessing({ loader: false, message: "" });
    }
  };

  const handleSave = async () => {
    if (!selectedStatus) {
      setErrorMessage("Please select a status.");
      return;
    }

    if (selectedStatus === "Delete") {
      const confirmDelete = window.confirm("Are you sure you want to delete this pet?");
      if (!confirmDelete) return;
    }

    await triggerStatusUpdateAPI(selectedStatus);
  };

  return (
    <div className={styles.overlay}>
      <div className={`${styles.modal} ${styles.changeStatusModal}`}>
        <div className={styles.modalHeader}>
          <button onClick={onClose} className={styles.backBtn}> ← </button>
          <h3 className={styles.modalTitle}>Change Status</h3>
        </div>

        <div className={styles.petInfoSection}>
          <div className={styles.inputGroup}>
            <label className={styles["lable-div"]}>Pet Name</label>
            <input 
              type="text" 
              value={pet?.petName || ""} 
              readOnly 
              className={styles.inputField} 
              style={{ backgroundColor: "#f5f5f5", color: "#666" }} 
            />
          </div>
        </div>

        <div className={styles.changeStatusSection}>
          <label className={styles["lable-div"]}>Pet Status</label>
          <select 
            value={selectedStatus} 
            onChange={(e) => setSelectedStatus(e.target.value)} 
            className={styles.selectField}
          >
            <option value="">Select Status</option> 
            <option value="Delete">Delete</option>
            <option value="Deceased">Deceased</option>   
          </select>
        </div>

        <button 
          className={styles.confirmBtnFull} 
          onClick={handleSave} 
          disabled={apiProcessing.loader}
          style={{ marginTop: "20px" }}
        >
          {apiProcessing.loader ? "Processing..." : "Confirm Change"}
        </button>

        {errorMessage && (
          <p style={{ color: "red", fontSize: "12px", textAlign: "center", marginTop: "10px" }}>
            {errorMessage}
          </p>
        )}
      </div>
    </div>
  );
};

export default ChangeStatusForPet;