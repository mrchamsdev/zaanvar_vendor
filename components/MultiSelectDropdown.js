import React, { useState, useRef, useEffect } from "react";
import styles from "../styles/multiSelectDropdown.module.css";
import { FaTimes } from "react-icons/fa";

const MultiSelectDropdown = ({
  listItems = [],         // [{ id, name }]
  selectedIds = [],       // [1, 2, 3]
  setSelectedIds = () => { },
  heading,
  mandatory = false,
  display,
  isSingleSelect = false
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const dropdownRef = useRef(null);

  // Handle selection toggle
  const handleSelect = (id) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((item) => item !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  // Handle removing a chip
  const handleRemove = (id) => {
    setSelectedIds(selectedIds.filter((item) => item !== id));
  };

  // Handle Select All toggle
  const handleSelectAll = () => {
    if (selectedIds.length === listItems.length) {
      setSelectedIds([]); // clear all
    } else {
      setSelectedIds(listItems.map((item) => item.id)); // select all
    }
  };

  // Search filter
  const filteredList = listItems.filter((item) =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const allSelected = selectedIds.length === listItems.length && listItems.length > 0;

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
    <div className={styles["multi-select-container"]} ref={dropdownRef}>
      <label className={styles["label"]}>
        {heading} {mandatory}
        {/* {heading} {mandatory && <span className={styles["required"]}>*</span>} */}
      </label>

      {/* Dropdown Toggle */}
      <div className={styles["dropdown"]} onClick={() => setIsOpen(!isOpen)}>
        <div className={styles["selected-items"]}>
          {selectedIds.length > 0 ? (
            selectedIds.map((id) => {
              const item = listItems.find((li) => li.id === id);
              return (
                <div key={id} className={styles["chip"]}>
                  {item?.name}
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
        <span className={styles["arrow"]}>&#9662;</span>
      </div>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className={styles["dropdown-menu"]}>
          {/* Search Box */}
          <div className={styles["search-box"]}>
            <input
              type="text"
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={styles["search-input"]}
            />
          </div>

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
          {selectedIds.map((id) => {
            const item = filteredList.find((li) => li.id === id);
            if (item) {
              return (
                <div
                  key={id}
                  className={`${styles["dropdown-item"]} ${styles["selected"]}`}
                  onClick={() => handleSelect(id)}
                >
                  {!isSingleSelect && <input type="checkbox" checked readOnly />} {item.name}
                </div>
              );
            }
            return null;
          })}

          {/* Remaining Items */}
          {filteredList.map((item) => {
            if (!selectedIds.includes(item.id)) {
              return (
                <div
                  key={item.id}
                  className={styles["dropdown-item"]}
                  onClick={() => handleSelect(item.id)}
                >
                  {!isSingleSelect && <input type="checkbox" checked={selectedIds.includes(item.id)} readOnly />}{" "}
                  {item.name}
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

