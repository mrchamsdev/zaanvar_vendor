import React, { useState, useEffect } from "react";
import styles from "../../styles/vendor-settings/settings.module.css";
import useStore from "../../components/state/useStore";
import useDashboardData from "../../components/dashboard/useDashboardData";
import {
  getTaxRates,
  createTaxRate,
  updateTaxRate,
  deleteTaxRate,
  getTaxGroups,
  createTaxGroup,
  updateTaxGroup,
  deleteTaxGroup
} from "../../services/settingsService";
import { toast } from "sonner";

const InfoIcon = ({ tip }) => {
  const [visible, setVisible] = React.useState(false);
  const [showBelow, setShowBelow] = React.useState(false);
  const [alignRight, setAlignRight] = React.useState(false);
  if (!tip) return null;

  const handleMouseEnter = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    if (rect.top < window.innerHeight * 0.5) {
      setShowBelow(true);
    } else {
      setShowBelow(false);
    }

    const windowWidth = window.innerWidth;
    const distanceToRight = windowWidth - rect.left;
    if (distanceToRight < 240) {
      setAlignRight(true);
    } else {
      setAlignRight(false);
    }

    setVisible(true);
  };

  const formattedContent = tip.split("\n\n").map((paragraph, index) => {
    const lines = paragraph.split("\n");
    return (
      <div key={index} style={{ marginBottom: index === lines.length - 1 ? 0 : '12px' }}>
        {lines.map((line, lIndex) => {
          const isHeader = line.endsWith("?") || line === "What is this?" || line === "Why use it?" || line === "Why to use?" || line === "How it is used?" || line === "Why use?" || line.startsWith("GSTIN Number") || line.startsWith("Business Currency");
          return (
            <div key={lIndex} style={{ 
              fontWeight: isHeader ? '700' : '400',
              fontSize: isHeader ? '13px' : '12px',
              color: isHeader ? '#fff' : '#e5e7eb',
              lineHeight: '1.5',
              marginBottom: isHeader ? '4px' : '0'
            }}>
              {line}
            </div>
          );
        })}
      </div>
    );
  });

  return (
    <span 
      className={styles.infoIconWrapper}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={() => setVisible(false)}
      style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', cursor: 'help' }}
    >
      <span className={styles.infoIcon}>
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block' }}>
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="16" x2="12" y2="12" />
          <line x1="12" y1="8" x2="12.01" y2="8" />
        </svg>
      </span>
      {visible && (
        <div className={`${showBelow ? styles.customTooltipBelow : styles.customTooltip} ${alignRight ? styles.alignRight : ''}`}>
          {formattedContent}
          <div className={showBelow ? styles.tooltipArrowBelow : styles.tooltipArrow}></div>
        </div>
      )}
    </span>
  );
};

const EditIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
  </svg>
);

const TrashIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
    <path d="M10 11v6M14 11v6M9 6V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2" />
  </svg>
);

