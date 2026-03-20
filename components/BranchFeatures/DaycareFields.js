import React from "react";
import MultiSelectDropdown from "../MultiSelectDropdown";
import styles from "../../styles/branchFeatures/daycareFields.module.css";

const PET_SIZES = [
  { id: "Toy", name: "Toy" },
  { id: "Small", name: "Small" },
  { id: "Medium", name: "Medium" },
  { id: "Large", name: "Large" },
  { id: "Giant", name: "Giant" },
];

const DAYCARE_SERVICES = [
  "Scheduled potty breaks","On-demand potty breaks","Puppy pee-pad support",
  "Daily pet walks","Leash walks","Outdoor playtime","Senior-friendly walks",
  "Scheduled feeding","Special diet handling","Medication administration",
  "Supplement support","24/7 staff supervision","Night checks","Behavior monitoring",
  "Emergency Transport","Vet coordination","First-aid treatment","Emergency isolation",
  "Pick-up & drop-off","Vet visit transport","Bath before checkout","Brushing",
  "Nail trimming","Paw cleaning","Puppy boarding","Senior pet care",
  "Special-needs pets","Anxiety care","Daily updates","Photo/video sharing",
  "Emergency alerts","Extra walks","One-on-one playtime","Late checkout",
];

const AMENITIES = [
  "Individual kennels","Private suites","Shared rooms","Climate-controlled rooms",
  "Comfortable bedding","Indoor housing areas","Outdoor relief areas","Secure fencing",
  "CCTV cameras","Fire safety systems","Toys","Rest areas","Calming music",
  "Enrichment equipment","Daily cleaning","Sanitized kennels","Waste disposal system",
  "Laundry facilities","Feeding bowls","Water stations","First-aid kits",
  "Isolation room","Emergency supplies","Reception area","Secure storage for pet belongings",
];

const FOOD_OPTIONS = [
  { id: "With Food", name: "With Food" },
  { id: "Without Food", name: "Without Food" },
];

const EMPTY_ITEM = { petTypes: [], petSizes: [] };
const EMPTY_PACKAGE = { packageName: "", selectedCombinations: [], foodOption: "", price: "" };

