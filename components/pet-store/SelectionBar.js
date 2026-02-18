
import React from "react";
import styles from "../../styles/pet-store/products.module.css";

const SelectionBar = ({ selectedIds, onEdit, onDelete, onClear }) => {
  if (selectedIds.length === 0) return null;

  return (
    <div className={styles.selectionBar}>
      <div className={styles.selectionInfo}>
        <span className={styles.closeSelection} onClick={onClear}>✕</span>
        <span>{selectedIds.length} Items Selected</span>
      </div>
      <div className={styles.selectionActions}>
        <button className={`${styles.selectionBtn} ${styles.deleteBtn}`} onClick={onDelete}>
          🗑 Delete
        </button>
        {selectedIds.length === 1 && (
          <button className={styles.selectionBtn} onClick={onEdit}>
            ✎ Edit
          </button>
        )}
      </div>
    </div>
  );
};

export default SelectionBar;
