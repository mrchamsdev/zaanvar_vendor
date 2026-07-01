import React, { useState } from "react";
import styles from "../../styles/vendor-settings/settings.module.css";

const InfoIcon = ({ tip }) => (
  <span className={styles.infoIcon} title={tip || "More info"}>ⓘ</span>
);

const AUTO_EVENTS = [
  { key: "purchaseOrder", label: "Purchase order" },
  { key: "purchaseOrderReceive", label: "Purchase order receive" },
  { key: "paymentOut", label: "Payment out" },
  { key: "purchaseReturn", label: "Purchase Return" },
  { key: "purchaseOrderTransaction", label: "Purchase order Transaction" },
  { key: "saleInvoice", label: "Sale invoice" },
  { key: "paymentIn", label: "Payment in" },
  { key: "saleReturn", label: "Sale return" },
  { key: "saleOrderTransaction", label: "Sale order Transaction" },
  { key: "cancelledInvoice", label: "Cancelled Invoice" },
];

const SALE_TEMPLATE = (
  <div className={styles.previewContainer}>
    <div className={styles.previewCard}>
      <div>Greetings from <span className={styles.previewPlaceholder}>[ First Name ]</span></div>
      <br />
      <div>We are pleased to have you as a valuable customer. Please find the details of your transaction.</div>
      <br />
      <div><span className={styles.previewPlaceholder}>[ Transaction_Type ]</span></div>
      <br />
      <div>Invoice Amount : <span className={styles.previewPlaceholder}>[ Invoice Amount ]</span></div>
      <br />
      <div>Balance : <span className={styles.previewPlaceholder}>[ Transaction Balance ]</span></div>
      <br />
      <div>Thanks for doing business with us. Regards,</div>
      <br />
      <div><span className={styles.previewPlaceholder}>[ Firm_Name ]</span></div>
    </div>
  </div>
);

const IMAGE_TEMPLATE = (
  <div className={styles.previewCardAttached}>
    <div className={styles.previewImageBanner}>
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
        <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
      </svg>
      Transaction Image Attached
    </div>
    <div>Greetings from My Company</div>
    <br />
    <div>We are pleased to have you as a valuable customer. Please find the details of your transaction.</div>
    <br />
    <div>Sale Invoice :</div>
    <br />
    <div>Invoice Amount : 792.000</div>
    <br />
    <div>Balance : 0.0000</div>
    <br />
    <div>Thanks for doing business with us. Regards,</div>
    <br />
    <div>My Company</div>
  </div>
);

