
import React, { useState, useEffect } from "react";
import { withTimeZone } from "@/utilities/date-time-utils";
import { WebApimanager } from "../utilities/WebApiManager";
import styles from "../../styles/pet-sales/chageStutus.module.css";
import useStore from "../state/useStore";
import { toast } from "sonner";

const ChangeStatus = ({ pet, setPet, onClose, onStatusChange }) => {
  const { getJwtToken } = useStore();
  const jwt = getJwtToken();
  const webApi = new WebApimanager(jwt);

  const [selectedStatus, setSelectedStatus] = useState("");
  const [showInnerPopup, setShowInnerPopup] = useState(false);
  const [detailData, setDetailData] = useState({});
  const [errorMessage, setErrorMessage] = useState("");
  const [validationErrors, setValidationErrors] = useState({});
  const [apiProcessing, setApiProcessing] = useState({ loader: false, message: "" });

  // Radio button states for "Sold Out" flow
  const [zaanvarHelpSell, setZaanvarHelpSell] = useState("");
  const [zaanvarRecommend, setZaanvarRecommend] = useState("");
  const [changePrice, setChangePrice] = useState("");
  const [newPrice, setNewPrice] = useState("");

  // Populate info on load
  useEffect(() => {
    if (pet) {
      setSelectedStatus(pet.petStatus || "");
    }
    document.body.style.overflow = "hidden";
    return () => (document.body.style.overflow = "auto");
  }, [pet]);

  const validateStatus = () => {
    const errors = {};
    
    if (!selectedStatus) {
      errors.selectedStatus = "Please select a status.";
    }
    
    if (selectedStatus === "Sold Out") {
      if (!zaanvarHelpSell) {
        errors.zaanvarHelpSell = "Please select if Zaanvar helped sell your pet.";
      }
      if (!zaanvarRecommend) {
        errors.zaanvarRecommend = "Please select if you would recommend Zaanvar.";
      }
      if (changePrice === "yes" && !newPrice) {
        errors.newPrice = "Please enter the new price.";
      }
      if (changePrice === "yes" && newPrice && parseFloat(newPrice) <= 0) {
        errors.newPrice = "Price must be greater than 0.";
      }
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSave = async () => {
    // Clear any previous errors
    setErrorMessage("");
    setValidationErrors({});
    
    if (!selectedStatus) {
      setValidationErrors({ selectedStatus: "Please select a status." });
      return;
    }

    // Check if Sold Out is selected - show inner popup first
    if (selectedStatus === "Sold Out") {
      console.log("Sold Out selected, showing inner popup");
      setShowInnerPopup(true);
      return; // Don't proceed with API call yet
    } else {
      // For all other statuses, proceed with API call
      const payload = {
        petStatus: selectedStatus,
        thanksNote: detailData.notes || "",
        ...withTimeZone("statusDate", new Date()),
      };
      await triggerStatusUpdateAPI(payload);
    }
  };

  const handleSubmitInner = async () => {
    // Validate the inner form fields
    const errors = {};
    if (!zaanvarHelpSell) {
      errors.zaanvarHelpSell = "Please select if Zaanvar helped sell your pet.";
    }
    if (!zaanvarRecommend) {
      errors.zaanvarRecommend = "Please select if you would recommend Zaanvar.";
    }
    if (changePrice === "yes" && !newPrice) {
      errors.newPrice = "Please enter the new price.";
    }
    if (changePrice === "yes" && newPrice && parseFloat(newPrice) <= 0) {
      errors.newPrice = "Price must be greater than 0.";
    }
    
    setValidationErrors(errors);
    
    if (Object.keys(errors).length > 0) {
      return;
    }
    
    const payload = {
      petStatus: selectedStatus,
      zaanvarHelpSell,
      zaanvarRecommend,
      price: changePrice === "yes" ? newPrice : pet?.price,
      ...withTimeZone("statusDate", new Date()),
      thanksNote: detailData.notes || "",
    };

    console.log("Submitting Sold Out payload:", payload);
    await triggerStatusUpdateAPI(payload);
  };

  const triggerStatusUpdateAPI = async (payload) => {
    try {
      setApiProcessing({ loader: true, message: "Updating..." });
      setErrorMessage("");
      
      const response = await webApi.put(`vendorPetSales/update/${pet.id}`, payload);

      if (response.status === 200 || response.data?.status === "success") {
        // Create updated pet object
        const updatedPetData = {
          ...pet,
          petStatus: payload.petStatus,
          price: payload.price || pet.price,
          thanksNote: payload.thanksNote || pet.thanksNote,
        };

        // Update local state
        if (typeof setPet === "function") {
          setPet(updatedPetData);
        }

        toast.success(`Status updated to "${payload.petStatus}" successfully!`);
        
        // Pass the updated data to parent
        if (onStatusChange) {
          onStatusChange({
            status: payload.petStatus,
            petId: pet.id,
            updatedPet: updatedPetData
          });
        }
        
        // Close the inner popup first if it's open
        setShowInnerPopup(false);
        // Then close the main popup
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

  const StatusInnerPopup = () => (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <div className={styles.modalHeader}>
          <button className={styles.backBtn} onClick={() => {
            setShowInnerPopup(false);
            setValidationErrors({});
          }}> ← </button>
          <h3 className={styles.modalTitle}>Sold Out Details</h3>
        </div>

        <div className={styles.innerBody}>
          <div className={styles["wrapper-div"]}>
            <img src="https://zaanvar-care.b-cdn.net/media/1760693132852-Congratulation.png" alt="congrats" width="50%" />
          </div>
          
          <p>Did Zaanvar directly help sell your pet? <span className={styles.requiredStar}>*</span></p>
          <div className={styles["para-text"]}>
            <label>
              <input 
                type="radio" 
                value="yes" 
                checked={zaanvarHelpSell === "yes"} 
                onChange={(e) => {
                  setZaanvarHelpSell(e.target.value);
                  setValidationErrors(prev => ({ ...prev, zaanvarHelpSell: "" }));
                }} 
              /> Yes
            </label>
            <label>
              <input 
                type="radio" 
                value="no" 
                checked={zaanvarHelpSell === "no"} 
                onChange={(e) => {
                  setZaanvarHelpSell(e.target.value);
                  setValidationErrors(prev => ({ ...prev, zaanvarHelpSell: "" }));
                }} 
              /> No
            </label>
          </div>
          {validationErrors.zaanvarHelpSell && (
            <p className={styles.errorText}>{validationErrors.zaanvarHelpSell}</p>
          )}

          <p>Would you recommend Zaanvar to your friend? <span className={styles.requiredStar}>*</span></p>
          <div className={styles["para-text"]}>
            <label>
              <input 
                type="radio" 
                value="yes" 
                checked={zaanvarRecommend === "yes"} 
                onChange={(e) => {
                  setZaanvarRecommend(e.target.value);
                  setValidationErrors(prev => ({ ...prev, zaanvarRecommend: "" }));
                }} 
              /> Yes
            </label>
            <label>
              <input 
                type="radio" 
                value="no" 
                checked={zaanvarRecommend === "no"} 
                onChange={(e) => {
                  setZaanvarRecommend(e.target.value);
                  setValidationErrors(prev => ({ ...prev, zaanvarRecommend: "" }));
                }} 
              /> No
            </label>
          </div>
          {validationErrors.zaanvarRecommend && (
            <p className={styles.errorText}>{validationErrors.zaanvarRecommend}</p>
          )}

          <p>Do you want to change the price?</p>
          <div className={styles["para-text"]}>
            <label>
              <input 
                type="radio" 
                value="yes" 
                checked={changePrice === "yes"} 
                onChange={(e) => {
                  setChangePrice(e.target.value);
                  if (e.target.value !== "yes") {
                    setNewPrice("");
                  }
                  setValidationErrors(prev => ({ ...prev, newPrice: "" }));
                }} 
              /> Yes
            </label>
            <label>
              <input 
                type="radio" 
                value="no" 
                checked={changePrice === "no"} 
                onChange={(e) => {
                  setChangePrice(e.target.value);
                  setNewPrice("");
                  setValidationErrors(prev => ({ ...prev, newPrice: "" }));
                }} 
              /> No
            </label>
          </div>
          
          {changePrice === "yes" && (
            <>
              <input 
                type="number" 
                value={newPrice} 
                onChange={(e) => {
                  setNewPrice(e.target.value);
                  setValidationErrors(prev => ({ ...prev, newPrice: "" }));
                }} 
                placeholder="Enter new price" 
                className={styles.inputField} 
              />
              {validationErrors.newPrice && (
                <p className={styles.errorText}>{validationErrors.newPrice}</p>
              )}
            </>
          )}
        </div>

        <div className={styles.buttonContainer}>
          <button 
            className={styles.confirmBtn} 
            onClick={handleSubmitInner} 
            disabled={apiProcessing.loader}
          >
            {apiProcessing.loader ? "Saving..." : "Confirm & Save"}
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {!showInnerPopup && (
        <div className={styles.overlay}>
          <div className={`${styles.modal} ${styles.changeStatusModal}`}>
            <div className={styles.modalHeader}>
              <button onClick={onClose} className={styles.backBtn}> ← </button>
              <h3 className={styles.modalTitle}>Change Status</h3>
            </div>

            <div className={styles.changeStatusSection}>
              <label className={styles["lable-div"]}>Pet Status <span className={styles.requiredStar}>*</span></label>
              <select 
                value={selectedStatus} 
                onChange={(e) => {
                  setSelectedStatus(e.target.value);
                  setValidationErrors(prev => ({ ...prev, selectedStatus: "" }));
                  setErrorMessage("");
                }} 
                className={styles.selectField}
              >
                <option value="">Select Status</option>                
                <option value="Reserved">Reserved</option>
                <option value="Sold Out">Sold Out</option>
                <option value="On Hold">On Hold</option>
                <option value="Not for Sale">Not for Sale</option>
                <option value="Ready for Sale">Ready for Sale</option>
              </select>
              {validationErrors.selectedStatus && (
                <p className={styles.errorText}>{validationErrors.selectedStatus}</p>
              )}
            </div>
            
            {selectedStatus && selectedStatus !== "Sold Out" && (
              <div className={styles.descriptionField}>
                <label className={styles["lable-div"]}>Description</label>
                <textarea
                  value={detailData.notes || ""}
                  onChange={(e) => setDetailData((prev) => ({ ...prev, notes: e.target.value }))}
                  className={styles.inputField}
                  placeholder="Enter notes..."
                  style={{ height: "80px" }}
                />
              </div>
            )}

            <button 
              className={styles.confirmBtnFull} 
              onClick={handleSave} 
              disabled={apiProcessing.loader}
            >
              {apiProcessing.loader ? "Processing..." : "Change Status"}
            </button>
            {errorMessage && <p className={styles.errorText}>{errorMessage}</p>}
          </div>
        </div>
      )}
      {showInnerPopup && <StatusInnerPopup />}
    </>
  );
};

export default ChangeStatus;
