import React from "react";
import styles from "../../styles/vendor-settings/settings.module.css";

const TABS = [
  { key: "General", label: "General Settings" },
  { key: "Transactions", label: "Transactions" },
  { key: "TaxesGST", label: "Taxes & GST" },
  { key: "TransactionMessage", label: "Transaction Message" },
  { key: "SupplierCustomer", label: "Supplier & Customer" },
  { key: "ItemSettings", label: "Item Settings" },
  { key: "ProfileSettings", label: "Profile Settings" },
];

const VendorSettingsLayout = ({ activeTab, onTabChange, children, onSave, saving }) => {
  return (
    <div className={styles.outerContentArea}>
      {/* Save button row — hidden on ProfileSettings (has own per-section saves) */}
      {activeTab !== "ProfileSettings" && (
        <div className={styles.saveBtnRow}>
        <button
          className={styles.saveBtn}
          onClick={onSave}
          disabled={saving}
          id="settings-save-btn"
        >
          {saving ? (
            <>
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                style={{ animation: "spin 0.8s linear infinite" }}
              >
                <path d="M21 12a9 9 0 1 1-6.219-8.56" />
              </svg>
              Saving…
            </>
          ) : (
            <>
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
              >
                <polyline points="20 6 9 17 4 12" />
              </svg>
              Save Settings
            </>
          )}
        </button>
        </div>
      )}

      {/* Tab content — fills full width */}
      {children}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};


export default VendorSettingsLayout;
export { TABS };