const TaxesGSTSettings = ({ settings, onChange, addEdit = true, canDelete = true }) => {
  const g = settings;
  const { jwtToken } = useStore();
  const { branchId } = useDashboardData({ skipReviews: true });

  const [showTaxList, setShowTaxList] = useState(false);

  // API tax rates state
  const [apiTaxRates, setApiTaxRates] = useState([]);
  const [loadingRates, setLoadingRates] = useState(false);

  // API tax groups state
  const [apiTaxGroups, setApiTaxGroups] = useState([]);
  const [loadingGroups, setLoadingGroups] = useState(false);

  // Modals visibility
  const [showAddRate, setShowAddRate] = useState(false);
  const [showAddGroup, setShowAddGroup] = useState(false);
  const [editingRate, setEditingRate] = useState(null);
  const [editingGroup, setEditingGroup] = useState(null);

  // Delete rate confirmation states
  const [rateToDelete, setRateToDelete] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Delete group confirmation states
  const [groupToDelete, setGroupToDelete] = useState(null);
  const [showGroupDeleteConfirm, setShowGroupDeleteConfirm] = useState(false);

  // Modal form states
  const [rateName, setRateName] = useState("");
  const [rateValue, setRateValue] = useState("");
  const [rateType, setRateType] = useState("Other");

  const [groupName, setGroupName] = useState("");
  const [selectedGroupRates, setSelectedGroupRates] = useState([]);

  // Fetch Tax Rates from API
  const fetchRates = async () => {
    if (!jwtToken || !branchId) return;
    setLoadingRates(true);
    try {
      const res = await getTaxRates(jwtToken, branchId);
      const payload = res?.data || res;
      const rawRates = Array.isArray(payload) ? payload : (payload?.data || payload?.taxes || []);
      const mappedRates = rawRates.map((r) => ({
        ...r,
        id: r.taxTableId || r.id,
        value: parseFloat(r.value) || 0,
      }));
      setApiTaxRates(mappedRates);
    } catch (err) {
      console.error("Failed to fetch tax rates:", err);
    } finally {
      setLoadingRates(false);
    }
  };

  // Fetch Tax Groups from API
  const fetchGroups = async () => {
    if (!jwtToken || !branchId) return;
    setLoadingGroups(true);
    try {
      const res = await getTaxGroups(jwtToken, branchId);
      const payload = res?.data || res;
      const rawGroups = Array.isArray(payload) ? payload : (payload?.data || payload?.taxGroups || []);
      const mappedGroups = rawGroups.map((group) => ({
        ...group,
        id: group.taxGroupId || group.id,
        rates: group.taxTableId || group.rates || [],
      }));
      setApiTaxGroups(mappedGroups);
    } catch (err) {
      console.error("Failed to fetch tax groups:", err);
    } finally {
      setLoadingGroups(false);
    }
  };

  const refreshList = () => {
    fetchRates();
    fetchGroups();
  };

  useEffect(() => {
    if (showTaxList) {
      refreshList();
    }
  }, [showTaxList, jwtToken, branchId]);

  const toggle = (field) => (e) => {
    onChange({ ...g, [field]: e.target.checked });
  };

  // Tax Rate Actions
  const handleOpenAddRate = () => {
    setEditingRate(null);
    setRateName("");
    setRateValue("");
    setRateType("Other");
    setShowAddRate(true);
  };

  const handleOpenEditRate = (rate) => {
    setEditingRate(rate);
    setRateName(rate.name);
    setRateValue(rate.value);
    setRateType(rate.taxType || rate.type || "Other");
    setShowAddRate(true);
  };

  const handleSaveRate = async () => {
    if (!rateName.trim()) return;
    const valueNum = parseFloat(rateValue) || 0;
    try {
      const payload = {
        name: rateName,
        value: valueNum,
        taxType: rateType,
      };

      if (editingRate && editingRate.id) {
        // PUT /api/vendor/taxes/:id
        await updateTaxRate(jwtToken, editingRate.id, payload);
        toast.success("Tax rate updated successfully!");
      } else {
        // POST /api/vendor/taxes
        const createPayload = {
          ...payload,
          branchId: parseInt(branchId),
        };
        await createTaxRate(jwtToken, createPayload);
        toast.success("Tax rate saved successfully!");
      }
      fetchRates();
      setShowAddRate(false);
      setEditingRate(null);
    } catch (err) {
      console.error("Failed to save tax rate:", err);
      toast.error("Failed to save tax rate");
    }
  };

  const confirmDeleteRate = (rate) => {
    setRateToDelete(rate);
    setShowDeleteConfirm(true);
  };

  const handleDeleteConfirm = async () => {
    if (!rateToDelete) return;
    try {
      const res = await deleteTaxRate(jwtToken, rateToDelete.id);
      const data = res?.data || res;
      if (data?.status === "fail" || data?.status === "error") {
        toast.error(data.message || "Cannot delete tax rate");
      } else {
        toast.success("Tax rate deleted successfully");
        fetchRates();
      }
    } catch (err) {
      const serverMsg = err?.response?.data?.message || err?.message;
      console.error("Failed to delete tax rate:", err);
      toast.error(serverMsg || "Failed to delete tax rate");
    } finally {
      setShowDeleteConfirm(false);
      setRateToDelete(null);
    }
  };

  // Tax Group Actions
  const handleOpenAddGroup = () => {
    setEditingGroup(null);
    setGroupName("");
    setSelectedGroupRates([]);
    setShowAddGroup(true);
  };

  const handleOpenEditGroup = (group) => {
    setEditingGroup(group);
    setGroupName(group.name);
    // Support either array of taxTableIds or rates
    setSelectedGroupRates(group.rates || group.taxTableId || []);
    setShowAddGroup(true);
  };

  const handleSaveGroup = async () => {
    if (!groupName.trim()) return;
    try {
      const payload = {
        name: groupName,
        taxTableId: selectedGroupRates, // Array of selected Tax Rate IDs
      };

      if (editingGroup && editingGroup.id) {
        // PUT /api/vendor/tax-groups/:id
        await updateTaxGroup(jwtToken, editingGroup.id, payload);
        toast.success("Tax group updated successfully!");
      } else {
        // POST /api/vendor/tax-groups
        const createPayload = {
          ...payload,
          branchId: parseInt(branchId),
        };
        await createTaxGroup(jwtToken, createPayload);
        toast.success("Tax group saved successfully!");
      }
      fetchGroups();
      setShowAddGroup(false);
      setEditingGroup(null);
    } catch (err) {
      console.error("Failed to save tax group:", err);
      toast.error("Failed to save tax group");
    }
  };

  const confirmDeleteGroup = (group) => {
    setGroupToDelete(group);
    setShowGroupDeleteConfirm(true);
  };

  const handleDeleteGroupConfirm = async () => {
    if (!groupToDelete) return;
    try {
      const res = await deleteTaxGroup(jwtToken, groupToDelete.id);
      const data = res?.data || res;
      if (data?.status === "fail" || data?.status === "error") {
        toast.error(data.message || "Cannot delete tax group");
      } else {
        toast.success("Tax group deleted successfully");
        fetchGroups();
      }
    } catch (err) {
      const serverMsg = err?.response?.data?.message || err?.message;
      console.error("Failed to delete tax group:", err);
      toast.error(serverMsg || "Failed to delete tax group");
    } finally {
      setShowGroupDeleteConfirm(false);
      setGroupToDelete(null);
    }
  };

  const handleToggleGroupRate = (rateId) => {
    const rateIdNum = Number(rateId);
    if (selectedGroupRates.includes(rateIdNum)) {
      setSelectedGroupRates(selectedGroupRates.filter((id) => id !== rateIdNum));
    } else {
      setSelectedGroupRates([...selectedGroupRates, rateIdNum]);
    }
  };

  const getGroupComponentText = (group) => {
    const ratesArray = group.rates || group.taxTableId || [];
    const selected = ratesArray
      .map((rId) => apiTaxRates.find((r) => Number(r.id) === Number(rId)))
      .filter(Boolean);
    if (selected.length === 0) {
      return "No taxes selected";
    }
    return selected.map((r) => r.name).join("    ");
  };

  const isGstEnabled = g.enableGst ?? g.enableGST ?? true;

  return (
    <div className={styles.threeColGrid} style={{ gridTemplateColumns: showTaxList ? "1fr 1fr 1fr" : "1fr", transition: "grid-template-columns 0.3s ease" }}>
      {/* ── GST Settings ── */}
      <div className={styles.card} style={{ maxWidth: showTaxList ? "none" : "480px" }}>
        <div className={styles.cardTitle}>GST Settings</div>

        <div className={styles.checkRow}>
          <input
            id="enableGST"
            type="checkbox"
            className={styles.checkInput}
            checked={isGstEnabled}
            onChange={(e) => onChange({ ...g, enableGst: e.target.checked })}
          />
          <label htmlFor="enableGST" className={styles.checkLabel}>Enable GST</label>
          <InfoIcon tip={`What is this?\nGST stands for Goods and Services Tax of the Government of India. Enabling GST allows you to apply GST to Sales, Purchases, and other types of transactions.\n\nHow it is used?\nApply GST to Sale and/or Purchase invoices. You can also generate GST reports for tax f iling.\n\nWhy to use?\nBusinesses with a GSTIN and registered under the Regular or Composition scheme can enable GST. Zaanvar generates ready-made GST reports such as GSTR-1 and GSTR-3B to simplify GST filing in India.`} />
        </div>




        <div style={{ marginTop: 16 }}>
          <button className={styles.btnLink} type="button" onClick={() => setShowTaxList(!showTaxList)}>
            Tax List
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ transform: showTaxList ? "rotate(90deg)" : "none", transition: "transform 0.2s", marginLeft: 4 }}>
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>
        </div>
      </div>

      {/* ── Tax Rates ── */}
      {showTaxList && (
        <div className={styles.card}>
          <div className={styles.cardTitle} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              Tax Rates
              {addEdit && (
              <button
                type="button"
                onClick={handleOpenAddRate}
                style={{ border: "none", background: "transparent", cursor: "pointer", display: "flex", alignItems: "center", padding: 0 }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#bbb" strokeWidth="2" style={{ transition: "stroke 0.2s" }} onMouseEnter={(e) => e.currentTarget.setAttribute("stroke", "#e9315d")} onMouseLeave={(e) => e.currentTarget.setAttribute("stroke", "#bbb")}>
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="16" />
                  <line x1="8" y1="12" x2="16" y2="12" />
                </svg>
              </button>
              )}
            </div>
          </div>

          {loadingRates ? (
            <div style={{ color: "#aaa", fontSize: 13, padding: "8px 0" }}>Loading...</div>
          ) : apiTaxRates.length === 0 ? (
            <div style={{ color: "#aaa", fontSize: 13, padding: "8px 0" }}>No tax rates added.</div>
          ) : (
            apiTaxRates.map((rate) => (
              <div key={rate.id} className={styles.listRow}>
                <div>{rate.name}</div>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <span style={{ fontWeight: 600, fontSize: 13 }}>{rate.value}</span>
                  <div className={styles.listRowActions}>
                    {addEdit && (
                    <div onClick={() => handleOpenEditRate(rate)} style={{ cursor: "pointer", display: "inline-flex" }}>
                      <EditIcon />
                    </div>
                    )}
                    {canDelete && (
                    <div onClick={() => confirmDeleteRate(rate)} style={{ cursor: "pointer", display: "inline-flex" }}>
                      <TrashIcon />
                    </div>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* ── Tax Groups ── */}
      {showTaxList && (
        <div className={styles.card}>
          <div className={styles.cardTitle} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              Tax Group
              {addEdit && (
              <button
                type="button"
                onClick={handleOpenAddGroup}
                style={{ border: "none", background: "transparent", cursor: "pointer", display: "flex", alignItems: "center", padding: 0 }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#bbb" strokeWidth="2" style={{ transition: "stroke 0.2s" }} onMouseEnter={(e) => e.currentTarget.setAttribute("stroke", "#e9315d")} onMouseLeave={(e) => e.currentTarget.setAttribute("stroke", "#bbb")}>
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="16" />
                  <line x1="8" y1="12" x2="16" y2="12" />
                </svg>
              </button>
              )}
            </div>
            <button
              type="button"
              onClick={() => setShowTaxList(false)}
              style={{ border: "none", background: "transparent", cursor: "pointer", display: "flex", alignItems: "center", padding: 0 }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#999" strokeWidth="2" style={{ transition: "stroke 0.2s" }} onMouseEnter={(e) => e.currentTarget.setAttribute("stroke", "#333")} onMouseLeave={(e) => e.currentTarget.setAttribute("stroke", "#999")}>
                <circle cx="12" cy="12" r="10" fill="#f0f0f0" stroke="none" />
                <path d="M15 9l-6 6M9 9l6 6" stroke="#999" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </button>
          </div>

          {loadingGroups ? (
            <div style={{ color: "#aaa", fontSize: 13, padding: "8px 0" }}>Loading...</div>
          ) : apiTaxGroups.length === 0 ? (
            <div style={{ color: "#aaa", fontSize: 13, padding: "8px 0" }}>No tax groups added.</div>
          ) : (
            apiTaxGroups.map((group) => (
              <div key={group.id} className={styles.listRow}>
                <div>
                  <div style={{ fontWeight: 600 }}>{group.name}</div>
                  <div className={styles.listRowSub}>{getGroupComponentText(group)}</div>
                </div>
                <div className={styles.listRowActions}>
                  {addEdit && (
                  <div onClick={() => handleOpenEditGroup(group)} style={{ cursor: "pointer", display: "inline-flex" }}>
                    <EditIcon />
                  </div>
                  )}
                  {canDelete && (
                  <div onClick={() => confirmDeleteGroup(group)} style={{ cursor: "pointer", display: "inline-flex" }}>
                    <TrashIcon />
                  </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* ── Add/Edit Tax Rate Modal ── */}
      {showAddRate && (
        <div className={styles.modalOverlay} style={{ zIndex: 1100 }}>
          <div className={styles.modalContent} style={{ maxWidth: "420px", width: "100%", padding: 0, borderRadius: "8px", overflow: "hidden" }}>
            <div className={styles.modalHeader} style={{ padding: "16px 20px", borderBottom: "1px solid #eee", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h3 className={styles.modalTitle} style={{ margin: 0, fontSize: "16px", fontWeight: "700" }}>
                {editingRate ? "Edit Tax Rate" : "Add Tax Rate"}
              </h3>
              <button className={styles.closeBtn} onClick={() => setShowAddRate(false)} style={{ border: "none", background: "transparent", fontSize: "20px", cursor: "pointer", padding: 0, color: "#999" }}>×</button>
            </div>

            <div style={{ padding: "20px" }}>
              <div style={{ marginBottom: "16px" }}>
                <input
                  type="text"
                  placeholder="Tax Name"
                  value={rateName}
                  onChange={(e) => setRateName(e.target.value)}
                  style={{ width: "100%", padding: "10px 12px", border: "1px solid #ddd", borderRadius: "6px", fontSize: "14px", boxSizing: "border-box" }}
                />
              </div>

              <div style={{ display: "flex", gap: "12px", marginBottom: "20px" }}>
                <input
                  type="number"
                  placeholder="Rate"
                  value={rateValue}
                  onChange={(e) => setRateValue(e.target.value)}
                  style={{ flex: 1, padding: "10px 12px", border: "1px solid #ddd", borderRadius: "6px", fontSize: "14px", boxSizing: "border-box" }}
                />
                <select
                  value={rateType}
                  onChange={(e) => setRateType(e.target.value)}
                  style={{ width: "110px", padding: "10px 12px", border: "1px solid #ddd", borderRadius: "6px", fontSize: "14px", background: "#fff", cursor: "pointer" }}
                >
                  <option value="Other">Other</option>
                  <option value="IGST">IGST</option>
                  <option value="SGST">SGST</option>
                  <option value="CGST">CGST</option>
                </select>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", borderTop: "1px solid #eee", paddingTop: "16px" }}>
                <button
                  type="button"
                  onClick={() => setShowAddRate(false)}
                  style={{ padding: "8px 24px", background: "#fff", border: "1px solid #e9315d", borderRadius: "6px", color: "#e9315d", fontSize: "14px", fontWeight: "600", cursor: "pointer" }}
                >
                  CANCEL
                </button>
                <button
                  type="button"
                  onClick={handleSaveRate}
                  style={{ padding: "8px 24px", background: "#e9315d", border: "1.5px solid #e9315d", borderRadius: "6px", color: "#fff", fontSize: "14px", fontWeight: "600", cursor: "pointer" }}
                >
                  SAVE
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Add/Edit Tax Group Modal ── */}
      {showAddGroup && (
        <div className={styles.modalOverlay} style={{ zIndex: 1100 }}>
          <div className={styles.modalContent} style={{ maxWidth: "420px", width: "100%", padding: 0, borderRadius: "8px", overflow: "hidden" }}>
            <div className={styles.modalHeader} style={{ padding: "16px 20px", borderBottom: "1px solid #eee", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h3 className={styles.modalTitle} style={{ margin: 0, fontSize: "16px", fontWeight: "700" }}>
                {editingGroup ? "Edit Tax Group" : "Add Tax Group"}
              </h3>
              <button className={styles.closeBtn} onClick={() => setShowAddGroup(false)} style={{ border: "none", background: "transparent", fontSize: "20px", cursor: "pointer", padding: 0, color: "#999" }}>×</button>
            </div>

            <div style={{ padding: "20px" }}>
              <div style={{ marginBottom: "16px" }}>
                <input
                  type="text"
                  placeholder="Enter Group Name"
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  style={{ width: "100%", padding: "10px 12px", border: "1px solid #ddd", borderRadius: "6px", fontSize: "14px", boxSizing: "border-box" }}
                />
              </div>

              <div style={{ marginBottom: "16px" }}>
                <div style={{ display: "block", fontSize: "13px", fontWeight: "600", marginBottom: "8px", color: "#333" }}>Select Taxes</div>
                <div style={{ maxHeight: "200px", overflowY: "auto", border: "1px solid #eee", borderRadius: "6px", padding: "8px" }}>
                  {apiTaxRates.map((rate) => (
                    <div key={rate.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 4px", borderBottom: "1px solid #f9f9f9" }}>
                      <span style={{ fontSize: "13px", color: "#333" }}>{rate.name}</span>
                      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <span style={{ fontSize: "12px", color: "#666" }}>{rate.value}%</span>
                        <input
                          type="checkbox"
                          checked={selectedGroupRates.includes(Number(rate.id))}
                          onChange={() => handleToggleGroupRate(rate.id)}
                          style={{ cursor: "pointer", accentColor: "#e9315d", width: "16px", height: "16px" }}
                        />
                      </div>
                    </div>
                  ))}
                  {apiTaxRates.length === 0 && (
                    <div style={{ fontSize: "12px", color: "#aaa", padding: "8px" }}>Please add tax rates first.</div>
                  )}
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", borderTop: "1px solid #eee", paddingTop: "16px" }}>
                <button
                  type="button"
                  onClick={() => setShowAddGroup(false)}
                  style={{ padding: "8px 24px", background: "#fff", border: "1px solid #e9315d", borderRadius: "6px", color: "#e9315d", fontSize: "14px", fontWeight: "600", cursor: "pointer" }}
                >
                  CANCEL
                </button>
                <button
                  type="button"
                  onClick={handleSaveGroup}
                  style={{ padding: "8px 24px", background: "#e9315d", border: "1.5px solid #e9315d", borderRadius: "6px", color: "#fff", fontSize: "14px", fontWeight: "600", cursor: "pointer" }}
                >
                  SAVE
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete Confirmation Modal ── */}
      {showDeleteConfirm && (
        <div className={styles.modalOverlay} style={{ zIndex: 1200 }}>
          <div className={styles.modalContent} style={{ maxWidth: "360px", width: "100%", padding: 0, borderRadius: "8px", overflow: "hidden" }}>
            <div className={styles.modalHeader} style={{ padding: "16px 20px", borderBottom: "1px solid #eee", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h3 className={styles.modalTitle} style={{ margin: 0, fontSize: "16px", fontWeight: "700" }}>Confirm Delete</h3>
              <button className={styles.closeBtn} onClick={() => setShowDeleteConfirm(false)} style={{ border: "none", background: "transparent", fontSize: "20px", cursor: "pointer", padding: 0, color: "#999" }}>×</button>
            </div>
            <div style={{ padding: "20px" }}>
              <div style={{ fontSize: "14px", color: "#333", marginBottom: "20px" }}>
                Are you sure you want to delete <strong>{rateToDelete?.name}</strong>?
              </div>
              <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", borderTop: "1px solid #eee", paddingTop: "16px" }}>
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(false)}
                  style={{ padding: "8px 20px", background: "#fff", border: "1px solid #ccc", borderRadius: "6px", color: "#666", fontSize: "14px", fontWeight: "600", cursor: "pointer" }}
                >
                  CANCEL
                </button>
                <button
                  type="button"
                  onClick={handleDeleteConfirm}
                  style={{ padding: "8px 20px", background: "#e9315d", border: "1.5px solid #e9315d", borderRadius: "6px", color: "#fff", fontSize: "14px", fontWeight: "600", cursor: "pointer" }}
                >
                  OK
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete Group Confirmation Modal ── */}
      {showGroupDeleteConfirm && (
        <div className={styles.modalOverlay} style={{ zIndex: 1200 }}>
          <div className={styles.modalContent} style={{ maxWidth: "360px", width: "100%", padding: 0, borderRadius: "8px", overflow: "hidden" }}>
            <div className={styles.modalHeader} style={{ padding: "16px 20px", borderBottom: "1px solid #eee", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h3 className={styles.modalTitle} style={{ margin: 0, fontSize: "16px", fontWeight: "700" }}>Confirm Delete</h3>
              <button className={styles.closeBtn} onClick={() => setShowGroupDeleteConfirm(false)} style={{ border: "none", background: "transparent", fontSize: "20px", cursor: "pointer", padding: 0, color: "#999" }}>×</button>
            </div>
            <div style={{ padding: "20px" }}>
              <div style={{ fontSize: "14px", color: "#333", marginBottom: "20px" }}>
                Are you sure you want to delete <strong>{groupToDelete?.name}</strong>?
              </div>
              <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", borderTop: "1px solid #eee", paddingTop: "16px" }}>
                <button
                  type="button"
                  onClick={() => setShowGroupDeleteConfirm(false)}
                  style={{ padding: "8px 20px", background: "#fff", border: "1px solid #ccc", borderRadius: "6px", color: "#666", fontSize: "14px", fontWeight: "600", cursor: "pointer" }}
                >
                  CANCEL
                </button>
                <button
                  type="button"
                  onClick={handleDeleteGroupConfirm}
                  style={{ padding: "8px 20px", background: "#e9315d", border: "1.5px solid #e9315d", borderRadius: "6px", color: "#fff", fontSize: "14px", fontWeight: "600", cursor: "pointer" }}
                >
                  OK
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TaxesGSTSettings;
