import React, { useState, useEffect } from "react";
import MultiSelectDropdown from "../MultiSelectDropdown";
import styles from "../../styles/branchFeatures/petSalesFields.module.css";

const EMPTY_ITEM = {
  kciRegistered: "",
  vaccinated: "",
  breedAgeUnit: "Months",
  petTypes: [],
  petSizes: [],
  petBreeds: [],
};

const BREED_TO_SIZE_MAP = {
  "German Shepherd": "Large",
  "Golden Retriever": "Large",
  "Husky": "Large",
  "Rottweiler": "Large",
  "Labrador Retriever": "Large",
  "Great Dane": "Giant",
  "Mastiff": "Giant",
  "Beagle": "Medium",
  "Bulldog": "Medium",
  "Poodle": "Medium",
  "Cocker Spaniel": "Medium",
  "Chihuahua": "Toy",
  "Pomeranian": "Toy",
  "Yorkshire Terrier": "Toy",
  "Shih Tzu": "Small",
  "Pug": "Small",
  "Persian Cat": "Small",
  "Siamese": "Small",
  "Maine Coon": "Large",
  default: "Medium",
};

// Maps UI pet type labels to API query values
// The API expects exact values — Birds and Small Pets may use different casing/naming
const PET_TYPE_API_MAP = {
  Dog: "Dog",
  Cat: "Cat",
  Birds: "Bird",      // UI shows "Birds" but API may expect "Bird"
  Fish: "Fish",
  "Small Pets": "SmallPet", // UI shows "Small Pets" but API may expect "SmallPet"
};

