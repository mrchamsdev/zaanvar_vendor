import React, { useState } from "react";
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

const SupplierCustomerSettings = ({ settings, onChange }) => {
  const p = settings;

  const toggle = (field) => (e) => onChange({ ...p, [field]: e.target.checked });

  const stepDays = (delta) => {
    const next = Math.max(1, (p.paymentReminderDays || 1) + delta);
    onChange({ ...p, paymentReminderDays: next });
  };

  /* Additional fields helper */
  const getFields = (fieldKey) => {
    return Array.isArray(p[fieldKey]) && p[fieldKey].length > 0
      ? p[fieldKey]
      : [
        { label: "", showInPrint: false, required: false, dataType: "string" },
        { label: "", showInPrint: false, required: false, dataType: "string" },
      ];
  };

  const updateFieldGeneric = (fieldKey) => (idx, key, val) => {
    const currentFields = getFields(fieldKey);
    const next = currentFields.map((f, i) =>
      i === idx ? { ...f, [key]: val } : f
    );
    onChange({ ...p, [fieldKey]: next });
  };

  const addFieldGeneric = (fieldKey) => () => {
    const currentFields = getFields(fieldKey);
    if (currentFields.length < 5) {
      onChange({ ...p, [fieldKey]: [...currentFields, { label: "", showInPrint: false, required: false, dataType: "string" }] });
    }
  };

  const deleteFieldGeneric = (fieldKey) => (idx) => {
    const currentFields = getFields(fieldKey);
    const next = currentFields.filter((_, i) => i !== idx);
    onChange({ ...p, [fieldKey]: next });
  };

  return (
    <div>
      <div className={styles.mainTitle}>
        Supplier &amp; Customer Settings
      </div>

      <div>
        {/* ── Supplier Settings Card ── */}
        <div className={styles.card}>
          <div className={styles.cardTitle}>Supplier Settings</div>

          <div className={styles.cardFlexContainer}>
            {/* Left Column: Settings */}
            <div className={styles.settingsCol}>
              {/* Supplier Grouping */}
              <div className={styles.checkRow}>
                <input id="supplierGrouping" type="checkbox" className={styles.checkInput}
                  checked={p.supplierGrouping} onChange={toggle("supplierGrouping")} />
                <label htmlFor="supplierGrouping" className={styles.checkLabel}>Supplier Grouping</label>
                <InfoIcon tip={`What is this?\nYou can group similar types of suppliers together. You can create groups and assign suppliers to those groups.\n\nWhy use it?\nIf you want to create groups of customers, vendors, or region-wise customers and view reports based on those groups, you can enable this setting.`} />
              </div>

              {/* Shipping Address */}
              <div className={styles.checkRow}>
                <input id="shippingAddress" type="checkbox" className={styles.checkInput}
                  checked={p.shippingAddress} onChange={toggle("shippingAddress")} />
                <label htmlFor="shippingAddress" className={styles.checkLabel}>Shipping Address</label>
                <InfoIcon tip="When ON, a shipping address field is added to customer and supplier records." />
              </div>

              {/* Print Shipping Address — only active when shipping address is ON */}
              <div className={`${styles.checkRow} ${p.shippingAddress ? "" : styles.disabledCheckRow}`}>
                <input id="printShippingAddress" type="checkbox" className={styles.checkInput}
                  checked={p.printShippingAddress}
                  onChange={toggle("printShippingAddress")}
                  disabled={!p.shippingAddress}
                />
                <label htmlFor="printShippingAddress" className={styles.checkLabel}>
                  Print Shipping Address
                </label>
                <InfoIcon tip="Print the shipping address on invoices (only available when Shipping Address is ON)." />
              </div>

              {/* Manage Supplier Status */}
              <div className={styles.checkRow}>
                <input id="manageSupplierStatus" type="checkbox" className={styles.checkInput}
                  checked={p.manageSupplierStatus} onChange={toggle("manageSupplierStatus")} />
                <label htmlFor="manageSupplierStatus" className={styles.checkLabel}>Manage Party Status</label>
                <InfoIcon tip="When ON, suppliers and customers can be marked Active or Inactive." />
              </div>

              {/* Enable Payment Reminder */}
              <div className={styles.checkRow}>
                <input id="enablePaymentReminder" type="checkbox" className={styles.checkInput}
                  checked={p.enablePaymentReminder} onChange={toggle("enablePaymentReminder")} />
                <label htmlFor="enablePaymentReminder" className={styles.checkLabel}>Enable Payment Reminder</label>
                <InfoIcon tip={`What is this?\nEnables you to receive automatic payment reminders that help you follow up with your suppliers and get paid faster.`} />
              </div>

              {/* Reminder days stepper */}
              <div className={`${styles.reminderRow} ${p.enablePaymentReminder ? "" : styles.disabledCheckRow}`}>
                <span className={styles.reminderLabel}>Remind me for &nbsp;Payment due in</span>
                <input
                  type="number"
                  className={styles.reminderInput}
                  value={p.paymentReminderDays}
                  min={1}
                  onChange={(e) =>
                    onChange({ ...p, paymentReminderDays: Math.max(1, parseInt(e.target.value) || 1) })
                  }
                  disabled={!p.enablePaymentReminder}
                />
                <div className={styles.stepperBtns}>
                  <button className={styles.stepperBtn} type="button" onClick={() => stepDays(1)}
                    disabled={!p.enablePaymentReminder}>▲</button>
                  <button className={styles.stepperBtn} type="button" onClick={() => stepDays(-1)}
                    disabled={!p.enablePaymentReminder}>▼</button>
                </div>
                <span className={styles.reminderLabel}>Days</span>
              </div>

              <div className={styles.marginTop16}>
                <button className={styles.btnLink} type="button">
                  Reminder Message
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Right Column: Supplier Additional Fields */}
            <div className={styles.additionalFieldsCol}>
              <div className={styles.additionalFieldsSectionTitle}>Additional Fields</div>

              {getFields("additionalFields").map((field, idx) => (
                <div key={idx} className={styles.marginBottom16}>
                  <div className={styles.addFieldRow}>
                    <input
                      type="text"
                      className={styles.addFieldInput}
                      placeholder={`Field Name`}
                      value={field.label}
                      onChange={(e) => updateFieldGeneric("additionalFields")(idx, "label", e.target.value)}
                    />
                    {idx > 1 && (
                      <button
                        type="button"
                        className={styles.deleteFieldBtn}
                        onClick={() => deleteFieldGeneric("additionalFields")(idx)}
                        title="Delete Field"
                      >
                        <TrashIcon />
                      </button>
                    )}
                  </div>
                  <div className={styles.fieldOptionsRow}>
                    <div className={styles.toggleWrap}>
                      <Toggle
                        id={`supplier-showInPrint-${idx}`}
                        checked={field.showInPrint}
                        onChange={(e) => updateFieldGeneric("additionalFields")(idx, "showInPrint", e.target.checked)}
                      />
                      Show in print
                    </div>
                    <div className={styles.toggleWrap}>
                      <Toggle
                        id={`supplier-required-${idx}`}
                        checked={field.required}
                        onChange={(e) => updateFieldGeneric("additionalFields")(idx, "required", e.target.checked)}
                      />
                      Required field
                    </div>
                    <div>
                      <select
                        className={styles.dataTypeSelect}
                        value={field.dataType || "string"}
                        onChange={(e) => updateFieldGeneric("additionalFields")(idx, "dataType", e.target.value)}
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
                onClick={addFieldGeneric("additionalFields")}
                disabled={getFields("additionalFields").length >= 5}
              >
                + Add
              </button>
            </div>
          </div>
        </div>

        {/* ── Customer Settings Card ── */}
        <div className={styles.card}>
          <div className={styles.cardTitle}>Customer Settings</div>

          <div className={styles.cardFlexContainer}>
            {/* Left Column: Settings */}
            <div className={styles.settingsCol}>
              {/* Customer Shipping Address */}
              <div className={styles.checkRow}>
                <input id="customerShippingAddress" type="checkbox" className={styles.checkInput}
                  checked={p.customerShippingAddress} onChange={toggle("customerShippingAddress")} />
                <label htmlFor="customerShippingAddress" className={styles.checkLabel}>Shipping Address</label>
                <InfoIcon tip="When ON, a shipping address field is added to customer records." />
              </div>

              {/* Customer Print Shipping Address */}
              <div className={`${styles.checkRow} ${p.customerShippingAddress ? "" : styles.disabledCheckRow}`}>
                <input id="customerPrintShippingAddress" type="checkbox" className={styles.checkInput}
                  checked={p.customerPrintShippingAddress}
                  onChange={toggle("customerPrintShippingAddress")}
                  disabled={!p.customerShippingAddress}
                />
                <label htmlFor="customerPrintShippingAddress" className={styles.checkLabel}>
                  Print Shipping Address
                </label>
                <InfoIcon tip="Print the shipping address on customer invoices (only available when Shipping Address is ON)." />
              </div>
            </div>

            {/* Right Column: Customer Additional Fields */}
            <div className={styles.additionalFieldsCol}>
              <div className={styles.additionalFieldsSectionTitle}>Additional Fields</div>

              {getFields("customerAdditionalFields").map((field, idx) => (
                <div key={idx} className={styles.marginBottom16}>
                  <div className={styles.addFieldRow}>
                    <input
                      type="text"
                      className={styles.addFieldInput}
                      placeholder={`Field Name`}
                      value={field.label}
                      onChange={(e) => updateFieldGeneric("customerAdditionalFields")(idx, "label", e.target.value)}
                    />
                    {idx > 1 && (
                      <button
                        type="button"
                        className={styles.deleteFieldBtn}
                        onClick={() => deleteFieldGeneric("customerAdditionalFields")(idx)}
                        title="Delete Field"
                      >
                        <TrashIcon />
                      </button>
                    )}
                  </div>
                  <div className={styles.fieldOptionsRow}>
                    <div className={styles.toggleWrap}>
                      <Toggle
                        id={`customer-showInPrint-${idx}`}
                        checked={field.showInPrint}
                        onChange={(e) => updateFieldGeneric("customerAdditionalFields")(idx, "showInPrint", e.target.checked)}
                      />
                      Show in print
                    </div>
                    <div className={styles.toggleWrap}>
                      <Toggle
                        id={`customer-required-${idx}`}
                        checked={field.required}
                        onChange={(e) => updateFieldGeneric("customerAdditionalFields")(idx, "required", e.target.checked)}
                      />
                      Required field
                    </div>
                    <div>
                      <select
                        className={styles.dataTypeSelect}
                        value={field.dataType || "string"}
                        onChange={(e) => updateFieldGeneric("customerAdditionalFields")(idx, "dataType", e.target.value)}
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
                onClick={addFieldGeneric("customerAdditionalFields")}
                disabled={getFields("customerAdditionalFields").length >= 5}
              >
                + Add
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SupplierCustomerSettings;
