import React from "react";
import styles from "../../styles/vendor-settings/settings.module.css";

const TABS = [
  { key: "General", label: "General Settings" },
  { key: "Transactions", label: "Transactions" },
  { key: "TaxesGST", label: "Taxes & GST" },
  { key: "TransactionMessage", label: "Transaction Message" },
  { key: "SupplierCustomer", label: "Supplier & Customer" },
  { key: "ItemSettings", label: "Item Settings" },
  { key: "ServicesPackages", label: "Services & Packages" },
  { key: "RoomsCapacity", label: "Rooms & Capacity" },
  { key: "ProfileSettings", label: "Profile Settings" },
];

const VendorSettingsLayout = ({ activeTab, onTabChange, children, onSave, saving }) => {
  return (
    <div className={styles.outerContentArea}>
      {/* Tab content — fills full width */}
      {children}

      {/* Save / Cancel button row at the bottom */}
      {activeTab !== "ProfileSettings" && activeTab !== "RolesAndPermissions" && activeTab !== "ServicesPackages" && activeTab !== "RoomsCapacity" && (
        <div className={styles.bottomActionBar}>
          <button
            type="button"
            className={styles.cancelBtn}
            onClick={() => window.location.reload()}
          >
            Cancel
          </button>
          <button
            type="button"
            className={styles.primarySaveBtn}
            onClick={onSave}
            disabled={saving}
            id="settings-save-btn"
          >
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};


export default VendorSettingsLayout;
export { TABS };
