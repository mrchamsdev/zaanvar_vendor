import React, { useEffect, useState } from "react";
import styles from "../../styles/staff-management/view-staff.module.css";
import { getStaffDetailsById } from "../../services/staffService";

const ViewStaff = ({ show, onClose, staffId, onEdit }) => {
  const [staffDetails, setStaffDetails] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isMaximized, setIsMaximized] = useState(true);
  const [isMinimized, setIsMinimized] = useState(false);

  useEffect(() => {
    if (show && staffId) {
      setLoading(true);
      getStaffDetailsById(staffId)
        .then(data => {
          setStaffDetails(data?.data || data || {});
          setLoading(false);
        })
        .catch(err => {
          console.error("Failed to fetch staff details", err);
          setLoading(false);
        });
    } else {
      setStaffDetails(null);
    }
  }, [show, staffId]);

  if (!show) return null;

  return (
    <div className={styles.modalOverlay} style={isMinimized ? { background: 'transparent', pointerEvents: 'none' } : {}}>
      <div 
        className={`${styles.modalContent} ${isMaximized ? styles.modalContentMaximized : ''} ${isMinimized ? styles.modalContentMinimized : ''}`}
        style={isMinimized ? { pointerEvents: 'auto', width: '300px' } : {}}
      >
        {/* Header */}
        <div className={styles.modalHeader}>
          <h2>View Details</h2>
          <div className={styles.modalControls}>
            <span onClick={() => setIsMinimized(!isMinimized)} title="Minimize">{isMinimized ? '+' : '—'}</span>
            <span onClick={() => { setIsMaximized(!isMaximized); setIsMinimized(false); }} title="Maximize">□</span>
            <span onClick={onClose} title="Close">✕</span>
          </div>
        </div>

        {!isMinimized && (
          <div className={styles.modalBody}>
          {loading ? (
            <p>Loading staff details...</p>
          ) : (
            <>
              <div className={styles.topBar}>
                <h3>Staff Details</h3>
                <div className={styles.actionButtons}>
                  <button className={styles.btnAction}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"></path><polyline points="16 6 12 2 8 6"></polyline><line x1="12" y1="2" x2="12" y2="15"></line></svg>
                    Share
                  </button>
                  <button className={styles.btnAction} onClick={onEdit}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>
                    Edit
                  </button>
                </div>
              </div>

              <div className={styles.gridContainer}>
                {/* Left Column */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                  <div className={styles.card}>
                    <div className={styles.infoRow} style={{ marginBottom: '24px' }}>
                      <div className={styles.ownerRow}>
                        <img
                          src={staffDetails?.profileImage || "https://ui-avatars.com/api/?name=" + (staffDetails?.firstName || staffDetails?.staffName || "S")}
                          alt="Profile"
                          className={styles.profileImage}
                        />
                        <span className={styles.infoLabel}>First & Last Name</span>
                      </div>
                      <span className={styles.infoValue}>{staffDetails?.firstName || staffDetails?.staffName || "-"} {staffDetails?.lastName || ""}</span>
                    </div>
                    <div className={styles.infoRow}>
                      <span className={styles.infoLabel}>Date of birth</span>
                      <span className={styles.infoValue}>{staffDetails?.dateOfBirth?.split('T')[0] || "-"}</span>
                    </div>
                    <div className={styles.infoRow}>
                      <span className={styles.infoLabel}>Gender</span>
                      <span className={styles.infoValue}>{staffDetails?.gender || "-"}</span>
                    </div>
                    <div className={styles.infoRow}>
                      <span className={styles.infoLabel}>Branch Assigned</span>
                      <span className={styles.infoValue}>{staffDetails?.branchId || "-"}</span>
                    </div>
                    <div className={styles.infoRow}>
                      <span className={styles.infoLabel}>Role</span>
                      <span className={styles.infoValue}>{staffDetails?.professionalRoleType || staffDetails?.role || "-"}</span>
                    </div>
                  </div>

                  <div className={styles.card}>
                    <div className={styles.cardTitle}>Contact Details</div>
                    <div className={styles.infoRow}>
                      <span className={styles.infoLabel}>Official Email Id</span>
                      <span className={styles.infoValue}>{staffDetails?.email || "-"}</span>
                    </div>
                    <div className={styles.infoRow}>
                      <span className={styles.infoLabel}>Personal Email Id</span>
                      <span className={styles.infoValue}>{staffDetails?.personalEmail || "-"}</span>
                    </div>
                    <div className={styles.infoRow}>
                      <span className={styles.infoLabel}>Phone Number</span>
                      <span className={styles.infoValue}>{staffDetails?.phoneNumber || staffDetails?.contact || "-"}</span>
                    </div>
                  </div>

                  <div className={styles.card}>
                    <div className={styles.cardTitle}>Residential Address</div>
                    <div className={styles.infoRow}><span className={styles.infoLabel}>Country</span><span className={styles.infoValue}>-</span></div>
                    <div className={styles.infoRow}><span className={styles.infoLabel}>State</span><span className={styles.infoValue}>-</span></div>
                    <div className={styles.infoRow}><span className={styles.infoLabel}>City</span><span className={styles.infoValue}>-</span></div>
                    <div className={styles.infoRow}><span className={styles.infoLabel}>Pincode</span><span className={styles.infoValue}>-</span></div>
                    <div className={styles.infoRow}><span className={styles.infoLabel}>Area, street</span><span className={styles.infoValue}>-</span></div>
                    <div className={styles.infoRow}><span className={styles.infoLabel}>Flat / House No</span><span className={styles.infoValue}>-</span></div>
                  </div>

                  <div className={styles.card}>
                    <div className={styles.cardTitle}>Experience</div>
                    <div className={styles.infoRow}><span className={styles.infoLabel}>Leave Assigned to staff per year</span><span className={styles.infoValue}>{staffDetails?.leavesPerYear || "-"}</span></div>
                    <div className={styles.infoRow}><span className={styles.infoLabel}>years of Experience</span><span className={styles.infoValue}>{staffDetails?.experience || "-"}</span></div>
                  </div>

                  <div className={styles.card}>
                    <div className={styles.cardTitle}>Additional Settings</div>
                    <div className={styles.infoRow}><span className={styles.infoLabel}>No of paid leaves</span><span className={styles.infoValue}>{staffDetails?.noOfPaidLeaves || "-"}</span></div>
                    <div className={styles.infoRow}><span className={styles.infoLabel}>Allow for extra working hours</span><span className={styles.infoValue}>{staffDetails?.allowExtraWorkingHours ? "Yes" : "No"}</span></div>
                    <div className={styles.infoRow}><span className={styles.infoLabel}>Salary Type</span><span className={styles.infoValue}>{staffDetails?.salaryType || "-"}</span></div>
                    <div className={styles.infoRow}><span className={styles.infoLabel}>Check in Based Geo-location</span><span className={styles.infoValue}>{staffDetails?.checkInGeoLocation ? "Yes" : "No"}</span></div>
                  </div>
                </div>

                {/* Right Column */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                  <div className={styles.card}>
                    <div className={styles.cardTitle}>Permissions</div>
                    <div className={styles.permissionsList}>
                      <div className={styles.permissionRow}>
                        <div className={styles.permName}>Daycare <span>(Bookings)</span></div>
                        <div className={styles.permValue}>View, Add/Edit, Delete</div>
                      </div>
                      <div className={styles.permissionRow}>
                        <div className={styles.permName}>Grooming <span>(Bookings)</span></div>
                        <div className={styles.permValue}>View, Add</div>
                      </div>
                      <div className={styles.permissionRow}>
                        <div className={styles.permName}>Training <span>(Bookings)</span></div>
                        <div className={styles.permValue}>Add/Edit, Delete</div>
                      </div>
                      <div className={styles.permissionRow}>
                        <div className={styles.permName}>Clinic <span>(Bookings, Vaccinations)</span></div>
                        <div className={styles.permValue}>View Only</div>
                      </div>
                    </div>
                  </div>

                  <div className={styles.card}>
                    <div className={styles.cardTitle}>Emergency Contact Details</div>
                    <div className={styles.infoRow}>
                      <span className={styles.infoLabel}>Name</span>
                      <span className={styles.infoValue}>{staffDetails?.emergencyContactName || "-"}</span>
                    </div>
                    <div className={styles.infoRow}>
                      <span className={styles.infoLabel}>Relation</span>
                      <span className={styles.infoValue}>{staffDetails?.emergencyContactRelation || "-"}</span>
                    </div>
                    <div className={styles.infoRow}>
                      <span className={styles.infoLabel}>Phone Number</span>
                      <span className={styles.infoValue}>{staffDetails?.emergencyContactPhone || "-"}</span>
                    </div>
                  </div>

                  <div className={styles.card}>
                    <div className={styles.cardTitle}>Permanent Address</div>
                    <div className={styles.infoRow}><span className={styles.infoLabel}>Country</span><span className={styles.infoValue}>-</span></div>
                    <div className={styles.infoRow}><span className={styles.infoLabel}>State</span><span className={styles.infoValue}>-</span></div>
                    <div className={styles.infoRow}><span className={styles.infoLabel}>City</span><span className={styles.infoValue}>-</span></div>
                    <div className={styles.infoRow}><span className={styles.infoLabel}>Pincode</span><span className={styles.infoValue}>-</span></div>
                    <div className={styles.infoRow}><span className={styles.infoLabel}>Area, street</span><span className={styles.infoValue}>-</span></div>
                    <div className={styles.infoRow}><span className={styles.infoLabel}>Flat / House No</span><span className={styles.infoValue}>-</span></div>
                  </div>

                  <div className={styles.card}>
                    <div className={styles.cardTitle}>Assigned Working Hours</div>
                    <div className={styles.permissionsList}>
                      {['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map((day) => {
                        const wh = staffDetails?.workingHours?.find(w => w.day === day);
                        return (
                          <div className={styles.permissionRow} key={day}>
                            <div className={styles.permName}>{day}</div>
                            <div className={styles.permValue}>
                              {wh?.isAvailable === false ? "Not Available" : `${wh?.startTime || "00:00 AM"} to ${wh?.endTime || "00:00 PM"}`}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ViewStaff;
