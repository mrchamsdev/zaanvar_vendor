import React, { useState, useEffect } from "react";
import styles from "../../styles/grooming/addBooking.module.css";
import Image from "next/image";
import { customerService } from "../../services/customerService";
import useStore from "../state/useStore";

// Removed mockCustomers, using dynamic fetching

const mockGroomers = Array(10).fill({
  id: "g1",
  name: "Mahendra ray",
  avatar: "https://zaanvarprods3.b-cdn.net/media/1781498177696-6e698fd1-db1d-4eb4-b957-c87d0c3eb1be.png"
}).map((g, i) => ({ ...g, id: `g${i}` }));

const timeSlots = [
  "01:30 AM", "02:30 AM", "03:30 AM", "04:30 AM", "05:30 AM",
  "06:30 AM", "07:30 AM", "08:30 AM", "09:30 AM", "10:30 AM",
  "11:30 AM", "12:30 PM", "01:30 PM", "02:30 PM", "03:30 PM",
  "04:30 PM", "05:30 PM", "06:30 PM", "07:30 PM", "08:30 PM"
];

const AddBookingGrooming = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState("Basic Details");
  const [customerType, setCustomerType] = useState("Existed"); // 'Existed' or 'New'
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const { jwtToken, selectedBranchId } = useStore();
  const [customers, setCustomers] = useState([]);
  const [selectedPets, setSelectedPets] = useState([]);
  const [customerSearchText, setCustomerSearchText] = useState("");
  const [showAddPetModal, setShowAddPetModal] = useState(false);
  const [newPetImagePreview, setNewPetImagePreview] = useState(null);

  useEffect(() => {
    if (jwtToken) {
      customerService.getCustomers(jwtToken, selectedBranchId).then(res => {
        if (res && res.data) {
          const list = Array.isArray(res.data) ? res.data : (res.data.customers || res.data.content || []);
          setCustomers(list);
        }
      });
    }
  }, [jwtToken, selectedBranchId]);
  
  // Service Details State (mapping pet index/id to state object)
  const [petServiceDetails, setPetServiceDetails] = useState({});

  const getPetState = (petId) => {
    return petServiceDetails[petId] || {
      assignedGroomer: mockGroomers[0].id,
      unassigned: false,
      selectedTime: "",
      groomingType: "Services"
    };
  };

  const updatePetState = (petId, field, value) => {
    setPetServiceDetails(prev => ({
      ...prev,
      [petId]: {
        ...getPetState(petId),
        [field]: value
      }
    }));
  };

  const handleNext = () => {
    if (activeTab === "Basic Details") setActiveTab("Service Details");
    else if (activeTab === "Service Details") setActiveTab("Service Agreement");
  };

  const handleBack = () => {
    if (activeTab === "Service Agreement") setActiveTab("Service Details");
    else if (activeTab === "Service Details") setActiveTab("Basic Details");
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h2 className={styles.title}>Book a slot</h2>
        <div className={styles.controls}>
          <button className={styles.iconBtn}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="5" y1="12" x2="19" y2="12" /></svg></button>
          <button className={styles.iconBtn}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="3" y="3" width="18" height="18" rx="2" /></svg></button>
          <button className={styles.iconBtn} onClick={onClose}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg></button>
        </div>
      </header>

      <div className={styles.tabs}>
        {["Basic Details", "Service Details", "Service Agreement"].map(tab => (
          <button
            key={tab}
            className={`${styles.tab} ${activeTab === tab ? styles.tabActive : ""}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className={styles.content}>
        {activeTab === "Basic Details" && (
          <>
            <div style={{ marginBottom: '2rem' }}>
              <h3 className={styles.sectionTitle}>Customer Details</h3>
              <div className={styles.card}>
                <div className={styles.radioGroup}>
                  <label className={styles.radioLabel}>
                    <input type="radio" name="customerType" value="Existed" className={styles.radioInput} checked={customerType === "Existed"} onChange={() => setCustomerType("Existed")} />
                    Existed Customer
                  </label>
                  <label className={styles.radioLabel}>
                    <input type="radio" name="customerType" value="New" className={styles.radioInput} checked={customerType === "New"} onChange={() => setCustomerType("New")} />
                    New Customer
                  </label>
                </div>

                {customerType === "Existed" ? (
                <>
                  <div className={styles.formGrid}>
                    <div className={styles.formGroup}>
                      <label className={styles.label}>Customer Name</label>
                      <div className={styles.dropdownWrapper}>
                        <input 
                          type="text" 
                          className={styles.input} 
                          placeholder="Search or choose customer..." 
                          value={showCustomerDropdown ? customerSearchText : (selectedCustomer ? (selectedCustomer.firstName + ' ' + (selectedCustomer.lastName || '')).trim() || selectedCustomer.vendorCustomerName || selectedCustomer.name : "")}
                          onClick={() => setShowCustomerDropdown(true)}
                          onChange={(e) => {
                            setCustomerSearchText(e.target.value);
                            setShowCustomerDropdown(true);
                          }}
                        />
                        {showCustomerDropdown && (
                          <div className={styles.customerDropdown}>
                            {customers
                              .filter(c => {
                                const name = ((c.firstName || '') + ' ' + (c.lastName || '')).toLowerCase();
                                const phone = (c.phoneNumber || c.phone || '').toLowerCase();
                                const search = customerSearchText.toLowerCase();
                                return name.includes(search) || phone.includes(search);
                              })
                              .map(c => (
                              <div 
                                key={c.id || c.vendorCustomerId} 
                                className={styles.customerItem}
                                onClick={() => { 
                                  setSelectedCustomer(c); 
                                  setCustomerSearchText("");
                                  setShowCustomerDropdown(false); 
                                }}
                              >
                                <span>{(c.firstName + ' ' + (c.lastName || '')).trim() || c.vendorCustomerName || c.name}</span>
                                <span style={{color: '#666'}}>{c.phoneNumber || c.phone}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className={styles.formGroup}>
                      <label className={styles.label}>
                        Pet Name {selectedCustomer && `(${(selectedCustomer.pets || selectedCustomer.customerPets || []).length})`}
                      </label>
                      <select 
                        className={styles.select}
                        value=""
                        onChange={(e) => {
                          const petId = e.target.value;
                          if (petId) {
                            const petsList = selectedCustomer.pets || selectedCustomer.customerPets || [];
                            const pet = petsList.find(p => (p.id == petId || p.vendorCustomerPetId == petId || p.petId == petId));
                            if (pet && !selectedPets.find(sp => (sp.id || sp.vendorCustomerPetId || sp.petId) === (pet.id || pet.vendorCustomerPetId || pet.petId))) {
                              setSelectedPets([...selectedPets, pet]);
                            }
                          }
                        }}
                      >
                        <option value="">Choose here</option>
                        {selectedCustomer && (selectedCustomer.pets || selectedCustomer.customerPets || []).map(pet => (
                          <option key={pet.id || pet.vendorCustomerPetId || pet.petId} value={pet.id || pet.vendorCustomerPetId || pet.petId}>
                            {pet.petName || pet.name || 'Unnamed Pet'}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </>
              ) : (
                <div className={styles.formGrid}>
                  <div className={styles.formGroup}>
                    <label className={styles.label}>First Name</label>
                    <input type="text" className={styles.input} placeholder="Enter your first name here" />
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.label}>Last Name</label>
                    <input type="text" className={styles.input} placeholder="Enter your last name here" />
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.label}>Gender</label>
                    <select className={styles.select}>
                      <option value="">Select Your Gender here</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                    </select>
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.label}>Mobile Number</label>
                    <input type="text" className={styles.input} placeholder="Enter your number here" />
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.label}>Email Id <span style={{fontSize: '0.75rem', color: '#888'}}>(optional)</span></label>
                    <input type="email" className={styles.input} placeholder="Enter your id here" />
                  </div>
                </div>
              )}
            </div>
            </div>

            {/* Selected Pets Section (Always visible for existed customers, or if we want it generally) */}
            {customerType === "Existed" && (
              <div style={{ marginBottom: '2rem' }}>
                <h3 className={styles.sectionTitle}>
                  Selected pets
                  <span 
                    style={{ color: '#ff4757', textDecoration: 'underline', cursor: 'pointer', fontSize: '0.9rem', fontWeight: 600 }}
                    onClick={() => setShowAddPetModal(true)}
                  >
                    ADD PET
                  </span>
                </h3>
                {selectedPets.length > 0 ? (
                  <div className={styles.card}>
                    <div className={styles.selectedPetsList}>
                      {selectedPets.map((pet, idx) => (
                        <div key={pet.id || pet.vendorCustomerPetId || pet.petId || idx} className={styles.petPill}>
                          {pet.petPhoto || pet.photo ? (
                            <img src={pet.petPhoto || pet.photo} alt="pet" className={styles.petPillImage} />
                          ) : (
                            <div className={styles.petPillPlaceholder}></div>
                          )}
                          <span className={styles.petPillName}>{(pet.petName || pet.name || 'Unknown').toUpperCase()}</span>
                          <button className={styles.petPillRemove} onClick={() => setSelectedPets(selectedPets.filter(sp => sp !== pet))}>×</button>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className={styles.card} style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '2rem', color: '#888' }}>
                    No pets selected
                  </div>
                )}
              </div>
            )}

            {/* Pet Details - Inline Form instead of Modal */}
            {(showAddPetModal || customerType === "New") && (
              <div style={{ marginBottom: '2rem' }}>
                <h3 className={styles.sectionTitle}>
                  Pet Details
                  {customerType === "Existed" && (
                    <button className={styles.iconBtn} onClick={() => setShowAddPetModal(false)}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#666" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                    </button>
                  )}
                </h3>
                <div className={styles.card}>
                  <div style={{ marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                    <div 
                      style={{ 
                        width: '80px', height: '80px', borderRadius: '50%', 
                        background: '#f5f5f5', border: '1px dashed #ccc',
                        display: 'flex', justifyContent: 'center', alignItems: 'center',
                        overflow: 'hidden', cursor: 'pointer', position: 'relative'
                      }}
                      onClick={() => document.getElementById('petImageInput').click()}
                    >
                      {newPetImagePreview ? (
                        <img src={newPetImagePreview} alt="Pet Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <span style={{ fontSize: '24px', color: '#aaa' }}>+</span>
                      )}
                    </div>
                    <div>
                      <input 
                        type="file" 
                        id="petImageInput"
                        accept="image/*"
                        style={{ display: 'none' }}
                        onChange={(e) => {
                          const file = e.target.files[0];
                          if (file) {
                            setNewPetImagePreview(URL.createObjectURL(file));
                          }
                        }}
                      />
                      <label htmlFor="petImageInput" style={{ color: '#ff4757', cursor: 'pointer', fontWeight: 500, fontSize: '0.9rem', textDecoration: 'underline' }}>
                        Upload Pet Photo
                      </label>
                    </div>
                  </div>

                  <div className={styles.formGrid}>
                    <div className={styles.formGroup}>
                      <label className={styles.label}>Pet Name</label>
                      <input type="text" className={styles.input} placeholder="Enter your pet name here" />
                    </div>
                    <div className={styles.formGroup}>
                      <label className={styles.label}>Pet Breed</label>
                      <select className={styles.select}>
                        <option value="">Choose your pet Breed here</option>
                      </select>
                    </div>
                    <div className={styles.formGroup}>
                      <label className={styles.label}>Pet Type</label>
                      <select className={styles.select}>
                        <option value="">Choose your pet Type here</option>
                      </select>
                    </div>
                    <div className={styles.formGroup}>
                      <label className={styles.label}>Pet Gender</label>
                      <select className={styles.select}>
                        <option value="">Choose your pet Gender here</option>
                      </select>
                    </div>
                    <div className={styles.formGroup}>
                      <label className={styles.label}>Pet Age</label>
                      <select className={styles.select}>
                        <option value="">Choose your pet Age here</option>
                      </select>
                    </div>
                    <div className={styles.formGroup}>
                      <label className={styles.label}>Pet Size</label>
                      <select className={styles.select}>
                        <option value="">Choose your pet Size here</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {activeTab === "Service Details" && (
          <>
            {selectedPets.length === 0 ? (
              <div className={styles.card} style={{ padding: '2rem', textAlign: 'center', color: '#888' }}>
                Please select at least one pet from the Basic Details tab first.
              </div>
            ) : (
              selectedPets.map((pet, idx) => {
                const petId = pet.id || pet.vendorCustomerPetId || pet.petId || idx;
                const petState = getPetState(petId);
                const isFirst = idx === 0;

                return (
                  <div key={petId} style={{ marginBottom: '3rem' }}>
                    <h3 className={styles.sectionTitle}>
                      {(pet.petName || pet.name || 'Unnamed Pet').toUpperCase()} Booking Details
                    </h3>
                    <div className={styles.card}>
                      <div className={styles.formGroup} style={{ maxWidth: '400px', marginBottom: '2rem' }}>
                        <label className={styles.label}>Service Type</label>
                        <select className={styles.select}>
                          <option value="Grooming, Clinic">Grooming, Clinic</option>
                        </select>
                      </div>

                      <h3 className={`${styles.sectionTitle} ${styles.sectionTitleRed}`}>
                        Grooming Details
                        <button className={styles.iconBtn}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg></button>
                      </h3>

                      <div style={{ marginBottom: '1.5rem' }}>
                        <label className={styles.label} style={{display: 'block', marginBottom: '1rem'}}>Assigned Groomer for the service</label>
                        <div className={styles.groomerGrid}>
                          {mockGroomers.map(g => (
                            <div 
                              key={g.id} 
                              className={`${styles.groomerChip} ${petState.assignedGroomer === g.id && !petState.unassigned ? styles.groomerChipActive : ""}`}
                              onClick={() => { 
                                updatePetState(petId, 'assignedGroomer', g.id); 
                                updatePetState(petId, 'unassigned', false); 
                              }}
                            >
                              <Image src={g.avatar} width={32} height={32} className={styles.avatar} alt="Avatar" />
                              {g.name}
                            </div>
                          ))}
                        </div>
                        <label className={styles.checkboxLabel}>
                          <input type="checkbox" checked={petState.unassigned} onChange={(e) => updatePetState(petId, 'unassigned', e.target.checked)} />
                          Mark it as unassigned
                        </label>
                      </div>

                      <div className={styles.formGrid} style={{ marginBottom: '2rem' }}>
                        <div className={styles.formGroup}>
                          <label className={styles.label}>Booking Type</label>
                          <select className={styles.select}>
                            <option value="In House Grooming">In House Grooming</option>
                          </select>
                        </div>
                        <div className={styles.formGroup}>
                          <label className={styles.label}>Appointment Date</label>
                          <input type="date" className={styles.input} />
                        </div>
                      </div>

                      <div style={{ marginBottom: '2rem' }}>
                        <label className={styles.label} style={{display: 'block', marginBottom: '1rem'}}>Select Appointment Time Slots</label>
                        <div className={styles.timeGrid}>
                          {timeSlots.map(time => (
                            <button 
                              key={time} 
                              className={`${styles.timeBtn} ${petState.selectedTime === time ? styles.timeBtnActive : ""}`}
                              onClick={() => updatePetState(petId, 'selectedTime', time)}
                            >
                              {time}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div style={{ marginBottom: '2rem' }}>
                        <label className={styles.label} style={{display: 'block', marginBottom: '1rem'}}>Grooming Type</label>
                        <div className={styles.radioGroup}>
                          <label className={styles.radioLabel}>
                            <input type="radio" name={`groomingType-${petId}`} value="Services" className={styles.radioInput} checked={petState.groomingType === "Services"} onChange={() => updatePetState(petId, 'groomingType', "Services")} />
                            Services
                          </label>
                          <label className={styles.radioLabel}>
                            <input type="radio" name={`groomingType-${petId}`} value="Package" className={styles.radioInput} checked={petState.groomingType === "Package"} onChange={() => updatePetState(petId, 'groomingType', "Package")} />
                            Package
                          </label>
                          <label className={styles.radioLabel}>
                            <input type="radio" name={`groomingType-${petId}`} value="Subscription" className={styles.radioInput} checked={petState.groomingType === "Subscription"} onChange={() => updatePetState(petId, 'groomingType', "Subscription")} />
                            Subscription
                          </label>
                        </div>

                        {petState.groomingType === "Services" && (
                          <div className={styles.formGroup} style={{ maxWidth: '400px' }}>
                            <label className={styles.label}>Grooming Services <span style={{color: '#888', fontSize: '0.75rem'}}>(Multiple selections)</span></label>
                            <select className={styles.select}>
                              <option value="">Choose your services here</option>
                            </select>
                          </div>
                        )}
                        {petState.groomingType === "Package" && (
                          <div className={styles.formGrid}>
                            <div className={styles.formGroup}>
                              <label className={styles.label}>Grooming Packages</label>
                              <select className={styles.select}>
                                <option value="">Choose here</option>
                              </select>
                            </div>
                            <div className={styles.formGroup}>
                              <label className={styles.label}>Add on Grooming Services <span style={{color: '#888', fontSize: '0.75rem'}}>(Multiple selections)</span></label>
                              <select className={styles.select}>
                                <option value="">Choose your services here</option>
                              </select>
                            </div>
                          </div>
                        )}
                        {petState.groomingType === "Subscription" && (
                          <div className={styles.formGrid}>
                            <div className={styles.formGroup}>
                              <label className={styles.label}>Grooming Packages</label>
                              <select className={styles.select}>
                                <option value="">Choose here</option>
                              </select>
                            </div>
                            <div className={styles.formGroup}>
                              <label className={styles.label}>Add on Grooming Services <span style={{color: '#888', fontSize: '0.75rem'}}>(Multiple selections)</span></label>
                              <select className={styles.select}>
                                <option value="">Choose your services here</option>
                              </select>
                            </div>
                          </div>
                        )}
                      </div>

                      <div>
                        <h4 className={styles.label} style={{display: 'block', marginBottom: '1rem'}}>Time taken for appointment</h4>
                        <div className={styles.formGrid} style={{ alignItems: 'flex-end', gap: '2rem' }}>
                          <div className={styles.formGroup}>
                            <label className={styles.label}>Hours</label>
                            <select className={styles.select}>
                              <option value="">Choose Hours here</option>
                            </select>
                          </div>
                          <div className={styles.formGroup}>
                            <label className={styles.label}>Minutes</label>
                            <select className={styles.select}>
                              <option value="">Choose Mins here</option>
                            </select>
                          </div>
                          <div className={styles.formGroup} style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <div style={{ flex: 1 }}>
                              <label className={styles.label}>Add buffer for extra time required</label>
                              <select className={styles.select}>
                                <option value="">Choose Hours here</option>
                              </select>
                            </div>
                            <span style={{ fontSize: '0.85rem', color: '#333', marginBottom: '4px' }}>Mins</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </>
        )}

        {activeTab === "Service Agreement" && (
          <div>
            <div className={styles.summaryGrid}>
              <div className={styles.summaryCard}>
                <h4 className={styles.summaryTitle}>Customer Details</h4>
                <div className={styles.summaryRow}>
                  <span className={styles.summaryLabel}>Customer Name</span>
                  <span className={styles.summaryValue}>{selectedCustomer ? ((selectedCustomer.firstName || "") + " " + (selectedCustomer.lastName || "")).trim() : "Phani Araja"}</span>
                </div>
                <div className={styles.summaryRow}>
                  <span className={styles.summaryLabel}>Customer Phone Number</span>
                  <span className={styles.summaryValue}>{selectedCustomer?.phoneNumber || "+91 9347992753"}</span>
                </div>
              </div>

              {selectedPets.length > 0 ? selectedPets.map((pet, idx) => (
                <div key={idx} className={styles.summaryCard}>
                  <h4 className={styles.summaryTitle}>Pet {idx + 1} Details</h4>
                  <div className={styles.petAvatarWrapper}>
                    <Image src={pet.photo || "https://zaanvarprods3.b-cdn.net/media/1781498177696-6e698fd1-db1d-4eb4-b957-c87d0c3eb1be.png"} width={40} height={40} alt="Pet" style={{ borderRadius: '50%', objectFit: 'cover' }} />
                    <span className={styles.summaryValue}>{(pet.petName || 'Unnamed').toUpperCase()}</span>
                  </div>
                </div>
              )) : (
                <div className={styles.summaryCard}>
                  <h4 className={styles.summaryTitle}>Pet One Details</h4>
                  <div className={styles.petAvatarWrapper}>
                    <Image src="https://zaanvarprods3.b-cdn.net/media/1781498177696-6e698fd1-db1d-4eb4-b957-c87d0c3eb1be.png" width={40} height={40} alt="Pet" style={{ borderRadius: '50%', objectFit: 'cover' }} />
                    <span className={styles.summaryValue}>VICTORIA</span>
                  </div>
                </div>
              )}

              <div className={styles.summaryCard}>
                <h4 className={styles.summaryTitle}>Grooming Details</h4>
                <div className={styles.summaryRow}><span className={styles.summaryLabel}>Appointment Date</span><span className={styles.summaryValue}>22/05/2026</span></div>
                <div className={styles.summaryRow}><span className={styles.summaryLabel}>Appointment Time</span><span className={styles.summaryValue}>9:00 AM</span></div>
                <div className={styles.summaryRow}><span className={styles.summaryLabel}>Booking Type</span><span className={styles.summaryValue}>Mobile Grooming</span></div>
                <div className={styles.summaryRow}><span className={styles.summaryLabel}>Type</span><span className={styles.summaryValue}>Service</span></div>
                <div className={styles.summaryRow}><span className={styles.summaryLabel}>Assigned Groomer</span><span className={styles.summaryValue}>Ravi Bishnoi</span></div>
              </div>

              <div className={styles.summaryCard}>
                <h4 className={styles.summaryTitle}>Grooming Cost Details</h4>
                <div className={styles.summaryRow}><span className={styles.summaryLabel}>Bathing</span><span className={styles.summaryValue}>₹ 500</span></div>
                <div className={styles.summaryRow}><span className={styles.summaryLabel}>Nail Cutting</span><span className={styles.summaryValue}>₹ 250</span></div>
                <div className={styles.summaryRow}><span className={styles.summaryLabel}>Total Amount</span><span className={styles.summaryValue}>₹ 750</span></div>
              </div>
            </div>

            <div className={styles.summaryGrid} style={{ alignItems: 'flex-start' }}>
              <div className={styles.paymentSection}>
                <h4 className={styles.summaryTitle} style={{ fontSize: '0.85rem', color: '#666' }}>Payment Details</h4>
                <div className={styles.formGrid}>
                  <div className={styles.formGroup}>
                    <label className={styles.label}>Payment Type</label>
                    <select className={styles.select}>
                      <option>Cash</option>
                    </select>
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.label}>Paid Amount</label>
                    <input type="text" className={styles.input} defaultValue="1500" />
                  </div>
                </div>
                <button className={styles.addPetBtn} style={{ alignSelf: 'flex-start', marginTop: '1rem', fontSize: '0.75rem' }}>+ADD ANOTHER PAYMENT</button>
              </div>

              <div className={styles.costBreakdownSection}>
                <h4 className={styles.summaryTitle}>Cost Break Down details</h4>
                
                <div className={styles.costRow}>
                  <span className={styles.costLabel}>Total</span>
                  <strong>₹ 1500</strong>
                </div>

                <div className={styles.costRow}>
                  <span className={styles.costLabel}>Whole Tax Details</span>
                  <div className={styles.toggleWrapper}>
                    <input type="checkbox" className={styles.toggle} defaultChecked />
                  </div>
                </div>

                <div className={styles.costRow}>
                  <span className={styles.costLabel} style={{ color: '#6c757d' }}>Discount in % percentage</span>
                  <input type="text" className={styles.costInput} defaultValue="10%" />
                </div>
                
                <div className={styles.costRow}>
                  <span className={styles.costLabel} style={{ color: '#6c757d' }}>After Tax Total Amount</span>
                  <strong>₹ 1650</strong>
                </div>

                <div className={styles.costRow}>
                  <span className={styles.costLabel}>Whole Discount Details</span>
                  <div className={styles.toggleWrapper}>
                    <input type="checkbox" className={styles.toggle} defaultChecked />
                  </div>
                </div>

                <div className={styles.costRow}>
                  <span className={styles.costLabel} style={{ color: '#6c757d' }}>Discount in % percentage</span>
                  <input type="text" className={styles.costInput} defaultValue="05%" />
                </div>
                
                <div className={styles.costRow}>
                  <span className={styles.costLabel} style={{ color: '#6c757d' }}>After Tax & Discount Total Amount</span>
                  <strong>₹ 1600</strong>
                </div>

                <div className={styles.costRow}>
                  <span className={styles.costLabel} style={{ color: '#6c757d' }}>Round Off</span>
                  <div className={styles.toggleWrapper}>
                    <input type="checkbox" className={styles.checkboxInput} defaultChecked />
                    <input type="text" className={styles.costInput} defaultValue="0.02" style={{ marginLeft: '1rem' }} />
                  </div>
                </div>

                <h4 className={styles.summaryTitle} style={{ marginTop: '1.5rem', marginBottom: '1rem' }}>Advanced Payment Details</h4>
                <div className={styles.costRow}>
                  <span className={styles.costLabel} style={{ color: '#6c757d' }}>Advanced Payment</span>
                  <strong>₹ 1000</strong>
                </div>

                <div className={styles.totalPending}>
                  <span>Total Pending Amount</span>
                  <span>₹ 600</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className={styles.footer}>
        <button className={styles.btnSecondary} onClick={handleBack} disabled={activeTab === "Basic Details"}>
          Back
        </button>
        <button className={styles.btnPrimary} onClick={handleNext}>
          {activeTab === "Service Agreement" ? "Submit" : "Next"}
        </button>
      </div>
    </div>
  );
};

export default AddBookingGrooming;
