import React from "react";
import styles from "../../styles/grooming/staffManagment.module.css"

const AddStaff = ({ show, onClose }) => {
  if (!show) return null;

  return (
    <>
      <div className={styles.overlay} onClick={onClose}></div>

      <div className={styles.drawer}>
        <div className={styles.drawerHeader}>
          <h3>Add Staff</h3>
          <span className={styles.closeBtn} onClick={onClose}>✕</span>
        </div>

        {/* Step Circles */}
        <div className={styles.steps}>
          {[1, 2, 3, 4, 5, 6].map((num) => (
            <span
              key={num}
              className={`${styles.step} ${num === 1 ? styles.activeStep : ""}`}
            >
              {`0${num}`}
            </span>
          ))}
        </div>

        {/* Form Fields */}
        <div className={styles.formGroup}>
          <label>Full Name</label>
          <input type="text" placeholder="Enter your full name here" />
        </div>

        <div className={styles.row}>
          <div className={styles.formGroup}>
            <label>Gender</label>
            <select style={{paddingLeft:"30px", width:"140px"}}>
              <option>Male</option>
              <option>Female</option>
            </select>
          </div>

          <div className={styles.formGroup}>
            <label>Date of Birth</label>
            <input type="date" />
          </div>
        </div>

        <div className={styles.formGroup}>
          <label>Mobile Number</label>
          <input type="text" placeholder="Enter your mobile number" />
        </div>

        <div className={styles.formGroup}>
          <label>Email Address</label>
          <input type="email" placeholder="Enter your email here" />
        </div>

        <div className={styles.formGroup}>
          <label>Residential Address</label>
          <input type="text" placeholder="Enter your address here" />
        </div>

        {/* Bottom Buttons */}
        <div className={styles.footerButtons}>
          <button className={styles.resetBtn}>RESET</button>
          <button className={styles.applyBtn}>APPLY FILTERS</button>
        </div>
      </div>
    </>
  );
};

export default AddStaff;
