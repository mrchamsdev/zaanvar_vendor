import React, { useEffect, useState, useRef } from "react";
import { FaTimes } from "react-icons/fa";
import MultiSelectDropdown from "../MultiSelectDropdown";
import styles from "@/styles/branchFeatures/GroomingFields.module.css";

const SERVICE_MODES = ["In-store", "In-home", "In-mobile"];

const GROOMING_OPTIONS = [
  "Bath & Blow Dry",
  "Hair Cut / Styling",
  "Nail Clipping",
  "Ear Cleaning",
  "Teeth Cleaning",
  "De-shedding",
  "Flea & Tick Treatment",
  "Puppy Grooming",
  "Full Grooming Package",
  "Other",
];

const emptyService = {
  serviceName: [],
  otherServiceName: "",
  petType: [],
  lifeStage: [],
  price: "",
  duration: "",
  description: "",
};

const emptyPackage = {
  packageName: "",
  selectedServices: [],
  price: "",
};

const GroomingSelect = ({ s, i, updateService }) => {
  const value = s.serviceName?.[0] || "";

  const onChange = (e) => {
    const val = e.target.value;
    updateService(i, null, (prev) => ({
      ...prev,
      serviceName: val ? [val] : [],
      otherServiceName: val === "Other" ? prev.otherServiceName : "",
    }));
  };

  return (
    <div className={styles.formField}>
      <label className={styles.label}>
        Grooming Service <span className={styles.required}>*</span>
      </label>
      <select className={styles.select} value={value} onChange={onChange}>
        <option value="">Select Grooming Service</option>
        {GROOMING_OPTIONS.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
    </div>
  );
};

const GroomingFields = ({ branch, branchIndex, type, setBranches, petList, availablePetTypes }) => {
  const grooming = branch.services?.[type] || {};
  const [priceErrors, setPriceErrors] = useState({});

  useEffect(() => {
    if (!grooming.services || grooming.services.length === 0) {
      setBranches((prev) => {
        const updated = [...prev];
        updated[branchIndex].services[type] = {
          services: [{ ...emptyService }],
          packages: [],
          serviceMode: [],
          terms: [],
          pickupLocations: [],
        };
        return updated;
      });
    }
  }, [grooming.services, branchIndex, type, setBranches]);

  const updateGrooming = (field, value) => {
    setBranches((prev) => {
      const updated = [...prev];
      updated[branchIndex].services[type] = {
        ...updated[branchIndex].services[type],
        [field]: value,
      };
      return updated;
    });
  };

  const services = (grooming.services || []).map((s) => ({
    ...s,
    serviceName: Array.isArray(s.serviceName) ? s.serviceName : [],
    otherServiceName: s.otherServiceName || "",
    petType: Array.isArray(s.petType) ? s.petType : [],
    lifeStage: Array.isArray(s.lifeStage) ? s.lifeStage : [],
  }));

  const addService = () =>
    updateGrooming("services", [...services, { ...emptyService }]);

  const updateService = (i, field, valueOrUpdater) => {
    const updated = [...services];
    const current = { ...updated[i] };
    if (typeof valueOrUpdater === "function") {
      updated[i] = valueOrUpdater(current);
    } else {
      updated[i] = { ...current, [field]: valueOrUpdater };
    }
    updateGrooming("services", updated);
  };

  const removeService = (i) => {
    if (services.length === 1) return;
    updateGrooming("services", services.filter((_, idx) => idx !== i));
    // setPriceErrors((prev) => {
    //   const newErrors = { ...prev };
    //   delete newErrors[`service_${i}`];
    //   return newErrors;
    // });
  };

  const packages = grooming.packages || [];

  const addPackage = () => {
    if (services.length === 0) return;
    updateGrooming("packages", [...packages, { ...emptyPackage }]);
  };

  const updatePackage = (i, field, value) => {
    const updated = [...packages];
    updated[i] = { ...updated[i], [field]: value };
    updateGrooming("packages", updated);
  };

  const removePackage = (i) => {
    updateGrooming("packages", packages.filter((_, idx) => idx !== i));
    // setPriceErrors((prev) => {
    //   const newErrors = { ...prev };
    //   delete newErrors[`package_${i}`];
    //   return newErrors;
    // });
  };

  const pickupLocations = Array.isArray(grooming.pickupLocations) ? grooming.pickupLocations : [];
  const updatePickupLocations = (value) =>
    updateGrooming(
      "pickupLocations",
      value.split(",").map((v) => v.trim()).filter(Boolean)
    );

  // Build service options for packages from entered services
  const serviceOptionsForPackages = services.flatMap((s, serviceIdx) => {
    const serviceName = s.serviceName?.[0] || "";
    const otherServiceName = s.otherServiceName || "";
    const displayName =
      serviceName === "Other" && otherServiceName ? otherServiceName : serviceName;
    if (!displayName) return [];
    const petTypes = s.petType?.length > 0 ? s.petType : ["General"];
    return petTypes.map((petType) => ({
      id: `${displayName}-${petType}`,
      name: `${displayName} - ${petType}`,
    }));
  });

  return (
    <div className={styles.wrapper}>
      {/* ===== SERVICE MODE ===== */}
      {/* Single header for Grooming - no duplicate + button */}
      <div className={styles.termsHeader}>
        <h5 className={styles.sectionTitle}>Grooming</h5>
      </div>

      <MultiSelectDropdown
        heading="Grooming Service Type"
        listItems={SERVICE_MODES.map((m) => ({ id: m, name: m }))}
        selectedIds={grooming.serviceMode || []}
        setSelectedIds={(ids) => updateGrooming("serviceMode", ids)}
        mandatory
      />

      <div className={styles.divider} />

      {/* Only show pickup locations if In-home or In-mobile selected */}
      {((grooming.serviceMode || []).includes("In-home") ||
        (grooming.serviceMode || []).includes("In-mobile")) && (
        <div className={styles.formField}>
          <label className={styles.label}>Service available locations to pickup and drop</label>
          <input
            type="text"
            className={styles.select}
            placeholder="e.g. Madhapur, Kondapur"
            value={pickupLocations.join(", ")}
            onChange={(e) => updatePickupLocations(e.target.value)}
          />
        </div>
      )}

      {/* ===== SERVICES ===== */}
      <div className={styles.termsHeader}>
        <h5 className={styles.sectionTitle}>Grooming Services</h5>
        <button className={styles.addBtn} type="button" onClick={addService}>
          +
        </button>
      </div>

      {services.map((s, i) => (
        <div key={i} className={styles.card}>
          {services.length > 1 && (
            <button
              className={styles.closeBtn}
              type="button"
              onClick={() => removeService(i)}
            >
              ×
            </button>
          )}

          <div className={styles.grid}>
            <div className={styles.formField}>
              <GroomingSelect s={s} i={i} updateService={updateService} />

              {s.serviceName.includes("Other") && (
                <div className={styles.formField}>
                  <label>Other Grooming Service *</label>
                  <input
                    type="text"
                    placeholder="Enter custom service name"
                    value={s.otherServiceName}
                    onChange={(e) => updateService(i, "otherServiceName", e.target.value)}
                    autoFocus
                  />
                </div>
              )}
            </div>

            <MultiSelectDropdown
              heading="Pet Type"
              listItems={availablePetTypes}
              selectedIds={s.petType}
              setSelectedIds={(ids) => updateService(i, "petType", ids)}
              mandatory
            />

            <div className={styles.formField}>
              <label>Price (₹) </label>
              <input
                type="number"
                placeholder="Enter price"
                value={s.price || ""}
                onChange={(e) => updateService(i, "price", e.target.value)}
                min="0"
              />
            </div>
          </div>
        </div>
      ))}

      {/* ===== PACKAGES ===== */}
      <div className={styles.termsHeader}>
        <h5 className={styles.sectionTitle}>Grooming Packages</h5>
        <button
          className={styles.addBtn}
          type="button"
          onClick={addPackage}
          disabled={services.length === 0}
        >
          +
        </button>
      </div>

      {services.length === 0 && (
        <small className={styles.warning}>
          Please add at least one service before creating packages
        </small>
      )}

      {packages.map((p, i) => (
        <div key={i} className={styles.card}>
          <button
            type="button"
            className={styles.closeBtn}
            onClick={() => removePackage(i)}
          >
            ×
          </button>

          <div className={styles.grid}>
            <div className={styles.formField}>
              <label className={styles.label}>
                Package Name <span className={styles.required}>*</span>
              </label>
              <input
                type="text"
                className={styles.selected}
                placeholder="Enter package name"
                value={p.packageName || ""}
                onChange={(e) => updatePackage(i, "packageName", e.target.value)}
              />
            </div>

            <div className={styles.formField}>
              <label className={styles.label}>
                Select Grooming Services <span className={styles.required}>*</span>
              </label>
              <MultiSelectDropdown
                heading=""
                listItems={serviceOptionsForPackages}
                selectedIds={p.selectedServices || []}
                setSelectedIds={(ids) => updatePackage(i, "selectedServices", ids)}
                mandatory
              />
            </div>

            <div className={styles.formField}>
              <label className={styles.label}>
                Price (₹) 
              </label>
              <input
                type="number"
                className={styles.select}
                placeholder="Enter price"
                value={p.price || ""}
                onChange={(e) => updatePackage(i, "price", e.target.value)}
                min="0"
              />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default GroomingFields;