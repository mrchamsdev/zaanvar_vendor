import React from "react";
import MultiSelectDropdown from "../MultiSelectDropdown";
import styles from "../../styles/branchFeatures/Sitter.module.css";

const SitterFields = ({ branch, branchIndex, setBranches, petList }) => {
  const petSizeOptions = [
    { id: "Small", name: "Small (0-10kg)" },
    { id: "Medium", name: "Medium (11-20kg)" },
    { id: "Large", name: "Large (21-40kg)" },
    { id: "Giant", name: "Giant (41kg+)" },
  ];

  const handleServiceChange = (field, value) => {
    setBranches((prev) => {
      const newBranches = [...prev];
      const sitterData = newBranches[branchIndex].services["Pet Sitter/Walker"] || {};
      newBranches[branchIndex].services["Pet Sitter/Walker"] = {
        ...sitterData,
        [field]: value,
      };
      return newBranches;
    });
  };

  const updateList = (field, index, subField, value) => {
    const currentList = [...(branch.services["Pet Sitter/Walker"]?.[field] || [])];
    currentList[index] = { ...currentList[index], [subField]: value };
    handleServiceChange(field, currentList);
  };

  const addListItem = (field, defaultValue) => {
    const currentList = [...(branch.services["Pet Sitter/Walker"]?.[field] || [])];
    handleServiceChange(field, [...currentList, defaultValue]);
  };

  const removeListItem = (field, index) => {
    const currentList = [...(branch.services["Pet Sitter/Walker"]?.[field] || [])];
    handleServiceChange(field, currentList.filter((_, i) => i !== index));
  };

  return (
    <div className={styles.sitterContainer}>
      {/* ✅ Title changed from "Pet Sitting Details" to "Pet Sitter / Walker Details" */}
      <h5 className={styles.featureTitle}>Pet Sitter / Walker Details</h5>

      <div className={styles.topGrid}>
        <div className={styles.formField}>
          <MultiSelectDropdown
            listItems={petSizeOptions}
            selectedIds={branch.services["Pet Sitter/Walker"]?.petSizes || []}
            setSelectedIds={(ids) => handleServiceChange("petSizes", ids)}
            heading="Accepted Pet Sizes"
            mandatory={true}
          />
        </div>

        <div className={styles.formField}>
          <MultiSelectDropdown
            listItems={petList}
            selectedIds={branch.services["Pet Sitter/Walker"]?.petTypes || []}
            setSelectedIds={(ids) => handleServiceChange("petTypes", ids)}
            heading="Pet Types"
            mandatory={true}
          />
        </div>
      </div>

      <div className={styles.topGrid}>
        <div className={styles.formField}>
          <label className={styles.label}>Serviceable Areas</label>
          <input
            type="text"
            className={styles.textInput}
            placeholder="e.g. Madhapur, Kondapur"
            value={
              Array.isArray(branch.services["Pet Sitter/Walker"]?.serviceableAreas)
                ? branch.services["Pet Sitter/Walker"]?.serviceableAreas.join(", ")
                : branch.services["Pet Sitter/Walker"]?.serviceableAreas || ""
            }
            onChange={(e) => handleServiceChange("serviceableAreas", e.target.value)}
          />
        </div>

        <div className={styles.formField}>
          <label className={styles.label}>Languages Spoken</label>
          <input
            type="text"
            className={styles.textInput}
            placeholder="e.g. English, Hindi, Telugu"
            value={branch.services["Pet Sitter/Walker"]?.languages || ""}
            onChange={(e) => handleServiceChange("languages", e.target.value)}
          />
        </div>
      </div>

      {/* Sitting Services — single header with + button, no duplicate */}
      <div className={styles.sectionHeader}>
        <label className={styles.label}>Sitting Services &amp; Duration</label>
        <button
          type="button"
          className={styles.addBtn}
          onClick={() => addListItem("items", { serviceName: "", timePeriod: "" })}
        >
          + Add Service
        </button>
      </div>

      {(branch.services["Pet Sitter/Walker"]?.items || [{ serviceName: "", timePeriod: "" }]).map(
        (item, idx) => (
          <div key={idx} className={styles.sideBySideRow}>
            <input
              className={styles.flexInputTwo}
              placeholder="e.g. Dog Walking / Day Sitting"
              value={item.serviceName}
              onChange={(e) => updateList("items", idx, "serviceName", e.target.value)}
            />
            <input
              className={styles.flexInputOne}
              placeholder="Duration/Period"
              value={item.timePeriod}
              onChange={(e) => updateList("items", idx, "timePeriod", e.target.value)}
            />
            {idx > 0 && (
              <button
                type="button"
                className={styles.removeBtn}
                onClick={() => removeListItem("items", idx)}
              >
                ×
              </button>
            )}
          </div>
        )
      )}

      <div className={styles.bottomRow}>
        <div className={styles.formField} style={{ flex: 1 }}>
          <label className={styles.label}>Others (Notes)</label>
          <input
            type="text"
            className={styles.textInput}
            placeholder="Any other special instructions..."
            value={branch.services["Pet Sitter/Walker"]?.others || ""}
            onChange={(e) => handleServiceChange("others", e.target.value)}
          />
        </div>

        <div className={styles.formField}>
          <label className={styles.label}>Last Minute Booking Provided? *</label>
          <div
            className={styles.radioGroup}
            style={{ display: "flex", gap: "20px", marginTop: "10px" }}
          >
            <label
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                cursor: "pointer",
                fontWeight: "500",
              }}
            >
              <input
                type="radio"
                name={`lastMinute-${branchIndex}`}
                checked={branch.services["Pet Sitter/Walker"]?.lastMinuteBooking === true}
                onChange={() => handleServiceChange("lastMinuteBooking", true)}
              />
              Yes
            </label>
            <label
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                cursor: "pointer",
                fontWeight: "500",
              }}
            >
              <input
                type="radio"
                name={`lastMinute-${branchIndex}`}
                checked={branch.services["Pet Sitter/Walker"]?.lastMinuteBooking === false}
                onChange={() => handleServiceChange("lastMinuteBooking", false)}
              />
              No
            </label>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SitterFields;