import { useState } from "react";
import styles from "../../styles/pet-sales/addNewAddressPopup.module.css";

const AddNewAddressPopup = ({ postFormData }) => {
  const [showModal, setShowModal] = useState(true); // manage modal visibility
  const [formData, setFormData] = useState({
    fullName: postFormData?.fullName || "",
    mobileNumber: postFormData?.phone || "",
    flat: "",
    street: "",
    landmark: "",
    country: "",
    state: "",
    pinCode: "",
    city: "",
    isDefault: false,
  });

  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSave = () => {
    const newErrors = {};

    if (!(formData.fullName || "").trim()) newErrors.fullName = "Full Name is required";
    if (!(formData.mobileNumber || "").trim()) newErrors.mobileNumber = "Mobile Number is required";
    if (!(formData.flat || "").trim()) newErrors.flat = "Flat/House no. is required";
    if (!(formData.street || "").trim()) newErrors.street = "Street is required";
    if (!(formData.landmark || "").trim()) newErrors.landmark = "Landmark is required";
    if (!(formData.country || "").trim()) newErrors.country = "Country is required";
    if (!(formData.state || "").trim()) newErrors.state = "State is required";
    if (!(formData.pinCode || "").trim()) newErrors.pinCode = "Pin Code is required";
    if (!(formData.city || "").trim()) newErrors.city = "City is required";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    console.log("Saved Data:", formData); // Replace with your local handling logic
    setShowModal(false); // Close modal after save
  };

  // Close modal if clicked outside modal content
  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      setShowModal(false);
    }
  };

  if (!showModal) return null; // hide modal

  return (
    <div className={styles.overlay} onClick={handleOverlayClick}>
      <div className={styles.modal}>
        <div className={styles.header}>
          <button className={styles.backButton} onClick={() => setShowModal(false)}>←</button>
          <span className={styles.headerTitle}>Add New Address</span>
        </div>

        <div className={styles.content}>
          {/* Full Name */}
          <div className={styles.formGroup}>
            <label>Full Name</label>
            <input
              name="fullName"
              placeholder="Enter First and Last Name"
              value={formData.fullName}
              onChange={handleChange}
            />
            {errors.fullName && <span className={styles.error}>{errors.fullName}</span>}
          </div>

          {/* Mobile Number */}
          <div className={styles.formGroup}>
            <label>Mobile Number</label>
            <input
              name="mobileNumber"
              placeholder="Enter Here"
              value={formData.mobileNumber}
              onChange={(e) => {
                const val = e.target.value;
                if (val.length <= 10 && /^[0-9]*$/.test(val)) handleChange(e);
              }}
            />
            {errors.mobileNumber && <span className={styles.error}>{errors.mobileNumber}</span>}
          </div>

          {/* Flat */}
          <div className={styles.formGroup}>
            <label>Flat, House no., Building, Company, Apartment</label>
            <input
              name="flat"
              placeholder="Enter Here"
              value={formData.flat}
              onChange={handleChange}
            />
            {errors.flat && <span className={styles.error}>{errors.flat}</span>}
          </div>

          {/* Street */}
          <div className={styles.formGroup}>
            <label>Area, Street, Sector, Village</label>
            <input
              name="street"
              placeholder="Enter Here"
              value={formData.street}
              onChange={handleChange}
            />
            {errors.street && <span className={styles.error}>{errors.street}</span>}
          </div>

          {/* Landmark */}
          <div className={styles.formGroup}>
            <label>Landmark</label>
            <input
              name="landmark"
              placeholder="Enter Here"
              value={formData.landmark}
              onChange={handleChange}
            />
            {errors.landmark && <span className={styles.error}>{errors.landmark}</span>}
          </div>

          {/* Country & State */}
          <div className={styles.row}>
            <div className={styles.formContainer}>
              <label>Country</label>
              <input
                name="country"
                placeholder="Enter Country"
                value={formData.country}
                onChange={handleChange}
              />
              {errors.country && <span className={styles.errorText}>{errors.country}</span>}
            </div>
            <div className={styles.formContainer}>
              <label>State</label>
              <input
                name="state"
                placeholder="Enter State"
                value={formData.state}
                onChange={handleChange}
              />
              {errors.state && <span className={styles.errorText}>{errors.state}</span>}
            </div>
          </div>

          {/* City & Pin Code */}
          <div className={styles.row}>
            <div className={styles.formContainer}>
              <label>City/Town</label>
              <input
                name="city"
                placeholder="Enter City"
                value={formData.city}
                onChange={handleChange}
              />
              {errors.city && <span className={styles.errorText}>{errors.city}</span>}
            </div>
            <div className={styles.formContainer}>
              <label>Pin code</label>
              <input
                name="pinCode"
                placeholder="Enter Here"
                value={formData.pinCode}
                onChange={(e) => {
                  const val = e.target.value;
                  if (/^[0-9]*$/.test(val) && val.length <= 6) handleChange(e);
                }}
              />
              {errors.pinCode && <span className={styles.errorText}>{errors.pinCode}</span>}
            </div>
          </div>

          {/* Default Address */}
          <div className={styles.formGroupCheckbox}>
            <input
              type="checkbox"
              name="isDefault"
              checked={formData.isDefault}
              onChange={handleChange}
            />
            <label>Make this my default address</label>
          </div>
        </div>

        <div className={styles["button-container"]}>
          <button className={styles.saveButton} onClick={handleSave}>
            SAVE
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddNewAddressPopup;
