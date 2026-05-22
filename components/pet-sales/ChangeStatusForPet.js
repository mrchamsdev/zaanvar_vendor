import React, { useState, useEffect } from "react";
import { WebApimanager } from "../utilities/WebApiManager";
import styles from "../../styles/pet-sales/chageStutus.module.css";
import useStore from "../state/useStore";
import { toast } from "sonner";
import { withTimeZone } from "@/utilities/date-time-utils";

const ChangeStatusForPet = ({ pet, setPet, onClose, onStatusChange }) => {
  const { getJwtToken } = useStore();
  const jwt = getJwtToken();
  const webApi = new WebApimanager(jwt);

  const [selectedStatus, setSelectedStatus] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [validationError, setValidationError] = useState("");
  const [apiProcessing, setApiProcessing] = useState({ loader: false, message: "" });

  useEffect(() => {
    if (pet) {
      // If backend says "Deleted", show "Delete" in dropdown for consistency
      setSelectedStatus(pet.petStatus === "Deleted" ? "Delete" : pet.petStatus || "");
    }
    document.body.style.overflow = "hidden";
    return () => (document.body.style.overflow = "auto");
  }, [pet]);

  // Clear validation error when user selects a status
  useEffect(() => {
    if (selectedStatus) {
      setValidationError("");
      setErrorMessage("");
    }
  }, [selectedStatus]);

 // In ChangeStatusForPet component, update the triggerStatusUpdateAPI
const triggerStatusUpdateAPI = async (statusValue) => {
  try {
    setApiProcessing({ loader: true, message: "Updating..." });
    setErrorMessage("");
    
    const finalStatus = statusValue === "Delete" ? "Deleted" : statusValue;

    const payload = {
      petStatus: finalStatus,
      ...withTimeZone("statusDate", new Date()),
    };

    const response = await webApi.put(`vendorPetProfile/update/${pet.id}`, payload);

    if (response.status === 200 || response.data?.status === "success") {
      const updatedPetData = {
        ...pet,
        petStatus: finalStatus,
        id: pet.id,
        _id: pet._id
      };

      if (typeof setPet === "function") {
        setPet(updatedPetData);
      }

      toast.success(`Status updated to "${finalStatus}" successfully!`);
      
      // Pass the result to parent
      if (onStatusChange) {
        onStatusChange({
          status: finalStatus,
          petId: pet.id,
          updatedPet: updatedPetData
        });
      }
      
      onClose();
    } else {
      const errorMsg = response.data?.message || "Failed to update status.";
      setErrorMessage(errorMsg);
      toast.error(errorMsg);
    }
  } catch (err) {
    console.error("Update Error:", err);
    const errorMsg = err.response?.data?.message || "Connection error. Please try again.";
    toast.error(errorMsg);
    setErrorMessage(errorMsg);
  } finally {
    setApiProcessing({ loader: false, message: "" });
  }
};

  const handleSave = async () => {
    // Clear previous errors
    setValidationError("");
    setErrorMessage("");
    
    // Validate status selection
    if (!selectedStatus) {
      setValidationError("Please select a status before confirming.");
      // Focus on the select field
      const selectElement = document.querySelector(`.${styles.selectField}`);
      if (selectElement) {
        selectElement.focus();
        selectElement.style.borderColor = "red";
        setTimeout(() => {
          selectElement.style.borderColor = "";
        }, 2000);
      }
      return;
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

        <div className={styles.changeStatusSection}>
          <label className={styles["lable-div"]}>
            Pet Status <span style={{color: "red"}}>*</span>
          </label>
          <select 
            value={selectedStatus} 
            onChange={(e) => setSelectedStatus(e.target.value)} 
            className={`${styles.selectField} ${validationError ? styles.errorField : ""}`}
            style={{ borderColor: validationError ? "red" : "" }}
          >
            <option value="">Select Status</option> 
            <option value="Delete">Delete</option>
            <option value="Deceased">Deceased</option>   
          </select>
          {validationError && (
            <p className={styles.errorText} style={{ color: "red", fontSize: "12px", marginTop: "5px" }}>
              {validationError}
            </p>
          )}
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
          <p className={styles.errorText} style={{ color: "red", fontSize: "12px", textAlign: "center", marginTop: "10px" }}>
            {errorMessage}
          </p>
        )}
      </div>
    </div>
  );
};

export default ChangeStatusForPet;