import React, { useState, useEffect } from "react";
import styles from "../../styles/vendor-settings/services-packages.module.css";
import useDashboardData from "../dashboard/useDashboardData";
import MultiSelectDropdown from "../MultiSelectDropdown";
import { VENDOR_API_URL } from "../utilities/Constants";
import useStore from "../state/useStore";

const AddPackageModal = ({ onClose, onSave, initialData }) => {
  const { branches } = useDashboardData({ skipReviews: true });
  const [branch, setBranch] = useState(initialData?.branch || "");
  const [category, setCategory] = useState(initialData?.category || "");
  const [packageName, setPackageName] = useState(initialData?.packageName || "");
  const [selectedServices, setSelectedServices] = useState(initialData?.services ? initialData.services.map(s => s.id || s) : []);
  const [petTypes, setPetTypes] = useState(initialData?.petType ? initialData.petType.split(",").map(p => p.trim()) : []);
  const [price, setPrice] = useState(initialData?.price || "");
  const [discountPercent, setDiscountPercent] = useState(initialData?.discountPercent || "");
  const [discountPrice, setDiscountPrice] = useState(initialData?.discountPrice || "");
  const [duration, setDuration] = useState(initialData?.duration || "");
  const [availableServices, setAvailableServices] = useState([]);

  const selectedBranchId = useStore((state) => state.selectedBranchId);
  
  // Prevent background scrolling when modal is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, []);

  // Fetch available services for the dropdown
  useEffect(() => {
    const fetchServices = async () => {
      try {
        const defaultBranchId = selectedBranchId || (branches && branches.length > 0 ? branches[0].id : 3);
        const branchIdToFetch = branch || defaultBranchId;
        const cleanBranchId = String(branchIdToFetch).replace(/^B-/, "");
        const res = await fetch(`${VENDOR_API_URL}vendor/grooming-booking/offerings/${cleanBranchId}?type=services`);
        const json = await res.json();
        if (json.status === "success" && json.data && json.data.services) {
          setAvailableServices(json.data.services.map(s => ({ id: s.id, name: s.serviceName })));
        }
      } catch (err) {
        console.error("Failed to fetch services", err);
      }
    };
    fetchServices();
  }, [branch, branches, selectedBranchId]);

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
    
    const durationNum = parseInt(duration) || 30;
    const petTypeArray = petTypes.length > 0 ? petTypes : ["Dog", "Cat"];

    const apiPayload = {
      serviceName: packageName,
      services: selectedServices, // pass the array of selected service IDs
      category: category || "Grooming",
      petType: petTypeArray,
      duration: durationNum,
      price: parseFloat(price) || 0,
      discountPercentage: parseFloat(discountPercent) || 0,
      discountPrice: parseFloat(discountPrice) || 0
    };

    onSave({
      id: initialData?.id || Date.now().toString(),
      apiPayload
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
                    {branches && branches.map(b => (
                      <option key={b.id} value={b.id}>{b.branchName || b.name}</option>
                    ))}
                  </select>
                </div>

                <div className={styles.formGroup}>
                  <label>Category</label>
                  <select className={styles.formSelect} value={category} onChange={(e) => setCategory(e.target.value)}>
                    <option value="">Select Category here</option>
                    <option value="Grooming">Grooming</option>
                    <option value="Day care">Day care</option>
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

                <div className={styles.formGroup} style={{ position: 'relative' }}>
                  <MultiSelectDropdown
                    heading="Included Services"
                    listItems={availableServices}
                    selectedIds={selectedServices}
                    setSelectedIds={setSelectedServices}
                    hideSearch={false}
                  />
                </div>

                <div className={styles.formGroup} style={{ position: 'relative' }}>
                  <MultiSelectDropdown
                    heading="Pet Type"
                    listItems={[
                      { id: "Dog", name: "Dog" },
                      { id: "Cat", name: "Cat" },
                      { id: "Bird", name: "Bird" },
                      { id: "Fish", name: "Fish" },
                      { id: "Small Pets", name: "Small Pets" }
                    ]}
                    selectedIds={petTypes}
                    setSelectedIds={setPetTypes}
                    hideSearch={true}
                  />
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
