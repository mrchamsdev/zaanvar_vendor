import React, { useState, useEffect } from "react";
import styles from "../../styles/staff-management.module.css";
import useDashboardData from "../dashboard/useDashboardData";
import { getStaffDetailsById, updateStaffDetails, addBranchStaff, generateGroomerSlots } from "../../services/staffService";
import { getRoles } from "../../services/rolesService";
import { dateOnlyWithTimeZone } from "../../utilities/date-time-utils";
import { Country, State, City } from "country-state-city";
import SearchableSelect from "../utilities/SearchableSelect";
import SearchableCountryCode from "../utilities/searchablecountrycode";
import { toast } from "sonner";

const AddStaff = ({ show, onClose, mode = "add", staffId = null }) => {
  const [activeTab, setActiveTab] = useState("personal");
  const [staffDetails, setStaffDetails] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [isMaximized, setIsMaximized] = useState(true);
  const [isMinimized, setIsMinimized] = useState(false);

  // Address details state
  const [residentialCountry, setResidentialCountry] = useState("");
  const [residentialState, setResidentialState] = useState("");
  const [residentialCity, setResidentialCity] = useState("");

  const [permanentCountry, setPermanentCountry] = useState("");
  const [permanentState, setPermanentState] = useState("");
  const [permanentCity, setPermanentCity] = useState("");
  const [isSameAsResidential, setIsSameAsResidential] = useState(false);

  const [phoneDialCode, setPhoneDialCode] = useState("+91");
  const [emergencyDialCode, setEmergencyDialCode] = useState("+91");

  const [workingHours, setWorkingHours] = useState(
    ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].reduce((acc, day) => {
      acc[day] = { isNotAvailable: day === 'Sunday', startTime: "09:00", endTime: "18:00" };
      return acc;
    }, {})
  );

  const { branches } = useDashboardData({ skipReviews: true }) || { branches: [] };

  const [rolesList, setRolesList] = useState([]);
  const [selectedBranchId, setSelectedBranchId] = useState("");
  const [selectedRoleId, setSelectedRoleId] = useState("");
  const [staffPermissions, setStaffPermissions] = useState([]);

  const allCountries = Country.getAllCountries().map(c => ({
    name: c.name,
    code: c.isoCode,
    dialCode: "+" + c.phonecode
  }));

  const generateTimeOptions = () => {
    const times = [];
    for (let i = 0; i < 24; i++) {
      const h = i < 10 ? `0${i}` : i;
      times.push(`${h}:00`);
      times.push(`${h}:30`);
    }
    return times;
  };
  const timeOptions = generateTimeOptions();

  // Helper values for dropdowns
  const residentialCountryCode = Country.getAllCountries().find(c => c.name === residentialCountry)?.isoCode || "";
  const residentialStateCode = State.getStatesOfCountry(residentialCountryCode).find(s => s.name === residentialState)?.isoCode || "";
  const residentialCountryOptions = Country.getAllCountries().map(c => ({ label: c.name, value: c.name }));
  const residentialStateOptions = residentialCountryCode ? State.getStatesOfCountry(residentialCountryCode).map(s => ({ label: s.name, value: s.name })) : [];
  const residentialCityOptions = residentialStateCode ? City.getCitiesOfState(residentialCountryCode, residentialStateCode).map(c => ({ label: c.name, value: c.name })) : [];

  const permanentCountryCode = Country.getAllCountries().find(c => c.name === permanentCountry)?.isoCode || "";
  const permanentStateCode = State.getStatesOfCountry(permanentCountryCode).find(s => s.name === permanentState)?.isoCode || "";
  const permanentCountryOptions = Country.getAllCountries().map(c => ({ label: c.name, value: c.name }));
  const permanentStateOptions = permanentCountryCode ? State.getStatesOfCountry(permanentCountryCode).map(s => ({ label: s.name, value: s.name })) : [];
  const permanentCityOptions = permanentStateCode ? City.getCitiesOfState(permanentCountryCode, permanentStateCode).map(c => ({ label: c.name, value: c.name })) : [];

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
    setStaffDetails(prev => {
      const updated = {
        ...prev,
        [type]: {
          ...(prev?.[type] || {}),
          [field]: value
        }
      };
      if (type === "residentialAddress" && isSameAsResidential) {
        updated.permanentAddress = { ...updated.residentialAddress };
      }
      return updated;
    });
  };

  const handleSameAsResidentialChange = (e) => {
    const checked = e.target.checked;
    setIsSameAsResidential(checked);
    if (checked) {
      setPermanentCountry(residentialCountry);
      setPermanentState(residentialState);
      setPermanentCity(residentialCity);
      setStaffDetails(prev => ({
        ...prev,
        permanentAddress: { ...(prev?.residentialAddress || {}) }
      }));
    }
  };

  const handlePincodeChange = async (type, e) => {
    let value = e.target.value;
    // Strip non-numeric characters
    value = value.replace(/[^0-9]/g, '');
    // Restrict length to 6 digits
    if (value.length > 6) value = value.slice(0, 6);

    handleAddressChange(type, 'pincode', value);
    if (value.length === 6) {
      try {
        const res = await fetch(`https://api.postalpincode.in/pincode/${value}`);
        const data = await res.json();
        if (data && data[0] && data[0].Status === "Success" && data[0].PostOffice) {
          const po = data[0].PostOffice[0];
          const country = po.Country || "India";
          const state = po.State;
          const city = po.District || po.Block;

          if (type === "residentialAddress") {
            setResidentialCountry(country);
            setResidentialState(state);
            setResidentialCity(city);
            handleAddressChange("residentialAddress", "country", country);
            handleAddressChange("residentialAddress", "state", state);
            handleAddressChange("residentialAddress", "city", city);
          } else {
            setPermanentCountry(country);
            setPermanentState(state);
            setPermanentCity(city);
            handleAddressChange("permanentAddress", "country", country);
            handleAddressChange("permanentAddress", "state", state);
            handleAddressChange("permanentAddress", "city", city);
          }
        }
      } catch (err) {
        console.error("Failed to fetch pincode details", err);
      }
    }
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
              >
                Personal Information
              </button>
              <button
                className={`${styles.modalNavItem} ${activeTab === "address" ? styles.modalNavItemActive : ""}`}
              >
                Address Details
              </button>
              <button
                className={`${styles.modalNavItem} ${activeTab === "experience" ? styles.modalNavItemActive : ""}`}
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

                  <div className={styles.sectionTitle}>Basic Information {loading && <span style={{ fontSize: '12px', color: '#888' }}>(Loading...)</span>}</div>
                  <div className={styles.formGrid}>
                    <div className={styles.formGroup}>
                      <label><span>First Name <span style={{ color: 'red' }}>*</span></span></label>
                      <input type="text" placeholder="Enter First Name" value={staffDetails?.firstName || staffDetails?.staffName || ""} readOnly={mode === 'view'} onChange={(e) => { handleChange("firstName", e.target.value); setErrors(p => ({ ...p, firstName: null })); }} />
                      {errors.firstName && <span style={{ color: 'red', fontSize: '12px', marginTop: '-4px' }}>{errors.firstName}</span>}
                    </div>
                    <div className={styles.formGroup}>
                      <label><span>Last Name <span style={{ color: 'red' }}>*</span></span></label>
                      <input type="text" placeholder="Enter here" value={staffDetails?.lastName || ""} readOnly={mode === 'view'} onChange={(e) => { handleChange("lastName", e.target.value); setErrors(p => ({ ...p, lastName: null })); }} />
                      {errors.lastName && <span style={{ color: 'red', fontSize: '12px', marginTop: '-4px' }}>{errors.lastName}</span>}
                    </div>
                    <div className={styles.formGroup}>
                      <label><span>Gender <span style={{ color: 'red' }}>*</span></span></label>
                      <div className={styles.radioGroup}>
                        <label className={styles.radioLabel}><input type="radio" name="gender" checked={staffDetails?.gender === 'Male'} disabled={mode === 'view'} onChange={() => { handleChange("gender", "Male"); setErrors(p => ({ ...p, gender: null })); }} /> Male</label>
                        <label className={styles.radioLabel}><input type="radio" name="gender" checked={staffDetails?.gender === 'Female'} disabled={mode === 'view'} onChange={() => { handleChange("gender", "Female"); setErrors(p => ({ ...p, gender: null })); }} /> Female</label>
                        <label className={styles.radioLabel}><input type="radio" name="gender" checked={!['Male', 'Female'].includes(staffDetails?.gender) && !!staffDetails?.gender} disabled={mode === 'view'} onChange={() => { handleChange("gender", "Prefer Not to say"); setErrors(p => ({ ...p, gender: null })); }} /> Prefer Not to say</label>
                      </div>
                      {errors.gender && <span style={{ color: 'red', fontSize: '12px', marginTop: '-4px' }}>{errors.gender}</span>}
                    </div>
                    <div className={styles.formGroup}>
                      <label><span>Date of Birth <span style={{ color: 'red' }}>*</span></span></label>
                      <input type="date" value={staffDetails?.dateOfBirth?.split('T')[0] || ""} readOnly={mode === 'view'} onChange={(e) => { handleChange("dateOfBirth", e.target.value); setErrors(p => ({ ...p, dateOfBirth: null })); }} />
                      {errors.dateOfBirth && <span style={{ color: 'red', fontSize: '12px', marginTop: '-4px' }}>{errors.dateOfBirth}</span>}
                    </div>
                    <div className={styles.formGroup}>
                      <label><span>Branch assigned to <span style={{ color: 'red' }}>*</span></span></label>
                      <select value={selectedBranchId} disabled={mode === 'view'} onChange={(e) => { setSelectedBranchId(e.target.value); setErrors(p => ({ ...p, branchId: null })); }}>
                        <option value="">Choose here</option>
                        {branches && branches.map((branch) => (
                          <option key={branch.id || branch._id} value={branch.id || branch._id}>
                            {branch.branchName || branch.name || branch.id}
                          </option>
                        ))}
                      </select>
                      {errors.branchId && <span style={{ color: 'red', fontSize: '12px', marginTop: '-4px' }}>{errors.branchId}</span>}
                    </div>
                    <div className={styles.formGroup}>
                      <label><span>Role <span style={{ color: 'red' }}>*</span></span></label>
                      <select value={selectedRoleId} disabled={mode === 'view'} onChange={(e) => { handleRoleChange(e); setErrors(p => ({ ...p, roleId: null })); }}>
                        <option value="">Choose here</option>
                        {rolesList.map(role => (
                          <option key={role.id} value={role.id}>{role.roleName || role.name}</option>
                        ))}
                      </select>
                      {errors.roleId && <span style={{ color: 'red', fontSize: '12px', marginTop: '-4px' }}>{errors.roleId}</span>}
                    </div>
                  </div>

                  <div className={styles.sectionTitle}>Permission Details</div>
                  <table className={styles.permissionsTable}>
                    <thead>
                      <tr>
                        <th>Module</th>
                        <th>Service Name</th>
                        <th style={{ textAlign: 'center' }}>View</th>
                        <th style={{ textAlign: 'center' }}>Add / Edit</th>
                        <th style={{ textAlign: 'center' }}>Delete</th>
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
                            <td style={{ textAlign: 'center' }}>
                              {mode === "view" ? (perm.view ? <span className={styles.iconGreen}>✓</span> : <span className={styles.iconRed}>✕</span>) : (
                                <input type="checkbox" checked={perm.view} onChange={(e) => handlePermChange(index, "view", e.target.checked)} style={{ cursor: 'pointer', accentColor: '#000' }} />
                              )}
                            </td>
                            <td style={{ textAlign: 'center' }}>
                              {mode === "view" ? (perm.addEdit ? <span className={styles.iconGreen}>✓</span> : <span className={styles.iconRed}>✕</span>) : (
                                <input type="checkbox" checked={perm.addEdit} onChange={(e) => handlePermChange(index, "addEdit", e.target.checked)} style={{ cursor: 'pointer', accentColor: '#000' }} />
                              )}
                            </td>
                            <td style={{ textAlign: 'center' }}>
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
                      <label><span>Official Email ID <span style={{ color: 'red' }}>*</span></span></label>
                      <input type="email" placeholder="Enter Official Email ID" value={staffDetails?.email || ""} readOnly={mode === 'view'} onChange={(e) => { handleChange("email", e.target.value); setErrors(p => ({ ...p, email: null })); }} />
                      {errors.email && <span style={{ color: 'red', fontSize: '12px', marginTop: '-4px' }}>{errors.email}</span>}
                    </div>
                    <div className={styles.formGroup}>
                      <label>Personal Email ID <span className={styles.optional}>(Optional)</span></label>
                      <input type="email" placeholder="Enter Personal Email ID" value={staffDetails?.personalEmail || ""} readOnly={mode === 'view'} onChange={(e) => handleChange("personalEmail", e.target.value)} />
                    </div>
                    <div className={styles.formGroup}>
                      <label><span>Phone Number <span style={{ color: 'red' }}>*</span></span></label>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <div style={{ width: '120px' }}>
                          <SearchableCountryCode
                            countries={allCountries}
                            selectedCode={allCountries.find(c => c.dialCode === phoneDialCode)?.code || 'IN'}
                            onSelect={(code) => setPhoneDialCode(allCountries.find(c => c.code === code)?.dialCode || '+91')}
                          />
                        </div>
                        <input type="text" placeholder="Enter Phone Number" value={staffDetails?.phoneNumber || ""} readOnly={mode === 'view'} onChange={(e) => { handleChange("phoneNumber", e.target.value); setErrors(p => ({ ...p, phoneNumber: null })); }} style={{ flex: 1 }} />
                      </div>
                      {errors.phoneNumber && <span style={{ color: 'red', fontSize: '12px', marginTop: '4px' }}>{errors.phoneNumber}</span>}
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
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <div style={{ width: '120px' }}>
                          <SearchableCountryCode
                            countries={allCountries}
                            selectedCode={allCountries.find(c => c.dialCode === emergencyDialCode)?.code || 'IN'}
                            onSelect={(code) => setEmergencyDialCode(allCountries.find(c => c.code === code)?.dialCode || '+91')}
                          />
                        </div>
                        <input type="text" placeholder="Enter Phone Number" value={staffDetails?.emergencyContactPhone || ""} readOnly={mode === 'view'} onChange={(e) => handleChange("emergencyContactPhone", e.target.value)} style={{ flex: 1 }} />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "address" && (
                <div>
                  <div className={styles.sectionTitle}>Residential Address Details</div>
                  <div className={styles.formGrid}>
                    <div className={styles.formGroup}>
                      <label><span>Country <span style={{ color: 'red' }}>*</span></span></label>
                      <SearchableSelect
                        options={residentialCountryOptions}
                        value={residentialCountry}
                        onChange={(val) => { setResidentialCountry(val); setResidentialState(""); setResidentialCity(""); handleAddressChange("residentialAddress", "country", val); setErrors(p => ({ ...p, residentialCountry: null })); }}
                        placeholder="Select Country"
                        disabled={mode === 'view'}
                      />
                      {errors.residentialCountry && <span style={{ color: 'red', fontSize: '12px', marginTop: '-4px' }}>{errors.residentialCountry}</span>}
                    </div>
                    <div className={styles.formGroup}>
                      <label>State</label>
                      <SearchableSelect
                        options={residentialStateOptions}
                        value={residentialState}
                        onChange={(val) => { setResidentialState(val); setResidentialCity(""); handleAddressChange("residentialAddress", "state", val); }}
                        placeholder="Select State"
                        disabled={!residentialCountry || mode === 'view'}
                      />
                    </div>
                    <div className={styles.formGroup}>
                      <label>City</label>
                      <SearchableSelect
                        options={residentialCityOptions}
                        value={residentialCity}
                        onChange={(val) => { setResidentialCity(val); handleAddressChange("residentialAddress", "city", val); }}
                        placeholder="Select City"
                        disabled={!residentialState || mode === 'view'}
                      />
                    </div>
                    <div className={styles.formGroup}>
                      <label>Pin Code</label>
                      <input type="text" placeholder="500085" value={staffDetails?.residentialAddress?.pincode || ""} readOnly={mode === 'view'} onChange={(e) => handlePincodeChange("residentialAddress", e)} />
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
                  <div className={styles.checkboxWrap} style={{ marginTop: '16px', marginBottom: '32px' }}>
                    <input type="checkbox" checked={isSameAsResidential} onChange={handleSameAsResidentialChange} disabled={mode === 'view'} /> Mark this address as permanent address
                  </div>

                  <div className={styles.sectionTitle}>Permanent Address Details</div>
                  <div className={styles.formGrid}>
                    <div className={styles.formGroup}>
                      <label><span>Country <span style={{ color: 'red' }}>*</span></span></label>
                      <SearchableSelect
                        options={permanentCountryOptions}
                        value={permanentCountry}
                        onChange={(val) => { setPermanentCountry(val); setPermanentState(""); setPermanentCity(""); handleAddressChange("permanentAddress", "country", val); setErrors(p => ({ ...p, permanentCountry: null })); }}
                        placeholder="Select Country"
                        disabled={mode === 'view' || isSameAsResidential}
                      />
                      {errors.permanentCountry && <span style={{ color: 'red', fontSize: '12px', marginTop: '-4px' }}>{errors.permanentCountry}</span>}
                    </div>
                    <div className={styles.formGroup}>
                      <label>State</label>
                      <SearchableSelect
                        options={permanentStateOptions}
                        value={permanentState}
                        onChange={(val) => { setPermanentState(val); setPermanentCity(""); handleAddressChange("permanentAddress", "state", val); }}
                        placeholder="Select State"
                        disabled={!permanentCountry || mode === 'view' || isSameAsResidential}
                      />
                    </div>
                    <div className={styles.formGroup}>
                      <label>City</label>
                      <SearchableSelect
                        options={permanentCityOptions}
                        value={permanentCity}
                        onChange={(val) => { setPermanentCity(val); handleAddressChange("permanentAddress", "city", val); }}
                        placeholder="Select City"
                        disabled={!permanentState || mode === 'view' || isSameAsResidential}
                      />
                    </div>
                    <div className={styles.formGroup}>
                      <label>Pin Code</label>
                      <input type="text" placeholder="500085" value={staffDetails?.permanentAddress?.pincode || ""} readOnly={mode === 'view' || isSameAsResidential} onChange={(e) => handlePincodeChange("permanentAddress", e)} />
                    </div>
                    <div className={styles.formGroup}>
                      <label>Area, Street</label>
                      <input type="text" placeholder="KPHB Colony" value={staffDetails?.permanentAddress?.areaStreet || ""} readOnly={mode === 'view' || isSameAsResidential} onChange={(e) => handleAddressChange("permanentAddress", "areaStreet", e.target.value)} />
                    </div>
                    <div className={styles.formGroup}>
                      <label>Flat/House no.</label>
                      <input type="text" placeholder="Pragathi Enclave flat No. 106" value={staffDetails?.permanentAddress?.flatNo || ""} readOnly={mode === 'view' || isSameAsResidential} onChange={(e) => handleAddressChange("permanentAddress", "flatNo", e.target.value)} />
                    </div>
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

                  <datalist id="time-options">
                    {timeOptions.map(time => <option key={time} value={time} />)}
                  </datalist>

                  <div className={styles.workingHoursGrid}>
                    {['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map((day) => (
                      <div key={day} className={styles.workingHourRow}>
                        <div style={{ width: '120px', fontWeight: 500, fontSize: '14px', color: '#1a1a1a' }}>{day}</div>

                        <div className={styles.toggleWrap}>
                          <label className={styles.switch}>
                            <input
                              type="checkbox"
                              checked={workingHours[day].isNotAvailable}
                              onChange={(e) => {
                                const checked = e.target.checked;
                                setWorkingHours(prev => ({
                                  ...prev,
                                  [day]: { ...prev[day], isNotAvailable: checked }
                                }));
                              }}
                            />
                            <span className={`${styles.slider} ${styles.round}`}></span>
                          </label>
                          <span style={{ fontSize: '12px', color: '#888' }}>Not Available</span>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <input
                            type="time"
                            list="time-options"
                            className={styles.timeSelect}
                            value={workingHours[day].startTime}
                            disabled={workingHours[day].isNotAvailable}
                            style={{ opacity: workingHours[day].isNotAvailable ? 0.5 : 1, cursor: workingHours[day].isNotAvailable ? 'not-allowed' : 'auto' }}
                            onChange={(e) => setWorkingHours(prev => ({ ...prev, [day]: { ...prev[day], startTime: e.target.value } }))}
                          />
                          <span style={{ fontSize: '12px', color: '#666' }}>TO</span>
                          <input
                            type="time"
                            list="time-options"
                            className={styles.timeSelect}
                            value={workingHours[day].endTime}
                            disabled={workingHours[day].isNotAvailable}
                            style={{ opacity: workingHours[day].isNotAvailable ? 0.5 : 1, cursor: workingHours[day].isNotAvailable ? 'not-allowed' : 'auto' }}
                            onChange={(e) => setWorkingHours(prev => ({ ...prev, [day]: { ...prev[day], endTime: e.target.value } }))}
                          />
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className={styles.sectionTitle}>Additional Settings</div>

                  <div className={styles.settingsGroup}>
                    <div className={styles.settingsLabel}>No of Paid Leaves For Month</div>
                    <div style={{ display: 'flex', gap: '24px' }}>
                      <label className={styles.checkboxLabel}><input type="radio" name="noOfPaidLeaves" defaultChecked /> 02 days</label>
                      <label className={styles.checkboxLabel}><input type="radio" name="noOfPaidLeaves" /> 04 days</label>
                      <label className={styles.checkboxLabel}><input type="radio" name="noOfPaidLeaves" /> Every Saturday</label>
                    </div>
                  </div>

                  <div className={styles.settingsGroup}>
                    <label className={styles.checkboxLabel}><input type="checkbox" /> Allow for Extra Working Hours</label>
                  </div>

                  <div className={styles.settingsGroup}>
                    <div className={styles.settingsLabel}>Salary Type</div>
                    <div style={{ display: 'flex', gap: '24px' }}>
                      <label className={styles.checkboxLabel}><input type="radio" name="salaryType" defaultChecked /> Day Wise</label>
                      <label className={styles.checkboxLabel}><input type="radio" name="salaryType" /> Month Wise</label>
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
                if (activeTab === "personal") {
                  const newErrors = {};
                  if (!staffDetails?.firstName && !staffDetails?.staffName) newErrors.firstName = "First Name is required";
                  if (!staffDetails?.lastName) newErrors.lastName = "Last Name is required";
                  if (!staffDetails?.gender) newErrors.gender = "Gender is required";
                  if (!staffDetails?.dateOfBirth) newErrors.dateOfBirth = "Date of Birth is required";
                  if (!selectedBranchId) newErrors.branchId = "Branch assigned to is required";
                  if (!selectedRoleId) newErrors.roleId = "Role is required";
                  if (!staffDetails?.email) newErrors.email = "Official Email ID is required";
                  if (!staffDetails?.phoneNumber) newErrors.phoneNumber = "Phone Number is required";

                  if (Object.keys(newErrors).length > 0) {
                    setErrors(newErrors);
                    return;
                  }
                  setErrors({});
                  setActiveTab("address");
                }
                else if (activeTab === "address") {
                  const newErrors = {};
                  if (!residentialCountry) newErrors.residentialCountry = "Residential Country is required";
                  if (!isSameAsResidential && !permanentCountry) newErrors.permanentCountry = "Permanent Country is required";

                  if (Object.keys(newErrors).length > 0) {
                    setErrors(newErrors);
                    return;
                  }
                  setErrors({});
                  setActiveTab("experience");
                }
                else {
                  try {
                    setLoading(true);

                    const formatAddress = (addr) => {
                      if (!addr) return {};
                      const parts = [addr.flatNo, addr.areaStreet, addr.city, addr.state, addr.country, addr.pincode].filter(Boolean);
                      return {
                        ...addr,
                        addressText: parts.join(", ")
                      };
                    };

                    const formattedWorkingHours = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map(day => {
                      const data = workingHours[day];
                      if (data.isNotAvailable) {
                        return { day, isAvailable: false };
                      }
                      return { day, isAvailable: true, startTime: data.startTime, endTime: data.endTime };
                    });

                    const basePayload = {
                      firstName: staffDetails?.firstName || staffDetails?.staffName,
                      lastName: staffDetails?.lastName || "",
                      gender: staffDetails?.gender,
                      password: staffDetails?.password || "123456",
                      email: staffDetails?.email,
                      personalEmail: staffDetails?.personalEmail,
                      phoneNumber: staffDetails?.phoneNumber ? (staffDetails.phoneNumber.startsWith("+") ? staffDetails.phoneNumber : `${phoneDialCode}${staffDetails.phoneNumber}`.trim()) : "",
                      emergencyContactName: staffDetails?.emergencyContactName,
                      emergencyContactRelation: staffDetails?.emergencyContactRelation,
                      emergencyContactPhone: staffDetails?.emergencyContactPhone ? (staffDetails.emergencyContactPhone.startsWith("+") ? staffDetails.emergencyContactPhone : `${emergencyDialCode}${staffDetails.emergencyContactPhone}`.trim()) : "",
                      role: rolesList.find(r => r.id === parseInt(selectedRoleId) || r.id === selectedRoleId)?.roleName || "STORE MANAGER",
                      roleId: parseInt(selectedRoleId),
                      branchId: parseInt(selectedBranchId),
                      residentialAddress: formatAddress(staffDetails?.residentialAddress),
                      permanentAddress: formatAddress(staffDetails?.permanentAddress),
                      leavesPerYear: parseInt(staffDetails?.leavesPerYear) || 12,
                      noOfPaidLeaves: staffDetails?.noOfPaidLeaves || "02 days",
                      allowExtraWorkingHours: staffDetails?.allowExtraWorkingHours || false,
                      salaryType: staffDetails?.salaryType || "Month Wise",
                      checkInGeoLocation: staffDetails?.checkInGeoLocation !== undefined ? staffDetails?.checkInGeoLocation : true,
                      workingHours: formattedWorkingHours,
                      permissions: staffPermissions || []
                    };

                    const payload = Object.assign(
                      basePayload,
                      staffDetails?.dateOfBirth ? dateOnlyWithTimeZone('dateOfBirth', staffDetails?.dateOfBirth) : {}
                    );

                    let newGroomerId = null;

                    if (mode === "edit" && staffId) {
                      await updateStaffDetails(staffId, payload);
                      newGroomerId = staffId;
                    } else {
                      const res = await addBranchStaff(payload);
                      const resData = res?.data || res || {};
                      newGroomerId = resData.groomerID || resData.id || resData.userId || resData.staffId || null;
                    }

                    if (newGroomerId && payload.role && payload.role.toLowerCase() === 'groomer') {
                      const daysOrder = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
                      const workingDaysList = daysOrder.filter(d => !workingHours[d]?.isNotAvailable);
                      const exceptDaysList = daysOrder.filter(d => workingHours[d]?.isNotAvailable);
                      
                      const slotsPayload = {
                        branchId: parseInt(selectedBranchId),
                        groomerID: parseInt(newGroomerId),
                        days: 7,
                        fromDay: workingDaysList.length > 0 ? workingDaysList[0] : "Monday",
                        toDay: workingDaysList.length > 0 ? workingDaysList[workingDaysList.length - 1] : "Friday",
                        except: exceptDaysList.length > 0 ? exceptDaysList.join(", ") : "None"
                      };
                      
                      try {
                        await generateGroomerSlots(slotsPayload);
                        console.log("Slots generated successfully");
                      } catch (slotErr) {
                        console.error("Failed to generate slots:", slotErr);
                      }
                    }

                    // On success, close or show toast
                    toast.success(`Staff ${mode === "edit" ? "updated" : "added"} successfully!`);
                    onClose();
                  } catch (error) {
                    console.error(`Failed to ${mode} staff:`, error);
                  } finally {
                    setLoading(false);
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
