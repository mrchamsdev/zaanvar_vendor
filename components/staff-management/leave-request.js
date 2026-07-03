import React, { useState, useEffect } from "react";
import styles from "../../styles/staff-management.module.css";
import { addStaffLeaveRequest } from "../../services/staffService";
import { toast } from "sonner";

const LeaveRequest = ({ show, onClose, branches = [], staffList = [], onSuccess }) => {
  const [selectedBranchId, setSelectedBranchId] = useState("");
  const [selectedUserId, setSelectedUserId] = useState("");
  const [notes, setNotes] = useState("");
  const [leaveType, setLeaveType] = useState("");
  const [temporaryStaffAvailable, setTemporaryStaffAvailable] = useState(true);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [daysCount, setDaysCount] = useState("");

  useEffect(() => {
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      const diffTime = end - start;
      if (diffTime >= 0) {
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // +1 to include both start and end days
        setDaysCount(diffDays);
      } else {
        setDaysCount("Invalid date range");
      }
    } else {
      setDaysCount("");
    }
  }, [startDate, endDate]);

  const handleSubmit = async () => {
    if (!selectedUserId || !selectedBranchId || !startDate || !endDate) {
      toast?.error ? toast.error("Please fill all required fields") : alert("Please fill all required fields");
      return;
    }

    try {
      const payload = {
        userId: parseInt(selectedUserId),
        branchId: parseInt(selectedBranchId),
        startDate,
        endDate,
        notes: notes || "Leave",
        leaveType,
        temporaryStaffAvailable
      };

      const res = await addStaffLeaveRequest(payload);
      if (res?.status === "success" || res?.statusCode === 200) {
        toast?.success ? toast.success("Leave request added successfully!") : alert("Leave request added successfully!");
        if (onSuccess) onSuccess();
        onClose();
        // Reset form
        setStartDate("");
        setEndDate("");
        setSelectedBranchId("");
        setSelectedUserId("");
        setNotes("");
        setLeaveType("");
        setTemporaryStaffAvailable(true);
      } else {
        toast?.error ? toast.error(res?.message || "Failed to add leave request") : alert(res?.message || "Failed to add leave request");
      }
    } catch (err) {
      console.error("Leave request error:", err);
      toast?.error ? toast.error("An error occurred") : alert("An error occurred");
    }
  };

  if (!show) return null;

  return (
    <div className={styles.drawerOverlay} onClick={onClose}>
      <div className={styles.drawerContent} onClick={(e) => e.stopPropagation()}>
        <div className={styles.drawerHeader}>
          <h2>Leave Request</h2>
          <span onClick={onClose} style={{ cursor: 'pointer' }}>✕</span>
        </div>

        <div className={styles.drawerBody}>
          <div className={styles.formGroup}>
            <label>Branch Assigned to</label>
            <select 
              style={{width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ddd'}}
              value={selectedBranchId}
              onChange={(e) => setSelectedBranchId(e.target.value)}
            >
              <option value="">Choose Branch</option>
              {branches?.map((b) => (
                <option key={b.id || b._id} value={b.id || b._id}>
                  {b.branchName || b.name || "Unknown Branch"}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.formGroup}>
            <label>Choose Employee</label>
            <select 
              style={{width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ddd'}}
              value={selectedUserId}
              onChange={(e) => setSelectedUserId(e.target.value)}
            >
              <option value="">Choose Employee</option>
              {staffList?.map((staff) => (
                <option key={staff.userId || staff.id || staff._id} value={staff.userId || staff.id || staff._id}>
                  {staff.staffName || staff.name || staff.firstName}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.formGroup}>
            <label>Start Date</label>
            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          </div>

          <div className={styles.formGroup}>
            <label>End Date</label>
            <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
          </div>

          <div className={styles.formGroup}>
            <label>Number of days</label>
            <input type="text" placeholder="Auto-calculated" value={daysCount} readOnly style={{ backgroundColor: '#f9f9f9', cursor: 'not-allowed' }} />
          </div>

          <div className={styles.formGroup}>
            <label>Leave Type</label>
            <select
              style={{width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ddd'}}
              value={leaveType}
              onChange={(e) => setLeaveType(e.target.value)}
            >
              <option value="">Select leave Type</option>
              <option value="Weekly off">Weekly off</option>
              <option value="Casual Leave">Casual Leave</option>
              <option value="Paid Leave">Paid Leave</option>
              <option value="Sick Leave">Sick Leave</option>
              <option value="Medical Leave">Medical Leave</option>
              <option value="Maternity Leave">Maternity Leave</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div className={styles.checkboxWrap} style={{ marginTop: '0' }}>
            <input 
              type="checkbox" 
              checked={temporaryStaffAvailable} 
              onChange={(e) => setTemporaryStaffAvailable(e.target.checked)} 
            />
            <span style={{ color: '#333' }}>Temporary Groomer Available</span>
          </div>

          <div className={styles.formGroup}>
            <label>Comments <span className={styles.optional}>Optional</span></label>
            <textarea 
              className={styles.textarea} 
              placeholder="Write here"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            ></textarea>
          </div>
        </div>

        <div className={styles.drawerFooter}>
          <button className={styles.btnOutline} onClick={onClose}>Back</button>
          <button className={styles.btnPrimary} onClick={handleSubmit}>Send Request</button>
        </div>
      </div>
    </div>
  );
};

export default LeaveRequest;
