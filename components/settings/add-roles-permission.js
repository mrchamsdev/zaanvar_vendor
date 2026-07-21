import React, { useState, useEffect } from "react";
import styles from "../../styles/settings/roles-permission.module.css";
import { getVendorModules, createRole, updateRole, getAssignedPersons } from "../../services/rolesService";
import useDashboardData from "../dashboard/useDashboardData";
import { toast } from "sonner";

const AddRolesPermission = ({ show, onClose, mode = "view", initialData = null }) => {
  const [isMaximized, setIsMaximized] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [modulesList, setModulesList] = useState([]);

  const [roleName, setRoleName] = useState("");
  const [description, setDescription] = useState("");
  const [permissions, setPermissions] = useState([]);
  const [assignedPersons, setAssignedPersons] = useState([]);
  const [loading, setLoading] = useState(false);

  const { branchId, userInfo } = useDashboardData({ skipReviews: true }) || {};

  useEffect(() => {
    if (show) {
      getVendorModules().then(res => {
        setModulesList(res?.data || res || []);
      }).catch(err => console.error(err));
    }
  }, [show]);


  useEffect(() => {
    if (show) {
      setRoleName(initialData?.roleName || "");
      setDescription(initialData?.description || "");
      setAssignedPersons(initialData?.assignedPersons || []);

      if (mode === "view") {
        setPermissions(initialData?.permissions || []);
      } else if (modulesList.length > 0) {
        const defaultPerms = modulesList.flatMap(mod => {
          const name = mod.name || mod.module || mod;
          const subModules = mod.subModules || [];

          if (subModules.length > 0) {
            return subModules.map(sub => {
              const subName = sub.name || sub;
              const existing = initialData?.permissions?.find(p => p.module === name && p.serviceName === subName);
              return existing ? { ...existing } : { module: name, serviceName: subName, view: false, addEdit: false, delete: false };
            });
          } else {
            const existing = initialData?.permissions?.find(p => p.module === name);
            return existing ? { ...existing } : { module: name, serviceName: "", view: false, addEdit: false, delete: false };
          }
        });
        setPermissions(defaultPerms);
      } else if (!initialData) {
        setPermissions([]);
      }
    }
  }, [show, initialData, modulesList, mode]);

  if (!show) return null;

  const handleSave = async () => {
    if (!roleName) return toast?.error ? toast.error("Role Name is required") : alert("Role Name is required");

    setLoading(true);
    try {
      const allPermissionsWithNoAccess = permissions.map(p => ({
        ...p,
        noAccess: !p.view && !p.addEdit && !p.delete
      }));

      const payload = {
        branchId: parseInt(branchId) || 1,
        companyId: userInfo?.companyId || 1,
        roleName,
        description,
        permissions: allPermissionsWithNoAccess
      };

      let res;
      if (initialData?.id) {
        res = await updateRole(initialData.id, payload);
      } else {
        res = await createRole(payload);
      }

      if (res?.status === "success" || res?.statusCode === 200 || res?.id) {
        toast?.success ? toast.success("Role saved successfully!") : alert("Role saved successfully!");
        onClose();
      } else {
        toast?.error ? toast.error(res?.message || "Failed to save") : alert(res?.message || "Failed to save");
      }
    } catch (error) {
      console.error(error);
      toast?.error ? toast.error("An error occurred") : alert("An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handlePermChange = (index, field, value) => {
    const newPerms = [...permissions];
    newPerms[index][field] = value;
    setPermissions(newPerms);
  };

  // No need for addPermRow since all modules are pre-populated



  return (
    <div className={styles.modalOverlay} style={isMinimized ? { background: 'transparent', pointerEvents: 'none' } : {}}>
      <div
        className={`${styles.modalContent} ${isMaximized ? styles.modalContentMaximized : ''} ${isMinimized ? styles.modalContentMinimized : ''}`}
        style={isMinimized ? { pointerEvents: 'auto', width: '300px' } : {}}
      >
        {/* Header */}
        <div className={styles.modalHeader}>
          <h2>Add Roles & Permission</h2>
          <div className={styles.modalControls}>
            <span onClick={() => setIsMinimized(!isMinimized)} title="Minimize">{isMinimized ? '+' : '—'}</span>
            <span onClick={() => { setIsMaximized(!isMaximized); setIsMinimized(false); }} title="Maximize">□</span>
            <span onClick={onClose} title="Close">✕</span>
          </div>
        </div>

        {!isMinimized && (
          <>
            <div className={styles.modalBody}>
              {/* Left Column: Roles & permission Details */}
              <div>
                <div className={styles.sectionTitle}>Roles & permission Details</div>

                <div className={styles.roleDetailsBox}>
                  <span className={styles.roleLabel}>Role Name</span>
                  {mode === "view" ? (
                    <span className={styles.roleValue}>{roleName || "-"}</span>
                  ) : (
                    <input
                      type="text"
                      className={styles.roleInput}
                      placeholder="Enter Role Name"
                      value={roleName}
                      onChange={e => setRoleName(e.target.value)}
                    />
                  )}
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
                    {permissions.map((perm, index) => (
                      <tr key={index}>
                        <td style={{ color: '#aaa', fontWeight: 500 }}>
                          {perm.module || "-"}
                        </td>
                        <td>
                          <span style={{ color: mode === "view" ? '#aaa' : '#555', fontWeight: mode === "view" ? 'normal' : 500 }}>
                            {perm.serviceName || "-"}
                          </span>
                        </td>
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
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Right Column: Roles Assigned Persons */}
              <div>
                <div className={styles.sectionTitle}>Roles Assigned Presons</div>
                <div className={styles.assignedPersonsBox}>
                  {assignedPersons.map((person, idx) => (
                    <div key={idx} className={styles.personRow}>
                      <div className={styles.personInfo}>
                        <div className={styles.personIcon}>
                          <img src={person.profileImage || `https://ui-avatars.com/api/?name=${person.name}`} alt="Profile" style={{ width: '100%', height: '100%', borderRadius: '50%' }} />
                        </div>
                        <span className={styles.personName}>{person.name}</span>
                      </div>
                      <span className={styles.personPhone}>{person.phoneNumber}</span>
                    </div>
                  ))}
                  {assignedPersons.length === 0 && (
                    <div style={{ color: '#aaa', padding: '12px', textAlign: 'center' }}>No persons assigned yet.</div>
                  )}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className={styles.modalFooter}>
              <button className={styles.btnCancel} onClick={onClose}>Cancel</button>
              {mode !== "view" && (
                <button className={styles.btnSave} onClick={handleSave} disabled={loading}>
                  {loading ? "Saving..." : "Save"}
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default AddRolesPermission;
