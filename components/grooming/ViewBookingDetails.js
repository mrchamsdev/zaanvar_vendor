import React, { useState, useRef, useEffect } from "react";
import styles from "../../styles/grooming/addBooking.module.css";
import Image from "next/image";

const menuActions = [
  "Edit", "Reschedule", "Cancel", "Check-In", "Check-Out", 
  "View", "Print", "Assign Groomer", "Approve", 
  "Update Payment status", "Generate Invoice"
];

const ViewBookingDetails = ({ onClose }) => {
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h2 className={styles.title}>View Details</h2>
        <div className={styles.controls}>
          <button className={styles.iconBtn}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="5" y1="12" x2="19" y2="12" /></svg></button>
          <button className={styles.iconBtn}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="3" y="3" width="18" height="18" rx="2" /></svg></button>
          <button className={styles.iconBtn} onClick={onClose}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg></button>
        </div>
      </header>

      <div className={styles.content}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h3 className={styles.title} style={{ fontSize: '1.1rem' }}>Booking Details</h3>
          <div style={{ position: 'relative' }} ref={menuRef}>
            <button className={styles.iconBtn} onClick={() => setShowMenu(!showMenu)}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="1" />
                <circle cx="12" cy="5" r="1" />
                <circle cx="12" cy="19" r="1" />
              </svg>
            </button>
            {showMenu && (
              <div className={styles.menuDropdown}>
                {menuActions.map(action => (
                  <div key={action} className={styles.menuItem} onClick={() => setShowMenu(false)}>
                    {action}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className={styles.summaryCard} style={{ marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <h4 className={styles.summaryTitle}>Customer Details</h4>
              <div className={styles.summaryRow} style={{ justifyContent: 'flex-start', gap: '2rem' }}>
                <span className={styles.summaryLabel}>Customer Name</span>
                <span className={styles.summaryValue}>Phani Araja</span>
              </div>
              <div className={styles.summaryRow} style={{ justifyContent: 'flex-start', gap: '1rem' }}>
                <span className={styles.summaryLabel}>Customer Phone Number</span>
                <span className={styles.summaryValue}>+91 9347992753</span>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <div style={{ textAlign: 'center' }}>
                <span className={styles.badgePending}>Payment pending</span>
                <span className={styles.badgeDue}>Due on 19 April 2026</span>
              </div>
              <div style={{ textAlign: 'center' }}>
                <span className={styles.badgeCheckedIn}>Checked - IN</span>
                <span className={styles.badgeDue}>Due on 19 April 2026</span>
              </div>
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '2rem' }}>
          {/* PET ONE COLUMN */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div className={styles.summaryCard} style={{ height: '100%' }}>
              <h4 className={styles.summaryTitle}>Pet One Details</h4>
              <div className={styles.petAvatarWrapper}>
                <Image src="https://zaanvarprods3.b-cdn.net/media/1781498177696-6e698fd1-db1d-4eb4-b957-c87d0c3eb1be.png" width={40} height={40} alt="Pet" style={{ borderRadius: '50%', objectFit: 'cover' }} />
                <span className={styles.summaryValue}>VICTORIA</span>
              </div>
            </div>

            <div className={styles.summaryCard} style={{ height: '100%' }}>
              <h4 className={styles.summaryTitle}>Grooming Details</h4>
              <div className={styles.summaryRow}><span className={styles.summaryLabel}>Appointment Date</span><span className={styles.summaryValue}>22/05/2026</span></div>
              <div className={styles.summaryRow}><span className={styles.summaryLabel}>Appointment Time</span><span className={styles.summaryValue}>9:00 AM</span></div>
              <div className={styles.summaryRow}><span className={styles.summaryLabel}>Booking Type</span><span className={styles.summaryValue}>Mobile Grooming</span></div>
              <div className={styles.summaryRow}><span className={styles.summaryLabel}>Type</span><span className={styles.summaryValue}>Service</span></div>
              <div className={styles.summaryRow}><span className={styles.summaryLabel}>Assigned Groomer</span><span className={styles.summaryValue}>Ravi Bishnoi</span></div>
            </div>

            <div className={styles.summaryCard} style={{ height: '100%' }}>
              <h4 className={styles.summaryTitle}>Grooming Cost Details</h4>
              <div className={styles.summaryRow}><span className={styles.summaryLabel}>Bathing</span><span className={styles.summaryValue}>₹ 500</span></div>
              <div className={styles.summaryRow}><span className={styles.summaryLabel}>Nail Cutting</span><span className={styles.summaryValue}>₹ 250</span></div>
              <div className={styles.summaryRow}><span className={styles.summaryLabel}>Total Amount</span><span className={styles.summaryValue}>₹ 750</span></div>
            </div>
          </div>

          {/* PET TWO COLUMN */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div className={styles.summaryCard} style={{ height: '100%' }}>
              <h4 className={styles.summaryTitle}>Pet Two Details</h4>
              <div className={styles.petAvatarWrapper}>
                <Image src="https://zaanvarprods3.b-cdn.net/media/1781498177696-6e698fd1-db1d-4eb4-b957-c87d0c3eb1be.png" width={40} height={40} alt="Pet" style={{ borderRadius: '50%', objectFit: 'cover' }} />
                <span className={styles.summaryValue}>VICTORIA</span>
              </div>
            </div>

            <div className={styles.summaryCard} style={{ height: '100%' }}>
              <h4 className={styles.summaryTitle}>Grooming Details</h4>
              <div className={styles.summaryRow}><span className={styles.summaryLabel}>Appointment Date</span><span className={styles.summaryValue}>22/05/2026</span></div>
              <div className={styles.summaryRow}><span className={styles.summaryLabel}>Appointment Time</span><span className={styles.summaryValue}>9:00 AM</span></div>
              <div className={styles.summaryRow}><span className={styles.summaryLabel}>Booking Type</span><span className={styles.summaryValue}>Mobile Grooming</span></div>
              <div className={styles.summaryRow}><span className={styles.summaryLabel}>Type</span><span className={styles.summaryValue}>Service</span></div>
              <div className={styles.summaryRow}><span className={styles.summaryLabel}>Assigned Groomer</span><span className={styles.summaryValue}>Ravi Bishnoi</span></div>
            </div>

            <div className={styles.summaryCard} style={{ height: '100%' }}>
              <h4 className={styles.summaryTitle}>Grooming Cost Details</h4>
              <div className={styles.summaryRow}><span className={styles.summaryLabel}>Vaccination 01</span><span className={styles.summaryValue}>₹ 500</span></div>
              <div className={styles.summaryRow}><span className={styles.summaryLabel}>Vaccination 02</span><span className={styles.summaryValue}>₹ 250</span></div>
              <div className={styles.summaryRow}><span className={styles.summaryLabel}>Total Amount</span><span className={styles.summaryValue}>₹ 750</span></div>
            </div>
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
                <input type="checkbox" className={styles.toggle} />
              </div>
            </div>

            <div className={styles.costRow}>
              <span className={styles.costLabel} style={{ color: '#6c757d' }}>Discount in Value</span>
              <input type="text" className={styles.costInput} defaultValue="₹ 50" />
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
    </div>
  );
};

export default ViewBookingDetails;
