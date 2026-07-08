import React from "react";
import styles from "../../styles/vendor-settings/settings.module.css";

const InfoIcon = ({ tip }) => (
  <span className={styles.infoIcon} title={tip || "More info"}>ⓘ</span>
);

/* Toggle switch component */
const Toggle = ({ id, checked, onChange }) => (
  <label className={styles.toggle}>
    <input type="checkbox" id={id} checked={checked} onChange={onChange} />
    <span className={styles.toggleSlider} />
  </label>
);

const TrashIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" /><line x1="10" y1="11" x2="10" y2="17" /><line x1="14" y1="11" x2="14" y2="17" />
  </svg>
);

const ItemSettings = ({ settings, onChange }) => {
  const s = settings;
  const toggle = (field) => (e) => onChange({ ...s, [field]: e.target.checked });

  /* ── Item Custom Fields ── */
  const getCustomFields = () => {
    return Array.isArray(s.customFields) && s.customFields.length > 0
      ? s.customFields
      : [
        { label: "", showInPrint: false, required: false, type: "string" },
        { label: "", showInPrint: false, required: false, type: "string" },
      ];
  };

  const addCustomField = () => {
    const fields = getCustomFields();
    if (fields.length < 5) {
      onChange({
        ...s,
        customFields: [...fields, { label: "", showInPrint: false, required: false, type: "string" }],
      });
    }
  };

  const removeCustomField = (idx) => {
    const fields = getCustomFields();
    const next = fields.filter((_, i) => i !== idx);
    onChange({
      ...s,
      customFields: next,
    });
  };

  const updateCustomField = (idx, key, val) => {
    const fields = getCustomFields();
    const next = fields.map((f, i) => (i === idx ? { ...f, [key]: val } : f));
    onChange({
      ...s,
      customFields: next,
    });
  };

  const customFieldsList = getCustomFields();

  return (
    <div>
      <div className={styles.mainTitle}>Item Settings</div>

      <div className={styles.card}>
        <div className={styles.cardTitle}>Item Settings</div>

        <div className={styles.cardFlexContainer}>
          {/* Left Column: Settings */}
          <div className={styles.settingsCol}>
            <div className={styles.checkRow}>
              <input id="barcodeScan" type="checkbox" className={styles.checkInput}
                checked={s.barcodeScan} onChange={toggle("barcodeScan")} />
              <label htmlFor="barcodeScan" className={styles.checkLabel}>Barcode Scan</label>
              <InfoIcon tip={`What is this?\nEnables you to scan item codes or serial numbers for your items while entering transactions.\n\nWhy use it?\nIf you want to use barcode scanning to quickly search for and add items to transactions, you can enable this feature.`} />
            </div>

            <div className={styles.checkRow}>
              <input id="showLowStockDialog" type="checkbox" className={styles.checkInput}
                checked={s.showLowStockDialog} onChange={toggle("showLowStockDialog")} />
              <label htmlFor="showLowStockDialog" className={styles.checkLabel}>Show Low Stock Dialog</label>
              <InfoIcon tip={`What is this?\nZaanvar will display a confirmation dialog when stock is low while creating a transaction.\n\nWhy use it?\nThis setting warns you when the stock quantity of an item falls below the specified minimum quantity, helping you avoid overselling or running out of stock.`} />
            </div>

            <div className={styles.checkRow}>
              <input id="updateSalePriceFromTxn" type="checkbox" className={styles.checkInput}
                checked={s.updateSalePriceFromTxn} onChange={toggle("updateSalePriceFromTxn")} />
              <label htmlFor="updateSalePriceFromTxn" className={styles.checkLabel}>
                Update Sale Price from Transaction
              </label>
              <InfoIcon tip={`What is this?\nThis setting automatically updates an item’s sale price whenever you change it during a sales transaction. The next time you create a sale for that item, the last used sale price will be shown automatically.\n\nWhy use it?\nIt helps keep your item prices up to date without manually editing the item master every time you change the selling price. This is useful if your selling prices change frequently.`} />
            </div>

            <div className={styles.checkRow}>
              <input id="manageItemStatus" type="checkbox" className={styles.checkInput}
                checked={s.manageItemStatus} onChange={toggle("manageItemStatus")} />
              <label htmlFor="manageItemStatus" className={styles.checkLabel}>Manage Item Status</label>
              <InfoIcon tip="When ON, items can be marked Active or Inactive." />
            </div>
          </div>

          {/* Right Column: Item Custom Fields */}
          <div className={styles.additionalFieldsCol}>
            <div className={styles.additionalFieldsSectionTitle}>Custom Fields</div>

            {customFieldsList.map((field, idx) => (
              <div key={idx} className={styles.marginBottom16}>
                <div className={styles.addFieldRow}>
                  <input
                    type="text"
                    className={styles.addFieldInput}
                    placeholder={`Field Name`}
                    value={field.label}
                    onChange={(e) => updateCustomField(idx, "label", e.target.value)}
                  />
                  {idx > 1 && (
                    <button
                      type="button"
                      className={styles.deleteFieldBtn}
                      onClick={() => removeCustomField(idx)}
                      title="Delete Field"
                    >
                      <TrashIcon />
                    </button>
                  )}
                </div>
                <div className={styles.fieldOptionsRow}>
                  <div className={styles.toggleWrap}>
                    <Toggle
                      id={`item-showInPrint-${idx}`}
                      checked={field.showInPrint}
                      onChange={(e) => updateCustomField(idx, "showInPrint", e.target.checked)}
                    />
                    Show in print
                  </div>
                  <div className={styles.toggleWrap}>
                    <Toggle
                      id={`item-required-${idx}`}
                      checked={field.required}
                      onChange={(e) => updateCustomField(idx, "required", e.target.checked)}
                    />
                    Required field
                  </div>
                  <div>
                    <select
                      className={styles.dataTypeSelect}
                      value={field.type || "string"}
                      onChange={(e) => updateCustomField(idx, "type", e.target.value)}
                    >
                      <option value="string">String</option>
                      <option value="number">Number</option>
                    </select>
                  </div>
                </div>
              </div>
            ))}

            <button
              className={`${styles.addBtn} ${styles.marginTop4}`}
              type="button"
              onClick={addCustomField}
              disabled={customFieldsList.length >= 5}
            >
              + Add
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ItemSettings;
