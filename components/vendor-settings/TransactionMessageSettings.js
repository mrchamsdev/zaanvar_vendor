import React, { useState } from "react";
import styles from "../../styles/vendor-settings/settings.module.css";

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

const AUTO_EVENTS = [
  { key: "purchaseOrder", label: "Purchase order" },
  { key: "purchaseOrderReceive", label: "Received order" },
  { key: "paymentOut", label: "Payment out" },
  { key: "purchaseReturn", label: "Purchase return" },
  { key: "saleInvoice", label: "Sale invoice" },
  { key: "paymentIn", label: "Payment in" },
  { key: "saleReturn", label: "Sale return" },
  { key: "cancelledInvoice", label: "Cancel invoice" },
];const GET_RECIPIENT_LABEL = (key) => {
  switch (key) {
    case "purchaseOrder":
      return "Send Purchase order message to Supplier";
    case "purchaseOrderReceive":
      return "Send Received order message to Supplier";
    case "paymentOut":
      return "Send Payment out transaction message to Supplier";
    case "purchaseReturn":
      return "Send Purchase return message to Supplier";
    case "saleInvoice":
      return "Send Sale invoice message to Customer";
    case "paymentIn":
      return "Send Payment in message to Customer";
    case "saleReturn":
      return "Send Sale return message to Customer";
    case "cancelledInvoice":
      return "Send Cancel invoice message to Customer";
    default:
      return "";
  }
};

const GET_RECIPIENT_TIP = (key) => {
  switch (key) {
    case "purchaseOrder":
      return "When enabled, Zaanvar will automatically send a message to your supplier after a Purchase Order is created.";
    case "purchaseOrderReceive":
      return "When enabled, Zaanvar will automatically send a message to your supplier after a Received Order is recorded.";
    case "paymentOut":
      return "When enabled, Zaanvar will automatically send a message to your supplier after a Payment Out transaction is recorded.";
    case "purchaseReturn":
      return "When enabled, Zaanvar will automatically send a message to your supplier after a Purchase Return is recorded.";
    case "saleInvoice":
      return "When enabled, Zaanvar will automatically send a message to your customer after a Sale Invoice is created.";
    case "paymentIn":
      return "When enabled, Zaanvar will automatically send a message to your customer after a Payment In transaction is recorded.";
    case "saleReturn":
      return "When enabled, Zaanvar will automatically send a message to your customer after a Sale Return is recorded.";
    case "cancelledInvoice":
      return "When enabled, Zaanvar will automatically send a message to your customer after a Sale Invoice is cancelled.";
    default:
      return "";
  }
};

const GET_RECIPIENT_PROP = (key) => {
  switch (key) {
    case "purchaseOrder":
      return "sendPurchaseOrderMessageToSupplier";
    case "purchaseOrderReceive":
      return "sendReceivedOrderMessageToSupplier";
    case "paymentOut":
      return "sendPaymentOutMessageToSupplier";
    case "purchaseReturn":
      return "sendPurchaseReturnMessageToSupplier";
    case "saleInvoice":
      return "sendSaleInvoiceMessageToCustomer";
    case "paymentIn":
      return "sendPaymentInMessageToCustomer";
    case "saleReturn":
      return "sendSaleReturnMessageToCustomer";
    case "cancelledInvoice":
      return "sendCancelInvoiceMessageToCustomer";
    default:
      return "";
  }
};

const GET_EVENT_STRING = (key) => {
  switch (key) {
    case "purchaseOrder":
      return "Purchase order";
    case "purchaseOrderReceive":
      return "Purchase order receive";
    case "paymentOut":
      return "Payment out";
    case "purchaseReturn":
      return "Purchase Return";
    case "saleInvoice":
      return "Sale invoice";
    case "paymentIn":
      return "Payment in";
    case "saleReturn":
      return "Sale return";
    case "cancelledInvoice":
      return "Cancelled Invoice";
    default:
      return "";
  }
};



