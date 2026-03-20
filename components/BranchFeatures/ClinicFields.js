import React from "react";
import MultiSelectDropdown from "../MultiSelectDropdown";
import styles from "../../styles/branchFeatures/clinicFields.module.css";

const CLINIC_TYPES = [
  { id: "Home visit", name: "Home visit" },
  { id: "Online visit", name: "Online visit" },
  { id: "Clinic visit", name: "Clinic visit" },
];

const EMPTY_ITEM = {
  services: [],
  petTypes: [],
  serviceFees: {}, // Structure: { [clinicType]: fee }
};

const ClinicFields = ({
  branch,
  branchIndex,
  type,
  setBranches,
  petList,
  availablePetTypes,
  serviceOptionsByFeatureType,
}) => {
  /* ================= NORMALIZE DATA ================= */
  const rawClinic = branch.services?.[type] || {};

  const clinic = {
    clinicTypes: Array.isArray(rawClinic.clinicTypes) ? rawClinic.clinicTypes : [],
    items: Array.isArray(rawClinic.items) ? rawClinic.items : [EMPTY_ITEM],
  };

  /* ================= UPDATE HELPERS ================= */
  const updateClinic = (updated) => {
    setBranches((prev) =>
      prev.map((b, i) =>
        i === branchIndex
          ? {
              ...b,
              services: {
                ...b.services,
                [type]: updated,
              },
            }
          : b
      )
    );
  };

  const updateItem = (index, field, value) => {
    const items = [...clinic.items];
    items[index] = { ...items[index], [field]: value };
    updateClinic({ ...clinic, items });
  };

  /* ================= ADD / REMOVE ================= */
  const addItem = () => {
    updateClinic({
      ...clinic,
      items: [...clinic.items, { ...EMPTY_ITEM }],
    });
  };

  const removeItem = (index) => {
    if (clinic.items.length === 1) return;
    updateClinic({
      ...clinic,
      items: clinic.items.filter((_, i) => i !== index),
    });
  };

  /* ================= UI ================= */
  return (
    <div className={styles.container}>
      {/* HEADER */}
      <div className={styles.headerRow}>
        <h4>Pet Clinic</h4>
        <button className={styles.addBtn} type="button" onClick={addItem}>
          + Add
        </button>
      </div>

      {/* CLINIC TYPE - ONCE AT TOP LEVEL */}
      <div className={styles.serviceBox}>
        <MultiSelectDropdown
          listItems={CLINIC_TYPES}
          selectedIds={clinic.clinicTypes || []}
          setSelectedIds={(ids) => {
            updateClinic({ ...clinic, clinicTypes: ids });
          }}
          heading="Clinic Type"
          mandatory
        />
      </div>

      {/* MULTIPLE CLINIC BLOCKS */}
      {clinic.items.map((item, index) => (
        <div key={index} className={styles.serviceBox}>
          {/* Floating close button in top-right corner */}
          {clinic.items.length > 1 && (
            <button
              className={styles.closeBtn}
              type="button" 
              onClick={() => removeItem(index)}
              title="Remove this configuration"
            >
              ×
            </button>
          )}

          {/* SERVICES - SINGLE SELECT */}
          <div className={styles.fullWidth}>
            <label className={styles.label}>Select Service *</label>
            <select
              className={styles.input}
              value={item.services && item.services.length > 0 ? item.services[0] : ""}
              onChange={(e) => {
                const service = e.target.value;
                const items = [...clinic.items];
                items[index] = {
                  ...items[index],
                  services: service ? [service] : [],
                  // Keep existing serviceFees structure (clinicType -> fee)
                  serviceFees: item.serviceFees || {},
                };
                updateClinic({ ...clinic, items });
              }}
            >
              <option value="">-- Select a Service --</option>
              {serviceOptionsByFeatureType["Pet Clinic"]?.map((service) => (
                <option key={service} value={service}>
                  {service}
                </option>
              ))}
            </select>
          </div>

          {/* PET TYPES */}
          <MultiSelectDropdown
           listItems={availablePetTypes}
            selectedIds={item.petTypes}
            setSelectedIds={(ids) => updateItem(index, "petTypes", ids)}
            heading="Supported Pets"
            mandatory
          />

          {/* CLINIC TYPE FEES - Only show if service is selected and clinic types are selected */}
          {item.services && item.services.length > 0 && clinic.clinicTypes && clinic.clinicTypes.length > 0 && (
            <div className={styles.fullWidth}>
              <label className={styles.label}>Consultation Fees (₹) *</label>
              <div className={styles.feeGrid}>
                {clinic.clinicTypes.map((clinicType) => (
                  <div key={clinicType} className={styles.feeItem}>
                    <span className={styles.serviceName}>{clinicType} Fee</span>
                    <input
                      type="text"
                      inputMode="numeric"
                      className={styles.input}
                      placeholder="Enter fee"
                      value={item.serviceFees?.[clinicType] ?? ""}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, "");
                        updateItem(index, "serviceFees", {
                          ...(item.serviceFees || {}),
                          [clinicType]: value,
                        });
                      }}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default ClinicFields;