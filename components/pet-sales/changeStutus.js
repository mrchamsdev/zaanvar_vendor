import React, { useState, useEffect } from "react";
import styles from "../../styles/pet-sales/chageStutus.module.css";

const ChangeStatus = ({ pet = null, onClose, onStatusChange }) => {
  const [selectedStatus, setSelectedStatus] = useState("");
  const [showInnerPopup, setShowInnerPopup] = useState(false);
  const [detailData, setDetailData] = useState({});
  const [errors, setErrors] = useState({});
  const [petBreed, setPetBreed] = useState("");
  const [petId, setPetId] = useState("");
  const [petName, setPetName] = useState("");

  const [zaanvarHelpSell, setZaanvarHelpSell] = useState("");
  const [zaanvarRecommend, setZaanvarRecommend] = useState("");
  const [changePrice, setChangePrice] = useState("");
  const [newPrice, setNewPrice] = useState("");

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => (document.body.style.overflow = "auto");
  }, []);

 const handleSave = () => {
  if (!selectedStatus) return;

  if (selectedStatus === "Sold Out") {
    setDetailData(initDetailDataForStatus(selectedStatus));
    setErrors({});
    setShowInnerPopup(true); // Only popup for Sold Out
  } else {
    // Other statuses: just save directly
    if (onStatusChange) {
      onStatusChange({
        status: selectedStatus,
        details: detailData,
      });
    }
    onClose();
  }
};

  

  const handleSubmitInner = () => {
    const validation = validateForStatus(selectedStatus, detailData);
    if (!validation.valid) {
      setErrors(validation.errors);
      return;
    }

    if (onStatusChange) {
      onStatusChange({
        status: selectedStatus,
        details: detailData,
        zaanvarHelpSell,
        zaanvarRecommend,
        priceChanged: changePrice === "yes" ? newPrice : null,
      });
    }
    setShowInnerPopup(false);
    onClose();
  };

  const handleCancel = () => {
    setShowInnerPopup(false);
    onClose();
  };

  const initDetailDataForStatus = (status) => {
    switch (status) {
      case "Available":
        return { availableDate: "", notes: "" };
      case "Reserved":
        return { reservedUntil: "", reserverName: "", notes: "" };
      case "Sold Out":
        return { soldDate: "", buyerId: "", soldPrice: "" };
      case "Not Available":
        return { reason: "", expectedReturnDate: "" };
      case "On Hold":
        return { holdUntil: "", holdReason: "" };
      default:
        return {};
    }
  };

  const validateForStatus = (status, data) => {
    const errors = {};
    let valid = true;

    switch (status) {
      case "Available":
        if (!data.availableDate) {
          valid = false;
          errors.availableDate = "Please pick available date.";
        }
        break;
      case "Reserved":
        if (!data.reservedUntil) {
          valid = false;
          errors.reservedUntil = "Please pick reserved-until date.";
        }
        if (!data.reserverName) {
          valid = false;
          errors.reserverName = "Please enter reserver name or id.";
        }
        break;
      case "Sold Out":
        if (!data.soldDate) {
          valid = false;
          errors.soldDate = "Please enter sold date.";
        }
        if (!data.buyerId) {
          valid = false;
          errors.buyerId = "Please enter buyer ID.";
        }
        break;
      case "Not Available":
        if (!data.reason) {
          valid = false;
          errors.reason = "Please provide a reason.";
        }
        break;
      case "On Hold":
        if (!data.holdUntil) {
          valid = false;
          errors.holdUntil = "Please select hold until date.";
        }
        if (!data.holdReason) {
          valid = false;
          errors.holdReason = "Please provide hold reason.";
        }
        break;
      default:
        break;
    }

    return { valid, errors };
  };

  const StatusInnerPopup = () => {
    return (
      <div className={styles.overlay}>
        <div className={styles.modal}>
          <div className={styles.modalHeader}>
            <button
              className={styles.backBtn}
              onClick={() => setShowInnerPopup(false)}
            >
              ←
            </button>
            <h3 className={styles.modalTitle}>{selectedStatus} Details</h3>
          </div>

          <div className={styles.innerBody}>
            {/* ✅ All statuses except Sold Out will use this same layout */}
            {selectedStatus !== "Sold Out" && (
              <>
                <div className={styles.petInfoSection}>
                  <div className={styles.inputGroup}>
                    <label className={styles["lable-div"]}>Pet Breed</label>
                    <input
                      type="text"
                      value={petBreed}
                      onChange={(e) => setPetBreed(e.target.value)}
                      className={styles.inputField}
                      placeholder="Enter pet breed"
                    />
                  </div>

                  <div className={styles.inputGroup}>
                    <label className={styles["lable-div"]}>Pet ID</label>
                    <input
                      type="text"
                      value={petId}
                      onChange={(e) => setPetId(e.target.value)}
                      className={styles.inputField}
                      placeholder="Enter pet ID"
                    />
                  </div>

                  <div className={styles.inputGroup}>
                    <label className={styles["lable-div"]}>Pet Name</label>
                    <input
                      type="text"
                      value={petName}
                      onChange={(e) => setPetName(e.target.value)}
                      className={styles.inputField}
                      placeholder="Enter pet name"
                    />
                  </div>

                  <p className={styles.description}>
                    To change pet status, select the appropriate status from the
                    dropdown below and click the “Change Status” button.
                  </p>

                  <div className={styles.changeStatusSection}>
  <label className={styles["lable-div"]}>Pet Status </label>
  <select
    value={selectedStatus}
    onChange={(e) => setSelectedStatus(e.target.value)}
    className={styles.selectField}
  >
    <option value="">Select Status</option>
    <option value="Available">Available</option>
    <option value="Reserved">Reserved</option>
    <option value="Sold Out">Sold Out</option>
    <option value="Not Available">Not Available</option>
    <option value="On Hold">On Hold</option>
  </select>
</div>


{selectedStatus && selectedStatus !== "Sold Out" && (
  <div className={styles.descriptionField}>
    <label className={styles["lable-div"]}>Description</label>
    <textarea
      value={detailData.notes || ""}
      onChange={(e) =>
        setDetailData((prev) => ({ ...prev, notes: e.target.value }))
      }
      className={styles.inputField}
      placeholder="Enter description..."
      style={{ height: "80px" }}
    />
  </div>
)}

{/* 
                  <div className={styles["below-para"]}>Description</div>
                  <textarea
                    className={styles.inputField}
                    style={{ height: "80px", fontSize: "16px" }}
                    placeholder="Enter description..."
                  />  */}

                  <div className={styles.warningBox}>
                    <span className={styles.warningText}>
                      <span>⚠️</span>
                      Please update the status as soon as the situation changes
                      to help others stay informed and avoid confusion.
                    </span>
                  </div>
                </div>
              </>
            )}


            {selectedStatus === "Sold Out" && (
              <>
                <div className={styles["wrapper-div"]}>
                  <img
                    src="https://zaanvar-care.b-cdn.net/media/1760693132852-Congratulation.png"
                    alt="congrats"
                    width="50%"
                  />
                </div>

                <p>Did Zaanvar directly help sell your pet?</p>
                <div className={styles["para-text"]}>
                  <label>
                    <input
                      type="radio"
                      name="zaanvarHelpSell"
                      value="yes"
                      checked={zaanvarHelpSell === "yes"}
                      onChange={(e) => setZaanvarHelpSell(e.target.value)}
                    />
                    Yes
                  </label>
                  <label>
                    <input
                      type="radio"
                      name="zaanvarHelpSell"
                      value="no"
                      checked={zaanvarHelpSell === "no"}
                      onChange={(e) => setZaanvarHelpSell(e.target.value)}
                    />
                    No
                  </label>
                </div>
                <p>Would you recommend Zaanvar to your friend?</p>
                <div className={styles["para-text"]}>
                  <label>
                    <input
                      type="radio"
                      name="zaanvarRecommend"
                      value="yes"
                      checked={zaanvarRecommend === "yes"}
                      onChange={(e) => setZaanvarRecommend(e.target.value)}
                    />
                    Yes, I would recommend
                  </label>
                  <label>
                    <input
                      type="radio"
                      name="zaanvarRecommend"
                      value="no"
                      checked={zaanvarRecommend === "no"}
                      onChange={(e) => setZaanvarRecommend(e.target.value)}
                    />
                    No, I would not recommend
                  </label>
                </div>

                <p>Do you want to change the current price?</p>
                <div className={styles["para-text"]}>
                  <label>
                    <input
                      type="radio"
                      name="changePrice"
                      value="yes"
                      checked={changePrice === "yes"}
                      onChange={(e) => setChangePrice(e.target.value)}
                    />
                    Yes
                  </label>
                  <label>
                    <input
                      type="radio"
                      name="changePrice"
                      value="no"
                      checked={changePrice === "no"}
                      onChange={(e) => setChangePrice(e.target.value)}
                    />
                    No
                  </label>
                </div>

                {changePrice === "yes" && (
                  <div>
                    <label>Enter Price</label>
                    <input
                      type="number"
                      value={newPrice}
                      onChange={(e) => setNewPrice(e.target.value)}
                      placeholder="Enter new price"
                      className={styles.inputField}
                    />
                  </div>
                )}

                <div className={styles["below-para"]}>
                  Want to say thanks to all the ethical breeders, responsible
                  vendors, and loving pet parents who help pets find happy,
                  healthy homes?
                </div>
                <textarea
                  className={styles.inputField}
                  style={{ height: "80px", fontSize: "16px" }}
                  placeholder="Enter something..."
                />
              </>
            )}
          </div>

          <div className={styles.buttonContainer}>
            <button className={styles.confirmBtn} onClick={handleSubmitInner}>
              Save
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      {!showInnerPopup && (
        <div className={styles.overlay}>
          <div className={`${styles.modal} ${styles.changeStatusModal}`}>
            <div className={styles.modalHeader}>
              <button onClick={onClose} className={styles.backBtn}>
                ←
              </button>
              <h3 className={styles.modalTitle}>Change Status</h3>
            </div>

            {/* ✅ New input fields section */}
            <div className={styles.petInfoSection}>
              <div className={styles.inputGroup}>
                <label className={styles["lable-div"]}>Pet Breed </label>
                <input
                  type="text"
                  value={petBreed}
                  onChange={(e) => setPetBreed(e.target.value)}
                  className={styles.inputField}
                  placeholder="Enter pet breed"
                />
              </div>

              <div className={styles.inputGroup}>
                <label className={styles["lable-div"]}>Pet ID </label>
                <input
                  type="text"
                  value={petId}
                  onChange={(e) => setPetId(e.target.value)}
                  className={styles.inputField}
                  placeholder="Enter pet ID"
                />
              </div>

              <div className={styles.inputGroup}>
                <label className={styles["lable-div"]}>Pet Name </label>
                <input
                  type="text"
                  value={petName}
                  onChange={(e) => setPetName(e.target.value)}
                  className={styles.inputField}
                  placeholder="Enter pet name"
                />
              </div>
            </div>

            <p className={styles.description}>
              To change pet status, select the appropriate status from the
              dropdown below and click the “Change Status” button.
            </p>

            <div className={styles.changeStatusSection}>
              <label className={styles["lable-div"]}>Pet Status </label>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className={styles.selectField}
              >
                <option value="">Select Status</option>
                <option value="Available">Available</option>
                <option value="Reserved">Reserved</option>
                <option value="Sold Out">Sold Out</option>
                <option value="Not Available">Not Available</option>
                <option value="On Hold">On Hold</option>
              </select>
            </div>
            {selectedStatus && selectedStatus !== "Sold Out" && (
  <div className={styles.descriptionField} >
    <label className={styles["lable-div"]}>Description</label>
    <textarea
      value={detailData.notes || ""}
      onChange={(e) =>
        setDetailData((prev) => ({ ...prev, notes: e.target.value }))
      }
      className={styles.inputField}
      placeholder="Enter description..."
      style={{ height: "80px" }}
    />
  </div>
)}
            <div className={styles.warningBox}>
              <span className={styles.warningText}>
                <span>⚠️</span>
                Please update the status as soon as the situation changes to
                help others stay informed and avoid confusion.
              </span>
            </div>

            <button className={styles.confirmBtnFull} onClick={handleSave}>
              Change Status
            </button>
          </div>
        </div>
      )}

      {showInnerPopup && <StatusInnerPopup />}
    </>
  );
};

export default ChangeStatus;