const GET_TXN_FIELDS = (txnType) => {
  switch (txnType) {
    case "Purchase order":
      return {
        placeholderBlock: "[ Purchase Order Transaction ]",
        imageLabel: "Purchase Order :",
        saleFields: [
          { label: "Order Amount", val: "[ Order Amount ]" },
          { label: "Paid", val: "[ ₹000000 ]" },
          { label: "Balance", val: "[ ₹000000 ]" },
          { label: "Total Balance", val: "[ ₹000000 ]" },
        ],
        imageFields: [
          { label: "Order Amount", val: "792.000" },
          { label: "Paid", val: "0.0000" },
          { label: "Balance", val: "0.0000" },
          { label: "Total Balance", val: "0.0000" },
        ]
      };
    case "Received order":
      return {
        placeholderBlock: "[ Purchase Transaction ]",
        imageLabel: "Purchase invoice :",
        saleFields: [
          { label: "Order Amount", val: "[ Order Amount ]" },
          { label: "Paid Amount", val: "[ ₹000000 ]" },
          { label: "Balance", val: "[ ₹000000 ]" },
          { label: "Total Balance", val: "[ ₹000000 ]" },
        ],
        imageFields: [
          { label: "Order Amount", val: "792.000" },
          { label: "Paid", val: "0.0000" },
          { label: "Balance", val: "0.0000" },
          { label: "Total Balance", val: "0.0000" },
        ]
      };
    case "Payment out":
      return {
        placeholderBlock: "[ Payment Out Transaction ]",
        imageLabel: "Payment Out Transaction :",
        saleFields: [
          { label: "Paid", val: "[ Amount ]" },
          { label: "Discount", val: "[ ₹000000 ]" },
          { label: "Total Balance", val: "[ ₹000000 ]" },
        ],
        imageFields: [
          { label: "Paid", val: "792.000" },
          { label: "Discount", val: "0.0000" },
          { label: "Total Balance", val: "0.0000" },
        ]
      };
    case "Purchase return":
      return {
        placeholderBlock: "[ Purchase Return Transaction ]",
        imageLabel: "Purchase Return invoice :",
        saleFields: [
          { label: "Purchase Return Amount", val: "[ Purchase Return Amount ]" },
          { label: "Received Amount", val: "[ ₹000000 ]" },
          { label: "Balance", val: "[ ₹000000 ]" },
          { label: "Total Balance", val: "[ ₹000000 ]" },
        ],
        imageFields: [
          { label: "Purchase Return Amount", val: "792.000" },
          { label: "Received Amount", val: "0.0000" },
          { label: "Balance", val: "0.0000" },
          { label: "Total Balance", val: "0.0000" },
        ]
      };
    case "Sale invoice":
      return {
        placeholderBlock: "[ Sale Transaction ]",
        imageLabel: "Sale Invoice :",
        saleFields: [
          { label: "Sale Amount", val: "[ Sale Amount ]" },
          { label: "Received Amount", val: "[ ₹000000 ]" },
          { label: "Balance", val: "[ ₹000000 ]" },
          { label: "Total Balance", val: "[ ₹000000 ]" },
        ],
        imageFields: [
          { label: "Sale Amount", val: "792.000" },
          { label: "Received", val: "0.0000" },
          { label: "Balance", val: "0.0000" },
          { label: "Total Balance", val: "0.0000" },
        ]
      };
    case "Payment in":
      return {
        placeholderBlock: "[ Payment IN Transaction ]",
        imageLabel: "Payment IN Invoice :",
        saleFields: [
          { label: "Received", val: "[ Amount ]" },
          { label: "Discount", val: "[ ₹000000 ]" },
          { label: "Total Balance", val: "[ ₹000000 ]" },
        ],
        imageFields: [
          { label: "Received", val: "792.000" },
          { label: "Discount", val: "0.0000" },
          { label: "Total Balance", val: "0.0000" },
        ]
      };
    case "Sale return":
      return {
        placeholderBlock: "[ Sale Return Transaction ]",
        imageLabel: "Sale Return invoice :",
        saleFields: [
          { label: "Sale Return Amount", val: "[ Sale Return Amount ]" },
          { label: "Paid Amount", val: "[ ₹000000 ]" },
          { label: "Balance", val: "[ ₹000000 ]" },
          { label: "Total Balance", val: "[ ₹000000 ]" },
        ],
        imageFields: [
          { label: "Sale Return Amount", val: "792.000" },
          { label: "Paid", val: "0.0000" },
          { label: "Balance", val: "0.0000" },
          { label: "Total Balance", val: "0.0000" },
        ]
      };
    case "Cancel invoice":
      return {
        placeholderBlock: "[ Cancelled Invoice Transaction ]",
        imageLabel: "Cancelled order Transaction :",
        saleFields: [
          { label: "Invoice Date", val: "[ DD-MM-YYYY ]" },
          { label: "Cancellation Date", val: "[ DD-MM-YYYY ]" },
        ],
        imageFields: [
          { label: "Invoice Date", val: "22-May-2026" },
          { label: "Cancellation Date", val: "30-May-2026" },
        ]
      };
    default:
      return null;
  }
};

const SaleTemplate = ({ txnType }) => {
  const fieldsConfig = GET_TXN_FIELDS(txnType);
  if (!fieldsConfig) return null;

  return (
    <div className={styles.previewContainer}>
      <div className={styles.previewCard}>
        <div>Greetings from <span className={styles.previewPlaceholder}>[ Branch Name ]</span></div>
        <br />
        <div>
          We are pleased to have you as a valuable customer. Please find the details of your transaction.
        </div>
        <br />
        <div>
          <span className={styles.previewPlaceholder}>{fieldsConfig.placeholderBlock}</span>
        </div>
        <br />
        {fieldsConfig.saleFields.map((f, i) => (
          <React.Fragment key={i}>
            <div>
              {f.label} : <span className={styles.previewPlaceholder}>{f.val}</span>
            </div>
            <br />
          </React.Fragment>
        ))}
        <div>Thanks for doing business with us. Regards,</div>
        <br />
        <div><span className={styles.previewPlaceholder}>[ Firm_Name ]</span></div>
      </div>
    </div>
  );
};

