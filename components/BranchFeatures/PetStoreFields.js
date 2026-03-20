import React, { useEffect, useState } from "react";
import MultiSelectDropdown from "../MultiSelectDropdown";
import styles from "../../styles/branchFeatures/petStore.module.css";

const PetStoreFields = ({ branch, branchIndex, type, setBranches, petList, availablePetTypes }) => {
  const API_BASE_URL =
    typeof window !== "undefined" && window.location.hostname !== "support.zaanvar.com"
      ? "https://dev.zaanvar.com/api/"
      : "https://prod.zaanvar.com/api/";

  /* ================= LOCAL STATE ================= */
  const [items, setItems] = useState([
    { petTypes: [], categories: [], customCategory: "" },
  ]);
  const [customCategoryErrors, setCustomCategoryErrors] = useState({}); // new: per-item error

  /* ================= INIT FROM BRANCH ================= */
  useEffect(() => {
    const store = branch.services?.[type];

    if (store?.items?.length) {
      setItems(
        store.items.map((i) => ({
          petTypes: Array.isArray(i.petTypes) ? i.petTypes : [],
          categories: Array.isArray(i.categories) ? i.categories : [],
          customCategory: i.customCategory || "",
        }))
      );
    }
  }, []);

  /* ================= SYNC TO PARENT ================= */
  useEffect(() => {
    setBranches((prev) =>
      prev.map((b, i) =>
        i === branchIndex
          ? {
              ...b,
              services: {
                ...b.services,
                [type]: { items },
              },
            }
          : b
      )
    );
  }, [items]);

  /* ================= VALIDATION FOR CUSTOM CATEGORY ================= */
  const validateCustomCategory = (index, categories, customValue) => {
    const hasOther = categories.includes("Other");

    if (hasOther && !customValue?.trim()) {
      setCustomCategoryErrors((prev) => ({
        ...prev,
        [index]: "Custom category is required when 'Other' is selected",
      }));
    } else {
      setCustomCategoryErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[index];
        return newErrors;
      });
    }
  };

  /* ================= UPDATE HELPERS ================= */
  const updateItemField = (index, field, value) => {
    setItems((prev) =>
      prev.map((item, i) =>
        i === index ? { ...item, [field]: value } : item
      )
    );

    // Validate custom category when relevant fields change
    if (field === "categories" || field === "customCategory") {
      const currentItem = items[index];
      const newCategories = field === "categories" ? value : currentItem.categories;
      const newCustom = field === "customCategory" ? value : currentItem.customCategory;

      validateCustomCategory(index, newCategories, newCustom);
    }
  };

  const addItem = () => {
    setItems((prev) => [
      ...prev,
      { petTypes: [], categories: [], customCategory: "" },
    ]);
    // No error for new empty item
  };

  const removeItem = (index) => {
    if (items.length === 1) return;
    setItems((prev) => prev.filter((_, i) => i !== index));
    // Clean up error
    setCustomCategoryErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors[index];
      return newErrors;
    });
  };

  /* ================= FETCH CATEGORIES ================= */
  const [categoryOptions, setCategoryOptions] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(false);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoadingCategories(true);
        const res = await fetch(`${API_BASE_URL}vendor/petstore/categories2`);
        const result = await res.json();

        const options = (result?.data || []).map((c) => ({
          id: c.name,
          name: c.name,
        }));

        options.push({ id: "Other", name: "Other" });
        setCategoryOptions(options);
      } catch (e) {
        console.error(e);
      } finally {
        setLoadingCategories(false);
      }
    };

    fetchCategories();
  }, []);

  return (
    <div className={styles.container}>
      <div className={styles.headerRow}>
        <h4>Pet Store</h4>
        {/* <button type="button" className={styles.addBtn} onClick={addItem}>
          + Add
        </button> */}
      </div>

      {items.map((item, index) => {
        const hasOther = item.categories.includes("Other");
        const errorMsg = customCategoryErrors[index];

        return (
          <div key={index} className={styles.serviceBox}>
            {items.length > 1 && (
              <button
                type="button"
                className={styles.removeBtn}
                onClick={() => removeItem(index)}
              >
                ×
              </button>
            )}

            <MultiSelectDropdown
              listItems={availablePetTypes}
              selectedIds={item.petTypes}
              setSelectedIds={(ids) => updateItemField(index, "petTypes", ids)}
              heading="Available Pets"
              mandatory
            />

            <MultiSelectDropdown
              listItems={categoryOptions}
              selectedIds={item.categories}
              setSelectedIds={(ids) => updateItemField(index, "categories", ids)}
              heading="Product Categories"
              mandatory
              disabled={loadingCategories}
            />

            {hasOther && (
              <div className={styles.formField}>
                <label>
                  Custom Category <span className={styles.required}>*</span>
                </label>
                <input
                  value={item.customCategory}
                  onChange={(e) =>
                    updateItemField(index, "customCategory", e.target.value)
                  }
                  className={`${styles.input} ${errorMsg ? styles.inputError : ""}`}
                  placeholder="Enter custom category name"
                />
                {errorMsg && (
                  <small className={styles.errorText}>{errorMsg}</small>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default PetStoreFields;