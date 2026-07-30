import React, { useState, useRef, useEffect } from "react";
import styles from "../styles/multiSelectDropdown.module.css";
import { FaTimes } from "react-icons/fa";
import { FiChevronDown } from "react-icons/fi";

const MultiSelectDropdown = ({
  listItems = [],         // [{ id, name }]
  selectedIds = [],       // [1, 2, 3]
  setSelectedIds = () => { },
  heading,
  mandatory = false,
  display,
  isSingleSelect = false,
  hideSearch = false,
  customStyles = {},
  hasError = false
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const dropdownRef = useRef(null);

  const safeSelectedIds = (Array.isArray(selectedIds) ? selectedIds : []).map(
    id => (typeof id === "object" && id !== null ? (id.id || id.serviceId || id.name || String(id)) : id)
  );

  // Handle selection toggle
  const handleSelect = (id) => {
    if (safeSelectedIds.includes(id)) {
      setSelectedIds(safeSelectedIds.filter((item) => item !== id));
    } else {
      setSelectedIds([...safeSelectedIds, id]);
    }
  };

  // Handle removing a chip
  const handleRemove = (id) => {
    setSelectedIds(safeSelectedIds.filter((item) => item !== id));
  };

  // Handle Select All toggle
  const handleSelectAll = () => {
    if (safeSelectedIds.length === listItems.length) {
      setSelectedIds([]); // clear all
    } else {
      setSelectedIds(listItems.map((item) => item.id)); // select all
    }
  };

  // Search filter
  const filteredList = listItems.filter((item) =>
    (item?.name ? String(item.name) : "").toLowerCase().includes((searchTerm || "").toLowerCase())
  );

  const allSelected = safeSelectedIds.length === listItems.length && listItems.length > 0;

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("click", handleClickOutside, true);
    return () => {
      document.removeEventListener("click", handleClickOutside, true);
    };
  }, []);

  return (
    <div className={styles["multi-select-container"]} style={customStyles.container || {}} ref={dropdownRef}>
      {heading && (
        <label className={styles["label"]}>
          {heading} {mandatory}
        </label>
      )}

      {/* Dropdown Toggle */}
      <div className={`${styles["dropdown"]} ${hasError ? styles["error"] : ""}`} style={customStyles.dropdown || {}} onClick={() => setIsOpen(!isOpen)}>
        <div className={styles["selected-items"]}>
          {safeSelectedIds.length > 0 ? (
            safeSelectedIds.map((id) => {
              const item = listItems.find((li) => String(li.id) === String(id));
              const displayName = item ? (typeof item.name === 'object' ? String(item.name.name || item.name) : String(item.name)) : String(id);
              const keyStr = String(id);
              return (
                <div key={keyStr} className={isSingleSelect ? "" : styles["chip"]} style={isSingleSelect ? { color: "#121212", fontSize: "14px" } : {}}>
                  {displayName}
                  {!isSingleSelect && (
                    <span
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemove(id);
                      }}
                    >
                      <FaTimes />
                    </span>
                  )}
                </div>
              );
            })
          ) : (
            <span className={styles["placeholder"]}>Select options...</span>
          )}
        </div>
        <span className={`${styles["arrow"]} ${isOpen ? styles["arrow-open"] : ""}`}>
          <FiChevronDown />
        </span>
      </div>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className={styles["dropdown-menu"]}>
          {/* Search Box */}
          {!hideSearch && (
            <div className={styles["search-box"]}>
              <input
                type="text"
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={styles["search-input"]}
              />
            </div>
          )}

          {/* Select All */}
          {!isSingleSelect && (

            <div
              className={styles["dropdown-item"]}
              onClick={handleSelectAll}
            >
              <input
                type="checkbox"
                checked={allSelected}
                readOnly
              />{" "}
              Select All
            </div>

          )}
          {/* Selected Items */}
          {safeSelectedIds.map((id) => {
            const item = filteredList.find((li) => String(li.id) === String(id));
            if (item) {
              const keyStr = String(id);
              const displayName = typeof item.name === 'object' ? String(item.name.name || item.name) : String(item.name);
              return (
                <div
                  key={keyStr}
                  className={`${styles["dropdown-item"]} ${styles["selected"]}`}
                  onClick={() => handleSelect(id)}
                >
                  {!isSingleSelect && <input type="checkbox" checked readOnly />} {displayName}
                </div>
              );
            }
            return null;
          })}

          {/* Remaining Items */}
          {filteredList.map((item) => {
            if (!safeSelectedIds.includes(item.id)) {
              const keyStr = String(item.id);
              const displayName = typeof item.name === 'object' ? String(item.name.name || item.name) : String(item.name);
              return (
                <div
                  key={keyStr}
                  className={styles["dropdown-item"]}
                  onClick={() => handleSelect(item.id)}
                >
                  {!isSingleSelect && <input type="checkbox" checked={safeSelectedIds.includes(item.id)} readOnly />}{" "}
                  {displayName}
                </div>
              );
            }
            return null;
          })}
        </div>
      )}
    </div>
  );
};

export default MultiSelectDropdown;

