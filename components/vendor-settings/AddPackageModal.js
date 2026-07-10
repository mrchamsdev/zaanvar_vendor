import React, { useState, useEffect } from "react";
import styles from "../../styles/vendor-settings/services-packages.module.css";

const AddPackageModal = ({ onClose, onSave, initialData }) => {
  const [branch, setBranch] = useState(initialData?.branch || "");
  const [category, setCategory] = useState(initialData?.category || "");
  const [packageName, setPackageName] = useState(initialData?.packageName || "");
  const [serviceName, setServiceName] = useState(initialData?.serviceName || "");
  const [petType, setPetType] = useState(initialData?.petType || "");
  const [price, setPrice] = useState(initialData?.price || "");
  const [discountPercent, setDiscountPercent] = useState(initialData?.discountPercent || "");
  const [discountPrice, setDiscountPrice] = useState(initialData?.discountPrice || "");
  const [duration, setDuration] = useState(initialData?.duration || "");

  // Auto-calculate discount price or percentage
  useEffect(() => {
    if (price && discountPercent) {
      const p = parseFloat(price);
      const d = parseFloat(discountPercent);
      if (!isNaN(p) && !isNaN(d)) {
        const calculatedDiscountPrice = p - (p * d) / 100;
        setDiscountPrice(calculatedDiscountPrice.toFixed(0));
      }
    }
  }, [price, discountPercent]);

  const handleDiscountPriceChange = (val) => {
    setDiscountPrice(val);
    if (price && val) {
      const p = parseFloat(price);
      const dp = parseFloat(val);
      if (!isNaN(p) && !isNaN(dp) && p > 0) {
        const calculatedPercent = ((p - dp) / p) * 100;
        setDiscountPercent(calculatedPercent.toFixed(0));
      }
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!packageName || !price) {
      alert("Please enter Package Name and Price");
      return;
    }
    onSave({
      id: initialData?.id || Date.now().toString(),
      packageName,
      petType: petType || "DOG, Cat",
      duration: duration || "30 mins",
      price: price ? `₹ ${price}` : "₹ 0",
      rawPrice: price,
      discountPercent,
      discountPrice: discountPrice ? `₹ ${discountPrice}` : "₹ 0",
      rawDiscountPrice: discountPrice,
      branch,
      category,
      serviceName
    });
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h3 className={styles.modalTitle}>{initialData ? "Edit Package" : "Add Package"}</h3>
          <div className={styles.modalControls}>
            <button className={styles.controlBtn} title="Minimize">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="5" y1="12" x2="19" y2="12" /></svg>
            </button>
            <button className={styles.controlBtn} title="Maximize">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="3" y="3" width="18" height="18" rx="2" /></svg>
            </button>
            <button className={styles.controlBtn} onClick={onClose} title="Close">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className={styles.modalBody}>
            <h4 className={styles.sectionTitle}>Enter Package Details</h4>
            <div className={styles.formCard}>
              <div className={styles.formGrid}>
                <div className={styles.formGroup}>
                  <label>Branch Assigned</label>
                  <select className={styles.formSelect} value={branch} onChange={(e) => setBranch(e.target.value)}>
                    <option value="">Select Branch here</option>
                    <option value="B-119-004">Branch B-119-004</option>
                    <option value="B-120-001">Branch B-120-001</option>
                  </select>
                </div>

                <div className={styles.formGroup}>
                  <label>Category</label>
                  <select className={styles.formSelect} value={category} onChange={(e) => setCategory(e.target.value)}>
                    <option value="">Select Category here</option>
                    <option value="Full Body Care">Full Body Care</option>
                    <option value="Hygiene Package">Hygiene Package</option>
                  </select>
                </div>

                <div className={styles.formGroup}>
                  <label>Package name</label>
                  <input
                    type="text"
                    className={styles.formInput}
                    placeholder="Enter Package name here"
                    value={packageName}
                    onChange={(e) => setPackageName(e.target.value)}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>Service name</label>
                  <select className={styles.formSelect} value={serviceName} onChange={(e) => setServiceName(e.target.value)}>
                    <option value="">Select here</option>
                    <option value="Bathing, Nail Cutting">Bathing, Nail Cutting</option>
                    <option value="Bathing, Hair Trim, Nail Cutting">Bathing, Hair Trim, Nail Cutting</option>
                  </select>
                </div>

                <div className={styles.formGroup}>
                  <label>Pet Type</label>
                  <select className={styles.formSelect} value={petType} onChange={(e) => setPetType(e.target.value)}>
                    <option value="">Select here</option>
                    <option value="DOG, Cat">DOG, Cat</option>
                    <option value="DOG">DOG</option>
                    <option value="Cat">Cat</option>
                  </select>
                </div>

                <div className={styles.formGroup}>
                  <label>Duration</label>
                  <input
                    type="text"
                    className={styles.formInput}
                    placeholder="Enter Duration (e.g. 30 mins, 1 hour)"
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>Total Price ( ₹ )</label>
                  <input
                    type="number"
                    className={styles.formInput}
                    placeholder="Enter Total Price"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>Discount Percentage (%)</label>
                  <input
                    type="number"
                    className={styles.formInput}
                    placeholder="Enter here"
                    value={discountPercent}
                    onChange={(e) => setDiscountPercent(e.target.value)}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>Discount Price</label>
                  <input
                    type="number"
                    className={styles.formInput}
                    placeholder="Enter here"
                    value={discountPrice}
                    onChange={(e) => handleDiscountPriceChange(e.target.value)}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className={styles.modalFooter}>
            <button type="button" className={styles.btnBack} onClick={onClose}>Back</button>
            <button type="submit" className={styles.btnSave}>Save</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddPackageModal;