const TransactionMessageSettings = ({ settings, onChange }) => {
  const m = settings;
  const [txnType, setTxnType] = useState("Sale Transaction");

  const toggle = (field) => (e) => onChange({ ...m, [field]: e.target.checked });

  const toggleEvent = (key) => {
    const current = m.autoMessageEvents || {};
    onChange({ ...m, autoMessageEvents: { ...current, [key]: !current[key] } });
  };

  return (
    <div style={{ display: "flex", gap: 24 }}>
      {/* ── Left panel ── */}
      <div style={{ flex: 1 }}>
        {/* Select Message Type */}
        <div className={styles.card}>
          <div className={styles.cardTitle}>Select Message Type</div>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 12,
              cursor: "default"
            }}
          >
            <div style={{
              width: 18,
              height: 18,
              borderRadius: "50%",
              border: "1.5px solid #eee",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 1px 3px rgba(0,0,0,0.05)"
            }}>
              <div style={{
                width: 10,
                height: 10,
                borderRadius: "50%",
                background: "#e9315d"
              }} />
            </div>
            
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "6px 16px",
              border: "1px solid #eee",
              borderRadius: 6,
              background: "#fafafa",
              fontWeight: 500,
              color: "#333"
            }}>
              <img 
                src="https://zaanvarprods3.b-cdn.net/media/1762595677584-zaanvarlogo.png" 
                alt="Zaanvar logo" 
                style={{ height: 20, objectFit: "contain" }} 
              />
              Send Via &nbsp;Zaanvar
            </div>
          </div>
        </div>

        {/* Message Recipient Settings */}
        <div className={styles.card}>
          <div className={styles.cardTitle}>Message Recipient Settings :</div>

          <div className={styles.checkRow}>
            <input id="sendMessageToSupplier" type="checkbox" className={styles.checkInput}
              checked={m.sendMessageToSupplier} onChange={toggle("sendMessageToSupplier")} />
            <label htmlFor="sendMessageToSupplier" className={styles.checkLabel}>Send Message to Supplier</label>
            <InfoIcon tip="When ON, supplier receives a message when a purchase order is created or received." />
          </div>

          <div className={styles.checkRow}>
            <input id="sendMessageToCustomer" type="checkbox" className={styles.checkInput}
              checked={m.sendMessageToCustomer} onChange={toggle("sendMessageToCustomer")} />
            <label htmlFor="sendMessageToCustomer" className={styles.checkLabel}>Send Message to Customer</label>
            <InfoIcon tip="When ON, customer receives a message when a sale invoice is created." />
          </div>

          <div className={styles.checkRow}>
            <input id="sendTxnUpdateToSupplier" type="checkbox" className={styles.checkInput}
              checked={m.sendTxnUpdateToSupplier} onChange={toggle("sendTxnUpdateToSupplier")} />
            <label htmlFor="sendTxnUpdateToSupplier" className={styles.checkLabel}>
              Send Transaction Update Message to Supplier
            </label>
            <InfoIcon tip="When ON, supplier gets a message when payment is done in purchase order, mark as pay, payment out, or purchase return." />
          </div>

          <div className={styles.checkRow}>
            <input id="sendTxnUpdateToCustomer" type="checkbox" className={styles.checkInput}
              checked={m.sendTxnUpdateToCustomer} onChange={toggle("sendTxnUpdateToCustomer")} />
            <label htmlFor="sendTxnUpdateToCustomer" className={styles.checkLabel}>
              Send Transaction Update Message to Customer
            </label>
            <InfoIcon tip="When ON, customer gets a message when payment is done in sale invoice, mark as pay, payment in, or sale return." />
          </div>

          <div className={styles.checkRow}>
            <input id="sendCopyToSelf" type="checkbox" className={styles.checkInput}
              checked={m.sendCopyToSelf} onChange={toggle("sendCopyToSelf")} />
            <label htmlFor="sendCopyToSelf" className={styles.checkLabel}>Send Message Copy to Self</label>
            <InfoIcon tip="When ON, any transaction message is also sent to you." />
          </div>
        </div>

        {/* Message Content */}
        <div className={styles.card}>
          <div className={styles.cardTitle}>Message Content :</div>

          <div className={styles.checkRow}>
            <input id="includeSupplierBalance" type="checkbox" className={styles.checkInput}
              checked={m.includeSupplierBalance} onChange={toggle("includeSupplierBalance")} />
            <label htmlFor="includeSupplierBalance" className={styles.checkLabel}>
              Supplier Current Balance in Message
            </label>
            <InfoIcon tip="When ON, the supplier's outstanding balance is included in the message." />
          </div>

          <div className={styles.checkRow}>
            <input id="includeCustomerBalance" type="checkbox" className={styles.checkInput}
              checked={m.includeCustomerBalance} onChange={toggle("includeCustomerBalance")} />
            <label htmlFor="includeCustomerBalance" className={styles.checkLabel}>
              Customer Current Balance in Message
            </label>
            <InfoIcon tip="When ON, the customer's outstanding balance is included in the message." />
          </div>

          <div className={styles.checkRow}>
            <input id="includeSupplierWebInvoiceLink" type="checkbox" className={styles.checkInput}
              checked={m.includeSupplierWebInvoiceLink} onChange={toggle("includeSupplierWebInvoiceLink")} />
            <label htmlFor="includeSupplierWebInvoiceLink" className={styles.checkLabel}>
              Web invoice link in Message for Suppliers
            </label>
            <InfoIcon tip="When ON, suppliers receive a web link to view their invoice online." />
          </div>

          <div className={styles.checkRow}>
            <input id="includeCustomerWebInvoiceLink" type="checkbox" className={styles.checkInput}
              checked={m.includeCustomerWebInvoiceLink} onChange={toggle("includeCustomerWebInvoiceLink")} />
            <label htmlFor="includeCustomerWebInvoiceLink" className={styles.checkLabel}>
              Web Invoice link in Message for Customer
            </label>
            <InfoIcon tip="When ON, customers receive a web link to view their invoice online." />
          </div>
        </div>

        {/* Auto Events */}
        <div className={styles.card}>
          <div className={styles.cardTitle}>Send Automatic Message for :</div>
          <div className={styles.checkGrid}>
            {AUTO_EVENTS.map((ev) => (
              <label key={ev.key} className={styles.checkGridItem}>
                <input
                  type="checkbox"
                  className={styles.checkInput}
                  checked={!!(m.autoMessageEvents || {})[ev.key]}
                  onChange={() => toggleEvent(ev.key)}
                  id={`autoEvent-${ev.key}`}
                />
                {ev.label}
              </label>
            ))}
          </div>
        </div>
      </div>

      {/* ── Right panel — Preview ── */}
      <div style={{ width: 360, flexShrink: 0 }}>
        <div className={styles.card}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
            <div className={styles.fieldLabel} style={{ margin: 0 }}>
              Transaction Type :
            </div>
            <select
              value={txnType}
              onChange={(e) => setTxnType(e.target.value)}
              style={{
                background: "#fdf0f3",
                color: "#e9315d",
                border: "none",
                borderRadius: 4,
                padding: "6px 12px",
                fontSize: 12,
                fontWeight: 500,
                outline: "none",
                cursor: "pointer"
              }}
            >
              {AUTO_EVENTS.map((ev) => (
                <option 
                  key={ev.key} 
                  value={ev.label}
                  style={{ color: "#333", background: "#fff" }}
                >
                  {ev.label}
                </option>
              ))}
            </select>
          </div>

          {SALE_TEMPLATE}
          {IMAGE_TEMPLATE}
        </div>
      </div>
    </div>
  );
};

export default TransactionMessageSettings;
