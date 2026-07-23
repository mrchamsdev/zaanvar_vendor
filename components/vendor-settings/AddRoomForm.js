import React, { useState } from "react";
import styles from "../../styles/vendor-settings/rooms-capacity.module.css";

const AddRoomForm = ({ onCancel, onSave, initialData }) => {
  const [activeSubTab, setActiveSubTab] = useState("Clinic");
  
  const clinicData = initialData?.clinic || {};
  const daycareData = initialData?.daycare || {};
  const lateCheckOutData = initialData?.lateCheckOut || {};
  const cancellationsData = initialData?.cancellations || {};

  const [independentRooms, setIndependentRooms] = useState(clinicData.independentRooms ?? true);

  // Clinic spaces room rows state
  const [clinicRooms, setClinicRooms] = useState(clinicData.rooms?.length ? clinicData.rooms.map(r => ({ ...r, numRooms: String(r.numberOfRooms || r.numRooms || "00"), capacity: String(r.capacity || "0000") })) : [
    { id: "cr1", roomName: "", numRooms: "00", petType: "Dog", capacity: "0000", price: "000" }
  ]);
  const [clinicRates, setClinicRates] = useState(clinicData.rates?.length ? clinicData.rates : [
    { id: "cl1", priceName: "", petType: "Dog", breedSize: "Large", price: "0000" }
  ]);
  const [clinicTaxIncluded, setClinicTaxIncluded] = useState(clinicData.taxIncluded ?? true);

  // Helper to parse time strings into hour (01-12) and period (AM/PM)
  const parseTimeString = (timeStr, defaultHour = "07:00", defaultPeriod = "AM") => {
    if (!timeStr) return { hour: defaultHour, period: defaultPeriod };
    const parts = timeStr.trim().split(" ");
    if (parts.length >= 2) {
      let h = parts[0];
      if (!h.includes(":")) h = `${h.padStart(2, '0')}:00`;
      return { hour: h, period: parts[1].toUpperCase() };
    }
    return { hour: defaultHour, period: defaultPeriod };
  };

  const initialCheckIn = parseTimeString(daycareData.checkInTimeFrom || daycareData.checkInTime || "07:00 AM", "07:00", "AM");
  const [daycareCheckInHour, setDaycareCheckInHour] = useState(initialCheckIn.hour);
  const [daycareCheckInPeriod, setDaycareCheckInPeriod] = useState(initialCheckIn.period);

  const initialCheckOut = parseTimeString(daycareData.checkOutTime || "05:00 PM", "05:00", "PM");
  const [daycareCheckOutHour, setDaycareCheckOutHour] = useState(initialCheckOut.hour);
  const [daycareCheckOutPeriod, setDaycareCheckOutPeriod] = useState(initialCheckOut.period);

  const daycareCheckInFrom = `${daycareCheckInHour} ${daycareCheckInPeriod}`;
  const daycareCheckInTo = `${daycareCheckInHour} ${daycareCheckInPeriod}`;
  const daycareCheckOut = `${daycareCheckOutHour} ${daycareCheckOutPeriod}`;

  const [daycareRooms, setDaycareRooms] = useState(daycareData.rooms?.length ? daycareData.rooms.map(r => ({ ...r, numRooms: String(r.numberOfRooms || r.numRooms || "00"), capacity: String(r.capacity || "0000"), foodProvided: r.foodProvided ?? false })) : [
    { id: "dr1", roomName: "", numRooms: "00", petType: "Dog", capacity: "0000", price: "000", foodProvided: false }
  ]);
  const [daycareChargeBy, setDaycareChargeBy] = useState(daycareData.chargeBy || "Do you charge by number of days or number of nights?");
  const [daycareRates, setDaycareRates] = useState(daycareData.rates?.length ? daycareData.rates : [
    { id: "dl1", priceName: "", petType: "Dog", breedSize: "Large", price: "0000" }
  ]);
  const [daycareTaxIncluded, setDaycareTaxIncluded] = useState(daycareData.taxIncluded ?? true);

  // Late Check Out states
  const [lateCheckOutSame, setLateCheckOutSame] = useState(lateCheckOutData.sameForAllServices ?? true);
  const [lateCheckOutOptionSame, setLateCheckOutOptionSame] = useState(lateCheckOutData.feeType || "flat");
  const [lateCheckOutAmountSame, setLateCheckOutAmountSame] = useState(lateCheckOutData.amount || "");
  
  const [lateCheckOutOptionClinic, setLateCheckOutOptionClinic] = useState(lateCheckOutData.clinic?.feeType || "flat");
  const [lateCheckOutAmountClinic, setLateCheckOutAmountClinic] = useState(lateCheckOutData.clinic?.amount || "");
  
  const [lateCheckOutOptionDaycare, setLateCheckOutOptionDaycare] = useState(lateCheckOutData.daycare?.feeType || "flat");
  const [lateCheckOutAmountDaycare, setLateCheckOutAmountDaycare] = useState(lateCheckOutData.daycare?.amount || "");

  // Cancellations states
  const [cancellationSame, setCancellationSame] = useState(cancellationsData.sameForAllServices ?? true);
  const [cancellationOptionSame, setCancellationOptionSame] = useState(cancellationsData.feeType || "charged");
  const [allowanceHoursSame, setAllowanceHoursSame] = useState(cancellationsData.hoursBeforeCheckIn || "");
  const [chargeAmountSame, setChargeAmountSame] = useState(cancellationsData.amount || "");
  const [latePercentageSame, setLatePercentageSame] = useState(cancellationsData.lateCancellationCharges || "");

  const [cancellationOptionClinic, setCancellationOptionClinic] = useState(cancellationsData.clinic?.feeType || "charged");
  const [allowanceHoursClinic, setAllowanceHoursClinic] = useState(cancellationsData.clinic?.hoursBeforeCheckIn || "");
  const [chargeAmountClinic, setChargeAmountClinic] = useState(cancellationsData.clinic?.amount || "");
  const [latePercentageClinic, setLatePercentageClinic] = useState(cancellationsData.clinic?.lateCancellationCharges || "");

  const [cancellationOptionDaycare, setCancellationOptionDaycare] = useState(cancellationsData.daycare?.feeType || "charged");
  const [allowanceHoursDaycare, setAllowanceHoursDaycare] = useState(cancellationsData.daycare?.hoursBeforeCheckIn || "");
  const [chargeAmountDaycare, setChargeAmountDaycare] = useState(cancellationsData.daycare?.amount || "");
  const [latePercentageDaycare, setLatePercentageDaycare] = useState(cancellationsData.daycare?.lateCancellationCharges || "");

  // Row Manipulation helpers
  const addClinicRoomRow = () => {
    setClinicRooms(prev => [...prev, { id: `cr_${Date.now()}`, roomName: "", numRooms: "00", petType: "Dog", capacity: "0000", price: "000" }]);
  };
  const removeClinicRoomRow = (id) => {
    if (clinicRooms.length > 1) setClinicRooms(prev => prev.filter(r => r.id !== id));
  };
  const updateClinicRoomRow = (id, field, val) => {
    setClinicRooms(prev => prev.map(r => r.id === id ? { ...r, [field]: val } : r));
  };

  const addClinicRateRow = () => {
    setClinicRates(prev => [...prev, { id: `cl_${Date.now()}`, priceName: "", petType: "Dog", breedSize: "Large", price: "0000" }]);
  };
  const removeClinicRateRow = (id) => {
    if (clinicRates.length > 1) setClinicRates(prev => prev.filter(r => r.id !== id));
  };
  const updateClinicRateRow = (id, field, val) => {
    setClinicRates(prev => prev.map(r => r.id === id ? { ...r, [field]: val } : r));
  };

  const addDaycareRoomRow = () => {
    setDaycareRooms(prev => [...prev, { id: `dr_${Date.now()}`, roomName: "", numRooms: "00", petType: "Dog", capacity: "0000", price: "000", foodProvided: false }]);
  };
  const removeDaycareRoomRow = (id) => {
    if (daycareRooms.length > 1) setDaycareRooms(prev => prev.filter(r => r.id !== id));
  };
  const updateDaycareRoomRow = (id, field, val) => {
    setDaycareRooms(prev => prev.map(r => r.id === id ? { ...r, [field]: val } : r));
  };

  const addDaycareRateRow = () => {
    setDaycareRates(prev => [...prev, { id: `dl_${Date.now()}`, priceName: "", petType: "Dog", breedSize: "Large", price: "0000" }]);
  };
  const removeDaycareRateRow = (id) => {
    if (daycareRates.length > 1) setDaycareRates(prev => prev.filter(r => r.id !== id));
  };
  const updateDaycareRateRow = (id, field, val) => {
    setDaycareRates(prev => prev.map(r => r.id === id ? { ...r, [field]: val } : r));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const formatRooms = (rArray) => rArray.map(r => ({
      ...r,
      numberOfRooms: parseInt(r.numRooms) || 0,
      capacity: parseInt(r.capacity) || 0,
      foodProvided: Boolean(r.foodProvided)
    }));
    const formatRates = (rArray) => rArray.map(r => ({ ...r, price: parseInt(r.price) || 0 }));
    
    const apiPayload = {
      clinic: {
        independentRooms,
        rooms: formatRooms(clinicRooms),
        rates: formatRates(clinicRates),
        taxIncluded: clinicTaxIncluded
      },
      daycare: {
        checkInTimeFrom: daycareCheckInFrom,
        checkInTimeTo: daycareCheckInTo,
        checkOutTime: daycareCheckOut,
        independentRooms: false,
        rooms: formatRooms(daycareRooms),
        rates: formatRates(daycareRates),
        chargeBy: daycareChargeBy,
        taxIncluded: daycareTaxIncluded
      },
      lateCheckOut: lateCheckOutSame ? {
        sameForAllServices: true,
        feeType: lateCheckOutOptionSame,
        amount: parseInt(lateCheckOutAmountSame) || 0
      } : {
        sameForAllServices: false,
        clinic: { feeType: lateCheckOutOptionClinic, amount: parseInt(lateCheckOutAmountClinic) || 0 },
        daycare: { feeType: lateCheckOutOptionDaycare, amount: parseInt(lateCheckOutAmountDaycare) || 0 }
      },
      cancellations: cancellationSame ? {
        sameForAllServices: true,
        feeType: cancellationOptionSame,
        hoursBeforeCheckIn: parseInt(allowanceHoursSame) || 0,
        amount: parseInt(chargeAmountSame) || 0,
        lateCancellationCharges: parseInt(latePercentageSame) || 0
      } : {
        sameForAllServices: false,
        clinic: {
          feeType: cancellationOptionClinic,
          hoursBeforeCheckIn: parseInt(allowanceHoursClinic) || 0,
          amount: parseInt(chargeAmountClinic) || 0,
          lateCancellationCharges: parseInt(latePercentageClinic) || 0
        },
        daycare: {
          feeType: cancellationOptionDaycare,
          hoursBeforeCheckIn: parseInt(allowanceHoursDaycare) || 0,
          amount: parseInt(chargeAmountDaycare) || 0,
          lateCancellationCharges: parseInt(latePercentageDaycare) || 0
        }
      }
    };
    onSave(apiPayload);
  };

  return (
    <div className={styles.formPageCard}>
      {/* Header with Minimize, Maximize, Close icons */}
      <div className={styles.addRoomHeader}>
        <h3 className={styles.modalTitle}>Rooms</h3>
        <div className={styles.modalControls}>
          <button type="button" className={styles.controlBtn} title="Minimize">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="5" y1="12" x2="19" y2="12" /></svg>
          </button>
          <button type="button" className={styles.controlBtn} title="Maximize">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="3" y="3" width="18" height="18" rx="2" /></svg>
          </button>
          <button type="button" className={styles.controlBtn} onClick={onCancel} title="Close">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
          </button>
        </div>
      </div>

      {/* Full Page Tabs */}
      <div className={styles.modalTabs}>
        {["Clinic", "Daycare", "late check out", "Cancellations"].map(tab => (
          <button
            key={tab}
            type="button"
            className={`${styles.modalTab} ${activeSubTab === tab ? styles.modalTabActive : ""}`}
            onClick={() => setActiveSubTab(tab)}
          >
            {tab}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit} className={styles.addRoomFormEl}>
        <div className={styles.formTabContentBody}>
          {/* CLINIC TAB */}
          {activeSubTab === "Clinic" && (
            <>
              <div className={styles.formSectionTitleRow}>
                <div className={styles.sectionHeaderCol}>
                  <h3>Add rooms for Clinic Management</h3>
                  <p>Designate boarding rooms and allocate pets to them</p>
                </div>
                <div className={styles.toggleContainer}>
                  <span className={styles.toggleLabel}>Independent Rooms</span>
                  <label className={styles.switch}>
                    <input
                      type="checkbox"
                      checked={independentRooms}
                      onChange={(e) => setIndependentRooms(e.target.checked)}
                    />
                    <span className={styles.slider}></span>
                  </label>
                </div>
              </div>

              <div className={styles.formCardWithMargin}>
                {/* Headers */}
                <div 
                  className={`${styles.rowHeaders} ${independentRooms ? styles.gridRoomsOn : styles.gridRoomsOff}`}
                >
                  <div className={styles.colHeader}>Room Name</div>
                  <div className={styles.colHeader}>Number of Rooms</div>
                  <div className={styles.colHeader}>{independentRooms ? "Pet Type" : "Animal Type"}</div>
                  <div className={styles.colHeader}>Beds / Room Capacity</div>
                  {!independentRooms && <div className={styles.colHeader}>Price</div>}
                  <div className={styles.colHeader}></div>
                </div>

                {/* Rows */}
                {clinicRooms.map((row) => (
                  <div 
                    key={row.id} 
                    className={`${styles.rowInputs} ${independentRooms ? styles.gridRoomsOn : styles.gridRoomsOff}`}
                  >
                    <input
                      type="text"
                      className={styles.formFieldInput}
                      placeholder="Enter here"
                      value={row.roomName}
                      onChange={(e) => updateClinicRoomRow(row.id, "roomName", e.target.value)}
                    />
                    <input
                      type="text"
                      className={styles.formFieldInput}
                      placeholder="00"
                      value={row.numRooms}
                      onChange={(e) => updateClinicRoomRow(row.id, "numRooms", e.target.value)}
                    />
                    <select
                      className={styles.formFieldInput}
                      value={row.petType}
                      onChange={(e) => updateClinicRoomRow(row.id, "petType", e.target.value)}
                    >
                      <option value="Dog">Dog</option>
                      <option value="Cat">Cat</option>
                    </select>
                    <input
                      type="text"
                      className={styles.formFieldInput}
                      placeholder="0000"
                      value={row.capacity}
                      onChange={(e) => updateClinicRoomRow(row.id, "capacity", e.target.value)}
                    />
                    {!independentRooms && (
                      <input
                        type="text"
                        className={styles.formFieldInput}
                        placeholder="₹ 000"
                        value={row.price}
                        onChange={(e) => updateClinicRoomRow(row.id, "price", e.target.value)}
                      />
                    )}
                    <button
                      type="button"
                      className={styles.removeLink}
                      onClick={() => removeClinicRoomRow(row.id)}
                    >
                      Remove
                    </button>
                  </div>
                ))}

                <button type="button" className={styles.btnActionLink} onClick={addClinicRoomRow}>
                  + Add Room Type
                </button>
              </div>

              {independentRooms && (
                <>
                  <div className={styles.sectionHeaderWithMargin}>
                    <h3>Clinic Rates</h3>
                    <p>Customise your pricing for clinic based on hourly, full day or half day charges</p>
                  </div>

                  <div className={styles.checkboxContainer}>
                    <input
                      type="checkbox"
                      id="clinicTax"
                      checked={clinicTaxIncluded}
                      onChange={(e) => setClinicTaxIncluded(e.target.checked)}
                    />
                    <label htmlFor="clinicTax">All prices included tax of 0%</label>
                  </div>

                  <div className={styles.formCard}>
                    <div className={`${styles.rowHeaders} ${styles.gridRoomsOn}`}>
                      <div className={styles.colHeader}>Price Name</div>
                      <div className={styles.colHeader}>Pet Type</div>
                      <div className={styles.colHeader}>Breed Size</div>
                      <div className={styles.colHeader}>Price</div>
                      <div className={styles.colHeader}></div>
                    </div>

                    {clinicRates.map(row => (
                      <div key={row.id} className={`${styles.rowInputs} ${styles.gridRoomsOn}`}>
                        <input
                          type="text"
                          className={styles.formFieldInput}
                          placeholder="Enter here"
                          value={row.priceName}
                          onChange={(e) => updateClinicRateRow(row.id, "priceName", e.target.value)}
                        />
                        <select
                          className={styles.formFieldInput}
                          value={row.petType}
                          onChange={(e) => updateClinicRateRow(row.id, "petType", e.target.value)}
                        >
                          <option value="Dog">Dog</option>
                          <option value="Cat">Cat</option>
                        </select>
                        <select
                          className={styles.formFieldInput}
                          value={row.breedSize}
                          onChange={(e) => updateClinicRateRow(row.id, "breedSize", e.target.value)}
                        >
                          <option value="Small">Small</option>
                          <option value="Medium">Medium</option>
                          <option value="Large">Large</option>
                        </select>
                        <input
                          type="text"
                          className={styles.formFieldInput}
                          placeholder="₹ 0000"
                          value={row.price}
                          onChange={(e) => updateClinicRateRow(row.id, "price", e.target.value)}
                        />
                        <button
                          type="button"
                          className={styles.removeLink}
                          onClick={() => removeClinicRateRow(row.id)}
                        >
                          Remove
                        </button>
                      </div>
                    ))}

                    <button type="button" className={styles.btnActionLink} onClick={addClinicRateRow}>
                      + Add Rate
                    </button>
                  </div>
                </>
              )}
            </>
          )}

          {/* DAYCARE TAB */}
          {activeSubTab === "Daycare" && (
            <>
              <div className={styles.formSectionTitleRow}>
                <div className={styles.sectionHeaderCol}>
                  <h3>Daycare Check In Time</h3>
                  <p>Choose the standard time at which someone can check in and check out their pets</p>
                </div>
                <div className={styles.toggleContainer}>
                  <span className={styles.toggleLabel}>Independent Rooms</span>
                  <label className={styles.switch}>
                    <input
                      type="checkbox"
                      checked={independentRooms}
                      onChange={(e) => setIndependentRooms(e.target.checked)}
                    />
                    <span className={styles.slider}></span>
                  </label>
                </div>
              </div>

              <div className={styles.daycareCheckInRow} style={{ display: 'flex', gap: '2.5rem', alignItems: 'center', marginBottom: '1.5rem' }}>
                <div className={styles.timeFieldBox}>
                  <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600', color: '#333' }}>Check In Time</label>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <select 
                      className={styles.timeSelect}
                      value={daycareCheckInHour}
                      onChange={(e) => setDaycareCheckInHour(e.target.value)}
                    >
                      {["01:00", "02:00", "03:00", "04:00", "05:00", "06:00", "07:00", "08:00", "09:00", "10:00", "11:00", "12:00"].map(h => (
                        <option key={h} value={h}>{h}</option>
                      ))}
                    </select>
                    <select 
                      className={styles.timeSelect}
                      value={daycareCheckInPeriod}
                      onChange={(e) => setDaycareCheckInPeriod(e.target.value)}
                    >
                      <option value="AM">AM</option>
                      <option value="PM">PM</option>
                    </select>
                  </div>
                </div>

                <div className={styles.timeFieldBox}>
                  <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600', color: '#333' }}>Check Out Time</label>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <select 
                      className={styles.timeSelect}
                      value={daycareCheckOutHour}
                      onChange={(e) => setDaycareCheckOutHour(e.target.value)}
                    >
                      {["01:00", "02:00", "03:00", "04:00", "05:00", "06:00", "07:00", "08:00", "09:00", "10:00", "11:00", "12:00"].map(h => (
                        <option key={h} value={h}>{h}</option>
                      ))}
                    </select>
                    <select 
                      className={styles.timeSelect}
                      value={daycareCheckOutPeriod}
                      onChange={(e) => setDaycareCheckOutPeriod(e.target.value)}
                    >
                      <option value="AM">AM</option>
                      <option value="PM">PM</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className={styles.sectionHeaderWithMargin}>
                <h3>Add rooms for Pet Daycare</h3>
                <p>Designate boarding rooms and allocate pets to them</p>
              </div>

              <div className={styles.formCardWithMargin}>
                <div 
                  className={`${styles.rowHeaders} ${independentRooms ? styles.gridDaycareRoomsOn : styles.gridDaycareRoomsOff}`}
                >
                  <div className={styles.colHeader}>Assigned Room</div>
                  <div className={styles.colHeader}>Food Providing</div>
                  <div className={styles.colHeader}>Number of Rooms</div>
                  <div className={styles.colHeader}>{independentRooms ? "Pet Type" : "Animal Type"}</div>
                  <div className={styles.colHeader}>Beds / Room Capacity</div>
                  {!independentRooms && <div className={styles.colHeader}>Price</div>}
                  <div className={styles.colHeader}></div>
                </div>

                {daycareRooms.map((row) => (
                  <div 
                    key={row.id} 
                    className={`${styles.rowInputs} ${independentRooms ? styles.gridDaycareRoomsOn : styles.gridDaycareRoomsOff}`}
                  >
                    <input
                      type="text"
                      className={styles.formFieldInput}
                      placeholder="Enter here"
                      value={row.roomName}
                      onChange={(e) => updateDaycareRoomRow(row.id, "roomName", e.target.value)}
                    />
                    <select
                      className={styles.formFieldInput}
                      value={row.foodProvided === true ? "true" : row.foodProvided === false ? "false" : ""}
                      onChange={(e) => updateDaycareRoomRow(row.id, "foodProvided", e.target.value === "true")}
                    >
                      <option value="">Select Food</option>
                      <option value="true">Yes</option>
                      <option value="false">No</option>
                    </select>
                    <input
                      type="text"
                      className={styles.formFieldInput}
                      placeholder="00"
                      value={row.numRooms}
                      onChange={(e) => updateDaycareRoomRow(row.id, "numRooms", e.target.value)}
                    />
                    <select
                      className={styles.formFieldInput}
                      value={row.petType}
                      onChange={(e) => updateDaycareRoomRow(row.id, "petType", e.target.value)}
                    >
                      <option value="Dog">Dog</option>
                      <option value="Cat">Cat</option>
                    </select>
                    <input
                      type="text"
                      className={styles.formFieldInput}
                      placeholder="0000"
                      value={row.capacity}
                      onChange={(e) => updateDaycareRoomRow(row.id, "capacity", e.target.value)}
                    />
                    {!independentRooms && (
                      <input
                        type="text"
                        className={styles.formFieldInput}
                        placeholder="₹ 000"
                        value={row.price}
                        onChange={(e) => updateDaycareRoomRow(row.id, "price", e.target.value)}
                      />
                    )}
                    <button
                      type="button"
                      className={styles.removeLink}
                      onClick={() => removeDaycareRoomRow(row.id)}
                    >
                      Remove
                    </button>
                  </div>
                ))}

                <button type="button" className={styles.btnActionLink} onClick={addDaycareRoomRow}>
                  + Add Room Type
                </button>
              </div>

              {independentRooms && (
                <>
                  <div className={styles.sectionHeaderWithMargin}>
                    <h3>Add pricing details for Pet Daycare</h3>
                    <p>Add price details for your boarding spaces, and select the animal type</p>
                  </div>

                  <div className={styles.formGroupWidthLimited}>
                    <label>You charge by?</label>
                    <select 
                      className={styles.formSelect}
                      value={daycareChargeBy}
                      onChange={(e) => setDaycareChargeBy(e.target.value)}
                    >
                      <option value="Do you charge by number of days or number of nights?">
                        Do you charge by number of days or number of nights?
                      </option>
                      <option value="Number of Days">Number of Days</option>
                      <option value="Number of Nights">Number of Nights</option>
                    </select>
                  </div>

                  <div className={styles.checkboxContainer}>
                    <input
                      type="checkbox"
                      id="daycareTax"
                      checked={daycareTaxIncluded}
                      onChange={(e) => setDaycareTaxIncluded(e.target.checked)}
                    />
                    <label htmlFor="daycareTax">All prices included tax of 0%</label>
                  </div>

                  <div className={styles.formCard}>
                    <div className={`${styles.rowHeaders} ${styles.gridRoomsOn}`}>
                      <div className={styles.colHeader}>Price Name</div>
                      <div className={styles.colHeader}>Pet Type</div>
                      <div className={styles.colHeader}>Breed Size</div>
                      <div className={styles.colHeader}>Price</div>
                      <div className={styles.colHeader}></div>
                    </div>

                    {daycareRates.map(row => (
                      <div key={row.id} className={`${styles.rowInputs} ${styles.gridRoomsOn}`}>
                        <input
                          type="text"
                          className={styles.formFieldInput}
                          placeholder="Enter here"
                          value={row.priceName}
                          onChange={(e) => updateDaycareRateRow(row.id, "priceName", e.target.value)}
                        />
                        <select
                          className={styles.formFieldInput}
                          value={row.petType}
                          onChange={(e) => updateDaycareRateRow(row.id, "petType", e.target.value)}
                        >
                          <option value="Dog">Dog</option>
                          <option value="Cat">Cat</option>
                        </select>
                        <select
                          className={styles.formFieldInput}
                          value={row.breedSize}
                          onChange={(e) => updateDaycareRateRow(row.id, "breedSize", e.target.value)}
                        >
                          <option value="Small">Small</option>
                          <option value="Medium">Medium</option>
                          <option value="Large">Large</option>
                        </select>
                        <input
                          type="text"
                          className={styles.formFieldInput}
                          placeholder="₹ 0000"
                          value={row.price}
                          onChange={(e) => updateDaycareRateRow(row.id, "price", e.target.value)}
                        />
                        <button
                          type="button"
                          className={styles.removeLink}
                          onClick={() => removeDaycareRateRow(row.id)}
                        >
                          Remove
                        </button>
                      </div>
                    ))}

                    <button type="button" className={styles.btnActionLink} onClick={addDaycareRateRow}>
                      + Add Rate
                    </button>
                  </div>
                </>
              )}
            </>
          )}

          {/* LATE CHECK OUT TAB */}
          {activeSubTab === "late check out" && (
            <>
              <div className={styles.formSectionTitleRow}>
                <div className={styles.sectionHeaderCol}>
                  <h3>Late Check Out Fee</h3>
                  <p>Set up the cancellation charges for your boarding</p>
                </div>
                <div className={styles.toggleContainer}>
                  <span className={styles.toggleLabel}>Same for all services</span>
                  <label className={styles.switch}>
                    <input
                      type="checkbox"
                      checked={lateCheckOutSame}
                      onChange={(e) => setLateCheckOutSame(e.target.checked)}
                    />
                    <span className={styles.slider}></span>
                  </label>
                </div>
              </div>

              {lateCheckOutSame ? (
                <div>
                  <div className={styles.radioListGroup}>
                    <label className={styles.radioOption}>
                      <input
                        type="radio"
                        name="lateCheckOutOptionSame"
                        value="flat"
                        checked={lateCheckOutOptionSame === "flat"}
                        onChange={() => setLateCheckOutOptionSame("flat")}
                        className={styles.radioInput}
                      />
                      <span>A flat fee is charged for late check out</span>
                    </label>
                    <label className={styles.radioOption}>
                      <input
                        type="radio"
                        name="lateCheckOutOptionSame"
                        value="hourly"
                        checked={lateCheckOutOptionSame === "hourly"}
                        onChange={() => setLateCheckOutOptionSame("hourly")}
                        className={styles.radioInput}
                      />
                      <span>Charged per hour after check out time</span>
                    </label>
                    <label className={styles.radioOption}>
                      <input
                        type="radio"
                        name="lateCheckOutOptionSame"
                        value="none"
                        checked={lateCheckOutOptionSame === "none"}
                        onChange={() => setLateCheckOutOptionSame("none")}
                        className={styles.radioInput}
                      />
                      <span>No Late Check Out Fee</span>
                    </label>
                  </div>

                  {lateCheckOutOptionSame !== "none" && (
                    <div className={styles.formGroupWidthLimited}>
                      <label className={styles.colHeader}>
                        {lateCheckOutOptionSame === "hourly" ? "Enter amount Per Hour" : "Enter amount"}
                      </label>
                      <div className={styles.amountInputContainer}>
                        <input
                          type="text"
                          className={styles.amountInput}
                          placeholder="Enter here"
                          value={lateCheckOutAmountSame}
                          onChange={(e) => setLateCheckOutAmountSame(e.target.value)}
                        />
                        <select className={styles.currencyDropdown} defaultValue="INR">
                          <option value="INR">₹</option>
                          <option value="USD">$</option>
                        </select>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div>
                  {/* Clinic Service */}
                  <h4 className={styles.serviceSubTitle}>Clinic</h4>
                  <div className={styles.radioListGroup}>
                    <label className={styles.radioOption}>
                      <input
                        type="radio"
                        name="lateCheckOutOptionClinic"
                        value="flat"
                        checked={lateCheckOutOptionClinic === "flat"}
                        onChange={() => setLateCheckOutOptionClinic("flat")}
                        className={styles.radioInput}
                      />
                      <span>A flat fee is charged for late check out</span>
                    </label>
                    <label className={styles.radioOption}>
                      <input
                        type="radio"
                        name="lateCheckOutOptionClinic"
                        value="hourly"
                        checked={lateCheckOutOptionClinic === "hourly"}
                        onChange={() => setLateCheckOutOptionClinic("hourly")}
                        className={styles.radioInput}
                      />
                      <span>Charged per hour after check out time</span>
                    </label>
                    <label className={styles.radioOption}>
                      <input
                        type="radio"
                        name="lateCheckOutOptionClinic"
                        value="none"
                        checked={lateCheckOutOptionClinic === "none"}
                        onChange={() => setLateCheckOutOptionClinic("none")}
                        className={styles.radioInput}
                      />
                      <span>No Late Check Out Fee</span>
                    </label>
                  </div>

                  {lateCheckOutOptionClinic !== "none" && (
                    <div className={styles.formGroupWidthLimited} style={{ marginBottom: 30 }}>
                      <label className={styles.colHeader}>
                        {lateCheckOutOptionClinic === "hourly" ? "Enter amount Per Hour" : "Enter amount"}
                      </label>
                      <div className={styles.amountInputContainer}>
                        <input
                          type="text"
                          className={styles.amountInput}
                          placeholder="Enter here"
                          value={lateCheckOutAmountClinic}
                          onChange={(e) => setLateCheckOutAmountClinic(e.target.value)}
                        />
                        <select className={styles.currencyDropdown} defaultValue="INR">
                          <option value="INR">₹</option>
                          <option value="USD">$</option>
                        </select>
                      </div>
                    </div>
                  )}

                  {/* Daycare Service */}
                  <h4 className={styles.serviceSubTitle}>Daycare</h4>
                  <div className={styles.radioListGroup}>
                    <label className={styles.radioOption}>
                      <input
                        type="radio"
                        name="lateCheckOutOptionDaycare"
                        value="flat"
                        checked={lateCheckOutOptionDaycare === "flat"}
                        onChange={() => setLateCheckOutOptionDaycare("flat")}
                        className={styles.radioInput}
                      />
                      <span>A flat fee is charged for late check out</span>
                    </label>
                    <label className={styles.radioOption}>
                      <input
                        type="radio"
                        name="lateCheckOutOptionDaycare"
                        value="hourly"
                        checked={lateCheckOutOptionDaycare === "hourly"}
                        onChange={() => setLateCheckOutOptionDaycare("hourly")}
                        className={styles.radioInput}
                      />
                      <span>Charged per hour after check out time</span>
                    </label>
                    <label className={styles.radioOption}>
                      <input
                        type="radio"
                        name="lateCheckOutOptionDaycare"
                        value="none"
                        checked={lateCheckOutOptionDaycare === "none"}
                        onChange={() => setLateCheckOutOptionDaycare("none")}
                        className={styles.radioInput}
                      />
                      <span>No Late Check Out Fee</span>
                    </label>
                  </div>

                  {lateCheckOutOptionDaycare !== "none" && (
                    <div className={styles.formGroupWidthLimited}>
                      <label className={styles.colHeader}>
                        {lateCheckOutOptionDaycare === "hourly" ? "Enter amount Per Hour" : "Enter amount"}
                      </label>
                      <div className={styles.amountInputContainer}>
                        <input
                          type="text"
                          className={styles.amountInput}
                          placeholder="Enter here"
                          value={lateCheckOutAmountDaycare}
                          onChange={(e) => setLateCheckOutAmountDaycare(e.target.value)}
                        />
                        <select className={styles.currencyDropdown} defaultValue="INR">
                          <option value="INR">₹</option>
                          <option value="USD">$</option>
                        </select>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </>
          )}

          {/* CANCELLATIONS TAB */}
          {activeSubTab === "Cancellations" && (
            <>
              <div className={styles.formSectionTitleRow}>
                <div className={styles.sectionHeaderCol}>
                  <h3>Cancellation Charges</h3>
                  <p>Set up the cancellation charges for your boarding</p>
                </div>
                <div className={styles.toggleContainer}>
                  <span className={styles.toggleLabel}>Same for all services</span>
                  <label className={styles.switch}>
                    <input
                      type="checkbox"
                      checked={cancellationSame}
                      onChange={(e) => setCancellationSame(e.target.checked)}
                    />
                    <span className={styles.slider}></span>
                  </label>
                </div>
              </div>

              {cancellationSame ? (
                <div>
                  <div className={styles.radioListGroup}>
                    <label className={styles.radioOption}>
                      <input
                        type="radio"
                        name="cancellationOptionSame"
                        value="charged"
                        checked={cancellationOptionSame === "charged"}
                        onChange={() => setCancellationOptionSame("charged")}
                        className={styles.radioInput}
                      />
                      <span>Cancellation fee charged</span>
                    </label>
                    <label className={styles.radioOption}>
                      <input
                        type="radio"
                        name="cancellationOptionSame"
                        value="free"
                        checked={cancellationOptionSame === "free"}
                        onChange={() => setCancellationOptionSame("free")}
                        className={styles.radioInput}
                      />
                      <span>Free Cancellation Option</span>
                    </label>
                  </div>

                  {cancellationOptionSame === "charged" && (
                    <>
                      <h4 className={styles.subSectionHeader}>Cancellation Allowance</h4>
                      <p className={styles.subSectionHeaderDesc}>Select how much time before check in the customer can cancel their booking.</p>
                      
                      <div className={styles.formGroupWidthLimited} style={{ marginBottom: 24 }}>
                        <label className={styles.formFieldLabel}>Hours before check in</label>
                        <input
                          type="text"
                          className={styles.formFieldInput}
                          placeholder="Enter hours"
                          value={allowanceHoursSame}
                          onChange={(e) => setAllowanceHoursSame(e.target.value)}
                        />
                      </div>

                      <h4 className={styles.subSectionHeader}>Cancellation Charges</h4>
                      <div className={styles.formGroupWidthLimited} style={{ marginBottom: 24 }}>
                        <label className={styles.formFieldLabel}>Amount</label>
                        <div className={styles.amountInputContainer}>
                          <input
                            type="text"
                            className={styles.amountInput}
                            placeholder="Enter here"
                            value={chargeAmountSame}
                            onChange={(e) => setChargeAmountSame(e.target.value)}
                          />
                          <select className={styles.currencyDropdown} defaultValue="INR">
                            <option value="INR">₹</option>
                            <option value="USD">$</option>
                          </select>
                        </div>
                      </div>

                      <h4 className={styles.subSectionHeader}>Late Cancellation Charges</h4>
                      <p className={styles.subSectionHeaderDesc}>What percentage of the booking amount do you charge as the cancellation fee?</p>
                      
                      <div className={styles.formGroupWidthLimited}>
                        <label className={styles.formFieldLabel}>Percentage</label>
                        <div className={styles.amountInputContainer}>
                          <input
                            type="text"
                            className={styles.amountInput}
                            placeholder="Enter here"
                            value={latePercentageSame}
                            onChange={(e) => setLatePercentageSame(e.target.value)}
                          />
                          <select className={styles.currencyDropdown} defaultValue="PERCENT">
                            <option value="PERCENT">%</option>
                          </select>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              ) : (
                <div className={styles.cardsRow}>
                  {/* Clinic Charges Card */}
                  <div className={styles.formInsideCard}>
                    <h4 className={styles.serviceSubTitle} style={{ marginTop: 0 }}>Clinic Charges</h4>
                    
                    <div className={styles.radioListGroup}>
                      <label className={styles.radioOption}>
                        <input
                          type="radio"
                          name="cancellationOptionClinic"
                          value="charged"
                          checked={cancellationOptionClinic === "charged"}
                          onChange={() => setCancellationOptionClinic("charged")}
                          className={styles.radioInput}
                        />
                        <span>Cancellation fee charged</span>
                      </label>
                      <label className={styles.radioOption}>
                        <input
                          type="radio"
                          name="cancellationOptionClinic"
                          value="free"
                          checked={cancellationOptionClinic === "free"}
                          onChange={() => setCancellationOptionClinic("free")}
                          className={styles.radioInput}
                        />
                        <span>Free Cancellation Option</span>
                      </label>
                    </div>

                    {cancellationOptionClinic === "charged" && (
                      <>
                        <h5 className={styles.subSectionHeader}>Cancellation Allowance</h5>
                        <p className={styles.subSectionHeaderDesc}>Select how much time before check in the customer can cancel their booking.</p>
                        
                        <div className={styles.formGroupWidthLimited} style={{ marginBottom: 20 }}>
                          <label className={styles.formFieldLabel}>Hours before check in</label>
                          <input
                            type="text"
                            className={styles.formFieldInput}
                            placeholder="Enter hours"
                            value={allowanceHoursClinic}
                            onChange={(e) => setAllowanceHoursClinic(e.target.value)}
                          />
                        </div>

                        <h5 className={styles.subSectionHeader}>Cancellation Charges</h5>
                        <div className={styles.formGroupWidthLimited} style={{ marginBottom: 20 }}>
                          <label className={styles.formFieldLabel}>Amount</label>
                          <div className={styles.amountInputContainer}>
                            <input
                              type="text"
                              className={styles.amountInput}
                              placeholder="Enter here"
                              value={chargeAmountClinic}
                              onChange={(e) => setChargeAmountClinic(e.target.value)}
                            />
                            <select className={styles.currencyDropdown} defaultValue="INR">
                              <option value="INR">₹</option>
                            </select>
                          </div>
                        </div>

                        <h5 className={styles.subSectionHeader}>Late Cancellation Charges</h5>
                        <p className={styles.subSectionHeaderDesc}>What percentage of the booking amount do you charge as the cancellation fee?</p>
                        
                        <div className={styles.formGroupWidthLimited}>
                          <label className={styles.formFieldLabel}>Percentage</label>
                          <div className={styles.amountInputContainer}>
                            <input
                              type="text"
                              className={styles.amountInput}
                              placeholder="Enter here"
                              value={latePercentageClinic}
                              onChange={(e) => setLatePercentageClinic(e.target.value)}
                            />
                            <select className={styles.currencyDropdown} defaultValue="PERCENT">
                              <option value="PERCENT">%</option>
                            </select>
                          </div>
                        </div>
                      </>
                    )}
                  </div>

                  {/* Daycare Charges Card */}
                  <div className={styles.formInsideCard}>
                    <h4 className={styles.serviceSubTitle} style={{ marginTop: 0 }}>Daycare Charges</h4>
                    
                    <div className={styles.radioListGroup}>
                      <label className={styles.radioOption}>
                        <input
                          type="radio"
                          name="cancellationOptionDaycare"
                          value="charged"
                          checked={cancellationOptionDaycare === "charged"}
                          onChange={() => setCancellationOptionDaycare("charged")}
                          className={styles.radioInput}
                        />
                        <span>Cancellation fee charged</span>
                      </label>
                      <label className={styles.radioOption}>
                        <input
                          type="radio"
                          name="cancellationOptionDaycare"
                          value="free"
                          checked={cancellationOptionDaycare === "free"}
                          onChange={() => setCancellationOptionDaycare("free")}
                          className={styles.radioInput}
                        />
                        <span>Free Cancellation Option</span>
                      </label>
                    </div>

                    {cancellationOptionDaycare === "charged" && (
                      <>
                        <h5 className={styles.subSectionHeader}>Cancellation Allowance</h5>
                        <p className={styles.subSectionHeaderDesc}>Select how much time before check in the customer can cancel their booking.</p>
                        
                        <div className={styles.formGroupWidthLimited} style={{ marginBottom: 20 }}>
                          <label className={styles.formFieldLabel}>Hours before check in</label>
                          <input
                            type="text"
                            className={styles.formFieldInput}
                            placeholder="Enter hours"
                            value={allowanceHoursDaycare}
                            onChange={(e) => setAllowanceHoursDaycare(e.target.value)}
                          />
                        </div>

                        <h5 className={styles.subSectionHeader}>Cancellation Charges</h5>
                        <div className={styles.formGroupWidthLimited} style={{ marginBottom: 20 }}>
                          <label className={styles.formFieldLabel}>Amount</label>
                          <div className={styles.amountInputContainer}>
                            <input
                              type="text"
                              className={styles.amountInput}
                              placeholder="Enter here"
                              value={chargeAmountDaycare}
                              onChange={(e) => setChargeAmountDaycare(e.target.value)}
                            />
                            <select className={styles.currencyDropdown} defaultValue="INR">
                              <option value="INR">₹</option>
                            </select>
                          </div>
                        </div>

                        <h5 className={styles.subSectionHeader}>Late Cancellation Charges</h5>
                        <p className={styles.subSectionHeaderDesc}>What percentage of the booking amount do you charge as the cancellation fee?</p>
                        
                        <div className={styles.formGroupWidthLimited}>
                          <label className={styles.formFieldLabel}>Percentage</label>
                          <div className={styles.amountInputContainer}>
                            <input
                              type="text"
                              className={styles.amountInput}
                              placeholder="Enter here"
                              value={latePercentageDaycare}
                              onChange={(e) => setLatePercentageDaycare(e.target.value)}
                            />
                            <select className={styles.currencyDropdown} defaultValue="PERCENT">
                              <option value="PERCENT">%</option>
                            </select>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        <div className={styles.modalFooter}>
          <button type="button" className={styles.btnCancel} onClick={onCancel}>Cancel</button>
          <button type="submit" className={styles.btnSubmit}>Submit</button>
        </div>
      </form>
    </div>
  );
};

export default AddRoomForm;
