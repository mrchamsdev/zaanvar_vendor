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

const SupplierCustomerSettings = ({ settings, onChange }) => {
  const p = settings;

  const toggle = (field) => (e) => onChange({ ...p, [field]: e.target.checked });

  const stepDays = (delta) => {
    const next = Math.max(1, (p.paymentReminderDays || 1) + delta);
    onChange({ ...p, paymentReminderDays: next });
  };

  /* Additional fields */
  const additionalFields = Array.isArray(p.additionalFields) && p.additionalFields.length > 0 
    ? p.additionalFields 
    : [
        { label: "", showInPrint: false },
        { label: "", showInPrint: false },
      ];

  const updateField = (idx, key, val) => {
    const next = additionalFields.map((f, i) =>
      i === idx ? { ...f, [key]: val } : f
    );
    onChange({ ...p, additionalFields: next });
  };

  const addField = () => {
    if (additionalFields.length < 6) {
      onChange({ ...p, additionalFields: [...additionalFields, { label: "", showInPrint: false }] });
    }
  };

  return (
    <div>
      <div className={styles.cardTitle} style={{ fontSize: 16, marginBottom: 20 }}>
        Supplier &amp; Customer Settings
      </div>

      <div className={styles.threeColGrid}>
        {/* ── Supplier Settings ── */}
        <div className={styles.card}>
          <div className={styles.cardTitle}>Supplier Settings</div>

          {/* Supplier Grouping */}
          <div className={styles.checkRow}>
            <input id="supplierGrouping" type="checkbox" className={styles.checkInput}
              checked={p.supplierGrouping} onChange={toggle("supplierGrouping")} />
            <label htmlFor="supplierGrouping" className={styles.checkLabel}>Supplier Grouping</label>
            <InfoIcon tip="When ON, suppliers can be organised into groups with filter support." />
          </div>

          {/* Shipping Address */}
          <div className={styles.checkRow}>
            <input id="shippingAddress" type="checkbox" className={styles.checkInput}
              checked={p.shippingAddress} onChange={toggle("shippingAddress")} />
            <label htmlFor="shippingAddress" className={styles.checkLabel}>Shipping Address</label>
            <InfoIcon tip="When ON, a shipping address field is added to customer and supplier records." />
          </div>

          {/* Print Shipping Address — only active when shipping address is ON */}
          <div
            className={styles.checkRow}
            style={{ opacity: p.shippingAddress ? 1 : 0.4, pointerEvents: p.shippingAddress ? "auto" : "none" }}
          >
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
            <InfoIcon tip="Send payment reminders before due date." />
          </div>

          {/* Reminder days stepper */}
          <div className={styles.reminderRow} style={{ opacity: p.enablePaymentReminder ? 1 : 0.4 }}>
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

          <div style={{ marginTop: 16 }}>
            <button className={styles.btnLink} type="button">
              Reminder Message
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>
          </div>
        </div>

        {/* ── Additional Fields ── */}
        <div className={styles.card}>
          <div className={styles.cardTitle}>Additional Fields</div>

          {additionalFields.map((field, idx) => (
            <div key={idx} style={{ marginBottom: 16 }}>
              <div className={styles.addFieldRow}>
                <input type="checkbox" className={styles.addFieldCheck} />
                <input
                  type="text"
                  className={styles.addFieldInput}
                  placeholder={`Additional Field ${idx + 1}`}
                  value={field.label}
                  onChange={(e) => updateField(idx, "label", e.target.value)}
                />
              </div>
              <div className={styles.toggleWrap} style={{ marginLeft: 26 }}>
                <Toggle
                  id={`showInPrint-${idx}`}
                  checked={field.showInPrint}
                  onChange={(e) => updateField(idx, "showInPrint", e.target.checked)}
                />
                Show in print
              </div>
            </div>
          ))}

          {additionalFields.length < 6 && (
            <button
              className={styles.btnLink}
              type="button"
              onClick={addField}
              style={{ marginTop: 4 }}
            >
              + Add
            </button>
          )}
        </div>

        {/* ── Enable Loyalty Point ── */}
        <div className={styles.card}>
          <div className={styles.cardTitle}>Enable Loyalty Point</div>

          <div className={styles.checkRow}>
            <input
              id="enableLoyaltyPoint"
              type="checkbox"
              className={styles.checkInput}
              checked={p.enableLoyaltyPoint}
              onChange={toggle("enableLoyaltyPoint")}
            />
            <label htmlFor="enableLoyaltyPoint" className={styles.checkLabel}>Enable Loyalty Point</label>
            <InfoIcon tip="Enable a loyalty point program for customers." />
          </div>
        </div>
      </div>
    </div>
  );
};

export default SupplierCustomerSettings;
