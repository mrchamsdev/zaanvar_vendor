import React, { useState } from "react";
import styles from "../../styles/vendor-settings/rooms-capacity.module.css";

const AddRoomModal = ({ onClose, onSave, initialData }) => {
  const [activeSubTab, setActiveSubTab] = useState("Clinic");
  const [independentRooms, setIndependentRooms] = useState(true);

  // Clinic spaces room rows state
  const [clinicRooms, setClinicRooms] = useState([
    { id: "cr1", roomName: "", numRooms: "00", petType: "Dog", capacity: "0000", price: "000" }
  ]);
  const [clinicRates, setClinicRates] = useState([
    { id: "cl1", priceName: "", petType: "Dog", breedSize: "Large", price: "0000" }
  ]);
  const [clinicTaxIncluded, setClinicTaxIncluded] = useState(true);

  // Daycare spaces room rows state
  const [daycareCheckInFrom, setDaycareCheckInFrom] = useState("07:00 AM");
  const [daycareCheckInTo, setDaycareCheckInTo] = useState("10:00 AM");
  const [daycareCheckOut, setDaycareCheckOut] = useState("09:00 AM");

  const [daycareRooms, setDaycareRooms] = useState([
    { id: "dr1", roomName: "", numRooms: "00", petType: "Dog", capacity: "0000", price: "000" }
  ]);
  const [daycareChargeBy, setDaycareChargeBy] = useState("Do you charge by number of days or number of nights?");
  const [daycareRates, setDaycareRates] = useState([
    { id: "dl1", priceName: "", petType: "Dog", breedSize: "Large", price: "0000" }
  ]);
  const [daycareTaxIncluded, setDaycareTaxIncluded] = useState(true);

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
    setDaycareRooms(prev => [...prev, { id: `dr_${Date.now()}`, roomName: "", numRooms: "00", petType: "Dog", capacity: "0000", price: "000" }]);
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
    onSave({
      spaceType: activeSubTab,
      independentRooms,
      rooms: activeSubTab === "Clinic" ? clinicRooms : daycareRooms,
      rates: activeSubTab === "Clinic" ? clinicRates : daycareRates,
      daycareCheckInFrom,
      daycareCheckInTo,
      daycareCheckOut
    });
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h3 className={styles.modalTitle}>Rooms</h3>
          <div className={styles.modalControls}>
            <button className={styles.controlBtn} title="Minimize">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="5" y1="12" x2="19" y2="12" /></svg>
            </button>
            <button className={styles.controlBtn} title="Maximize">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="3" y="3" width="18" height="18" rx="2" /></svg>
            </button>
            <button className={styles.controlBtn} onClick={onClose} title="Close">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
            </button>
          </div>
        </div>

        {/* Modal Tabs */}
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

        <form onSubmit={handleSubmit} style={{ display: 'contents' }}>
          <div className={styles.modalBody}>
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

                <div className={styles.formCard} style={{ marginBottom: 24 }}>
                  {/* Headers */}
                  <div 
                    className={styles.rowHeaders} 
                    style={{ gridTemplateColumns: independentRooms ? "2fr 1fr 1fr 1fr" : "2fr 1fr 1.2fr 1fr 1fr" }}
                  >
                    <div className={styles.colHeader}>Room Name</div>
                    <div className={styles.colHeader}>Number of Rooms</div>
                    <div className={styles.colHeader}>{independentRooms ? "Pet Type" : "Animal Type"}</div>
                    <div className={styles.colHeader}>Beds / Room Capacity</div>
                    {!independentRooms && <div className={styles.colHeader}>Price</div>}
                  </div>

                  {/* Rows */}
                  {clinicRooms.map((row) => (
                    <div 
                      key={row.id} 
                      className={styles.rowInputs}
                      style={{ gridTemplateColumns: independentRooms ? "2fr 1fr 1fr 1fr" : "2fr 1fr 1.2fr 1fr 1fr" }}
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
                    <div className={styles.sectionHeaderCol} style={{ marginBottom: 20 }}>
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
                      <div className={styles.rowHeaders} style={{ gridTemplateColumns: "2fr 1fr 1fr 1.5fr" }}>
                        <div className={styles.colHeader}>Price Name</div>
                        <div className={styles.colHeader}>Pet Type</div>
                        <div className={styles.colHeader}>Breed Size</div>
                        <div className={styles.colHeader}>Price</div>
                      </div>

                      {clinicRates.map(row => (
                        <div key={row.id} className={styles.rowInputs} style={{ gridTemplateColumns: "2fr 1fr 1fr 1.5fr" }}>
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

                <div className={styles.daycareCheckInRow}>
                  <div className={styles.checkInTimeGroup}>
                    <div className={styles.timeFieldBox}>
                      <label>From</label>
                      <select 
                        className={styles.timeSelect}
                        value={daycareCheckInFrom}
                        onChange={(e) => setDaycareCheckInFrom(e.target.value)}
                      >
                        <option value="07:00 AM">07:00 AM</option>
                        <option value="08:00 AM">08:00 AM</option>
                      </select>
                    </div>
                    <span className={styles.toLabel}>TO</span>
                    <div className={styles.timeFieldBox}>
                      <label>To</label>
                      <select 
                        className={styles.timeSelect}
                        value={daycareCheckInTo}
                        onChange={(e) => setDaycareCheckInTo(e.target.value)}
                      >
                        <option value="10:00 AM">10:00 AM</option>
                        <option value="11:00 AM">11:00 AM</option>
                      </select>
                    </div>
                  </div>

                  <div className={styles.timeFieldBox} style={{ marginLeft: 40 }}>
                    <label>Check Out Time</label>
                    <select 
                      className={styles.timeSelect}
                      value={daycareCheckOut}
                      onChange={(e) => setDaycareCheckOut(e.target.value)}
                    >
                      <option value="09:00 AM">09:00 AM</option>
                      <option value="05:00 PM">05:00 PM</option>
                    </select>
                  </div>
                </div>

                <div className={styles.sectionHeaderCol} style={{ marginBottom: 20 }}>
                  <h3>Add rooms for Pet Daycare</h3>
                  <p>Designate boarding rooms and allocate pets to them</p>
                </div>

                <div className={styles.formCard} style={{ marginBottom: 24 }}>
                  <div 
                    className={styles.rowHeaders} 
                    style={{ gridTemplateColumns: independentRooms ? "2fr 1fr 1fr 1fr" : "2fr 1fr 1.2fr 1fr 1fr" }}
                  >
                    <div className={styles.colHeader}>Room Name</div>
                    <div className={styles.colHeader}>Number of Rooms</div>
                    <div className={styles.colHeader}>{independentRooms ? "Pet Type" : "Animal Type"}</div>
                    <div className={styles.colHeader}>Beds / Room Capacity</div>
                    {!independentRooms && <div className={styles.colHeader}>Price</div>}
                  </div>

                  {daycareRooms.map((row) => (
                    <div 
                      key={row.id} 
                      className={styles.rowInputs}
                      style={{ gridTemplateColumns: independentRooms ? "2fr 1fr 1fr 1fr" : "2fr 1fr 1.2fr 1fr 1fr" }}
                    >
                      <input
                        type="text"
                        className={styles.formFieldInput}
                        placeholder="Enter here"
                        value={row.roomName}
                        onChange={(e) => updateDaycareRoomRow(row.id, "roomName", e.target.value)}
                      />
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
                    <div className={styles.sectionHeaderCol} style={{ marginBottom: 20 }}>
                      <h3>Add pricing details for Pet Daycare</h3>
                      <p>Add price details for your boarding spaces, and select the animal type</p>
                    </div>

                    <div className={styles.formGroup} style={{ marginBottom: 20, width: '400px' }}>
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
                      <div className={styles.rowHeaders} style={{ gridTemplateColumns: "2fr 1fr 1fr 1.5fr" }}>
                        <div className={styles.colHeader}>Price Name</div>
                        <div className={styles.colHeader}>Pet Type</div>
                        <div className={styles.colHeader}>Breed Size</div>
                        <div className={styles.colHeader}>Price</div>
                      </div>

                      {daycareRates.map(row => (
                        <div key={row.id} className={styles.rowInputs} style={{ gridTemplateColumns: "2fr 1fr 1fr 1.5fr" }}>
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

            {/* LATE CHECK OUT & CANCELLATIONS PLACEHOLDERS */}
            {(activeSubTab === "late check out" || activeSubTab === "Cancellations") && (
              <div className={styles.formCard} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '60px 20px', color: '#6b7280' }}>
                <p>Configuration settings for {activeSubTab} will go here.</p>
              </div>
            )}
          </div>

          <div className={styles.modalFooter}>
            <button type="button" className={styles.btnCancel} onClick={onClose}>Cancel</button>
            <button type="submit" className={styles.btnSubmit}>Submit</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddRoomModal;