const ImageTemplate = ({ txnType, includeSupplierWebInvoiceLink, includeCustomerWebInvoiceLink }) => {
  const fieldsConfig = GET_TXN_FIELDS(txnType);
  if (!fieldsConfig) return null;

  const isSupplier = ["Purchase order", "Received order", "Payment out", "Purchase return"].includes(txnType);
  const showLink = (isSupplier ? includeSupplierWebInvoiceLink : includeCustomerWebInvoiceLink) !== false;

  return (
    <div className={styles.previewCardAttached}>
      {showLink && (
        <div className={styles.previewImageBanner}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
            <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
          </svg>
          Web Invoice Link Included
        </div>
      )}
      <div>Greetings from My Branch</div>
      <br />
      <div>
        We are pleased to have you as a valuable customer. Please find the details of your transaction.
      </div>
      <br />
      <div>{fieldsConfig.imageLabel}</div>
      <br />
      {fieldsConfig.imageFields.map((f, i) => (
        <React.Fragment key={i}>
          <div>
            {f.label} : {f.val}
          </div>
          <br />
        </React.Fragment>
      ))}
      {showLink && (
        <>
          <div>Click the link below to view or download your invoice:</div>
          <div style={{ color: "#e9315d", textDecoration: "underline", marginTop: 4, fontWeight: 500, cursor: "pointer" }}>
            https://zaanvar.in/invoice/preview/xyz123
          </div>
          <br />
        </>
      )}
      <div>Thanks for doing business with us. Regards,</div>
      <br />
      <div>My Branch</div>
    </div>
  );
};


const TransactionMessageSettings = ({ settings, onChange }) => {
  const m = settings;
  const [txnType, setTxnType] = useState("Purchase order");

  const toggle = (field) => (e) => onChange({ ...m, [field]: e.target.checked });

  const toggleEvent = (key) => {
    const eventString = GET_EVENT_STRING(key);
    let updated;
    if (Array.isArray(m.autoMessageEvents)) {
      if (m.autoMessageEvents.includes(eventString)) {
        updated = m.autoMessageEvents.filter((item) => item !== eventString);
      } else {
        updated = [...m.autoMessageEvents, eventString];
      }
    } else if (m.autoMessageEvents && typeof m.autoMessageEvents === "object") {
      updated = {
        ...m.autoMessageEvents,
        [key]: !m.autoMessageEvents[key]
      };
    } else {
      updated = { [key]: true };
    }
    onChange({ ...m, autoMessageEvents: updated });
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

          {AUTO_EVENTS.map((ev) => {
            const propName = GET_RECIPIENT_PROP(ev.key);
            return (
              <div key={ev.key} className={styles.checkRow}>
                <input
                  id={`autoEvent-${ev.key}`}
                  type="checkbox"
                  className={styles.checkInput}
                  checked={!!m[propName]}
                  onChange={(e) => onChange({ ...m, [propName]: e.target.checked })}
                />
                <label htmlFor={`autoEvent-${ev.key}`} className={styles.checkLabel}>
                  {GET_RECIPIENT_LABEL(ev.key)}
                </label>
                <InfoIcon tip={GET_RECIPIENT_TIP(ev.key)} />
              </div>
            );
          })}

          <div className={styles.checkRow}>
            <input id="sendCopyToSelf" type="checkbox" className={styles.checkInput}
              checked={m.sendCopyToSelf} onChange={toggle("sendCopyToSelf")} />
            <label htmlFor="sendCopyToSelf" className={styles.checkLabel}>Send Message Copy to Self</label>
            <InfoIcon tip={`What is this?\nZaanvar will send an automatic message to you immediately after the transaction has been recorded.`} />
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
            <InfoIcon tip={`What is this?\nZaanvar will include the suppliers current balance in your message.`} />
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
            <InfoIcon tip={`What is this?\nZaanvar will include a web invoice link in your message.`} />
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
            {AUTO_EVENTS.map((ev) => {
              const eventString = GET_EVENT_STRING(ev.key);
              const isChecked = Array.isArray(m.autoMessageEvents)
                ? m.autoMessageEvents.includes(eventString)
                : m.autoMessageEvents && typeof m.autoMessageEvents === "object"
                ? !!m.autoMessageEvents[ev.key]
                : false;
              return (
                <label key={ev.key} className={styles.checkGridItem}>
                  <input
                    type="checkbox"
                    className={styles.checkInput}
                    checked={isChecked}
                    onChange={() => toggleEvent(ev.key)}
                    id={`autoEventBottom-${ev.key}`}
                  />
                  {ev.label}
                </label>
              );
            })}
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

          <SaleTemplate txnType={txnType} />
          <ImageTemplate
            txnType={txnType}
            includeSupplierWebInvoiceLink={m.includeSupplierWebInvoiceLink}
            includeCustomerWebInvoiceLink={m.includeCustomerWebInvoiceLink}
          />
        </div>
      </div>
    </div>
  );
};

export default TransactionMessageSettings;
