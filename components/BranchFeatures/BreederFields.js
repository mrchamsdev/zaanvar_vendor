import React, { useState, useEffect } from "react";
import MultiSelectDropdown from "../MultiSelectDropdown";
import styles from "../../styles/branchFeatures/BreederFields.module.css";

const BreederFields = ({ branch, branchIndex, setBranches, petList}) => {

     const API_URL =
    typeof window !== "undefined" &&
    window.location.hostname !== "support.zaanvar.com"
      ? "https://dev.zaanvar.com/api/"
      : "https://prod.zaanvar.com/api/";
  const [breedOptions, setBreedOptions] = useState([]);

  const handleServiceChange = (field, value) => {
    setBranches((prev) => {
      const newBranches = [...prev];
      const breederData = newBranches[branchIndex].services["Pet Breeder"] || {};
      newBranches[branchIndex].services["Pet Breeder"] = {
        ...breederData,
        [field]: value,
      };
      return newBranches;
    });
  };

  // Logic to fetch and combine breeds for multiple pet types (e.g., Dog + Cat)
  const fetchAllBreeds = async (selectedPetTypes) => {
    if (!selectedPetTypes || selectedPetTypes.length === 0) {
      setBreedOptions([]);
      return;
    }

    try {
      const promises = selectedPetTypes.map((type) =>
        fetch(`${API_URL}breeds?petType=${type}`).then((res) => res.json())
      );

      const results = await Promise.all(promises);
      
      // Flatten all breed arrays from different pet types into one list
      const combinedBreeds = results.flatMap((result) => {
        const breeds = Array.isArray(result?.data) ? result.data : [];
        return breeds.map((breed) => ({
          id: breed.breedName,
          name: `${breed.breedName} (${breed.petType || ""})`, // Visual hint of which pet type it belongs to
          breedValue: breed.breedName
        }));
      });

      setBreedOptions(combinedBreeds);
    } catch (err) {
      console.error("Breed fetch failed", err);
      setBreedOptions([]);
    }
  };

  // Trigger fetch whenever petTypes change
  useEffect(() => {
    const selectedTypes = branch.services["Pet Breeder"]?.petTypes || [];
    fetchAllBreeds(selectedTypes);
  }, [branch.services["Pet Breeder"]?.petTypes]);

  return (
    <div className={styles.breederContainer}>
      <h5 className={styles.featureTitle}>Pet Breeder Details</h5>

      {/* <div className={styles.formField}>
        <label className={styles.label}>Breeder Name</label>
        <input
          type="text"
          className={styles.textInput}
          placeholder="Enter registered breeder name"
          value={branch.services["Pet Breeder"]?.breederName || ""}
          onChange={(e) => handleServiceChange("breederName", e.target.value)}
        />
      </div> */}

      <div className={styles.topGrid}>
        {/* Pet Type Selection */}
        <div className={styles.formField}>
          <MultiSelectDropdown
            listItems={petList}
            selectedIds={branch.services["Pet Breeder"]?.petTypes || []}
            setSelectedIds={(ids) => handleServiceChange("petTypes", ids)}
            heading="Pet Types"
            mandatory={true}
          />
        </div>

        {/* Dynamic Breed Selection */}
        <div className={styles.formField}>
          <MultiSelectDropdown
            listItems={breedOptions}
            selectedIds={branch.services["Pet Breeder"]?.petBreeds || []}
            setSelectedIds={(ids) => handleServiceChange("petBreeds", ids)}
            heading="Pet Breeds"
            mandatory={true}
            disabled={breedOptions.length === 0}
          />
          {branch.services["Pet Breeder"]?.petTypes?.length > 0 && breedOptions.length === 0 && (
            <small style={{ color: "#ff6b35" }}>Loading breeds...</small>
          )}
        </div>
      </div>
    </div>
  );
};

export default BreederFields;