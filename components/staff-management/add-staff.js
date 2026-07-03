import React, { useState, useEffect } from "react";
import styles from "../../styles/staff-management.module.css";
import useDashboardData from "../dashboard/useDashboardData";
import { getStaffDetailsById, updateStaffDetails } from "../../services/staffService";
import { getRoles } from "../../services/rolesService";

const AddStaff = ({ show, onClose, mode = "add", staffId = null }) => {
  const [activeTab, setActiveTab] = useState("personal");
  const [staffDetails, setStaffDetails] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isMaximized, setIsMaximized] = useState(true);
  const [isMinimized, setIsMinimized] = useState(false);

  // Address details state
  const [residentialCountry, setResidentialCountry] = useState("");
  const [residentialState, setResidentialState] = useState("");
  const [residentialCity, setResidentialCity] = useState("");

  const [permanentCountry, setPermanentCountry] = useState("");
  const [permanentState, setPermanentState] = useState("");
  const [permanentCity, setPermanentCity] = useState("");

  const { branches } = useDashboardData({ skipReviews: true }) || { branches: [] };

  const [rolesList, setRolesList] = useState([]);
  const [selectedBranchId, setSelectedBranchId] = useState("");
  const [selectedRoleId, setSelectedRoleId] = useState("");
  const [staffPermissions, setStaffPermissions] = useState([]);

  const countryData = {
    "India": {
      "Telangana": ["Hyderabad", "Warangal", "Nizamabad"],
      "Maharashtra": ["Mumbai", "Pune", "Nagpur"],
      "Karnataka": ["Bengaluru", "Mysuru", "Mangaluru"]
    },
    "USA": {
      "California": ["Los Angeles", "San Francisco", "San Diego"],
      "Texas": ["Houston", "Austin", "Dallas"]
    }
  };

  useEffect(() => {
    if (show && (mode === "edit" || mode === "view") && staffId) {
      setLoading(true);
      getStaffDetailsById(staffId)
        .then(data => {
          const details = data?.data || data || {};
          setStaffDetails(details);
          setSelectedBranchId(details.branchId || "");
          setSelectedRoleId(details.roleId || details.role || "");
          setStaffPermissions(details.permissions || []);
          
          if (details.residentialAddress) {
            setResidentialCountry(details.residentialAddress.country || "");
            setResidentialState(details.residentialAddress.state || "");
            setResidentialCity(details.residentialAddress.city || "");
          }
          if (details.permanentAddress) {
            setPermanentCountry(details.permanentAddress.country || "");
            setPermanentState(details.permanentAddress.state || "");
            setPermanentCity(details.permanentAddress.city || "");
          }
          setLoading(false);
        })
        .catch(err => {
          console.error("Failed to fetch staff details", err);
          setLoading(false);
        });
    } else {
      setStaffDetails({});
      setSelectedBranchId("");
      setSelectedRoleId("");
      setStaffPermissions([]);
      setResidentialCountry("");
      setResidentialState("");
      setResidentialCity("");
      setPermanentCountry("");
      setPermanentState("");
      setPermanentCity("");
    }
  }, [show, mode, staffId]);

  const handleChange = (field, value) => {
    if (mode === 'view') return;
    setStaffDetails(prev => ({ ...prev, [field]: value }));
  };

  const handleAddressChange = (type, field, value) => {
    if (mode === 'view') return;
    setStaffDetails(prev => ({
      ...prev,
      [type]: {
        ...(prev?.[type] || {}),
        [field]: value
      }
    }));
  };

  useEffect(() => {
    if (selectedBranchId || branches?.[0]?.id || branches?.[0]?._id) {
      const branchIdToFetch = selectedBranchId || branches[0].id || branches[0]._id;
      getRoles(branchIdToFetch)
        .then(res => setRolesList(res?.data || res || []))
        .catch(err => console.error(err));
    }
  }, [selectedBranchId, branches]);

  const handleRoleChange = (e) => {
    const roleId = e.target.value;
    setSelectedRoleId(roleId);
    
    // Automatically fill permissions if role selected
    if (roleId) {
      const selectedRole = rolesList.find(r => r.id === parseInt(roleId) || r.id === roleId);
      if (selectedRole && selectedRole.permissions) {
        setStaffPermissions(selectedRole.permissions);
      } else {
        setStaffPermissions([]);
      }
    } else {
      setStaffPermissions([]);
    }
  };

  const handlePermChange = (index, field, value) => {
    if (mode === 'view') return;
    const newPerms = [...staffPermissions];
    newPerms[index] = { ...newPerms[index], [field]: value };
    setStaffPermissions(newPerms);
  };

  if (!show) return null;

  return (
    <div className={styles.modalOverlay} style={isMinimized ? { background: 'transparent', pointerEvents: 'none' } : {}}>
      <div
        className={`${styles.modalContent} ${isMaximized ? styles.modalContentMaximized : ''} ${isMinimized ? styles.modalContentMinimized : ''}`}
        style={isMinimized ? { pointerEvents: 'auto', width: '300px' } : {}}
      >
        {/* Header */}
        <div className={styles.modalHeader}>
          <h2>{mode === 'edit' ? 'Edit Staff' : mode === 'view' ? 'View Staff' : 'Add Staff'}</h2>
          <div className={styles.modalControls}>
            <span onClick={() => setIsMinimized(!isMinimized)} title="Minimize">{isMinimized ? '+' : '—'}</span>
            <span onClick={() => { setIsMaximized(!isMaximized); setIsMinimized(false); }} title="Maximize">□</span>
            <span onClick={onClose} title="Close">✕</span>
          </div>
        </div>

        {/* Hide body if minimized */}
        {!isMinimized && (
          <>
            {/* Navigation Tabs */}
            <div className={styles.modalNav}>
              <button
                className={`${styles.modalNavItem} ${activeTab === "personal" ? styles.modalNavItemActive : ""}`}
                onClick={() => setActiveTab("personal")}
              >
                Personal Information
              </button>
              <button
                className={`${styles.modalNavItem} ${activeTab === "address" ? styles.modalNavItemActive : ""}`}
                onClick={() => setActiveTab("address")}
              >
                Address Details
              </button>
              <button
                className={`${styles.modalNavItem} ${activeTab === "experience" ? styles.modalNavItemActive : ""}`}
                onClick={() => setActiveTab("experience")}
              >
                Experience
              </button>
            </div>

            {/* Body content based on tab */}
            <div className={styles.modalBody}>
              {activeTab === "personal" && (
                <div>
                  <div className={styles.photoUpload}>
                    <div className={styles.photoCircle}></div>
                    <div className={styles.photoText}>
                      <strong>Upload latest photo of the staff <span className={styles.optional}>(Optional)</span></strong>
                      <span>File size not more than 2 MB</span>
                    </div>
                    <button className={styles.uploadBtn}>Upload Picture</button>
                  </div>

                  <div className={styles.sectionTitle}>Basic Information {loading && <span style={{fontSize: '12px', color: '#888'}}>(Loading...)</span>}</div>
                  <div className={styles.formGrid}>
                    <div className={styles.formGroup}>
                      <label>First Name</label>
                      <input type="text" placeholder="Enter First Name" value={staffDetails?.firstName || staffDetails?.staffName || ""} readOnly={mode === 'view'} onChange={(e) => handleChange("firstName", e.target.value)} />
                    </div>
                    <div className={styles.formGroup}>
                      <label>Last Name <span className={styles.optional}>(Optional)</span></label>
                      <input type="text" placeholder="Enter here" value={staffDetails?.lastName || ""} readOnly={mode === 'view'} onChange={(e) => handleChange("lastName", e.target.value)} />
                    </div>
                    <div className={styles.formGroup}>
                      <label>Gender</label>
                      <div className={styles.radioGroup}>
                        <label className={styles.radioLabel}><input type="radio" name="gender" checked={staffDetails?.gender === 'Male'} disabled={mode === 'view'} onChange={() => handleChange("gender", "Male")} /> Male</label>
                        <label className={styles.radioLabel}><input type="radio" name="gender" checked={staffDetails?.gender === 'Female'} disabled={mode === 'view'} onChange={() => handleChange("gender", "Female")} /> Female</label>
                        <label className={styles.radioLabel}><input type="radio" name="gender" checked={!['Male', 'Female'].includes(staffDetails?.gender) && !!staffDetails?.gender} disabled={mode === 'view'} onChange={() => handleChange("gender", "Prefer Not to say")} /> Prefer Not to say</label>
                      </div>
                    </div>
                    <div className={styles.formGroup}>
                      <label>Date of Birth</label>
                      <input type="date" value={staffDetails?.dateOfBirth?.split('T')[0] || ""} readOnly={mode === 'view'} onChange={(e) => handleChange("dateOfBirth", e.target.value)} />
                    </div>
                    <div className={styles.formGroup}>
                      <label>Branch assigned to</label>
                      <select value={selectedBranchId} disabled={mode === 'view'} onChange={(e) => setSelectedBranchId(e.target.value)}>
                        <option value="">Choose here</option>
                        {branches && branches.map((branch) => (
                          <option key={branch.id || branch._id} value={branch.id || branch._id}>
                            {branch.branchName || branch.name || branch.id}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className={styles.formGroup}>
                      <label>Role</label>
                      <select value={selectedRoleId} disabled={mode === 'view'} onChange={handleRoleChange}>
                        <option value="">Choose here</option>
                        {rolesList.map(role => (
                          <option key={role.id} value={role.id}>{role.roleName || role.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className={styles.sectionTitle}>Permission Details</div>
                  <table className={styles.permissionsTable}>
                    <thead>
                      <tr>
                        <th>Module</th>
                        <th>Service Name</th>
                        <th style={{textAlign: 'center'}}>View</th>
                        <th style={{textAlign: 'center'}}>Add / Edit</th>
                        <th style={{textAlign: 'center'}}>Delete</th>
                      </tr>
                    </thead>
                    <tbody>
                      {staffPermissions.length === 0 ? (
                        <tr>
                          <td colSpan="5" style={{ textAlign: "center", color: "#888", padding: "16px" }}>
                            Please select a role to view permissions.
                          </td>
                        </tr>
                      ) : (
                        staffPermissions.map((perm, index) => (
                          <tr key={index}>
                            <td style={{ color: '#aaa', fontWeight: 500 }}>{perm.module || "-"}</td>
                            <td><span style={{ color: mode === 'view' ? '#aaa' : '#555' }}>{perm.serviceName || "-"}</span></td>
                            <td style={{textAlign: 'center'}}>
                              {mode === "view" ? (perm.view ? <span className={styles.iconGreen}>✓</span> : <span className={styles.iconRed}>✕</span>) : (
                                <input type="checkbox" checked={perm.view} onChange={(e) => handlePermChange(index, "view", e.target.checked)} style={{ cursor: 'pointer', accentColor: '#000' }} />
                              )}
                            </td>
                            <td style={{textAlign: 'center'}}>
                              {mode === "view" ? (perm.addEdit ? <span className={styles.iconGreen}>✓</span> : <span className={styles.iconRed}>✕</span>) : (
                                <input type="checkbox" checked={perm.addEdit} onChange={(e) => handlePermChange(index, "addEdit", e.target.checked)} style={{ cursor: 'pointer', accentColor: '#000' }} />
                              )}
                            </td>
                            <td style={{textAlign: 'center'}}>
                              {mode === "view" ? (perm.delete ? <span className={styles.iconGreen}>✓</span> : <span className={styles.iconRed}>✕</span>) : (
                                <input type="checkbox" checked={perm.delete} onChange={(e) => handlePermChange(index, "delete", e.target.checked)} style={{ cursor: 'pointer', accentColor: '#000' }} />
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>

                  <div className={styles.sectionTitle}>Contact Details</div>
                  <div className={styles.formGrid}>
                    <div className={styles.formGroup}>
                      <label>Official Email ID</label>
                      <input type="email" placeholder="Enter Official Email ID" value={staffDetails?.email || ""} readOnly={mode === 'view'} onChange={(e) => handleChange("email", e.target.value)} />
                    </div>
                    <div className={styles.formGroup}>
                      <label>Personal Email ID <span className={styles.optional}>(Optional)</span></label>
                      <input type="email" placeholder="Enter Personal Email ID" value={staffDetails?.personalEmail || ""} readOnly={mode === 'view'} onChange={(e) => handleChange("personalEmail", e.target.value)} />
                    </div>
                    <div className={styles.formGroup}>
                      <label>Phone Number</label>
                      <input type="text" placeholder="+91 Enter Phone Number" value={staffDetails?.phoneNumber || ""} readOnly={mode === 'view'} onChange={(e) => handleChange("phoneNumber", e.target.value)} />
                    </div>
                  </div>

                  <div className={styles.sectionTitle}>Emergency contact details</div>
                  <div className={styles.formGrid}>
                    <div className={styles.formGroup}>
                      <label>Name <span className={styles.optional}>(Optional)</span></label>
                      <input type="text" placeholder="Enter Name" value={staffDetails?.emergencyContactName || ""} readOnly={mode === 'view'} onChange={(e) => handleChange("emergencyContactName", e.target.value)} />
                    </div>
                    <div className={styles.formGroup}>
                      <label>Relation <span className={styles.optional}>(Optional)</span></label>
                      <input type="text" placeholder="Enter Relation" value={staffDetails?.emergencyContactRelation || ""} readOnly={mode === 'view'} onChange={(e) => handleChange("emergencyContactRelation", e.target.value)} />
                    </div>
                    <div className={styles.formGroup}>
                      <label>Phone Number <span className={styles.optional}>(Optional)</span></label>
                      <input type="text" placeholder="+91 Enter Phone Number" value={staffDetails?.emergencyContactPhone || ""} readOnly={mode === 'view'} onChange={(e) => handleChange("emergencyContactPhone", e.target.value)} />
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "address" && (
                <div>
                  <div className={styles.sectionTitle}>Residential Address Details</div>
                  <div className={styles.formGrid}>
                    <div className={styles.formGroup}>
                      <label>Country <span style={{color: 'red'}}>*</span></label>
                      <select value={residentialCountry} disabled={mode === 'view'} onChange={(e) => { setResidentialCountry(e.target.value); setResidentialState(""); setResidentialCity(""); handleAddressChange("residentialAddress", "country", e.target.value); }}>
                        <option value="">Select Country</option>
                        {Object.keys(countryData).map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                    <div className={styles.formGroup}>
                      <label>State</label>
                      <select value={residentialState} disabled={!residentialCountry || mode === 'view'} onChange={(e) => { setResidentialState(e.target.value); setResidentialCity(""); handleAddressChange("residentialAddress", "state", e.target.value); }}>
                        <option value="">Select State</option>
                        {residentialCountry && Object.keys(countryData[residentialCountry]).map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                    <div className={styles.formGroup}>
                      <label>City</label>
                      <select value={residentialCity} disabled={!residentialState || mode === 'view'} onChange={(e) => { setResidentialCity(e.target.value); handleAddressChange("residentialAddress", "city", e.target.value); }}>
                        <option value="">Select City</option>
                        {residentialState && countryData[residentialCountry][residentialState].map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                    <div className={styles.formGroup}>
                      <label>Pin Code</label>
                      <input type="text" placeholder="500085" value={staffDetails?.residentialAddress?.pincode || ""} readOnly={mode === 'view'} onChange={(e) => handleAddressChange("residentialAddress", "pincode", e.target.value)} />
                    </div>
                    <div className={styles.formGroup}>
                      <label>Area, Street</label>
                      <input type="text" placeholder="KPHB Colony" value={staffDetails?.residentialAddress?.areaStreet || ""} readOnly={mode === 'view'} onChange={(e) => handleAddressChange("residentialAddress", "areaStreet", e.target.value)} />
                    </div>
                    <div className={styles.formGroup}>
                      <label>Flat/House no.</label>
                      <input type="text" placeholder="Pragathi Enclave flat No. 106" value={staffDetails?.residentialAddress?.flatNo || ""} readOnly={mode === 'view'} onChange={(e) => handleAddressChange("residentialAddress", "flatNo", e.target.value)} />
                    </div>
                  </div>
                  <div className={styles.checkboxWrap} style={{marginTop: '16px', marginBottom: '32px'}}>
                    <input type="checkbox" defaultChecked /> Mark this address as permanent address
                  </div>

                  <div className={styles.sectionTitle}>Permanent Address Details</div>
                  <div className={styles.formGrid}>
                    <div className={styles.formGroup}>
                      <label>Country <span style={{color: 'red'}}>*</span></label>
                      <select value={permanentCountry} disabled={mode === 'view'} onChange={(e) => { setPermanentCountry(e.target.value); setPermanentState(""); setPermanentCity(""); handleAddressChange("permanentAddress", "country", e.target.value); }}>
                        <option value="">Select Country</option>
                        {Object.keys(countryData).map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                    <div className={styles.formGroup}>
                      <label>State</label>
                      <select value={permanentState} disabled={!permanentCountry || mode === 'view'} onChange={(e) => { setPermanentState(e.target.value); setPermanentCity(""); handleAddressChange("permanentAddress", "state", e.target.value); }}>
                        <option value="">Select State</option>
                        {permanentCountry && Object.keys(countryData[permanentCountry]).map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                    <div className={styles.formGroup}>
                      <label>City</label>
                      <select value={permanentCity} disabled={!permanentState || mode === 'view'} onChange={(e) => { setPermanentCity(e.target.value); handleAddressChange("permanentAddress", "city", e.target.value); }}>
                        <option value="">Select City</option>
                        {permanentState && countryData[permanentCountry][permanentState].map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                    <div className={styles.formGroup}>
                      <label>Pin Code</label>
                      <input type="text" placeholder="500085" value={staffDetails?.permanentAddress?.pincode || ""} readOnly={mode === 'view'} onChange={(e) => handleAddressChange("permanentAddress", "pincode", e.target.value)} />
                    </div>
                    <div className={styles.formGroup}>
                      <label>Area, Street</label>
                      <input type="text" placeholder="KPHB Colony" value={staffDetails?.permanentAddress?.areaStreet || ""} readOnly={mode === 'view'} onChange={(e) => handleAddressChange("permanentAddress", "areaStreet", e.target.value)} />
                    </div>
                    <div className={styles.formGroup}>
                      <label>Flat/House no.</label>
                      <input type="text" placeholder="Pragathi Enclave flat No. 106" value={staffDetails?.permanentAddress?.flatNo || ""} readOnly={mode === 'view'} onChange={(e) => handleAddressChange("permanentAddress", "flatNo", e.target.value)} />
                    </div>
                  </div>
                  <div className={styles.checkboxWrap} style={{marginTop: '16px', opacity: 0.5}}>
                    <input type="checkbox" disabled /> Mark this address as permanent address
                  </div>
                </div>
              )}

              {activeTab === "experience" && (
                <div>
                  <div className={styles.formGrid}>
                    <div className={styles.formGroup}>
                      <label>Leave assigned to staff per year <span className={styles.optional}>Optional</span></label>
                      <input type="text" placeholder="Enter leave assigned per year" />
                    </div>
                    <div className={styles.formGroup}>
                      <label>Years of Experience <span className={styles.optional}>Optional</span></label>
                      <input type="text" placeholder="Enter Your Experience Year" />
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '32px', marginBottom: '16px' }}>
                    <div className={styles.sectionTitle} style={{ margin: 0 }}>Assigned working hours</div>
                    <div className={styles.checkboxWrap} style={{ marginTop: 0 }}>
                      <input type="checkbox" defaultChecked /> Copy to all days
                    </div>
                  </div>

                  <div className={styles.workingHoursGrid}>
                    {['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map((day) => (
                      <div key={day} className={styles.workingHourRow}>
                        <div style={{ width: '120px', fontWeight: 500, fontSize: '14px', color: '#1a1a1a' }}>{day}</div>

                        <div className={styles.toggleWrap}>
                          <label className={styles.switch}>
                            <input type="checkbox" defaultChecked={day === 'Thursday'} />
                            <span className={`${styles.slider} ${styles.round}`}></span>
                          </label>
                          <span style={{ fontSize: '12px', color: '#888' }}>Not Available</span>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <select className={styles.timeSelect}>
                            <option>00 : 00</option>
                          </select>
                          <span style={{ fontSize: '12px', color: '#666' }}>TO</span>
                          <select className={styles.timeSelect}>
                            <option>00 : 00</option>
                          </select>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className={styles.sectionTitle}>Additional Settings</div>

                  <div className={styles.settingsGroup}>
                    <div className={styles.settingsLabel}>No of Paid Leaves For Month</div>
                    <div style={{ display: 'flex', gap: '24px' }}>
                      <label className={styles.checkboxLabel}><input type="checkbox" defaultChecked /> 02 days</label>
                      <label className={styles.checkboxLabel}><input type="checkbox" /> 04 days</label>
                      <label className={styles.checkboxLabel}><input type="checkbox" /> Every Saturday</label>
                    </div>
                  </div>

                  <div className={styles.settingsGroup}>
                    <label className={styles.checkboxLabel}><input type="checkbox" /> Allow for Extra Working Hours</label>
                  </div>

                  <div className={styles.settingsGroup}>
                    <div className={styles.settingsLabel}>Salary Type</div>
                    <div style={{ display: 'flex', gap: '24px' }}>
                      <label className={styles.checkboxLabel}><input type="checkbox" defaultChecked /> Day Wise</label>
                      <label className={styles.checkboxLabel}><input type="checkbox" /> Month Wise</label>
                    </div>
                  </div>

                  <div className={styles.settingsGroup}>
                    <label className={styles.checkboxLabel}><input type="checkbox" /> Check-in based Geo Location</label>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className={styles.modalFooter}>
              {activeTab !== "personal" && (
                <button className={styles.btnOutline} onClick={() => {
                  if (activeTab === "experience") setActiveTab("address");
                  else if (activeTab === "address") setActiveTab("personal");
                }}>Previous</button>
              )}
              
              <button className={styles.btnPrimary} onClick={async () => {
                if (activeTab === "personal") setActiveTab("address");
                else if (activeTab === "address") setActiveTab("experience");
                else {
                  if (mode === "edit" && staffId) {
                    try {
                      setLoading(true);
                      const payload = {
                        firstName: staffDetails?.firstName || staffDetails?.staffName,
                        lastName: staffDetails?.lastName,
                        gender: staffDetails?.gender,
                        dateOfBirth: staffDetails?.dateOfBirth,
                        personalEmail: staffDetails?.personalEmail,
                        emergencyContactName: staffDetails?.emergencyContactName,
                        emergencyContactRelation: staffDetails?.emergencyContactRelation,
                        emergencyContactPhone: staffDetails?.emergencyContactPhone,
                        role: rolesList.find(r => r.id === parseInt(selectedRoleId) || r.id === selectedRoleId)?.roleName || "MANAGER",
                        residentialAddress: staffDetails?.residentialAddress || {},
                        permanentAddress: staffDetails?.permanentAddress || {},
                        leavesPerYear: staffDetails?.leavesPerYear || 15,
                        noOfPaidLeaves: staffDetails?.noOfPaidLeaves || "03 days",
                        allowExtraWorkingHours: staffDetails?.allowExtraWorkingHours || false,
                        salaryType: staffDetails?.salaryType || "Day Wise",
                        checkInGeoLocation: staffDetails?.checkInGeoLocation || true,
                        workingHours: staffDetails?.workingHours || [],
                        permissions: staffPermissions
                      };
                      await updateStaffDetails(staffId, payload);
                      // On success, close or show toast
                      onClose();
                    } catch (error) {
                      console.error("Failed to update staff:", error);
                    } finally {
                      setLoading(false);
                    }
                  } else {
                    onClose();
                  }
                }
              }} disabled={loading}>
                {loading ? "Submitting..." : (activeTab === "experience" ? "Submit" : "Next")}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default AddStaff;
