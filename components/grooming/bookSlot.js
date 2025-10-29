import { Settings } from "@/public/image/SVG";
import React from "react";
import styles from "../../styles/grooming/bookslot.module.css";

const BookSlot = () => {
  return (
    <div className={styles["main-wrapper"]}>
      {/* Header */}
      <div className={styles["slot-wrapper"]}>
        <p>Book a Slot</p>
        <span>
          <Settings />
        </span>
      </div>

      {/* Form Container */}
      <div className={styles.formContainer}>
        {/* Row 1 */}
        <div className={styles.row}>
          <div className={styles.field}>
            <label>Pet Name</label>
            <input
              className={styles.input}
              type="text"
              placeholder="Enter Pet Name"
            />
          </div>
          <div className={styles.field}>
            <label>Owner's Name</label>
            <input
              className={styles.input}
              type="text"
              placeholder="Enter Owner's Name"
            />
          </div>
        </div>

        {/* Row 2 */}
        <div className={styles.row}>
          <div className={styles.field}>
            <label>Groomer Assigned</label>
            <select className={styles.select}>
              <option>Dr. Dinesh Kumar Reddy</option>
              <option>Dr. Dinesh Kumar Reddy</option>
              <option>Dr. Dinesh Kumar Reddy</option>
            </select>
          </div>
          <div className={styles.field}>
            <label>Department / Type</label>
            <select className={styles.select}>
              <option>Consultation</option>
              <option>Consultation</option>
              <option>Consultation</option>
            </select>
          </div>
        </div>

        {/* Row 3 */}
        <div className={styles.row}>
          <div className={styles.field}>
            <label>Date</label>
            <input className={styles.input} type="date" />
          </div>
          <div className={styles.field}>
            <label>Time</label>
            <input className={styles.input} type="time" />
          </div>
        </div>

        {/* Row 4 */}
        <div className={styles.row}>
          <div className={styles.field}>
            <label>Status</label>
            <select className={styles.select}>
              <option>Completed</option>
              <option>Pending</option>
              <option>Upcoming</option>
              <option>Cancelled</option>
            </select>
          </div>
          <div className={styles.field}>
            <label>Duration (Optional)</label>
            <input
              className={styles.input}
              type="text"
              placeholder="Enter Duration"
            />
          </div>
        </div>

        {/* Notes */}
        <div className={styles.row}>
          <div className={styles.fieldFull}>
            <label>Reason / Notes</label>
            <textarea
              className={styles.textarea}
              placeholder="Lorem ipsum dolor sit..."
            ></textarea>
          </div>
        </div>
        <div className={styles["button-container"]}>
          <button className={styles.shareBtn}>SHARE</button>
          <button className={styles.saveBtn}>SAVE</button>
        </div>
      </div>
    </div>
  );
};

export default BookSlot;
