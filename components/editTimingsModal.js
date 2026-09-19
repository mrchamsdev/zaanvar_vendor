import React, { useState, useEffect } from "react";
import styles from "../styles/editTimingsModal.module.css";
import { WebApimanager } from "./utilities/WebApiManager";
import useStore from "./state/useStore";
import { toast } from "sonner";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const HOURS = ["00", ...Array.from({ length: 12 }, (_, i) => (i + 1).toString().padStart(2, "0"))];
const MINUTES = Array.from({ length: 60 }, (_, i) => i.toString().padStart(2, "0"));

function parseDayTiming(val = "") {
  if (!val || val === "Closed" || val === "closed") {
    return { oH: "09", oM: "00", openPeriod: "AM", cH: "09", cM: "00", closePeriod: "PM", isClosed: val === "Closed" || val === "closed" };
  }
  const [openStr = "", closeStr = ""] = String(val).split(" - ");
  const [openTime = "09:00", openPeriod = "AM"] = openStr.split(" ");
  const [closeTime = "09:00", closePeriod = "PM"] = closeStr.split(" ");
  const [oH = "09", oM = "00"] = openTime.split(":");
  const [cH = "09", cM = "00"] = closeTime.split(":");
  return { oH, oM, openPeriod, cH, cM, closePeriod, isClosed: false };
}

function buildTimingStr(oH, oM, oP, cH, cM, cP) {
  return `${oH}:${oM} ${oP} - ${cH}:${cM} ${cP}`;
}