const DaycareFields = ({ branch, branchIndex, type, setBranches, petList, availablePetTypes }) => {
  const rawDaycare = branch.services?.[type] || {};

  const daycare = {
    items: Array.isArray(rawDaycare?.items)
      ? rawDaycare.items.map(item => ({
          ...EMPTY_ITEM, ...item,
          petTypes: item.supportedPets || item.petTypes || [],
          petSizes: item.petSizes || [],
        }))
      : [{ ...EMPTY_ITEM }],
    pickupLocations: Array.isArray(rawDaycare?.pickupLocations) ? rawDaycare.pickupLocations : [],
    services: Array.isArray(rawDaycare?.services) ? rawDaycare.services : [],
    amenities: Array.isArray(rawDaycare?.amenities) ? rawDaycare.amenities : [],
    packages: Array.isArray(rawDaycare?.packages) ? rawDaycare.packages : [],
  };

  const updateDaycare = (updated) => {
    setBranches((prev) =>
      prev.map((b, i) =>
        i === branchIndex ? { ...b, services: { ...b.services, [type]: updated } } : b
      )
    );
  };

  const updateItem = (index, field, value) => {
    const items = [...daycare.items];
    items[index] = { ...items[index], [field]: value };
    updateDaycare({ ...daycare, items });
  };

  const addItem = () => updateDaycare({ ...daycare, items: [...daycare.items, { ...EMPTY_ITEM }] });

  const removeItem = (index) => {
    if (daycare.items.length === 1) return;
    updateDaycare({ ...daycare, items: daycare.items.filter((_, i) => i !== index) });
  };

  const addPackage = () => updateDaycare({ ...daycare, packages: [...daycare.packages, { ...EMPTY_PACKAGE }] });

  const updatePackage = (i, field, value) => {
    const packages = [...daycare.packages];
    packages[i] = { ...packages[i], [field]: value };
    updateDaycare({ ...daycare, packages });
  };

  const removePackage = (i) =>
    updateDaycare({ ...daycare, packages: daycare.packages.filter((_, idx) => idx !== i) });

  const getPetTypeSizeCombinations = () => {
    const combinations = [];
    daycare.items.forEach((item) => {
      item.petTypes.forEach((petType) => {
        item.petSizes.forEach((petSize) => {
          const petTypeName = availablePetTypes.find(p => p.id === petType)?.name || petType;
          const combinationId = `${petSize}_${petType}`;
          const combinationName = `${petSize} ${petTypeName}`;
          if (!combinations.find(c => c.id === combinationId)) {
            combinations.push({ id: combinationId, name: combinationName });
          }
        });
      });
    });
    return combinations;
  };

  const updatePickupLocations = (value) =>
    updateDaycare({
      ...daycare,
      pickupLocations: value.split(",").map((v) => v.trim()).filter(Boolean),
    });

  return (
    <div className={styles.daycareWrapper}>
      {/* Header */}
      <div className={styles.sectionHeader}>
        <h4 className={styles.sectionTitle}>Pet Daycare</h4>
      </div>

      {/* Pet Type & Size — 2 col grid */}
      {daycare.items.map((item, index) => (
        <div key={index} className={styles.petTypeBox}>
          {daycare.items.length > 1 && (
            <button className={styles.removeBtn} type="button" onClick={() => removeItem(index)}>×</button>
          )}
          <div className={styles.twoCol}>
            <MultiSelectDropdown
              listItems={availablePetTypes}
              selectedIds={item.petTypes}
              setSelectedIds={(ids) => updateItem(index, "petTypes", ids)}
              heading="Pet Type"
              mandatory
            />
            <MultiSelectDropdown
              listItems={PET_SIZES}
              selectedIds={item.petSizes}
              setSelectedIds={(ids) => updateItem(index, "petSizes", ids)}
              heading="Pet Size"
              mandatory
            />
          </div>
        </div>
      ))}

      {/* Pickup locations */}
      <div className={styles.fieldRow}>
        <label className={styles.label}>Service available locations to pickup and drop</label>
        <input
          type="text"
          className={styles.input}
          placeholder="e.g. Madhapur, Kondapur"
          value={Array.isArray(daycare.pickupLocations) ? daycare.pickupLocations.join(", ") : ""}
          onChange={(e) => updatePickupLocations(e.target.value)}
        />
      </div>

      {/* DayCare Packages */}
      <div className={styles.sectionHeader}>
        <h4 className={styles.sectionTitle}>DayCare Packages</h4>
        <button
          type="button"
          className={styles.addBtn}
          onClick={addPackage}
          disabled={getPetTypeSizeCombinations().length === 0}
        >
          + Add Package
        </button>
      </div>

      {getPetTypeSizeCombinations().length === 0 && (
        <small className={styles.warning}>
          Please add pet types and sizes above before creating packages
        </small>
      )}

      {daycare.packages.map((pkg, i) => (
        <div key={i} className={styles.packageBox}>
          <button type="button" className={styles.removeBtn} onClick={() => removePackage(i)}>×</button>

          <div className={styles.twoCol}>
            <div className={styles.fieldGroup}>
              <label className={styles.label}>Package Name <span className={styles.req}>*</span></label>
              <input
                type="text"
                className={styles.input}
                placeholder="Enter package name"
                value={pkg.packageName || ""}
                onChange={(e) => updatePackage(i, "packageName", e.target.value)}
              />
            </div>
            <div className={styles.fieldGroup}>
              <label className={styles.label}>Select Pet Type & Size <span className={styles.req}>*</span></label>
              <MultiSelectDropdown
                heading=""
                listItems={getPetTypeSizeCombinations()}
                selectedIds={pkg.selectedCombinations || []}
                setSelectedIds={(ids) => updatePackage(i, "selectedCombinations", ids)}
                mandatory
              />
            </div>
          </div>

          <div className={styles.twoCol} style={{ marginTop: "12px" }}>
            <div className={styles.fieldGroup}>
              <label className={styles.label}>Food Option</label>
              <select
                className={styles.input}
                value={pkg.foodOption || ""}
                onChange={(e) => updatePackage(i, "foodOption", e.target.value)}
              >
                <option value="">Select Food Option</option>
                {FOOD_OPTIONS.map((opt) => (
                  <option key={opt.id} value={opt.id}>{opt.name}</option>
                ))}
              </select>
            </div>
            <div className={styles.fieldGroup}>
              <label className={styles.label}>Price (₹) <span className={styles.req}>*</span></label>
              <input
                type="number"
                className={styles.input}
                placeholder="Enter price"
                value={pkg.price || ""}
                onChange={(e) => updatePackage(i, "price", e.target.value)}
                min="0"
              />
            </div>
          </div>
        </div>
      ))}

      {/* Daycare Services */}
      <div className={styles.fieldRow}>
        <MultiSelectDropdown
          heading="Daycare Services"
          listItems={DAYCARE_SERVICES.map((s) => ({ id: s, name: s }))}
          selectedIds={daycare.services}
          setSelectedIds={(ids) => updateDaycare({ ...daycare, services: ids })}
        />
      </div>

      {/* Amenities */}
      <div className={styles.fieldRow}>
        <MultiSelectDropdown
          heading="Amenities"
          listItems={AMENITIES.map((a) => ({ id: a, name: a }))}
          selectedIds={daycare.amenities}
          setSelectedIds={(ids) => updateDaycare({ ...daycare, amenities: ids })}
        />
      </div>
    </div>
  );
};

export default DaycareFields;