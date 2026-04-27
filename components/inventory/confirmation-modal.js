import React from "react";
import styles from "../../styles/inventory/confirmation-modal.module.css";

const IconTrash = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
    <path d="M10 11v6" /><path d="M14 11v6" /><path d="M9 6V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2" />
  </svg>
);

const ConfirmationModal = ({ 
  isOpen, 
  title = "Are you sure?", 
  message = "This action cannot be undone.", 
  onConfirm, 
  onCancel,
  confirmText = "Yes",
  cancelText = "No"
}) => {
  if (!isOpen) return null;

  return (
    <div className={styles.modalOverlay} onClick={onCancel}>
      <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
        <div className={styles.modalIcon}>
          <IconTrash />
        </div>
        <h3 className={styles.modalTitle}>{title}</h3>
        <p className={styles.modalText}>{message}</p>
        <div className={styles.modalActions}>
          <button className={styles.cancelBtn} onClick={onCancel}>
            {cancelText}
          </button>
          <button className={styles.confirmBtn} onClick={onConfirm}>
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal;
