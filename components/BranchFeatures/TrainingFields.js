import React from "react";
import MultiSelectDropdown from "../MultiSelectDropdown";
import styles from "../../styles/branchFeatures/TrainingFields.module.css";

const TrainingFields = ({ branch, branchIndex, setBranches, petList }) => {
  const trainingTypeOptions = [
    { id: "Doorstep Training", name: "Doorstep Training" },
    { id: "Center-based Training", name: "Center-based Training" },
  ];

  const handleServiceChange = (field, value) => {
    setBranches((prev) => {
      const newBranches = [...prev];
      const trainingData = newBranches[branchIndex].services["Pet Training"] || {};
      newBranches[branchIndex].services["Pet Training"] = {
        ...trainingData,
        [field]: value,
      };
      return newBranches;
    });
  };

  const updateList = (field, index, subField, value) => {
    const currentList = [...(branch.services["Pet Training"]?.[field] || [])];
    currentList[index] = { ...currentList[index], [subField]: value };
    handleServiceChange(field, currentList);
  };

  const addListItem = (field, defaultValue) => {
    const currentList = [...(branch.services["Pet Training"]?.[field] || [])];
    handleServiceChange(field, [...currentList, defaultValue]);
  };

  const removeListItem = (field, index) => {
    const currentList = [...(branch.services["Pet Training"]?.[field] || [])];
    handleServiceChange(field, currentList.filter((_, i) => i !== index));
  };

  const trainingData = branch.services["Pet Training"] || {};
  const selectedTypes = trainingData.trainingTypes || [];
  const isCenterBased = selectedTypes.includes("Center-based Training");

  const enteredServices = trainingData.items || [];
  const serviceOptionsForPackages = [
    ...enteredServices
      .filter((item) => item.serviceName?.trim())
      .map((item) => ({ id: item.serviceName, name: item.serviceName })),
    // { id: "General Training", name: "General Training" },
  ];

  const ageUnitOptions = ["Days", "Months", "Years"];
  const durationUnitOptions = ["Minutes", "Hours"];

  return (
    <div className={styles.trainingContainer}>
      <h5 className={styles.featureTitle}>Pet Training Details</h5>

      <div className={styles.topGrid}>
        <div className={styles.formField}>
          <MultiSelectDropdown
            listItems={trainingTypeOptions}
            selectedIds={selectedTypes}
            setSelectedIds={(ids) => handleServiceChange("trainingTypes", ids)}
            heading="Training Type"
            mandatory={true}
          />
        </div>
        <div className={styles.formField}>
          <MultiSelectDropdown
            listItems={petList}
            selectedIds={trainingData.petTypes || []}
            setSelectedIds={(ids) => handleServiceChange("petTypes", ids)}
            heading="Pet Type"
            mandatory={true}
          />
        </div>
      </div>

      <div className={styles.formField} style={{ marginTop: "16px" }}>
        <label className={styles.label}>Serviceable Areas</label>
        <input
          type="text"
          className={styles.textInput}
          placeholder="e.g. Madhapur, Jubilee Hills"
          value={trainingData.serviceableAreas || ""}
          onChange={(e) => handleServiceChange("serviceableAreas", e.target.value)}
        />
      </div>

      {/* ===== AGE & CAPACITY ===== */}
      <div className={styles.topGrid} style={{ marginTop: "16px" }}>
        {/* Minimum Age */}
        <div className={styles.formField}>
          <label className={styles.label}>Minimum Age Accepted</label>
          <div className={styles.numberWithUnit}>
            <input
              type="number"
              min="0"
              placeholder="e.g. 3"
              className={styles.numberInput}
              value={trainingData.minAge?.value || ""}
              onChange={(e) =>
                handleServiceChange("minAge", {
                  ...(trainingData.minAge || {}),
                  value: e.target.value,
                })
              }
            />
            <select
              className={styles.unitSelect}
              value={trainingData.minAge?.unit || "Months"}
              onChange={(e) =>
                handleServiceChange("minAge", {
                  ...(trainingData.minAge || {}),
                  unit: e.target.value,
                })
              }
            >
              {ageUnitOptions.map((u) => <option key={u} value={u}>{u}</option>)}
            </select>
          </div>
        </div>

        {/* Maximum Age */}
        <div className={styles.formField}>
          <label className={styles.label}>Maximum Age Accepted</label>
          <div className={styles.numberWithUnit}>
            <input
              type="number"
              min="0"
              placeholder="e.g. 10"
              className={styles.numberInput}
              value={trainingData.maxAge?.value || ""}
              onChange={(e) =>
                handleServiceChange("maxAge", {
                  ...(trainingData.maxAge || {}),
                  value: e.target.value,
                })
              }
            />
            <select
              className={styles.unitSelect}
              value={trainingData.maxAge?.unit || "Years"}
              onChange={(e) =>
                handleServiceChange("maxAge", {
                  ...(trainingData.maxAge || {}),
                  unit: e.target.value,
                })
              }
            >
              {ageUnitOptions.map((u) => <option key={u} value={u}>{u}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Max Pets per Batch — Center-based only */}
      {isCenterBased && (
        <div className={styles.formField} style={{ marginTop: "16px" }}>
          <label className={styles.label}>Max Pets per Batch / Session</label>
          <input
            type="number"
            min="1"
            placeholder="e.g. 5"
            className={styles.textInput}
            style={{ maxWidth: "220px" }}
            value={trainingData.maxPetsPerBatch || ""}
            onChange={(e) => handleServiceChange("maxPetsPerBatch", e.target.value)}
          />
          <small style={{ color: "#888", fontSize: "0.82rem", marginTop: "4px" }}>
            For center-based group training sessions
          </small>
        </div>
      )}

      {/* ===== SERVICES ===== */}
      <div className={styles.sectionHeader} style={{ marginTop: "20px" }}>
        <label className={styles.label}>Training Services &amp; Schedule</label>
        <button
          type="button"
          className={styles.addBtn}
          onClick={() =>
            addListItem("items", {
              serviceName: "",
              noOfDays: "",
              noOfSessions: "",
              duration: "",
              durationUnit: "Hours",
            })
          }
        >
          + Add Service
        </button>
      </div>

      {(trainingData.items || [
        { serviceName: "", noOfDays: "", noOfSessions: "", duration: "", durationUnit: "Hours" },
      ]).map((item, idx) => (
        <div key={idx} className={styles.trainingSideBySideRow}>
          <input
            className={styles.flexService}
            placeholder="Service Name"
            value={item.serviceName}
            onChange={(e) => updateList("items", idx, "serviceName", e.target.value)}
          />
          <input
            className={styles.flexSmall}
            type="number"
            placeholder="Days"
            value={item.noOfDays}
            onChange={(e) => updateList("items", idx, "noOfDays", e.target.value)}
          />
          <input
            className={styles.flexSmall}
            type="number"
            placeholder="Sessions"
            value={item.noOfSessions}
            onChange={(e) => updateList("items", idx, "noOfSessions", e.target.value)}
          />
          <div className={styles.numberWithUnit} style={{ flex: "1 0 160px" }}>
            <input
              type="number"
              min="1"
              placeholder="Duration"
              className={styles.numberInput}
              value={item.duration || ""}
              onChange={(e) => updateList("items", idx, "duration", e.target.value)}
            />
            <select
              className={styles.unitSelect}
              value={item.durationUnit || "Hours"}
              onChange={(e) => updateList("items", idx, "durationUnit", e.target.value)}
            >
              {durationUnitOptions.map((u) => <option key={u} value={u}>{u}</option>)}
            </select>
          </div>
          {idx > 0 && (
            <button type="button" className={styles.removeBtn} onClick={() => removeListItem("items", idx)}>
              ×
            </button>
          )}
        </div>
      ))}

      {/* ===== PACKAGES ===== */}
      <div className={styles.sectionHeader} style={{ marginTop: "20px" }}>
        <label className={styles.label}>Training Packages</label>
        <button
          type="button"
          className={styles.addBtn}
          onClick={() =>
            addListItem("packages", {
              packageName: "",
              selectedServices: [],
              noOfDays: "",
              noOfSessions: "",
              duration: "",
              durationUnit: "Hours",
            })
          }
        >
          + Add Package
        </button>
      </div>

      {(trainingData.packages || [
        { packageName: "", selectedServices: [], noOfDays: "", noOfSessions: "", duration: "", durationUnit: "Hours" },
      ]).map((pkg, idx) => (
        <div key={idx} className={styles.packageMultiColumnRow}>
          <input
            className={styles.flexPackageName}
            placeholder="Package Name"
            value={pkg.packageName}
            onChange={(e) => updateList("packages", idx, "packageName", e.target.value)}
          />
          <div style={{ flex: "1 0 calc(50% - 12px)", minWidth: 200 }}>
            <MultiSelectDropdown
              heading=""
              listItems={serviceOptionsForPackages}
              selectedIds={pkg.selectedServices || []}
              setSelectedIds={(ids) => updateList("packages", idx, "selectedServices", ids)}
              mandatory={false}
            />
          </div>
          <input
            className={styles.flexTiny}
            type="number"
            placeholder="Days"
            value={pkg.noOfDays}
            onChange={(e) => updateList("packages", idx, "noOfDays", e.target.value)}
          />
          <input
            className={styles.flexTiny}
            type="number"
            placeholder="Sessions"
            value={pkg.noOfSessions}
            onChange={(e) => updateList("packages", idx, "noOfSessions", e.target.value)}
          />
          <div className={styles.numberWithUnit} style={{ flex: "1 0 160px" }}>
            <input
              type="number"
              min="1"
              placeholder="Duration"
              className={styles.numberInput}
              value={pkg.duration || ""}
              onChange={(e) => updateList("packages", idx, "duration", e.target.value)}
            />
            <select
              className={styles.unitSelect}
              value={pkg.durationUnit || "Hours"}
              onChange={(e) => updateList("packages", idx, "durationUnit", e.target.value)}
            >
              {durationUnitOptions.map((u) => <option key={u} value={u}>{u}</option>)}
            </select>
          </div>
          {idx > 0 && (
            <button type="button" className={styles.removeBtn} onClick={() => removeListItem("packages", idx)}>
              ×
            </button>
          )}
        </div>
      ))}
    </div>
  );
};

export default TrainingFields;