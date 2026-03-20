import React, { useState, useEffect } from "react";
import { toast } from "sonner";
import DashboardLayout from "../components/dashboard/DashboardLayout";
import useDashboardData from "../components/dashboard/useDashboardData";
import styles from "../styles/dashboard/dashboard.module.css";

const DAYS = ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"];

/* ── Parse "09:00" → { hh:"09", mm:"00", period:"AM" } ── */
function parseTime(timeStr) {
  if (!timeStr || timeStr === "closed") return { hh:"00", mm:"00", period:"AM" };
  const [hRaw, mm] = timeStr.split(":").map(s => s.trim());
  let h = parseInt(hRaw, 10);
  const period = h >= 12 ? "PM" : "AM";
  if (h > 12) h -= 12;
  if (h === 0) h = 12;
  return { hh: String(h).padStart(2,"0"), mm: mm || "00", period };
}

/* ── Convert back to 24-hr "09:00" ── */
function to24(hh, mm, period) {
  let h = parseInt(hh, 10);
  if (period === "PM" && h < 12) h += 12;
  if (period === "AM" && h === 12) h = 0;
  return `${String(h).padStart(2,"0")}:${mm}`;
}

/* ── Build slot state from timings object ── */
function buildSlots(timings) {
  const out = {};
  DAYS.forEach((day) => {
    const key  = day.toLowerCase();
    const slot = timings?.[key];
    const o    = parseTime(slot?.open);
    const c    = parseTime(slot?.close);
    out[key] = {
      openHH:      o.hh,  openMM:      o.mm,  openPeriod:  o.period,
      closeHH:     c.hh,  closeMM:     c.mm,  closePeriod: c.period,
      closed: !slot?.open || slot.open === "closed",
    };
  });
  return out;
}

/* ═══════════════════════════════════════════════════════════
 * Timing Slots Page
 * ═══════════════════════════════════════════════════════════ */
export default function TimingSlotsPage() {
  const { timings, branchId } = useDashboardData();

  const [slots,   setSlots]   = useState(() => buildSlots(timings));
  const [editing, setEditing] = useState(true);

  /* When Zustand rehydrates (or branch changes), rebuild slots */
  useEffect(() => {
    setSlots(buildSlots(timings));
  }, [JSON.stringify(timings)]);

  const topbarButtons = [
    // { label: "+ Add Rooms",    color: "purple", action: "addRooms" },
    // { label: "+ Add Bookings", color: "red",    action: "addBookings" },
    // { label: "+ Add More",     color: "gray",   action: "addMore" },
  ];

  const update = (day, field, value) =>
    setSlots(prev => ({ ...prev, [day]: { ...prev[day], [field]: value } }));

  const handleSave = () => {
    const payload = {};
    DAYS.forEach((day) => {
      const key = day.toLowerCase();
      const s   = slots[key];
      payload[key] = s.closed
        ? { open: "closed", close: "closed" }
        : { open: to24(s.openHH, s.openMM, s.openPeriod), close: to24(s.closeHH, s.closeMM, s.closePeriod) };
    });
    /* TODO: call PUT /vendorUser/updateTimings/${branchId} with payload */
    console.log("Saving timings:", payload);
    toast.success("Timing slots saved!");
    setEditing(false);
  };

  const handleCancel = () => {
    setSlots(buildSlots(timings));
    setEditing(false);
  };

  return (
    <DashboardLayout topbarButtons={topbarButtons}>
      {/* Header */}
      <div className={styles.tsPageHeader}>
        <h2 className={styles.tsPageTitle}>Timing Slots</h2>
        {/* {editing && <span className={styles.tsEditingBadge}>Editing</span>} */}
      </div>

      {/* Table */}
      <div className={styles.tsTable}>
        {DAYS.map((day) => {
          const key = day.toLowerCase();
          const s   = slots[key] || {};
          return (
            <div key={day} className={styles.tsRow}>
              <span className={styles.tsDay}>{day}</span>
              <div className={styles.tsTimeInputs}>
                {/* Open */}
                <div className={styles.tsTimeGroup}>
                  <input className={styles.tsTimeBox}
                    type="text" maxLength={2} value={s.openHH} readOnly={!editing}
                    onChange={e => update(key,"openHH", e.target.value.replace(/\D/g,"").slice(0,2))} />
                  <span className={styles.tsColon}>:</span>
                  <input className={styles.tsTimeBox}
                    type="text" maxLength={2} value={s.openMM} readOnly={!editing}
                    onChange={e => update(key,"openMM", e.target.value.replace(/\D/g,"").slice(0,2))} />
                  <select className={styles.tsAmPmBox}
                    value={s.openPeriod} disabled={!editing}
                    onChange={e => update(key,"openPeriod", e.target.value)}>
                    <option>AM</option><option>PM</option>
                  </select>
                </div>

                <span className={styles.tsTo}>TO</span>

                {/* Close */}
                <div className={styles.tsTimeGroup}>
                  <input className={styles.tsTimeBox}
                    type="text" maxLength={2} value={s.closeHH} readOnly={!editing}
                    onChange={e => update(key,"closeHH", e.target.value.replace(/\D/g,"").slice(0,2))} />
                  <span className={styles.tsColon}>:</span>
                  <input className={styles.tsTimeBox}
                    type="text" maxLength={2} value={s.closeMM} readOnly={!editing}
                    onChange={e => update(key,"closeMM", e.target.value.replace(/\D/g,"").slice(0,2))} />
                  <select className={styles.tsAmPmBox}
                    value={s.closePeriod} disabled={!editing}
                    onChange={e => update(key,"closePeriod", e.target.value)}>
                    <option>AM</option><option>PM</option>
                  </select>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer */}
      {/* <div className={styles.tsFooter}>
        <button className={styles.tsCancelBtn} onClick={handleCancel}>Cancel</button>
        <button className={styles.tsSaveBtn}   onClick={handleSave}>Save</button>
      </div> */}
    </DashboardLayout>
  );
}
