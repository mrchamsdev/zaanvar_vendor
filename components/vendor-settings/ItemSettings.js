import React, { useState } from "react";
import styles from "../../styles/vendor-settings/settings.module.css";

const InfoIcon = ({ tip }) => (
  <span className={styles.infoIcon} title={tip || "More info"}>ⓘ</span>
);

const TrashIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
    <path d="M10 11v6M14 11v6M9 6V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2" />
  </svg>
);

const ItemSettings = ({ settings, onChange }) => {
  const s = settings;
  const toggle = (field) => (e) => onChange({ ...s, [field]: e.target.checked });

  /* ── Item Custom Fields ── */
  const customFields = Array.isArray(s.customFields) ? s.customFields : [];

  const addCustomField = () => {
    onChange({
      ...s,
      customFields: [...customFields, { id: Date.now(), label: "", type: "text" }],
    });
  };

  const removeCustomField = (id) => {
    onChange({
      ...s,
      customFields: customFields.filter((f) => f.id !== id),
    });
  };

  const updateCustomField = (id, key, val) => {
    onChange({
      ...s,
      customFields: customFields.map((f) => (f.id === id ? { ...f, [key]: val } : f)),
    });
  };

  return (
    <div className={styles.twoColGrid}>
      {/* ── Item Settings ── */}
      <div className={styles.card}>
        <div className={styles.cardTitle}>Item Settings</div>

        <div className={styles.checkRow}>
          <input id="barcodeScan" type="checkbox" className={styles.checkInput}
            checked={s.barcodeScan} onChange={toggle("barcodeScan")} />
          <label htmlFor="barcodeScan" className={styles.checkLabel}>Barcode Scan</label>
          <InfoIcon tip="Enable barcode scanning for product lookup." />
        </div>

        <div className={styles.checkRow}>
          <input id="showLowStockDialog" type="checkbox" className={styles.checkInput}
            checked={s.showLowStockDialog} onChange={toggle("showLowStockDialog")} />
          <label htmlFor="showLowStockDialog" className={styles.checkLabel}>Show Low Stock Dialog</label>
          <InfoIcon tip="Show an alert when stock falls below the minimum threshold." />
        </div>

        <div className={styles.checkRow}>
          <input id="updateSalePriceFromTxn" type="checkbox" className={styles.checkInput}
            checked={s.updateSalePriceFromTxn} onChange={toggle("updateSalePriceFromTxn")} />
          <label htmlFor="updateSalePriceFromTxn" className={styles.checkLabel}>
            Update Sale Price from Transaction
          </label>
          <InfoIcon tip="When ON, changing selling price in a sale invoice auto-updates the product." />
        </div>

        <div className={styles.checkRow}>
          <input id="calculateTaxBasedOnMrp" type="checkbox" className={styles.checkInput}
            checked={s.calculateTaxBasedOnMrp} onChange={toggle("calculateTaxBasedOnMrp")} />
          <label htmlFor="calculateTaxBasedOnMrp" className={styles.checkLabel}>
            Calculate Tax based on MRP
          </label>
          <InfoIcon tip="When ON, tax is calculated on MRP × Qty instead of Selling Price × Qty." />
        </div>

        <div className={styles.checkRow}>
          <input id="manageItemStatus" type="checkbox" className={styles.checkInput}
            checked={s.manageItemStatus} onChange={toggle("manageItemStatus")} />
          <label htmlFor="manageItemStatus" className={styles.checkLabel}>Manage Item Status</label>
          <InfoIcon tip="When ON, items can be marked Active or Inactive." />
        </div>
      </div>

      {/* ── Item Custom Fields ── */}
      <div className={styles.card}>
        <div className={styles.cardTitle}>Item Custom Fields</div>

        <button
          className={styles.btnLink}
          type="button"
          onClick={addCustomField}
          id="add-custom-fields-btn"
          style={{ marginBottom: customFields.length > 0 ? 16 : 0 }}
        >
          Add Custom Fields
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>

        {customFields.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {customFields.map((field, idx) => (
              <div
                key={field.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "8px 12px",
                  border: "1px solid #eee",
                  borderRadius: 8,
                  background: "#fafafa",
                }}
              >
                <span style={{ fontSize: 12, color: "#aaa", minWidth: 20 }}>
                  {idx + 1}.
                </span>
                <input
                  type="text"
                  placeholder="Field Name"
                  value={field.label}
                  onChange={(e) => updateCustomField(field.id, "label", e.target.value)}
                  className={styles.addFieldInput}
                  style={{ flex: 1 }}
                />
                <select
                  className={styles.select}
                  style={{ width: 90, fontSize: 12 }}
                  value={field.type}
                  onChange={(e) => updateCustomField(field.id, "type", e.target.value)}
                >
                  <option value="text">Text</option>
                  <option value="number">Number</option>
                  <option value="date">Date</option>
                </select>
                <button
                  type="button"
                  onClick={() => removeCustomField(field.id)}
                  style={{
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    color: "#e9315d",
                    padding: "4px",
                  }}
                >
                  <TrashIcon />
                </button>
              </div>
            ))}
          </div>
        )}

        {customFields.length === 0 && (
          <p style={{ fontSize: 12, color: "#bbb", marginTop: 12 }}>
            No custom fields added yet. Click &ldquo;Add Custom Fields&rdquo; to create one.
          </p>
        )}
      </div>
    </div>
  );
};

export default ItemSettings;
