import React, { useEffect, useState } from "react";
import MultiSelectDropdown from "../MultiSelectDropdown";
import styles from "../../styles/branchFeatures/petStore.module.css";

const PetStoreFields = ({ branch, branchIndex, type, setBranches, petList, availablePetTypes, errors = {} }) => {
  const API_BASE_URL =
    typeof window !== "undefined" && window.location.hostname !== "support.zaanvar.com"
      ? "https://dev.zaanvar.com/api/"
      : "https://prod.zaanvar.com/api/";

  /* ================= LOCAL STATE ================= */
  const [items, setItems] = useState([
    { petTypes: [], categories: [], customCategory: "" },
  ]);
  const [customCategoryErrors, setCustomCategoryErrors] = useState({});

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
  };

  const removeItem = (index) => {
    if (items.length === 1) return;
    setItems((prev) => prev.filter((_, i) => i !== index));
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

  const errPetStoreItems = errors.petStore_items || errors[`petStore_items_${branchIndex}`];

  return (
    <div className={styles.container}>
      <div className={styles.headerRow}>
        <h4>Pet Store</h4>
      </div>

      {errPetStoreItems && (
        <span style={{ color: "#ef4444", fontSize: 12, marginBottom: 8, display: "block" }}>
          {errPetStoreItems}
        </span>
      )}

      {items.map((item, index) => {
        const hasOther = item.categories.includes("Other");
        const errPetTypes = errors[`petStore_${index}_petTypes`] || errors[`petStore_${branchIndex}_${index}_petTypes`];
        const errCategories = errors[`petStore_${index}_categories`] || errors[`petStore_${branchIndex}_${index}_categories`];
        const errCustom = errors[`petStore_${index}_customCategory`] || errors[`petStore_${branchIndex}_${index}_customCat`] || customCategoryErrors[index];

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

            <div>
              <MultiSelectDropdown
                listItems={availablePetTypes}
                selectedIds={item.petTypes}
                setSelectedIds={(ids) => updateItemField(index, "petTypes", ids)}
                heading="Available Pets"
                mandatory
                hasError={Boolean(errPetTypes)}
              />
              {errPetTypes && (
                <span style={{ color: "#ef4444", fontSize: 11, marginTop: 4, display: "block" }}>
                  {errPetTypes}
                </span>
              )}
            </div>

            <div style={{ marginTop: 12 }}>
              <MultiSelectDropdown
                listItems={categoryOptions}
                selectedIds={item.categories}
                setSelectedIds={(ids) => updateItemField(index, "categories", ids)}
                heading="Product Categories"
                mandatory
                disabled={loadingCategories}
                hasError={Boolean(errCategories)}
              />
              {errCategories && (
                <span style={{ color: "#ef4444", fontSize: 11, marginTop: 4, display: "block" }}>
                  {errCategories}
                </span>
              )}
            </div>

            {hasOther && (
              <div className={styles.formField} style={{ marginTop: 12 }}>
                <label>
                  Custom Category <span className={styles.required}>*</span>
                </label>
                <input
                  value={item.customCategory}
                  onChange={(e) =>
                    updateItemField(index, "customCategory", e.target.value)
                  }
                  style={{ border: errCustom ? "1px solid #ef4444" : undefined }}
                  className={`${styles.input} ${errCustom ? styles.inputError : ""}`}
                  placeholder="Enter custom category name"
                />
                {errCustom && (
                  <span style={{ color: "#ef4444", fontSize: 11, marginTop: 4, display: "block" }}>
                    {errCustom}
                  </span>
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