const PetSalesFields = ({
  branch,
  branchIndex,
  type,
  setBranches,
  availablePetTypes,
}) => {
  const API_URL =
    typeof window !== "undefined" &&
    window.location.hostname !== "support.zaanvar.com"
      ? "https://dev.zaanvar.com/api/"
      : "https://prod.zaanvar.com/api/";

  const [breedOptions, setBreedOptions] = useState({});

  const petTypeOptions = Array.isArray(availablePetTypes)
    ? availablePetTypes.map((p) =>
        typeof p === "string"
          ? { id: p, name: p }
          : { id: p.id || p.name, name: p.name || p.id }
      )
    : [];

  const rawSales = branch.services?.[type];
  const sales = {
    items: Array.isArray(rawSales?.items)
      ? rawSales.items.map((item) => ({
          ...EMPTY_ITEM,
          ...item,
          breedAgeUnit: item?.breedAgeUnit || "Months",
          petTypes: Array.isArray(item?.petTypes) ? item.petTypes : [],
          petBreeds: Array.isArray(item?.petBreeds) ? item.petBreeds : [],
          petSizes: Array.isArray(item?.petSizes) ? item.petSizes : [],
        }))
      : [{ ...EMPTY_ITEM }],
  };

  // Fetch breeds — tries multiple API variants to handle Birds / Small Pets
  const fetchBreedsByPetType = async (petType, index) => {
    if (!petType) {
      setBreedOptions((prev) => ({ ...prev, [index]: [] }));
      return;
    }

    // Build list of query values to try for this pet type
    const apiValue = PET_TYPE_API_MAP[petType] || petType;
    const queriesToTry = Array.from(new Set([apiValue, petType]));

    let combinedBreeds = [];

    for (const query of queriesToTry) {
      try {
        const res = await fetch(`${API_URL}breeds?petType=${encodeURIComponent(query)}`);
        if (!res.ok) continue;
        const result = await res.json();
        const breeds = Array.isArray(result?.data) ? result.data : [];
        if (breeds.length > 0) {
          combinedBreeds = breeds.map((breed) => ({
            id: `${breed.breedName} (${breed.petType || petType})`,
            name: `${breed.breedName} (${breed.petType || petType})`,
            size: breed.size,
          }));
          break; // Found results — stop trying variants
        }
      } catch (err) {
        // Try next variant
      }
    }

    // If still empty, try fetching all breeds and filter client-side
    if (combinedBreeds.length === 0) {
      try {
        const res = await fetch(`${API_URL}breeds`);
        if (res.ok) {
          const result = await res.json();
          const allBreeds = Array.isArray(result?.data) ? result.data : [];
          const lower = petType.toLowerCase().replace(/s$/, ""); // "Birds" → "bird", "Small Pets" → "small pet"
          const filtered = allBreeds.filter(
            (b) =>
              b.petType?.toLowerCase().includes(lower) ||
              b.petType?.toLowerCase() === lower ||
              b.petType?.toLowerCase() === apiValue.toLowerCase()
          );
          if (filtered.length > 0) {
            combinedBreeds = filtered.map((breed) => ({
              id: `${breed.breedName} (${breed.petType || petType})`,
              name: `${breed.breedName} (${breed.petType || petType})`,
              size: breed.size,
            }));
          }
        }
      } catch (err) {
        console.error("Fallback breed fetch failed", err);
      }
    }

    setBreedOptions((prev) => ({ ...prev, [index]: combinedBreeds }));
  };

  useEffect(() => {
    sales.items.forEach((item, index) => {
      const petType = item.petTypes[item.petTypes.length - 1];
      if (!petType) {
        if (item.petBreeds?.length) updateItem(index, "petBreeds", []);
        setBreedOptions((prev) => ({ ...prev, [index]: [] }));
        return;
      }
      fetchBreedsByPetType(petType, index);
    });
  }, [sales.items.map((i) => i.petTypes.join(",")).join("|")]);

  const updateSales = (updated) => {
    setBranches((prev) =>
      prev.map((b, i) =>
        i === branchIndex
          ? { ...b, services: { ...b.services, [type]: updated } }
          : b
      )
    );
  };

  const updateItem = (index, field, value) => {
    const items = [...sales.items];
    items[index] = { ...items[index], [field]: value };
    updateSales({ ...sales, items });
  };

  // Auto pet size from breeds
  useEffect(() => {
    sales.items.forEach((item, index) => {
      if (!Array.isArray(item.petBreeds) || item.petBreeds.length === 0) {
        if (item.petSizes?.length) updateItem(index, "petSizes", []);
        return;
      }
      const sizesFromBreeds = item.petBreeds
        .map((breed) => {
          const cleanName = breed.split(" (")[0].trim();
          return BREED_TO_SIZE_MAP[cleanName] || BREED_TO_SIZE_MAP.default;
        })
        .filter(Boolean);
      const uniqueSizes = [...new Set(sizesFromBreeds)];
      if (JSON.stringify(uniqueSizes) !== JSON.stringify(item.petSizes)) {
        updateItem(index, "petSizes", uniqueSizes);
      }
    });
  }, [sales.items]);

  const addItem = () =>
    updateSales({ ...sales, items: [...sales.items, { ...EMPTY_ITEM }] });

  const removeItem = (index) => {
    if (sales.items.length === 1) return;
    updateSales({ ...sales, items: sales.items.filter((_, i) => i !== index) });
  };

  return (
    <div className={styles.container}>
      <div className={styles.headerRow}>
        <h4>Pet Sales</h4>
        <button className={styles.addBtn} type="button" onClick={addItem}>
          + Add
        </button>
      </div>

      {sales.items.map((item, index) => (
        <div key={index} className={styles.serviceBox}>
          {sales.items.length > 1 && (
            <button className={styles.closeBtn} onClick={() => removeItem(index)}>
              ×
            </button>
          )}

          <div className={styles.left}>
            <label className={styles.label}>KCI Registered *</label>
            <select
              className={styles.input}
              value={item.kciRegistered}
              onChange={(e) =>
                updateItem(index, "kciRegistered", e.target.value === "true")
              }
            >
              <option value="">Select</option>
              <option value="true">Yes</option>
              <option value="false">No</option>
            </select>
 <MultiSelectDropdown
              heading="Pet Type"
              listItems={petTypeOptions}
              selectedIds={item.petTypes}
              setSelectedIds={(ids) => {
                // Only keep the most recently selected type (single select behaviour)
                const singleId = ids.length > 0 ? [ids[ids.length - 1]] : [];
                updateItem(index, "petTypes", singleId);
              }}
              mandatory
              isSingleSelect = "true"
            />
           
          </div>

          <div className={styles.right}>
             <label className={styles.label}>Vaccinated *</label>
            <select
              className={styles.input}
              value={item.vaccinated}
              onChange={(e) =>
                updateItem(index, "vaccinated", e.target.value === "true")
              }
            >
              <option value="">Select</option>
              <option value="true">Yes</option>
              <option value="false">No</option>
            </select>
           

            {/* Show loading hint if pet type selected but breeds still fetching */}
            {item.petTypes.length > 0 && !breedOptions[index] && (
              <small style={{ color: "#ff6b35", fontSize: "0.82rem" }}>
                Loading breeds...
              </small>
            )}

            {item.petTypes.length > 0 &&
              breedOptions[index] &&
              breedOptions[index].length === 0 && (
                <small style={{ color: "#888", fontSize: "0.82rem" }}>
                  No breeds found for selected pet type
                </small>
              )}

            <MultiSelectDropdown
              heading="Pet Breed"
              listItems={breedOptions[index] || []}
              selectedIds={item.petBreeds}
              setSelectedIds={(ids) => updateItem(index, "petBreeds", ids)}
              mandatory
            />
          </div>
        </div>
      ))}
    </div>
  );
};

export default PetSalesFields;