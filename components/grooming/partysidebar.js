import React, { useEffect } from "react";
import styles from "../../styles/grooming/partysidebar.module.css";
import { Quit, Settings } from "@/public/image/SVG";
const PartySettingsDrawer = ({ open, onClose }) => {
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }
    return () => {
      document.body.style.overflow = "auto";
    };
  }, [open]);

  if (!open) return null;

  return (
    <>
      <div className={styles.overlay} onClick={onClose}></div>

      <div className={styles.drawer}>
        <div className={styles.header}>
          <h3>Party Settings</h3>
          <button className={styles.closeBtn} onClick={onClose}>
            ✕
          </button>
        </div>

        <div className={styles.section}>
          <h4>General</h4>

          <label className={styles.checkbox}>
            <input type="checkbox" />
            Party Grouping <span className={styles.info}><Quit/></span>
          </label>

          <label className={styles.checkbox}>
            <input type="checkbox" />
            Shipping Address <span className={styles.info}><Quit/></span>
          </label>

          <label className={styles.checkbox}>
            <input type="checkbox" />
            Manage Party Status <span className={styles.info}><Quit/></span>
          </label>

          <label className={styles.checkbox}>
            <input type="checkbox" defaultChecked />
            Enable Payment Reminder <span className={styles.info}><Quit/></span>
          </label>

          <div className={styles.reminderBox}>
            <label>
              Remind me for payment due in{" "}
              <span className={styles.info}><Quit/></span>
            </label>
            <div className={styles.reminderInput}>
              <input type="number" defaultValue={1} /> <span>(Days)</span>
            </div>
          </div>
        </div>

        <div className={styles.section}>
          <h4>
            Additional Fields <span className={styles.info}><Quit/></span>
          </h4>

          <label className={styles.checkbox}>
            <input type="checkbox" />
            Additional Field 1
          </label>
          <div className={styles.inputRow}>
            <input
              type="text"
              placeholder="Enter Field Name"
              className={styles.textInput}
            />
            <div className={styles.toggleRow}>
              <span>Show Print</span>
              <label className={styles.switch}>
                <input type="checkbox" defaultChecked />
                <span className={styles.slider}></span>
              </label>
            </div>
          </div>

          <label className={styles.checkbox}>
            <input type="checkbox" />
            Additional Field 2
          </label>
          <div className={styles.inputRow}>
            <input
              type="text"
              placeholder="Enter Field Name"
              className={styles.textInput}
            />
            <div className={styles.toggleRow}>
              <span>Show Print</span>
              <label className={styles.switch}>
                <input type="checkbox" defaultChecked />
                <span className={styles.slider}></span>
              </label>
            </div>
          </div>
        </div>

        <div className={styles.footer}>
          <button className={styles.moreSettingsBtn}>
            <Settings /> More Settings
          </button>
        </div>
      </div>
    </>
  );
};

export default PartySettingsDrawer;