export default function EditTimingsModal({
  open,
  onClose,
  branchId,
  companyId,
  branchName,
  initialTimings = {},
  initialSpecialHours = [],
  onSuccess
}) {
  const { jwtToken } = useStore();
  const [submitting, setSubmitting] = useState(false);
  const [hoursMode, setHoursMode] = useState("MAIN_HOURS");
  const [is24x7, setIs24x7] = useState(false);

  // Timings per day
  const [timings, setTimings] = useState(() => {
    const init = {};
    DAYS.forEach(d => {
      init[d] = initialTimings[d] || initialTimings[d.toLowerCase()] || "09:00 AM - 09:00 PM";
    });
    return init;
  });

  // Special Hours list
  const [specialHours, setSpecialHours] = useState(() => {
    if (Array.isArray(initialSpecialHours) && initialSpecialHours.length > 0) {
      return initialSpecialHours.map((sh, idx) => ({
        id: idx + 1,
        date: sh.date || "",
        hours: sh.hours || (sh.isClosed ? "Closed" : `${sh.opensAt || "10:00"} - ${sh.closesAt || "15:00"}`),
        opensAt: sh.opensAt || "10:00",
        closesAt: sh.closesAt || "15:00",
        isClosed: sh.isClosed || sh.hours === "Closed"
      }));
    }
    return [
      { id: 1, date: "2026-07-04", hours: "10:00 - 15:00", opensAt: "10:00", closesAt: "15:00", isClosed: false },
      { id: 2, date: "2026-07-05", hours: "Closed", opensAt: "09:30", closesAt: "18:30", isClosed: true }
    ];
  });

  // Re-populate when modal opens or initial values change
  useEffect(() => {
    if (!open) return;
    const init = {};
    DAYS.forEach(d => {
      init[d] = initialTimings[d] || initialTimings[d.toLowerCase()] || "09:00 AM - 09:00 PM";
    });
    setTimings(init);

    if (Array.isArray(initialSpecialHours) && initialSpecialHours.length > 0) {
      setSpecialHours(initialSpecialHours.map((sh, idx) => ({
        id: idx + 1,
        date: sh.date || "",
        hours: sh.hours || (sh.isClosed ? "Closed" : `${sh.opensAt || "10:00"} - ${sh.closesAt || "15:00"}`),
        opensAt: sh.opensAt || "10:00",
        closesAt: sh.closesAt || "15:00",
        isClosed: sh.isClosed || sh.hours === "Closed"
      })));
    }
  }, [open, initialTimings, initialSpecialHours]);

  if (!open) return null;

  // Day timing update helper
  const handleTimingChange = (day, updatedVal) => {
    setTimings(prev => ({ ...prev, [day]: updatedVal }));
  };

  // Apply to all dates
  const handleApplyToAll = () => {
    const firstValid = Object.values(timings).find(v => v && v !== "Closed" && v !== "closed");
    if (!firstValid) {
      toast.error("Please set at least one valid open timing first.");
      return;
    }
    const newT = {};
    DAYS.forEach(d => { newT[d] = firstValid; });
    setTimings(newT);
    toast.success("Applied timing to all days!");
  };

  // Special Hours handlers
  const handleAddSpecialDate = () => {
    setSpecialHours(prev => [
      ...prev,
      { id: Date.now(), date: "", hours: "10:00 - 15:00", opensAt: "10:00", closesAt: "15:00", isClosed: false }
    ]);
  };

  const handleRemoveSpecialDate = (id) => {
    setSpecialHours(prev => prev.filter(sh => sh.id !== id));
  };

  const handleUpdateSpecialDate = (id, field, value) => {
    setSpecialHours(prev => prev.map(sh => {
      if (sh.id !== id) return sh;
      const updated = { ...sh, [field]: value };
      if (field === "isClosed") {
        updated.hours = value ? "Closed" : `${updated.opensAt || "10:00"} - ${updated.closesAt || "15:00"}`;
      } else if (field === "opensAt" || field === "closesAt") {
        if (!updated.isClosed) {
          updated.hours = `${updated.opensAt || "10:00"} - ${updated.closesAt || "15:00"}`;
        }
      }
      return updated;
    }));
  };

  // Form Submit Handler
  const handleSave = async () => {
    setSubmitting(true);
    try {
      const token = jwtToken || (typeof window !== "undefined" ? (localStorage.getItem("jwtToken") || localStorage.getItem("token") || "") : "");
      const webApi = new WebApimanager(token);

      const targetBranchId = parseInt(branchId || 1, 10);

      // Build Timings Object
      const formattedTimings = {};
      DAYS.forEach(d => {
        const key = d.toLowerCase();
        const val = timings[d];
        formattedTimings[key] = (val === "Closed" || val === "closed") ? "Closed" : val;
      });

      // 1. Submit Branch / Company Timings via PUT /api/companies/vendor/timings
      const timingsPayload = companyId ? {
        companyId: parseInt(companyId, 10),
        timings: formattedTimings
      } : {
        branchId: targetBranchId,
        timings: formattedTimings
      };

      await webApi.put("companies/vendor/timings", timingsPayload);

      // 2. Submit Special Hours if present
      const validSpecialHours = specialHours
        .filter(sh => sh.date)
        .map(sh => ({
          date: sh.date,
          hours: sh.isClosed ? "Closed" : (sh.hours || `${sh.opensAt || "10:00"} - ${sh.closesAt || "15:00"}`)
        }));

      if (validSpecialHours.length > 0) {
        const specialHoursPayload = {
          branchId: targetBranchId,
          specialHours: validSpecialHours
        };
        await webApi.put("companies/vendor/timings", specialHoursPayload);
      }

      toast.success("Timings updated successfully!");
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      console.error("Failed to update timings:", err);
      toast.error(err?.response?.data?.message || err.message || "Failed to update timings.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className={styles.header}>
          <h2 className={styles.headerTitle}>
            Edit Timings
            <span className={styles.branchBadge}>{branchName || `Branch #${branchId || 1}`}</span>
          </h2>
          <button className={styles.closeBtn} onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>

        {/* Modal Body */}
        <div className={styles.body}>
          {/* SECTION 1: HOURS MODE */}
          <div className={styles.sectionCard}>
            <div className={styles.sectionHeader}>
              <h3 className={styles.sectionTitle}>Hours</h3>
              <p className={styles.sectionSub}>CHOOSE YOUR SHOP OPENING AND CLOSING TIMES.</p>
            </div>
            <div className={styles.radioList}>
              <label className={styles.radioOption}>
                <input
                  type="radio"
                  name="hoursMode"
                  value="MAIN_HOURS"
                  checked={hoursMode === "MAIN_HOURS"}
                  onChange={() => setHoursMode("MAIN_HOURS")}
                />
                <div>
                  <div className={styles.radioLabelText}>OPEN WITH MAIN HOURS</div>
                  <div className={styles.radioSubText}>SHOW WHEN YOUR BUSINESS IS OPEN</div>
                </div>
              </label>

              <label className={styles.radioOption}>
                <input
                  type="radio"
                  name="hoursMode"
                  value="NO_MAIN_HOURS"
                  checked={hoursMode === "NO_MAIN_HOURS"}
                  onChange={() => setHoursMode("NO_MAIN_HOURS")}
                />
                <div>
                  <div className={styles.radioLabelText}>OPEN WITH NO MAIN HOURS</div>
                  <div className={styles.radioSubText}>DON&apos;T SHOW ANY BUSINESS HOURS</div>
                </div>
              </label>

              <label className={styles.radioOption}>
                <input
                  type="radio"
                  name="hoursMode"
                  value="TEMPORARILY_CLOSED"
                  checked={hoursMode === "TEMPORARILY_CLOSED"}
                  onChange={() => setHoursMode("TEMPORARILY_CLOSED")}
                />
                <div>
                  <div className={styles.radioLabelText}>TEMPORARILY CLOSED</div>
                  <div className={styles.radioSubText}>SHOW THAT YOUR BUSINESS WILL OPEN AGAIN IN THE FUTURE</div>
                </div>
              </label>

              <label className={styles.radioOption}>
                <input
                  type="radio"
                  name="hoursMode"
                  value="PERMANENTLY_CLOSED"
                  checked={hoursMode === "PERMANENTLY_CLOSED"}
                  onChange={() => setHoursMode("PERMANENTLY_CLOSED")}
                />
                <div>
                  <div className={styles.radioLabelText}>PERMANENTLY CLOSED</div>
                  <div className={styles.radioSubText}>SHOW THAT YOUR BUSINESS NO LONGER EXISTS</div>
                </div>
              </label>
            </div>
          </div>

          {/* SECTION 2: BRANCH TIMINGS */}
          {hoursMode === "MAIN_HOURS" && (
            <div className={styles.sectionCard}>
              <div className={styles.sectionHeader}>
                <h3 className={styles.sectionTitle}>Branch Timings</h3>
              </div>

              <div className={styles.timingsControlBar}>
                <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, cursor: "pointer" }}>
                  <input
                    type="checkbox"
                    checked={is24x7}
                    onChange={(e) => {
                      const checked = e.target.checked;
                      setIs24x7(checked);
                      if (checked) {
                        const newT = {};
                        DAYS.forEach(d => { newT[d] = "12:00 AM - 11:59 PM"; });
                        setTimings(newT);
                      }
                    }}
                    style={{ accentColor: "#1a73e8", width: 16, height: 16 }}
                  />
                  24/7 Open
                </label>

                <button type="button" className={styles.applyAllBtn} onClick={handleApplyToAll}>
                  Apply to all Dates
                </button>
              </div>

              <div style={{ fontSize: 12, fontWeight: 700, color: "#475569", marginBottom: 12 }}>
                Store Timings
              </div>

              <div className={styles.timingsList}>
                {DAYS.map((day) => {
                  const { oH, oM, openPeriod, cH, cM, closePeriod, isClosed } = parseDayTiming(timings[day]);

                  const handleDayToggleClosed = (checked) => {
                    if (checked) {
                      handleTimingChange(day, "Closed");
                    } else {
                      handleTimingChange(day, buildTimingStr(oH, oM, openPeriod, cH, cM, closePeriod));
                    }
                  };

                  const handleUpdateField = (key, val) => {
                    const cur = { oH, oM, openPeriod, cH, cM, closePeriod };
                    cur[key] = val;
                    handleTimingChange(day, buildTimingStr(cur.oH, cur.oM, cur.openPeriod, cur.cH, cur.cM, cur.closePeriod));
                  };

                  return (
                    <div key={day} className={styles.timingDayRow} style={{ opacity: isClosed ? 0.75 : 1 }}>
                      <div className={styles.dayLabelWrap}>
                        <span className={styles.dayName}>{day}</span>
                        <label className={styles.closedCheck}>
                          <input
                            type="checkbox"
                            checked={isClosed}
                            onChange={(e) => handleDayToggleClosed(e.target.checked)}
                          />
                          Closed
                        </label>
                      </div>

                      <div className={styles.timeSelectGroup}>
                        <select
                          disabled={isClosed}
                          className={styles.timeSelect}
                          value={oH}
                          onChange={(e) => handleUpdateField("oH", e.target.value)}
                        >
                          {HOURS.map(h => <option key={h}>{h}</option>)}
                        </select>
                        <span>:</span>
                        <select
                          disabled={isClosed}
                          className={styles.timeSelect}
                          value={oM}
                          onChange={(e) => handleUpdateField("oM", e.target.value)}
                        >
                          {MINUTES.map(m => <option key={m}>{m}</option>)}
                        </select>
                        <select
                          disabled={isClosed}
                          className={styles.timeSelect}
                          value={openPeriod}
                          onChange={(e) => handleUpdateField("openPeriod", e.target.value)}
                        >
                          <option>AM</option>
                          <option>PM</option>
                        </select>
                        <span style={{ fontSize: 11, color: "#64748b", margin: "0 4px" }}>TO</span>
                        <select
                          disabled={isClosed}
                          className={styles.timeSelect}
                          value={cH}
                          onChange={(e) => handleUpdateField("cH", e.target.value)}
                        >
                          {HOURS.map(h => <option key={h}>{h}</option>)}
                        </select>
                        <span>:</span>
                        <select
                          disabled={isClosed}
                          className={styles.timeSelect}
                          value={cM}
                          onChange={(e) => handleUpdateField("cM", e.target.value)}
                        >
                          {MINUTES.map(m => <option key={m}>{m}</option>)}
                        </select>
                        <select
                          disabled={isClosed}
                          className={styles.timeSelect}
                          value={closePeriod}
                          onChange={(e) => handleUpdateField("closePeriod", e.target.value)}
                        >
                          <option>AM</option>
                          <option>PM</option>
                        </select>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* SECTION 3: SPECIAL HOURS */}
          <div className={styles.sectionCard}>
            <div className={styles.sectionHeader}>
              <h3 className={styles.sectionTitle}>Special hours</h3>
              <p className={styles.sectionSub}>CONFIRM PUBLIC HOLIDAYS OR ADD HOURS SO CUSTOMERS KNOW WHEN YOU&apos;RE OPEN.</p>
            </div>

            {/* Custom Special Dates */}
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {specialHours.map((sh) => (
                <div key={sh.id} className={styles.customDateRow}>
                  <div className={styles.dateInputGroup}>
                    <label className={styles.inputLabel}>Date</label>
                    <input
                      type="date"
                      className={styles.dateInput}
                      value={sh.date}
                      onChange={(e) => handleUpdateSpecialDate(sh.id, "date", e.target.value)}
                    />
                  </div>

                  <label className={styles.closedCheck} style={{ marginBottom: 8 }}>
                    <input
                      type="checkbox"
                      checked={sh.isClosed}
                      onChange={(e) => handleUpdateSpecialDate(sh.id, "isClosed", e.target.checked)}
                    />
                    Closed
                  </label>

                  {!sh.isClosed && (
                    <>
                      <div className={styles.dateInputGroup}>
                        <label className={styles.inputLabel}>Opens at</label>
                        <input
                          type="time"
                          className={styles.timeInput}
                          value={sh.opensAt || "09:30"}
                          onChange={(e) => handleUpdateSpecialDate(sh.id, "opensAt", e.target.value)}
                        />
                      </div>
                      <div className={styles.dateInputGroup}>
                        <label className={styles.inputLabel}>Close at</label>
                        <input
                          type="time"
                          className={styles.timeInput}
                          value={sh.closesAt || "18:30"}
                          onChange={(e) => handleUpdateSpecialDate(sh.id, "closesAt", e.target.value)}
                        />
                      </div>
                    </>
                  )}

                  <button
                    type="button"
                    className={styles.deleteBtn}
                    onClick={() => handleRemoveSpecialDate(sh.id)}
                    title="Remove date"
                  >
                    🗑️
                  </button>
                </div>
              ))}
            </div>

            <button type="button" className={styles.addDateBtn} onClick={handleAddSpecialDate}>
              + Add a date
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className={styles.footer}>
          <button className={styles.cancelBtn} onClick={onClose}>
            Cancel
          </button>
          <button className={styles.saveBtn} onClick={handleSave} disabled={submitting}>
            {submitting ? "Saving..." : "Save Timings"}
          </button>
        </div>
      </div>
    </div>
  );
}
